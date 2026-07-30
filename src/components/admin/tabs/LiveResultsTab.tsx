import React, { useState, useEffect } from 'react';
import { RefreshCw, Trophy, Users, Clock, CheckCircle, BarChart3, ShieldAlert } from 'lucide-react';
import { Ballot, Candidate } from '../../../types';

interface LiveResultsTabProps {
  ballot: Ballot;
}

export const LiveResultsTab: React.FC<LiveResultsTabProps> = ({ ballot }) => {
  const [secondsUntilRefresh, setSecondsUntilRefresh] = useState(5);
  const [lastRefreshTime, setLastRefreshTime] = useState(new Date());

  // Auto-refresh timer logic
  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsUntilRefresh((prev) => {
        if (prev <= 1) {
          setLastRefreshTime(new Date());
          return 5;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleManualRefresh = () => {
    setLastRefreshTime(new Date());
    setSecondsUntilRefresh(5);
  };

  // Compute votes
  const totalValid = ballot.validVoterIds.length;
  const totalVotesCast = ballot.votes.length;
  const percentageProcess = totalValid > 0 ? ((totalVotesCast / totalValid) * 100).toFixed(1) : '0';

  // Last vote timestamp
  const lastVoteTimestamp =
    ballot.votes.length > 0
      ? new Date(
          Math.max(...ballot.votes.map((v) => new Date(v.timestamp).getTime()))
        ).toLocaleString('af-ZA')
      : 'Nog geen stemme ingedien nie';

  // Candidate tallies
  const boyVotesMap = new Map<string, number>();
  const girlVotesMap = new Map<string, number>();

  ballot.votes.forEach((v) => {
    v.selectedBoyIds.forEach((id) => {
      boyVotesMap.set(id, (boyVotesMap.get(id) || 0) + 1);
    });
    v.selectedGirlIds.forEach((id) => {
      girlVotesMap.set(id, (girlVotesMap.get(id) || 0) + 1);
    });
  });

  // Sort candidates by vote count descending
  const sortedBoys = [...ballot.boysCandidates].sort(
    (a, b) => (boyVotesMap.get(b.id) || 0) - (boyVotesMap.get(a.id) || 0)
  );

  const sortedGirls = [...ballot.girlsCandidates].sort(
    (a, b) => (girlVotesMap.get(b.id) || 0) - (girlVotesMap.get(a.id) || 0)
  );

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Metrics Banner */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 font-serif flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-500" />
              Intydse Leaderboard & Uitslae
            </h2>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={handleManualRefresh}
              className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Vervars Nou</span>
            </button>
          </div>
        </div>

        {/* 3 Metric cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-1">
            <span className="text-slate-500 font-medium">Stemme Ingedien</span>
            <div className="text-xl font-extrabold text-slate-900 font-mono">
              {totalVotesCast} <span className="text-xs text-slate-500 font-normal">/ {totalValid} leerders</span>
            </div>
          </div>

          <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-1">
            <span className="text-slate-500 font-medium">% Vordering van Stemproses</span>
            <div className="text-xl font-extrabold text-emerald-800 font-mono">
              {percentageProcess}%
            </div>
          </div>

          <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-1">
            <span className="text-slate-500 font-medium">Tydstip van Laaste Stem</span>
            <div className="text-xs font-bold text-slate-800 font-mono truncate">
              {lastVoteTimestamp}
            </div>
          </div>
        </div>
      </div>

      {/* Leaderboard Lists Side-by-Side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* BOYS LEADERBOARD */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-base font-bold text-slate-900 font-serif flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-blue-500" />
              Seunskandidate Leaderboard
            </h3>
            <span className="text-xs text-slate-500">
              {sortedBoys.length} Kandidate
            </span>
          </div>

          {sortedBoys.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center italic">
              Geen seunskandidate gelaai nie.
            </p>
          ) : (
            <div className="space-y-2">
              {sortedBoys.map((candidate, idx) => {
                const votes = boyVotesMap.get(candidate.id) || 0;
                const pct = totalVotesCast > 0 ? Math.round((votes / totalVotesCast) * 100) : 0;
                const isTop = idx === 0 && votes > 0;

                return (
                  <div
                    key={candidate.id}
                    className={`px-3.5 py-2 rounded-xl border transition-all flex items-center justify-between ${
                      isTop
                        ? 'bg-amber-50/60 border-amber-200/90 shadow-xs'
                        : 'bg-slate-50/70 border-slate-200/80'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold font-mono ${
                          idx === 0
                            ? 'bg-amber-400 text-amber-950'
                            : idx === 1
                            ? 'bg-slate-300 text-slate-800'
                            : idx === 2
                            ? 'bg-amber-700/30 text-amber-900'
                            : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        {idx + 1}
                      </span>
                      <div>
                        <span className="font-bold text-slate-900 text-sm">{candidate.name}</span>
                        {candidate.grade && (
                          <span className="ml-2 text-[11px] text-slate-500 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                            {candidate.grade}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-sm font-extrabold text-slate-900 font-mono">{votes}</span>
                      <span className="text-xs text-slate-500 ml-1">stemme ({pct}%)</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* GIRLS LEADERBOARD */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-base font-bold text-slate-900 font-serif flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-rose-500" />
              Dogterskandidate Leaderboard
            </h3>
            <span className="text-xs text-slate-500">
              {sortedGirls.length} Kandidate
            </span>
          </div>

          {sortedGirls.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center italic">
              Geen dogterskandidate gelaai nie.
            </p>
          ) : (
            <div className="space-y-2">
              {sortedGirls.map((candidate, idx) => {
                const votes = girlVotesMap.get(candidate.id) || 0;
                const pct = totalVotesCast > 0 ? Math.round((votes / totalVotesCast) * 100) : 0;
                const isTop = idx === 0 && votes > 0;

                return (
                  <div
                    key={candidate.id}
                    className={`px-3.5 py-2 rounded-xl border transition-all flex items-center justify-between ${
                      isTop
                        ? 'bg-amber-50/60 border-amber-200/90 shadow-xs'
                        : 'bg-slate-50/70 border-slate-200/80'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold font-mono ${
                          idx === 0
                            ? 'bg-amber-400 text-amber-950'
                            : idx === 1
                            ? 'bg-slate-300 text-slate-800'
                            : idx === 2
                            ? 'bg-amber-700/30 text-amber-900'
                            : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        {idx + 1}
                      </span>
                      <div>
                        <span className="font-bold text-slate-900 text-sm">{candidate.name}</span>
                        {candidate.grade && (
                          <span className="ml-2 text-[11px] text-slate-500 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                            {candidate.grade}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-sm font-extrabold text-slate-900 font-mono">{votes}</span>
                      <span className="text-xs text-slate-500 ml-1">stemme ({pct}%)</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
