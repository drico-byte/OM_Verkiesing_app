/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { AdminSettings, Ballot, ViewMode, VoteRecord } from './types';
import {
  getStoredAdminSettings,
  saveAdminSettings,
  getStoredBallots,
  saveBallots,
  resetToDefaults,
} from './lib/storage';
import {
  subscribeAdminSettings,
  saveAdminSettingsCloud,
  subscribeBallots,
  saveBallotCloud,
  saveBallotsCloud,
  deleteBallotCloud,
  subscribePermissionError,
  submitVoteCloud,
  subscribeVotes,
  signOutAdmin,
} from './lib/firebase';
import { Header } from './components/Header';
import { AppLanding } from './components/AppLanding';
import { AdminLanding } from './components/admin/AdminLanding';
import { BallotDetail } from './components/admin/BallotDetail';
import { LearnerBallotLanding } from './components/learner/LearnerBallotLanding';
import { LearnerVotingFlow } from './components/learner/LearnerVotingFlow';

export default function App() {
  const [adminSettings, setAdminSettings] = useState<AdminSettings>(() =>
    getStoredAdminSettings()
  );

  const [ballots, setBallots] = useState<Ballot[]>(() => {
    const stored = getStoredBallots();

    return stored.filter(
      (ballot) =>
        ballot.id !== 'ballot_vrl_2026' &&
        ballot.id !== 'ballot_klas_11a'
    );
  });

  const [viewMode, setViewMode] = useState<ViewMode>({
    type: 'app_landing',
  });

  const [firebaseRulesError, setFirebaseRulesError] = useState(false);

  useEffect(() => {
    const unsubscribePermissionError = subscribePermissionError(
      (hasError) => {
        setFirebaseRulesError(hasError);
      }
    );

    return () => {
      unsubscribePermissionError();
    };
  }, []);

  // Subscribe to the admin settings and the main ballot documents.
  useEffect(() => {
    const unsubscribeSettings = subscribeAdminSettings((cloudSettings) => {
      if (cloudSettings) {
        setAdminSettings(cloudSettings);
        saveAdminSettings(cloudSettings);
        return;
      }

      const initialSettings = getStoredAdminSettings();

      saveAdminSettingsCloud(initialSettings).catch(console.error);
    });

    const unsubscribeBallots = subscribeBallots(
      (cloudBallots) => {
        const mockIds = ['ballot_vrl_2026', 'ballot_klas_11a'];

        if (cloudBallots.length > 0) {
          cloudBallots.forEach((ballot) => {
            if (mockIds.includes(ballot.id)) {
              deleteBallotCloud(ballot.id).catch(console.error);
            }
          });

          const realBallots = cloudBallots.filter(
            (ballot) => !mockIds.includes(ballot.id)
          );

          const sortedBallots = [...realBallots].sort(
            (firstBallot, secondBallot) =>
              new Date(secondBallot.createdAt).getTime() -
              new Date(firstBallot.createdAt).getTime()
          );

          /*
           * Preserve votes already loaded from the votes subcollections.
           * The main ballot subscription should not erase them every time
           * an administrator changes a ballot setting.
           */
          setBallots((currentBallots) => {
            const nextBallots = sortedBallots.map((cloudBallot) => {
              const currentBallot = currentBallots.find(
                (ballot) => ballot.id === cloudBallot.id
              );

              return {
                ...cloudBallot,
                votes: currentBallot?.votes ?? [],
              };
            });

            saveBallots(nextBallots);

            return nextBallots;
          });

          return;
        }

        const localBallots = getStoredBallots().filter(
          (ballot) => !mockIds.includes(ballot.id)
        );

        if (localBallots.length > 0) {
          setBallots(localBallots);
          saveBallotsCloud(localBallots).catch(console.error);
        }
      },
      () => {
        const mockIds = ['ballot_vrl_2026', 'ballot_klas_11a'];

        const localBallots = getStoredBallots().filter(
          (ballot) => !mockIds.includes(ballot.id)
        );

        if (localBallots.length > 0) {
          setBallots(localBallots);
        }
      }
    );

    return () => {
      unsubscribeSettings();
      unsubscribeBallots();
    };
  }, []);

  /*
   * Subscribe separately to every ballot's votes subcollection.
   * Each learner vote is stored in its own Firestore document.
   */
  const ballotIds = ballots
    .map((ballot) => ballot.id)
    .sort()
    .join('|');

  useEffect(() => {
    if (!ballotIds) {
      return;
    }

    const ids = ballotIds.split('|');

    const unsubscribeFunctions = ids.map((ballotId) =>
      subscribeVotes(ballotId, (votes) => {
        setBallots((currentBallots) => {
          const updatedBallots = currentBallots.map((ballot) =>
            ballot.id === ballotId
              ? {
                  ...ballot,
                  votes,
                }
              : ballot
          );

          saveBallots(updatedBallots);

          return updatedBallots;
        });
      })
    );

    return () => {
      unsubscribeFunctions.forEach((unsubscribe) => {
        unsubscribe();
      });
    };
  }, [ballotIds]);

  const handleUpdateAdminSettings = (newSettings: AdminSettings) => {
    setAdminSettings(newSettings);
    saveAdminSettings(newSettings);

    saveAdminSettingsCloud(newSettings).catch(console.error);
  };

  const handleUpdateBallots = (newBallots: Ballot[]) => {
    setBallots(newBallots);
    saveBallots(newBallots);

    saveBallotsCloud(newBallots).catch(console.error);
  };

  const handleUpdateSingleBallot = (updatedBallot: Ballot) => {
    const updatedBallots = ballots.map((ballot) =>
      ballot.id === updatedBallot.id ? updatedBallot : ballot
    );

    setBallots(updatedBallots);
    saveBallots(updatedBallots);

    saveBallotCloud(updatedBallot).catch(console.error);
  };

  const handleCreateBallot = (name: string, accessCode: string) => {
    const newBallot: Ballot = {
      id:
        'ballot_' +
        Date.now() +
        '_' +
        Math.random().toString(36).substring(2, 6),
      name,
      accessCode,
      thankYouMessage: 'Dankie. Jou stem is suksesvol ingedien.',
      validVoterIds: [],
      manualVoterIds: [],
      boysCandidates: [],
      girlsCandidates: [],
      maxBoyPicks: 15,
      maxGirlPicks: 15,
      openTime: new Date().toISOString(),
      closeTime: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString(),
      isManualOpen: true,
      votes: [],
      createdAt: new Date().toISOString(),
    };

    const nextBallots = [newBallot, ...ballots];

    setBallots(nextBallots);
    saveBallots(nextBallots);

    saveBallotCloud(newBallot).catch(console.error);

    setViewMode({
      type: 'admin_ballot_detail',
      ballotId: newBallot.id,
    });
  };

  const handleCopyBallot = (ballotId: string) => {
    const sourceBallot = ballots.find(
      (ballot) => ballot.id === ballotId
    );

    if (!sourceBallot) {
      return;
    }

    const copiedBallot: Ballot = {
      id:
        'ballot_' +
        Date.now() +
        '_' +
        Math.random().toString(36).substring(2, 6),
      name: `${sourceBallot.name} (Kopie)`,
      accessCode: '',
      validVoterIds: [],
      manualVoterIds: [],
      boysCandidates: sourceBallot.boysCandidates.map((candidate) => ({
        ...candidate,
      })),
      girlsCandidates: sourceBallot.girlsCandidates.map((candidate) => ({
        ...candidate,
      })),
      maxBoyPicks: sourceBallot.maxBoyPicks,
      maxGirlPicks: sourceBallot.maxGirlPicks,
      openTime: new Date().toISOString(),
      closeTime: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString(),
      isManualOpen: false,
      votes: [],
      createdAt: new Date().toISOString(),
    };

    const nextBallots = [copiedBallot, ...ballots];

    setBallots(nextBallots);
    saveBallots(nextBallots);

    saveBallotCloud(copiedBallot).catch(console.error);

    setViewMode({
      type: 'admin_ballot_detail',
      ballotId: copiedBallot.id,
    });
  };

  const handleDeleteBallot = (ballotId: string) => {
    const filteredBallots = ballots.filter(
      (ballot) => ballot.id !== ballotId
    );

    setBallots(filteredBallots);
    saveBallots(filteredBallots);

    deleteBallotCloud(ballotId).catch(console.error);
  };

  const handleToggleManualOpen = (
    ballotId: string,
    isOpen: boolean
  ) => {
    const updatedBallots = ballots.map((ballot) =>
      ballot.id === ballotId
        ? {
            ...ballot,
            isManualOpen: isOpen,
          }
        : ballot
    );

    handleUpdateBallots(updatedBallots);
  };

  const handleResetDefaults = () => {
    resetToDefaults();

    setAdminSettings(getStoredAdminSettings());
    setBallots(getStoredBallots());

    setViewMode({
      type: 'admin_landing',
    });
  };

  const handleSubmitLearnerVote = async (
    ballotId: string,
    voterId: string,
    selectedBoyIds: string[],
    selectedGirlIds: string[]
  ): Promise<void> => {
    const targetBallot = ballots.find(
      (ballot) => ballot.id === ballotId
    );

    if (!targetBallot) {
      throw new Error('Die stembrief kon nie gevind word nie.');
    }

    const cleanVoterId = voterId.trim();

    if (!cleanVoterId) {
      throw new Error('Die leerder-ID is ongeldig.');
    }

    const newVoteRecord: VoteRecord = {
      id:
        'vote_' +
        Date.now() +
        '_' +
        Math.random().toString(36).substring(2, 6),
      voterId: cleanVoterId,
      selectedBoyIds,
      selectedGirlIds,
      timestamp: new Date().toISOString(),
    };

    const result = await submitVoteCloud(
      ballotId,
      newVoteRecord
    );

    if (!result.success) {
      throw new Error(
        result.reason || 'Die stem kon nie gestoor word nie.'
      );
    }
  };

  const currentBallot =
    viewMode.type === 'admin_ballot_detail' ||
    viewMode.type === 'learner_ballot_landing' ||
    viewMode.type === 'learner_voting'
      ? ballots.find(
          (ballot) => ballot.id === viewMode.ballotId
        )
      : null;

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 font-sans flex flex-col antialiased">
      {firebaseRulesError && (
        <div className="bg-amber-900/90 text-amber-100 text-xs px-4 py-3 flex items-center justify-between gap-3 shadow-md border-b border-amber-700">
          <div className="flex items-start md:items-center gap-2">
            <span className="font-bold text-amber-300 shrink-0">
              ⚠️ Firestore Security Rules Notice:
            </span>

            <span>
              Your Firebase Console project (
              <code>om-verkiesings</code>) has rules set to private.
              Your ballots are stored locally in your browser. To
              enable live database sync, go to your{' '}
              <a
                href="https://console.firebase.google.com/"
                target="_blank"
                rel="noreferrer"
                className="underline text-amber-200 font-semibold hover:text-white"
              >
                Firebase Console
              </a>{' '}
              &rarr; <strong>Firestore Database</strong> &rarr;{' '}
              <strong>Rules</strong> tab and publish the required
              rules.
            </span>
          </div>

          <button
            onClick={() => setFirebaseRulesError(false)}
            className="text-amber-200 hover:text-white text-xs px-2.5 py-1 rounded bg-amber-800/80 hover:bg-amber-800 shrink-0 transition-colors font-medium"
          >
            Dismiss
          </button>
        </div>
      )}

      <Header
        adminSettings={adminSettings}
        viewMode={viewMode}
        onNavigateHome={() => {
          signOutAdmin();
          setViewMode({
            type: 'app_landing',
          });
        }}
        onNavigateAdminHome={() =>
          setViewMode({
            type: 'admin_landing',
          })
        }
      />

      <main className="flex-1">
        {viewMode.type === 'app_landing' && (
          <AppLanding
            ballots={ballots}
            onAdminLogin={() =>
              setViewMode({
                type: 'admin_landing',
              })
            }
            onEnterLearnerBallot={(ballotId) =>
              setViewMode({
                type: 'learner_ballot_landing',
                ballotId,
              })
            }
          />
        )}

        {viewMode.type === 'admin_landing' && (
          <AdminLanding
            adminSettings={adminSettings}
            ballots={ballots}
            onSaveAdminSettings={handleUpdateAdminSettings}
            onCreateBallot={handleCreateBallot}
            onCopyBallot={handleCopyBallot}
            onDeleteBallot={handleDeleteBallot}
            onToggleManualOpen={handleToggleManualOpen}
            onSelectBallot={(ballotId) =>
              setViewMode({
                type: 'admin_ballot_detail',
                ballotId,
              })
            }
            onResetDefaults={handleResetDefaults}
          />
        )}

        {viewMode.type === 'admin_ballot_detail' &&
          currentBallot && (
            <BallotDetail
              ballot={currentBallot}
              ballots={ballots}
              onBack={() =>
                setViewMode({
                  type: 'admin_landing',
                })
              }
              onUpdateBallot={handleUpdateSingleBallot}
              onToggleManualOpen={handleToggleManualOpen}
            />
          )}

        {viewMode.type === 'learner_ballot_landing' &&
          currentBallot && (
            <LearnerBallotLanding
              adminSettings={adminSettings}
              ballot={currentBallot}
              onValidIdSubmitted={(voterId) =>
                setViewMode({
                  type: 'learner_voting',
                  ballotId: currentBallot.id,
                  voterId,
                })
              }
              onCancel={() =>
                setViewMode({
                  type: 'app_landing',
                })
              }
            />
          )}

        {viewMode.type === 'learner_voting' &&
          currentBallot && (
            <LearnerVotingFlow
              adminSettings={adminSettings}
              ballot={currentBallot}
              voterId={viewMode.voterId}
              onSubmitVote={(selectedBoyIds, selectedGirlIds) =>
                handleSubmitLearnerVote(
                  currentBallot.id,
                  viewMode.voterId,
                  selectedBoyIds,
                  selectedGirlIds
                )
              }
              onFinishAndHome={() =>
                setViewMode({
                  type: 'app_landing',
                })
              }
            />
          )}
      </main>
    </div>
  );
}