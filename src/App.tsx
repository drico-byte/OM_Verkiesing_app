/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
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
} from './lib/firebase';
import { Header } from './components/Header';
import { AppLanding } from './components/AppLanding';
import { AdminLanding } from './components/admin/AdminLanding';
import { BallotDetail } from './components/admin/BallotDetail';
import { LearnerBallotLanding } from './components/learner/LearnerBallotLanding';
import { LearnerVotingFlow } from './components/learner/LearnerVotingFlow';

export default function App() {
  const [adminSettings, setAdminSettings] = useState<AdminSettings>(() => getStoredAdminSettings());
  const [ballots, setBallots] = useState<Ballot[]>(() => {
    const stored = getStoredBallots();
    return stored.filter((b) => b.id !== 'ballot_vrl_2026' && b.id !== 'ballot_klas_11a');
  });
  const [viewMode, setViewMode] = useState<ViewMode>({ type: 'app_landing' });
  const [firebaseRulesError, setFirebaseRulesError] = useState(false);

  useEffect(() => {
    const unsubPerm = subscribePermissionError((hasError) => {
      setFirebaseRulesError(hasError);
    });
    return () => unsubPerm();
  }, []);

  // Subscribe to Firebase Firestore real-time updates
  useEffect(() => {
    // 1. Admin Settings subscription
    const unsubscribeSettings = subscribeAdminSettings((cloudSettings) => {
      if (cloudSettings) {
        setAdminSettings(cloudSettings);
        saveAdminSettings(cloudSettings);
      } else {
        // Seed default settings to Firestore if empty
        const initial = getStoredAdminSettings();
        saveAdminSettingsCloud(initial).catch(console.error);
      }
    });

    // 2. Ballots subscription
    const unsubscribeBallots = subscribeBallots(
      (cloudBallots) => {
        const mockIds = ['ballot_vrl_2026', 'ballot_klas_11a'];
        if (cloudBallots && cloudBallots.length > 0) {
          // Auto-purge any initial mock ballots from Firestore
          cloudBallots.forEach((b) => {
            if (mockIds.includes(b.id)) {
              deleteBallotCloud(b.id).catch(console.error);
            }
          });

          const realBallots = cloudBallots.filter((b) => !mockIds.includes(b.id));

          // Sort ballots by createdAt descending
          const sorted = [...realBallots].sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
          setBallots(sorted);
          saveBallots(sorted);
        } else {
          // If cloud is empty, keep and sync existing local ballots
          const localBallots = getStoredBallots().filter((b) => !mockIds.includes(b.id));
          if (localBallots.length > 0) {
            setBallots(localBallots);
            saveBallotsCloud(localBallots).catch(console.error);
          }
        }
      },
      () => {
        // On error (e.g., missing permissions), preserve local storage ballots
        const mockIds = ['ballot_vrl_2026', 'ballot_klas_11a'];
        const localBallots = getStoredBallots().filter((b) => !mockIds.includes(b.id));
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

  // Sync state changes to storage & cloud
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
    const updated = ballots.map((b) => (b.id === updatedBallot.id ? updatedBallot : b));
    setBallots(updated);
    saveBallots(updated);
    saveBallotCloud(updatedBallot).catch(console.error);
  };

  const handleCreateBallot = (name: string, accessCode: string) => {
    const newBallot: Ballot = {
      id: 'ballot_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      name,
      accessCode,
      welcomeMessage: `Welkom by die ${name} verkiesing stembrief. Voer asseblief jou skool ID in om te stem.`,
      validVoterIds: [],
      boysCandidates: [],
      girlsCandidates: [],
      maxBoyPicks: 15,
      maxGirlPicks: 15,
      openTime: new Date().toISOString(),
      closeTime: new Date(Date.now() + 3600 * 1000 * 72).toISOString(), // 3 days
      isManualOpen: true,
      votes: [],
      createdAt: new Date().toISOString(),
    };

    const nextBallots = [newBallot, ...ballots];
    setBallots(nextBallots);
    saveBallots(nextBallots);
    saveBallotCloud(newBallot).catch(console.error);
    setViewMode({ type: 'admin_ballot_detail', ballotId: newBallot.id });
  };

  const handleDeleteBallot = (ballotId: string) => {
    const filtered = ballots.filter((b) => b.id !== ballotId);
    setBallots(filtered);
    saveBallots(filtered);
    deleteBallotCloud(ballotId).catch(console.error);
  };

  const handleToggleManualOpen = (ballotId: string, isOpen: boolean) => {
    const updated = ballots.map((b) => (b.id === ballotId ? { ...b, isManualOpen: isOpen } : b));
    handleUpdateBallots(updated);
  };

  const handleResetDefaults = () => {
    resetToDefaults();
    setAdminSettings(getStoredAdminSettings());
    setBallots(getStoredBallots());
    setViewMode({ type: 'admin_landing' });
  };

  // Submit learner vote
  const handleSubmitLearnerVote = (
    ballotId: string,
    voterId: string,
    selectedBoyIds: string[],
    selectedGirlIds: string[]
  ) => {
    const targetBallot = ballots.find((b) => b.id === ballotId);
    if (!targetBallot) return;

    const newVoteRecord: VoteRecord = {
      id: 'vote_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      voterId,
      selectedBoyIds,
      selectedGirlIds,
      timestamp: new Date().toISOString(),
    };

    const updatedBallot: Ballot = {
      ...targetBallot,
      votes: [newVoteRecord, ...targetBallot.votes],
    };

    handleUpdateSingleBallot(updatedBallot);
  };

  // Helper to get ballot for current detail/learner view
  const currentBallot =
    viewMode.type === 'admin_ballot_detail' ||
    viewMode.type === 'learner_ballot_landing' ||
    viewMode.type === 'learner_voting'
      ? ballots.find((b) => b.id === viewMode.ballotId)
      : null;

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 font-sans flex flex-col antialiased">
      {firebaseRulesError && (
        <div className="bg-amber-900/90 text-amber-100 text-xs px-4 py-3 flex items-center justify-between gap-3 shadow-md border-b border-amber-700">
          <div className="flex items-start md:items-center gap-2">
            <span className="font-bold text-amber-300 shrink-0">⚠️ Firestore Security Rules Notice:</span>
            <span>
              Your Firebase Console project (<code>om-verkiesings</code>) has rules set to private.
              Your ballots are stored locally in your browser. To enable live database sync, go to your{' '}
              <a
                href="https://console.firebase.google.com/"
                target="_blank"
                rel="noreferrer"
                className="underline text-amber-200 font-semibold hover:text-white"
              >
                Firebase Console
              </a>{' '}
              &rarr; <strong>Firestore Database</strong> &rarr; <strong>Rules</strong> tab and change rules to allow read/write.
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

      {/* Global Application Header */}
      <Header
        adminSettings={adminSettings}
        viewMode={viewMode}
        onNavigateHome={() => setViewMode({ type: 'app_landing' })}
        onNavigateAdminHome={() => setViewMode({ type: 'admin_landing' })}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {viewMode.type === 'app_landing' && (
          <AppLanding
            adminSettings={adminSettings}
            ballots={ballots}
            onAdminLogin={() => setViewMode({ type: 'admin_landing' })}
            onEnterLearnerBallot={(ballotId) =>
              setViewMode({ type: 'learner_ballot_landing', ballotId })
            }
          />
        )}

        {viewMode.type === 'admin_landing' && (
          <AdminLanding
            adminSettings={adminSettings}
            ballots={ballots}
            onSaveAdminSettings={handleUpdateAdminSettings}
            onCreateBallot={handleCreateBallot}
            onDeleteBallot={handleDeleteBallot}
            onToggleManualOpen={handleToggleManualOpen}
            onSelectBallot={(ballotId) =>
              setViewMode({ type: 'admin_ballot_detail', ballotId })
            }
            onResetDefaults={handleResetDefaults}
          />
        )}

        {viewMode.type === 'admin_ballot_detail' && currentBallot && (
          <BallotDetail
            ballot={currentBallot}
            onBack={() => setViewMode({ type: 'admin_landing' })}
            onUpdateBallot={handleUpdateSingleBallot}
            onToggleManualOpen={handleToggleManualOpen}
          />
        )}

        {viewMode.type === 'learner_ballot_landing' && currentBallot && (
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
            onCancel={() => setViewMode({ type: 'app_landing' })}
          />
        )}

        {viewMode.type === 'learner_voting' && currentBallot && (
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
            onFinishAndHome={() => setViewMode({ type: 'app_landing' })}
          />
        )}
      </main>
    </div>
  );
}
