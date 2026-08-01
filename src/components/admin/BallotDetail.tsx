import React, { useState } from 'react';
import { 
  ArrowLeft, 
  LayoutDashboard, 
  Trophy, 
  Users, 
  Upload, 
  Download, 
  Settings, 
  Key,
  Calendar,
  ShieldAlert
} from 'lucide-react';
import { Ballot } from '../../types';
import { OverviewTab } from './tabs/OverviewTab';
import { LiveResultsTab } from './tabs/LiveResultsTab';
import { CandidatesTab } from './tabs/CandidatesTab';
import { VoterIdsTab } from './tabs/VoterIdsTab';
import { UploadDataTab } from './tabs/UploadDataTab';
import { ExportDataTab } from './tabs/ExportDataTab';
import { SettingsTab } from './tabs/SettingsTab';
import { UserCheck } from 'lucide-react';

interface BallotDetailProps {
  ballot: Ballot;
  ballots: Ballot[];
  onBack: () => void;
  onUpdateBallot: (updatedBallot: Ballot) => void;
  onToggleManualOpen: (ballotId: string, isOpen: boolean) => void;
}

export type BallotTabType = 'overview' | 'live_results' | 'voter_ids' | 'candidates' | 'upload' | 'export' | 'settings';

export const BallotDetail: React.FC<BallotDetailProps> = ({
  ballot,
  ballots,
  onBack,
  onUpdateBallot,
  onToggleManualOpen,
}) => {
  const [activeTab, setActiveTab] = useState<BallotTabType>('overview');

  const now = new Date();
  const openDate = new Date(ballot.openTime);
  const closeDate = new Date(ballot.closeTime);
  const isTimeOpen = now >= openDate && now <= closeDate;
  const isOpen = ballot.isManualOpen && isTimeOpen;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Header & Navigation */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
            title="Terug na Stembriewe Lys"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
                {ballot.name}
              </h1>
              <span className="bg-slate-100 text-slate-900 text-xs font-mono px-2.5 py-0.5 rounded-md border border-slate-200 font-bold">
                {ballot.accessCode}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
              <span>Toelatingskode: <strong className="text-slate-800 font-mono">{ballot.accessCode}</strong></span>
              <span>•</span>
              <span>{ballot.validVoterIds.length} Gemagtigde Leerders</span>
            </p>
          </div>
        </div>

        {/* Manual Open/Close Controls */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 pt-3 md:pt-0 border-slate-100">
          <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-xl border border-slate-200 text-xs font-bold">
            <span className="text-slate-500 ml-1">Status:</span>
            <label className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg cursor-pointer transition-all border ${ballot.isManualOpen ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs' : 'text-slate-600 hover:text-slate-900 border-transparent'}`}>
              <input
                type="radio"
                name="ballotDetailManual"
                checked={ballot.isManualOpen === true}
                onChange={() => onToggleManualOpen(ballot.id, true)}
                className="hidden"
              />
              <span>● OOP</span>
            </label>

            <label className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg cursor-pointer transition-all border ${!ballot.isManualOpen ? 'bg-rose-600 text-white border-rose-700 shadow-xs' : 'text-slate-600 hover:text-slate-900 border-transparent'}`}>
              <input
                type="radio"
                name="ballotDetailManual"
                checked={ballot.isManualOpen === false}
                onChange={() => onToggleManualOpen(ballot.id, false)}
                className="hidden"
              />
              <span>● GESLUIT</span>
            </label>
          </div>
        </div>
      </div>

      {/* 6 TABS BAR */}
      <div className="flex border-b border-slate-200 overflow-x-auto no-scrollbar space-x-2 sm:space-x-6 pb-1">
        <button
          onClick={() => setActiveTab('overview')}
          className={`pb-3 px-3 text-xs sm:text-sm font-semibold flex items-center gap-2 transition-colors border-b-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'overview'
              ? 'border-slate-900 text-slate-900'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <LayoutDashboard className="w-4 h-4" />
          <span>Oorsig</span>
        </button>

        <button
          onClick={() => setActiveTab('live_results')}
          className={`pb-3 px-3 text-xs sm:text-sm font-semibold flex items-center gap-2 transition-colors border-b-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'live_results'
              ? 'border-slate-900 text-slate-900'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Trophy className="w-4 h-4 text-slate-900" />
          <span>Lewendige Uitslae</span>
        </button>

        <button
          onClick={() => setActiveTab('voter_ids')}
          className={`pb-3 px-3 text-xs sm:text-sm font-semibold flex items-center gap-2 transition-colors border-b-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'voter_ids'
              ? 'border-slate-900 text-slate-900'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <UserCheck className="w-4 h-4 text-emerald-600" />
          <span>Gemagtigde Leerders ({ballot.validVoterIds.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('candidates')}
          className={`pb-3 px-3 text-xs sm:text-sm font-semibold flex items-center gap-2 transition-colors border-b-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'candidates'
              ? 'border-slate-900 text-slate-900'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Kandidate ({ballot.boysCandidates.length + ballot.girlsCandidates.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('upload')}
          className={`pb-3 px-3 text-xs sm:text-sm font-semibold flex items-center gap-2 transition-colors border-b-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'upload'
              ? 'border-slate-900 text-slate-900'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Upload className="w-4 h-4" />
          <span>Data Oplaai</span>
        </button>

        <button
          onClick={() => setActiveTab('export')}
          className={`pb-3 px-3 text-xs sm:text-sm font-semibold flex items-center gap-2 transition-colors border-b-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'export'
              ? 'border-slate-900 text-slate-900'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Download className="w-4 h-4" />
          <span>Data Uitvoer</span>
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`pb-3 px-3 text-xs sm:text-sm font-semibold flex items-center gap-2 transition-colors border-b-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'settings'
              ? 'border-slate-900 text-slate-900'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>Instellings</span>
        </button>
      </div>

      {/* RENDER TAB CONTENT */}
      <div>
        {activeTab === 'overview' && <OverviewTab ballot={ballot} />}
        {activeTab === 'live_results' && <LiveResultsTab ballot={ballot} />}
        {activeTab === 'voter_ids' && (
          <VoterIdsTab ballot={ballot} onUpdateBallot={onUpdateBallot} />
        )}
        {activeTab === 'candidates' && (
          <CandidatesTab ballot={ballot} onUpdateBallot={onUpdateBallot} />
        )}
        {activeTab === 'upload' && (
          <UploadDataTab ballot={ballot} onUpdateBallot={onUpdateBallot} />
        )}
        {activeTab === 'export' && <ExportDataTab ballot={ballot} />}
        {activeTab === 'settings' && (
          <SettingsTab ballot={ballot} ballots={ballots} onUpdateBallot={onUpdateBallot} />
        )}
      </div>
    </div>
  );
};
