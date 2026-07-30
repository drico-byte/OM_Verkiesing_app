import React, { useState } from 'react';
import { 
  UserCheck, 
  UserPlus, 
  Search, 
  Trash2, 
  CheckCircle2, 
  Clock, 
  Upload, 
  Sparkles, 
  AlertCircle,
  Filter,
  Users
} from 'lucide-react';
import { Ballot } from '../../../types';

interface VoterIdsTabProps {
  ballot: Ballot;
  onUpdateBallot: (updatedBallot: Ballot) => void;
}

export const VoterIdsTab: React.FC<VoterIdsTabProps> = ({
  ballot,
  onUpdateBallot,
}) => {
  const [newIdInput, setNewIdInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'manual' | 'bulk' | 'voted' | 'not_voted'>('all');
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [page, setPage] = useState(1);
  const pageSize = 50;

  const manualSet = new Set(ballot.manualVoterIds || []);
  const votedIdsSet = new Set(ballot.votes.map((v) => v.voterId));

  // Default sample IDs check
  const defaultSampleIds = ['1001', '1002', '1003', '1004', '1005'];
  const hasSampleIds = defaultSampleIds.some((id) => ballot.validVoterIds.includes(id));

  // Add new IDs (single or multiple separated by comma/space/newline)
  const handleAddVoterIds = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newIdInput.trim()) return;

    // Split input by commas, spaces, or newlines
    const rawIds = newIdInput
      .split(/[\s,\n]+/)
      .map((id) => id.trim())
      .filter((id) => id.length > 0);

    if (rawIds.length === 0) return;

    const existingVoterIds = new Set(ballot.validVoterIds);
    const existingManualIds = new Set(ballot.manualVoterIds || []);

    const addedIds: string[] = [];
    let duplicateCount = 0;

    rawIds.forEach((id) => {
      if (existingVoterIds.has(id)) {
        duplicateCount++;
      } else {
        existingVoterIds.add(id);
        existingManualIds.add(id);
        addedIds.push(id);
      }
    });

    if (addedIds.length === 0) {
      setFeedbackMessage({
        type: 'error',
        text: duplicateCount > 0 
          ? `Al ${duplicateCount} ID('s) bestaan reeds in die stembrief.` 
          : 'Geen nuwe geldige ID\'s is gevind nie.',
      });
      return;
    }

    const updatedBallot: Ballot = {
      ...ballot,
      validVoterIds: Array.from(existingVoterIds),
      manualVoterIds: Array.from(existingManualIds),
    };

    onUpdateBallot(updatedBallot);
    setNewIdInput('');
    setFeedbackMessage({
      type: 'success',
      text: `${addedIds.length} nuwe ID('s) is suksesvol handmatig bygevoeg! ${duplicateCount > 0 ? `(${duplicateCount} duplikate oorgeslaan)` : ''}`,
    });
  };

  // Remove single ID
  const handleRemoveVoterId = (idToRemove: string) => {
    const updatedValid = ballot.validVoterIds.filter((id) => id !== idToRemove);
    const updatedManual = (ballot.manualVoterIds || []).filter((id) => id !== idToRemove);

    const updatedBallot: Ballot = {
      ...ballot,
      validVoterIds: updatedValid,
      manualVoterIds: updatedManual,
    };

    onUpdateBallot(updatedBallot);
    setFeedbackMessage({
      type: 'success',
      text: `ID "${idToRemove}" is verwyder.`,
    });
  };

  // Remove sample demo IDs (1001-1005)
  const handleRemoveSampleIds = () => {
    const updatedValid = ballot.validVoterIds.filter((id) => !defaultSampleIds.includes(id));
    const updatedManual = (ballot.manualVoterIds || []).filter((id) => !defaultSampleIds.includes(id));

    const updatedBallot: Ballot = {
      ...ballot,
      validVoterIds: updatedValid,
      manualVoterIds: updatedManual,
    };

    onUpdateBallot(updatedBallot);
    setFeedbackMessage({
      type: 'success',
      text: `Voorbeeld ID's (1001-1005) is suksesvol verwyder uit gemagtigde lys!`,
    });
  };

  // Filter list
  const filteredVoterIds = ballot.validVoterIds.filter((id) => {
    const matchesSearch = id.toLowerCase().includes(searchQuery.toLowerCase().trim());
    if (!matchesSearch) return false;

    const isManual = manualSet.has(id);
    const hasVoted = votedIdsSet.has(id);

    if (filterType === 'manual') return isManual;
    if (filterType === 'bulk') return !isManual;
    if (filterType === 'voted') return hasVoted;
    if (filterType === 'not_voted') return !hasVoted;

    return true;
  });

  // Pagination
  const totalPages = Math.ceil(filteredVoterIds.length / pageSize) || 1;
  const paginatedVoterIds = filteredVoterIds.slice((page - 1) * pageSize, page * pageSize);

  const manualCount = (ballot.manualVoterIds || []).length;
  const bulkCount = ballot.validVoterIds.length - manualCount;
  const votedCount = ballot.validVoterIds.filter((id) => votedIdsSet.has(id)).length;

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Top Stats Overview Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl p-5 border border-slate-200/90 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Totaal Gemagtig</span>
            <div className="p-2 rounded-lg bg-slate-100 text-slate-900">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900">{ballot.validVoterIds.length}</div>
          <div className="text-xs text-slate-500">Leerders toegelaat om te stem</div>
        </div>

        <div className="bg-white rounded-xl p-5 border border-slate-200/90 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Het Gestem</span>
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-emerald-700">{votedCount}</div>
          <div className="text-xs text-slate-500">{((votedCount / (ballot.validVoterIds.length || 1)) * 100).toFixed(1)}% van totaal</div>
        </div>

        <div className="bg-white rounded-xl p-5 border border-slate-200/90 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Handmatig Bygevoeg</span>
            <div className="p-2 rounded-lg bg-amber-50 text-amber-600">
              <UserPlus className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-amber-600">{manualCount}</div>
          <div className="text-xs text-slate-500">Wysigings deur admin</div>
        </div>

        <div className="bg-white rounded-xl p-5 border border-slate-200/90 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">CSV / Grootmaat</span>
            <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
              <Upload className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-blue-600">{Math.max(0, bulkCount)}</div>
          <div className="text-xs text-slate-500">Ingevoer via CSV lêer</div>
        </div>
      </div>

      {/* Sample IDs Cleanup Prompt Notice */}
      {hasSampleIds && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-950">
              <strong className="block text-sm font-bold text-amber-900 mb-0.5">Voorbeeld ID's (1001-1005) bespeur</strong>
              Hierdie stembrief bevat nog die 5 verstek voorbeeld ID's (1001 tot 1005). As jy slegs jou eie CSV ID's wil gebruik, kan jy hierdie 5 voorbeeld ID's verwyder.
            </div>
          </div>
          <button
            onClick={handleRemoveSampleIds}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold shadow-xs whitespace-nowrap cursor-pointer transition-colors"
          >
            Verwyder Voorbeeld ID's (1001-1005)
          </button>
        </div>
      )}

      {/* Manual Add Voter Form Card */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-sm p-6 space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <UserPlus className="w-5 h-5 text-slate-900" />
          <h2 className="text-lg font-bold text-slate-900">Handmatige Leerder ID Byvoeging</h2>
        </div>

        <form onSubmit={handleAddVoterIds} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Voer Leerder ID(s) In
            </label>
            <p className="text-xs text-slate-500 mb-2">
              Jy kan 'n enkel ID inhou of verskeie ID's gelyktydig byvoeg geskei deur kommas, spasies of nuwe reëls.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={newIdInput}
                onChange={(e) => setNewIdInput(e.target.value)}
                placeholder="Bv. 1098, 1099, 1100"
                className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 font-mono placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white"
              />
              <button
                type="submit"
                className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md shadow-slate-900/10 transition-all cursor-pointer flex items-center justify-center gap-2 shrink-0"
              >
                <UserPlus className="w-4 h-4" />
                <span>Voeg ID('s) By</span>
              </button>
            </div>
          </div>
        </form>

        {feedbackMessage && (
          <div
            className={`p-3 rounded-lg text-xs font-medium flex items-center gap-2 ${
              feedbackMessage.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-rose-50 text-rose-800 border border-rose-200'
            }`}
          >
            {feedbackMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{feedbackMessage.text}</span>
          </div>
        )}
      </div>

      {/* Voter IDs Table / List View */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-sm p-6 space-y-6">
        {/* Search & Filter Controls */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              placeholder="Soek Leerder ID..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar w-full md:w-auto text-xs font-semibold">
            <button
              onClick={() => { setFilterType('all'); setPage(1); }}
              className={`px-3 py-1.5 rounded-lg border transition-colors cursor-pointer whitespace-nowrap ${
                filterType === 'all'
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              Alle ({ballot.validVoterIds.length})
            </button>

            <button
              onClick={() => { setFilterType('manual'); setPage(1); }}
              className={`px-3 py-1.5 rounded-lg border transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                filterType === 'manual'
                  ? 'bg-amber-600 text-white border-amber-600'
                  : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Handmatig ({manualCount})</span>
            </button>

            <button
              onClick={() => { setFilterType('bulk'); setPage(1); }}
              className={`px-3 py-1.5 rounded-lg border transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                filterType === 'bulk'
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-blue-50 text-blue-800 border-blue-200 hover:bg-blue-100'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              <span>CSV Grootmaat ({Math.max(0, bulkCount)})</span>
            </button>

            <button
              onClick={() => { setFilterType('voted'); setPage(1); }}
              className={`px-3 py-1.5 rounded-lg border transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                filterType === 'voted'
                  ? 'bg-emerald-600 text-white border-emerald-600'
                  : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Gestem ({votedCount})</span>
            </button>
          </div>
        </div>

        {/* List Content */}
        {filteredVoterIds.length === 0 ? (
          <div className="py-12 text-center space-y-2">
            <Users className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-sm font-bold text-slate-700">Geen Leerder ID's gevind nie</p>
            <p className="text-xs text-slate-500">
              {searchQuery ? 'Geen resultate gepas met jou soektog nie.' : 'Daar is tans geen gemagtigde ID\'s in hierdie kategorie nie.'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {paginatedVoterIds.map((id) => {
                const isManual = manualSet.has(id);
                const vote = ballot.votes.find((v) => v.voterId === id);
                const hasVoted = !!vote;

                return (
                  <div
                    key={id}
                    className={`p-3.5 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                      isManual
                        ? 'bg-amber-50/50 border-amber-200 hover:border-amber-300'
                        : 'bg-slate-50/70 border-slate-200/90 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="font-mono text-base font-bold text-slate-900 tracking-wider">
                        {id}
                      </div>

                      {/* Status Badges */}
                      <div className="flex flex-wrap items-center gap-1.5">
                        {isManual ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 shadow-2xs">
                            <UserPlus className="w-3 h-3 text-amber-700" />
                            Handmatig
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-200/80 text-slate-700 border border-slate-300">
                            CSV
                          </span>
                        )}

                        {hasVoted ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Gestem
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 text-slate-500 border border-slate-200">
                            <Clock className="w-3 h-3 text-slate-400" />
                            Nog Nie
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => handleRemoveVoterId(id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                      title="Verwyder ID"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-4 border-t border-slate-100 text-xs">
                <span className="text-slate-500">
                  Wys {(page - 1) * pageSize + 1} tot {Math.min(page * pageSize, filteredVoterIds.length)} van {filteredVoterIds.length} ID's
                </span>

                <div className="flex items-center gap-2 font-semibold">
                  <button
                    disabled={page === 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    Vorige
                  </button>
                  <span className="px-2 text-slate-700">Bladsy {page} van {totalPages}</span>
                  <button
                    disabled={page === totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    Volgende
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
