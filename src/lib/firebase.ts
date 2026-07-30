import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs,
  deleteDoc,
  onSnapshot, 
  getDocFromServer 
} from 'firebase/firestore';
import rawConfig from '../../firebase-applet-config.json';
import { Ballot, AdminSettings } from '../types';

const config = rawConfig as Record<string, string>;

export const isFirebaseConfigured = Boolean(config && config.projectId && config.apiKey);

// Initialize Firebase App
const app = isFirebaseConfigured
  ? (getApps().length === 0 ? initializeApp(config) : getApps()[0])
  : null;

// Database instance
const dbInstance = () => {
  if (!app) return null;
  const dbId = config.firestoreDatabaseId || config.databaseId;
  return dbId ? getFirestore(app, dbId) : getFirestore(app);
};
export const db = dbInstance();
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

let permissionErrorListeners: Array<(hasError: boolean) => void> = [];
let hasPermissionError = false;

export function subscribePermissionError(listener: (hasError: boolean) => void): () => void {
  permissionErrorListeners.push(listener);
  listener(hasPermissionError);
  return () => {
    permissionErrorListeners = permissionErrorListeners.filter((l) => l !== listener);
  };
}

function notifyPermissionError(error: unknown) {
  const msg = error instanceof Error ? error.message : String(error);
  if (msg.includes('permissions') || msg.includes('PERMISSION_DENIED')) {
    hasPermissionError = true;
    permissionErrorListeners.forEach((l) => l(true));
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth?.currentUser?.uid,
      email: auth?.currentUser?.email,
    },
    operationType,
    path,
  };
  console.warn('Firestore Operation Error:', errInfo);
  notifyPermissionError(error);
}

// Connection test on init
async function testConnection() {
  if (!db) return;
  try {
    await getDocFromServer(doc(db, 'settings', 'admin'));
  } catch (error) {
    notifyPermissionError(error);
  }
}
if (isFirebaseConfigured) {
  testConnection();
}

// Subscribe to Admin Settings in real-time
export function subscribeAdminSettings(
  onUpdate: (settings: AdminSettings | null) => void,
  onError?: (err: unknown) => void
): () => void {
  if (!db) return () => {};
  const docRef = doc(db, 'settings', 'admin');
  return onSnapshot(
    docRef,
    (snapshot) => {
      if (snapshot.exists()) {
        onUpdate(snapshot.data() as AdminSettings);
      } else {
        onUpdate(null);
      }
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, 'settings/admin');
      onError?.(error);
    }
  );
}

// Helper to remove undefined fields before sending to Firestore
function sanitizeForFirestore<T>(data: T): T {
  return JSON.parse(JSON.stringify(data));
}

// Save Admin Settings to Firestore
export async function saveAdminSettingsCloud(settings: AdminSettings): Promise<boolean> {
  if (!db) return false;
  const path = 'settings/admin';
  try {
    const cleanData = sanitizeForFirestore(settings);
    await setDoc(doc(db, 'settings', 'admin'), cleanData, { merge: true });
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    return false;
  }
}

// Subscribe to Ballots in real-time
export function subscribeBallots(
  onUpdate: (ballots: Ballot[]) => void,
  onError?: (err: unknown) => void
): () => void {
  if (!db) return () => {};
  const colRef = collection(db, 'ballots');
  return onSnapshot(
    colRef,
    (snapshot) => {
      const ballots: Ballot[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        ballots.push({
          id: docSnap.id,
          name: '',
          accessCode: '',
          welcomeMessage: '',
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
          votes: [],
          createdAt: new Date().toISOString(),
          ...data,
        } as Ballot);
      });
      onUpdate(ballots);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, 'ballots');
      onError?.(error);
    }
  );
}

// Save a single Ballot to Firestore
export async function saveBallotCloud(ballot: Ballot): Promise<boolean> {
  if (!db) return false;
  const path = `ballots/${ballot.id}`;
  try {
    const cleanData = sanitizeForFirestore(ballot);
    await setDoc(doc(db, 'ballots', ballot.id), cleanData);
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    return false;
  }
}

// Save all Ballots to Firestore batch
export async function saveBallotsCloud(ballots: Ballot[]): Promise<boolean> {
  if (!db) return false;
  try {
    const results = await Promise.all(ballots.map((b) => saveBallotCloud(b)));
    return results.every(Boolean);
  } catch (error) {
    console.warn('Error saving ballots to cloud:', error);
    return false;
  }
}

// Delete a single Ballot from Firestore
export async function deleteBallotCloud(ballotId: string): Promise<boolean> {
  if (!db) return false;
  const path = `ballots/${ballotId}`;
  try {
    await deleteDoc(doc(db, 'ballots', ballotId));
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
    return false;
  }
}

