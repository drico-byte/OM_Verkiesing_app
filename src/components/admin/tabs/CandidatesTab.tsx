import React, { useState } from 'react';
import { Search, Plus, Trash2, UserPlus, Users, User, Filter, AlertCircle } from 'lucide-react';
import { Ballot, Candidate, Gender } from '../../../types';

interface CandidatesTabProps {
  ballot: Ballot;
  onUpdateBallot: (updatedBallot: Ballot) => void;
}

export const CandidatesTab: React.FC<CandidatesTabProps> = ({
  ballot,
  onUpdateBallot,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [genderFilter, setGenderFilter] = useState<'alles' | 'seun' | 'dogter'>('alles');
  const [showAddModal, setShowAddModal] = useState(false);
  const [candidateToDelete, setCandidateToDelete] = useState<Candidate | null>(null);

  // New candidate form
  const [name, setName] = useState('');
  const [gender, setGender] = useState<Gender>('seun');
  const [grade, setGrade] = useState('');

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newCandidate: Candidate = {
      id: 'candidate_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      name: name.trim(),
      gender,
      grade: grade.trim() || undefined,
    };

    const updatedBoys = [...ballot.boysCandidates];
    const updatedGirls = [...ballot.girlsCandidates];

    if (gender === 'seun') {
      updatedBoys.push(newCandidate);
      updatedBoys.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));
    } else {
      updatedGirls.push(newCandidate);
      updatedGirls.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));
    }

    onUpdateBallot({
      ...ballot,
      boysCandidates: updatedBoys,
      girlsCandidates: updatedGirls,
    });

    setName('');
    setGrade('');
    setShowAddModal(false);
  };

  const handleConfirmDeleteCandidate = () => {
    if (!candidateToDelete) return;
    if (candidateToDelete.gender === 'seun') {
      const updatedBoys = ballot.boysCandidates.filter((c) => c.id !== candidateToDelete.id);
      onUpdateBallot({ ...ballot, boysCandidates: updatedBoys });
    } else {
      const updatedGirls = ballot.girlsCandidates.filter((c) => c.id !== candidateToDelete.id);
      onUpdateBallot({ ...ballot, girlsCandidates: updatedGirls });
    }
    setCandidateToDelete(null);
  };

  // Filter candidates
  const filteredBoys = ballot.boysCandidates.filter((c) =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.grade && c.grade.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const filteredGirls = ballot.girlsCandidates.filter((c) =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.grade && c.grade.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Search & Actions Header */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto flex-1">
          {/* Search bar */}
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Soek kandidaat op naam of klas..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white"
            />
          </div>

          {/* Gender Filter Buttons */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl w-full sm:w-auto border border-slate-200 text-xs">
            <button
              onClick={() => setGenderFilter('alles')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                genderFilter === 'alles'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Alles ({ballot.boysCandidates.length + ballot.girlsCandidates.length})
            </button>
            <button
              onClick={() => setGenderFilter('seun')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                genderFilter === 'seun'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Seuns ({ballot.boysCandidates.length})
            </button>
            <button
              onClick={() => setGenderFilter('dogter')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                genderFilter === 'dogter'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Dogters ({ballot.girlsCandidates.length})
            </button>
          </div>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="w-full md:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors shadow-sm cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          <span>Voeg Kandidaat Handmatig By</span>
        </button>
      </div>

      {/* BOYS CANDIDATES SECTION */}
      {(genderFilter === 'alles' || genderFilter === 'seun') && (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-base font-bold text-slate-900 font-serif flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-blue-600" />
              Seunskandidate ({filteredBoys.length})
            </h3>
          </div>

          {filteredBoys.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center italic">
              Geen seunskandidate gevind nie.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredBoys.map((candidate) => (
                <div
                  key={candidate.id}
                  className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-3 hover:border-blue-300 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm shrink-0">
                      {candidate.name.charAt(0)}
                    </div>
                    <div className="truncate">
                      <div className="font-bold text-slate-900 text-sm truncate">{candidate.name}</div>
                      <div className="text-[11px] text-slate-500">
                        {candidate.grade || 'Klas ongespesifiseer'} • Seun
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => setCandidateToDelete(candidate)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors shrink-0 cursor-pointer"
                    title="Skrap kandidaat"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* GIRLS CANDIDATES SECTION */}
      {(genderFilter === 'alles' || genderFilter === 'dogter') && (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-base font-bold text-slate-900 font-serif flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-rose-600" />
              Dogterskandidate ({filteredGirls.length})
            </h3>
          </div>

          {filteredGirls.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center italic">
              Geen dogterskandidate gevind nie.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredGirls.map((candidate) => (
                <div
                  key={candidate.id}
                  className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-3 hover:border-rose-300 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center font-bold text-sm shrink-0">
                      {candidate.name.charAt(0)}
                    </div>
                    <div className="truncate">
                      <div className="font-bold text-slate-900 text-sm truncate">{candidate.name}</div>
                      <div className="text-[11px] text-slate-500">
                        {candidate.grade || 'Klas ongespesifiseer'} • Dogter
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => setCandidateToDelete(candidate)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors shrink-0 cursor-pointer"
                    title="Skrap kandidaat"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* DELETE CANDIDATE CONFIRMATION MODAL */}
      {candidateToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-2xl border border-slate-100 animate-scaleIn">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-rose-600" />
              </div>
              <h3 className="text-base font-bold text-slate-900 font-serif">Skrap Kandidaat?</h3>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Is jy seker jy wil vir <strong>{candidateToDelete.name}</strong> ({candidateToDelete.gender === 'seun' ? 'Seun' : 'Dogter'}) skrap uit hierdie stembrief?
            </p>

            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setCandidateToDelete(null)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Kanselleer
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteCandidate}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-md transition-colors cursor-pointer"
              >
                Ja, Skrap
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD CANDIDATE MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-slate-100 animate-scaleIn">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-900 font-serif">Voeg Kandidaat By</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Volle Volledige Naam & Van
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Bv. Francois Louw"
                  className="mt-1.5 block w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Geslag
                </label>
                <div className="mt-1.5 grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setGender('seun')}
                    className={`py-2.5 rounded-xl border text-xs font-bold transition-all ${
                      gender === 'seun'
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-300'
                    }`}
                  >
                    Seun
                  </button>
                  <button
                    type="button"
                    onClick={() => setGender('dogter')}
                    className={`py-2.5 rounded-xl border text-xs font-bold transition-all ${
                      gender === 'dogter'
                        ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-300'
                    }`}
                  >
                    Dogter
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Graad / Klas (Opsioneel)
                </label>
                <input
                  type="text"
                  value={grade}
                  onChange={(e) => setGrade(e.target.value)}
                  placeholder="Bv. Gr. 11A"
                  className="mt-1.5 block w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl text-xs font-bold transition-colors"
                >
                  Kanselleer
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md transition-colors"
                >
                  Voeg By
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
