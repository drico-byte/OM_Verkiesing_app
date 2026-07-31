import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  getDocFromServer,
  getFirestore,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  setDoc,
} from 'firebase/firestore';
import rawConfig from '../../firebase-applet-config.json';
import {
  AdminSettings,
  Ballot,
  VoteRecord,
} from '../types';

const config = rawConfig as Record<string, string>;

export const isFirebaseConfigured = Boolean(
  config &&
    config.projectId &&
    config.apiKey
);

const app = isFirebaseConfigured
  ? getApps().length === 0
    ? initializeApp(config)
    : getApps()[0]
  : null;

const createDatabaseInstance = () => {
  if (!app) {
    return null;
  }

  const databaseId =
    config.firestoreDatabaseId ||
    config.databaseId;

  return databaseId
    ? getFirestore(app, databaseId)
    : getFirestore(app);
};

export const db = createDatabaseInstance();
export const auth = app ? getAuth(app) : null;

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
  };
}

interface VoteSubmissionResult {
  success: boolean;
  reason?: string;
}

let permissionErrorListeners: Array<
  (hasError: boolean) => void
> = [];

let hasPermissionError = false;

export function subscribePermissionError(
  listener: (hasError: boolean) => void
): () => void {
  permissionErrorListeners.push(listener);
  listener(hasPermissionError);

  return () => {
    permissionErrorListeners =
      permissionErrorListeners.filter(
        (currentListener) =>
          currentListener !== listener
      );
  };
}

function notifyPermissionError(error: unknown) {
  const message =
    error instanceof Error
      ? error.message
      : String(error);

  if (
    message.includes('permissions') ||
    message.includes('PERMISSION_DENIED') ||
    message.includes('permission-denied')
  ) {
    hasPermissionError = true;

    permissionErrorListeners.forEach((listener) => {
      listener(true);
    });
  }
}

function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
) {
  const errorInformation: FirestoreErrorInfo = {
    error:
      error instanceof Error
        ? error.message
        : String(error),
    authInfo: {
      userId: auth?.currentUser?.uid,
      email: auth?.currentUser?.email,
    },
    operationType,
    path,
  };

  console.warn(
    'Firestore Operation Error:',
    errorInformation
  );

  notifyPermissionError(error);
}

async function testConnection() {
  if (!db) {
    return;
  }

  try {
    await getDocFromServer(
      doc(db, 'settings', 'admin')
    );
  } catch (error) {
    notifyPermissionError(error);
  }
}

if (isFirebaseConfigured) {
  testConnection();
}

function sanitizeForFirestore<T>(data: T): T {
  return JSON.parse(JSON.stringify(data)) as T;
}

export function subscribeAdminSettings(
  onUpdate: (
    settings: AdminSettings | null
  ) => void,
  onError?: (error: unknown) => void
): () => void {
  if (!db) {
    return () => {};
  }

  const documentReference = doc(
    db,
    'settings',
    'admin'
  );

  return onSnapshot(
    documentReference,
    (snapshot) => {
      if (snapshot.exists()) {
        onUpdate(
          snapshot.data() as AdminSettings
        );
      } else {
        onUpdate(null);
      }
    },
    (error) => {
      handleFirestoreError(
        error,
        OperationType.GET,
        'settings/admin'
      );

      onError?.(error);
    }
  );
}

export async function saveAdminSettingsCloud(
  settings: AdminSettings
): Promise<boolean> {
  if (!db) {
    return false;
  }

  const path = 'settings/admin';

  try {
    const cleanSettings =
      sanitizeForFirestore(settings);

    await setDoc(
      doc(db, 'settings', 'admin'),
      cleanSettings,
      {
        merge: true,
      }
    );

    return true;
  } catch (error) {
    handleFirestoreError(
      error,
      OperationType.WRITE,
      path
    );

    return false;
  }
}

export function subscribeBallots(
  onUpdate: (ballots: Ballot[]) => void,
  onError?: (error: unknown) => void
): () => void {
  if (!db) {
    return () => {};
  }

  const collectionReference = collection(
    db,
    'ballots'
  );

  return onSnapshot(
    collectionReference,
    (snapshot) => {
      const ballots: Ballot[] = [];

      snapshot.forEach((documentSnapshot) => {
        const data = documentSnapshot.data();

        /*
         * Votes are intentionally not read from the main ballot document.
         * They are loaded from:
         * ballots/{ballotId}/votes/{voterId}
         */
        const ballot: Ballot = {
          id: documentSnapshot.id,
          name: '',
          accessCode: '',
          thankYouMessage: '',
          validVoterIds: [],
          manualVoterIds: [],
          boysCandidates: [],
          girlsCandidates: [],
          maxBoyPicks: 0,
          maxGirlPicks: 0,
          openTime: new Date().toISOString(),
          closeTime: new Date().toISOString(),
          isManualOpen: true,
          createdAt: new Date().toISOString(),
          ...data,
          votes: [],
        } as Ballot;

        ballots.push(ballot);
      });

      onUpdate(ballots);
    },
    (error) => {
      handleFirestoreError(
        error,
        OperationType.LIST,
        'ballots'
      );

      onError?.(error);
    }
  );
}

export async function saveBallotCloud(
  ballot: Ballot
): Promise<boolean> {
  if (!db) {
    return false;
  }

  const path = `ballots/${ballot.id}`;

  try {
    /*
     * The votes property only exists in React state for display purposes.
     * Individual votes are stored as separate subcollection documents.
     */
    const {
      votes: _votes,
      ...ballotWithoutVotes
    } = ballot;

    const cleanBallot =
      sanitizeForFirestore(ballotWithoutVotes);

    /*
     * We replace the main ballot document so that an old legacy
     * "votes" array is removed from it automatically.
     */
    await setDoc(
      doc(db, 'ballots', ballot.id),
      cleanBallot
    );

    return true;
  } catch (error) {
    handleFirestoreError(
      error,
      OperationType.WRITE,
      path
    );

    return false;
  }
}

export async function saveBallotsCloud(
  ballots: Ballot[]
): Promise<boolean> {
  if (!db) {
    return false;
  }

  try {
    const results = await Promise.all(
      ballots.map((ballot) =>
        saveBallotCloud(ballot)
      )
    );

    return results.every(Boolean);
  } catch (error) {
    console.warn(
      'Error saving ballots to cloud:',
      error
    );

    return false;
  }
}

export async function deleteBallotCloud(
  ballotId: string
): Promise<boolean> {
  if (!db) {
    return false;
  }

  const path = `ballots/${ballotId}`;

  try {
    /*
     * Note:
     * Firestore does not automatically delete subcollections.
     * For the current app, test votes should be cleared separately
     * before deleting a ballot that contains vote documents.
     */
    await deleteDoc(
      doc(db, 'ballots', ballotId)
    );

    return true;
  } catch (error) {
    handleFirestoreError(
      error,
      OperationType.DELETE,
      path
    );

    return false;
  }
}

export async function submitVoteCloud(
  ballotId: string,
  vote: VoteRecord
): Promise<VoteSubmissionResult> {
  if (!db) {
    return {
      success: false,
      reason:
        'Firebase is nie gekonfigureer nie.',
    };
  }

  const cleanBallotId = ballotId.trim();
  const cleanVoterId = vote.voterId.trim();

  if (!cleanBallotId || !cleanVoterId) {
    return {
      success: false,
      reason:
        'Die stembrief- of leerder-ID is ongeldig.',
    };
  }

  const voteReference = doc(
    db,
    'ballots',
    cleanBallotId,
    'votes',
    cleanVoterId
  );

  try {
    await runTransaction(
      db,
      async (transaction) => {
        const existingVote =
          await transaction.get(voteReference);

        if (existingVote.exists()) {
          throw new Error('ALREADY_VOTED');
        }

        const cleanVote =
          sanitizeForFirestore({
            ...vote,
            voterId: cleanVoterId,
          });

        transaction.set(
          voteReference,
          cleanVote
        );
      }
    );

    return {
      success: true,
    };
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === 'ALREADY_VOTED'
    ) {
      return {
        success: false,
        reason:
          'Hierdie leerder het reeds gestem.',
      };
    }

    handleFirestoreError(
      error,
      OperationType.WRITE,
      `ballots/${cleanBallotId}/votes/${cleanVoterId}`
    );

    return {
      success: false,
      reason:
        'Die stem kon nie gestoor word nie. Probeer asseblief weer.',
    };
  }
}

export function subscribeVotes(
  ballotId: string,
  onUpdate: (votes: VoteRecord[]) => void,
  onError?: (error: unknown) => void
): () => void {
  if (!db) {
    return () => {};
  }

  const votesCollectionReference =
    collection(
      db,
      'ballots',
      ballotId,
      'votes'
    );

  const votesQuery = query(
    votesCollectionReference,
    orderBy('timestamp', 'desc')
  );

  return onSnapshot(
    votesQuery,
    (snapshot) => {
      const votes = snapshot.docs.map(
        (voteDocument) => {
          const data =
            voteDocument.data() as VoteRecord;

          return {
            ...data,
            voterId:
              data.voterId ||
              voteDocument.id,
          };
        }
      );

      onUpdate(votes);
    },
    (error) => {
      handleFirestoreError(
        error,
        OperationType.LIST,
        `ballots/${ballotId}/votes`
      );

      onError?.(error);
    }
  );
}