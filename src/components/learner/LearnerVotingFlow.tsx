import React, { useState } from 'react';
import {
  Check,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Search,
  Edit3,
  Vote,
  Sparkles,
  School,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { AdminSettings, Ballot, Candidate } from '../../types';

interface LearnerVotingFlowProps {
  adminSettings: AdminSettings;
  ballot: Ballot;
  voterId: string;
  onSubmitVote: (selectedBoyIds: string[], selectedGirlIds: string[]) => Promise<void>;
  onFinishAndHome: () => void;
}

type VotingStep = 'boys' | 'girls' | 'review' | 'thank_you';

export const LearnerVotingFlow: React.FC<LearnerVotingFlowProps> = ({
  adminSettings,
  ballot,
  voterId,
  onSubmitVote,
  onFinishAndHome,
}) => {
  const [currentStep, setCurrentStep] = useState<VotingStep>('boys');
  const [selectedBoyIds, setSelectedBoyIds] = useState<string[]>([]);
  const [selectedGirlIds, setSelectedGirlIds] = useState<string[]>([]);
  const [boySearch, setBoySearch] = useState('');
  const [girlSearch, setGirlSearch] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Toggle boy candidate selection (max limit enforced unless 0)
  const toggleBoy = (id: string) => {
    if (selectedBoyIds.includes(id)) {
      setSelectedBoyIds(selectedBoyIds.filter((item) => item !== id));
    } else {
      if (ballot.maxBoyPicks > 0 && selectedBoyIds.length >= ballot.maxBoyPicks) {
        alert(`Jy kan maksimum ${ballot.maxBoyPicks} seunskandidate kies.`);
        return;
      }
      setSelectedBoyIds([...selectedBoyIds, id]);
    }
  };

  // Toggle girl candidate selection (max limit enforced unless 0)
  const toggleGirl = (id: string) => {
    if (selectedGirlIds.includes(id)) {
      setSelectedGirlIds(selectedGirlIds.filter((item) => item !== id));
    } else {
      if (ballot.maxGirlPicks > 0 && selectedGirlIds.length >= ballot.maxGirlPicks) {
        alert(`Jy kan maksimum ${ballot.maxGirlPicks} dogterskandidate kies.`);
        return;
      }
      setSelectedGirlIds([...selectedGirlIds, id]);
    }
  };

  const handleFinalSubmit = async () => {
    setSubmitError(null);
    setIsSubmitting(true);

    try {
      await onSubmitVote(selectedBoyIds, selectedGirlIds);
      setCurrentStep('thank_you');
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : 'Die stem kon nie ingedien word nie. Probeer asseblief weer.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredBoys = ballot.boysCandidates.filter((c) =>
    c.name.toLowerCase().includes(boySearch.toLowerCase()) ||
    (c.grade && c.grade.toLowerCase().includes(boySearch.toLowerCase()))
  );

  const filteredGirls = ballot.girlsCandidates.filter((c) =>
    c.name.toLowerCase().includes(girlSearch.toLowerCase()) ||
    (c.grade && c.grade.toLowerCase().includes(girlSearch.toLowerCase()))
  );

  const selectedBoyCandidates = ballot.boysCandidates.filter((c) =>
    selectedBoyIds.includes(c.id)
  );

  const selectedGirlCandidates = ballot.girlsCandidates.filter((c) =>
    selectedGirlIds.includes(c.id)
  );

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fadeIn">
      {/* Stepper Wizard Indicator (Hidden on Thank You page) */}
      {currentStep !== 'thank_you' && (
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-sm p-4 sm:p-6 space-y-3">
          <div className="flex items-center justify-between gap-3 text-xs font-bold text-slate-500 uppercase tracking-wider">
            <span className="text-slate-900 font-extrabold text-sm sm:text-base normal-case truncate">{ballot.name}</span>
            <span className="shrink-0">Leerder ID: <strong className="text-slate-900 font-mono">{voterId}</strong></span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div
              className={`h-2 rounded-full transition-all ${
                currentStep === 'boys'
                  ? 'bg-slate-900'
                  : selectedBoyIds.length > 0
                  ? 'bg-emerald-600'
                  : 'bg-slate-200'
              }`}
            />
            <div
              className={`h-2 rounded-full transition-all ${
                currentStep === 'girls'
                  ? 'bg-slate-900'
                  : selectedGirlIds.length > 0
                  ? 'bg-emerald-600'
                  : 'bg-slate-200'
              }`}
            />
            <div
              className={`h-2 rounded-full transition-all ${
                currentStep === 'review' ? 'bg-slate-900' : 'bg-slate-200'
              }`}
            />
          </div>


        </div>
      )}

      {/* STEP 1: BOYS SELECTION */}
      {currentStep === 'boys' && (
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
                <span className="w-4 h-4 rounded-full bg-slate-900" />
                Kies Seunskandidate
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                {ballot.maxBoyPicks === 0 ? (
                  <>Kies seunskandidate. (Gekies: <strong className="text-slate-900 font-mono">{selectedBoyIds.length}</strong> / Geen beperking)</>
                ) : (
                  <>Kies 'n maksimum van <strong>{ballot.maxBoyPicks}</strong> seuns. (Gekies: <strong className="text-slate-900 font-mono">{selectedBoyIds.length}</strong> / {ballot.maxBoyPicks})</>
                )}
              </p>
            </div>

            {/* Search */}
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={boySearch}
                onChange={(e) => setBoySearch(e.target.value)}
                placeholder="Soek seunskandidaat..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>
          </div>

          {filteredBoys.length === 0 ? (
            <p className="text-xs text-slate-400 py-8 text-center italic">
              Geen seunskandidate gevind nie.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {filteredBoys.map((c) => {
                const isSelected = selectedBoyIds.includes(c.id);

                return (
                  <div
                    key={c.id}
                    onClick={() => toggleBoy(c.id)}
                    className={`py-2 px-3 sm:py-2.5 sm:px-3.5 rounded-xl border-2 cursor-pointer transition-all flex items-center justify-between gap-2 ${
                      isSelected
                        ? 'border-slate-900 bg-slate-100/80 shadow-xs ring-2 ring-slate-900/20'
                        : 'border-slate-200/90 bg-slate-50/60 hover:border-slate-300 hover:bg-white'
                    }`}
                  >
                    <div className="font-bold text-slate-900 text-sm truncate">{c.name}</div>

                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                        isSelected
                          ? 'bg-slate-900 border-slate-900 text-white'
                          : 'border-slate-300 bg-white'
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-500">
              Gekies: <strong>{selectedBoyIds.length}</strong> uit {ballot.maxBoyPicks} toegelaat
            </span>

            <button
              onClick={() => setCurrentStep('girls')}
              className="px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md shadow-slate-900/10 transition-all cursor-pointer flex items-center gap-2 transform active:scale-95"
            >
              <span>Gaan Voort na Dogters</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: GIRLS SELECTION */}
      {currentStep === 'girls' && (
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
                <span className="w-4 h-4 rounded-full bg-slate-900" />
                Kies Dogterskandidate
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                {ballot.maxGirlPicks === 0 ? (
                  <>Kies dogterskandidate. (Gekies: <strong className="text-slate-900 font-mono">{selectedGirlIds.length}</strong> / Geen beperking)</>
                ) : (
                  <>Kies 'n maksimum van <strong>{ballot.maxGirlPicks}</strong> dogters. (Gekies: <strong className="text-slate-900 font-mono">{selectedGirlIds.length}</strong> / {ballot.maxGirlPicks})</>
                )}
              </p>
            </div>

            {/* Search */}
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={girlSearch}
                onChange={(e) => setGirlSearch(e.target.value)}
                placeholder="Soek dogterskandidaat..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>
          </div>

          {filteredGirls.length === 0 ? (
            <p className="text-xs text-slate-400 py-8 text-center italic">
              Geen dogterskandidate gevind nie.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {filteredGirls.map((c) => {
                const isSelected = selectedGirlIds.includes(c.id);

                return (
                  <div
                    key={c.id}
                    onClick={() => toggleGirl(c.id)}
                    className={`py-2 px-3 sm:py-2.5 sm:px-3.5 rounded-xl border-2 cursor-pointer transition-all flex items-center justify-between gap-2 ${
                      isSelected
                        ? 'border-slate-900 bg-slate-100/80 shadow-xs ring-2 ring-slate-900/20'
                        : 'border-slate-200/90 bg-slate-50/60 hover:border-slate-300 hover:bg-white'
                    }`}
                  >
                    <div className="font-bold text-slate-900 text-sm truncate">{c.name}</div>

                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                        isSelected
                          ? 'bg-slate-900 border-slate-900 text-white'
                          : 'border-slate-300 bg-white'
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
            <button
              onClick={() => setCurrentStep('boys')}
              className="px-4 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl text-xs font-bold transition-colors flex items-center gap-2 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Terug na Seuns</span>
            </button>

            <button
              onClick={() => setCurrentStep('review')}
              className="px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md shadow-slate-900/10 transition-all cursor-pointer flex items-center gap-2 transform active:scale-95"
            >
              <span>Gaan Voort na Hersiening</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: REVIEW PAGE */}
      {currentStep === 'review' && (
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-8">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
              Hersiening van jou Stem
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Kontroleer jou keuses hieronder voordat jy jou finale stem inhandig.
            </p>
          </div>

          <div className="space-y-6">
            {/* Selected Boys Summary */}
            <div className="bg-slate-50 rounded-xl p-5 border border-slate-200 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-slate-900" />
                  Jou Gekose Seunskandidate ({selectedBoyCandidates.length})
                </h3>
                <button
                  onClick={() => setCurrentStep('boys')}
                  className="text-xs text-slate-900 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" /> Wysig Seuns
                </button>
              </div>

              {selectedBoyCandidates.length === 0 ? (
                <p className="text-xs text-slate-400 italic">Geen seunskandidate gekies nie.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {selectedBoyCandidates.map((c) => (
                    <div key={c.id} className="p-3 bg-white rounded-xl border border-slate-200 text-xs font-bold text-slate-900 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>{c.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Selected Girls Summary */}
            <div className="bg-slate-50 rounded-xl p-5 border border-slate-200 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-slate-900" />
                  Jou Gekose Dogterskandidate ({selectedGirlCandidates.length})
                </h3>
                <button
                  onClick={() => setCurrentStep('girls')}
                  className="text-xs text-slate-900 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" /> Wysig Dogters
                </button>
              </div>

              {selectedGirlCandidates.length === 0 ? (
                <p className="text-xs text-slate-400 italic">Geen dogterskandidate gekies nie.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {selectedGirlCandidates.map((c) => (
                    <div key={c.id} className="p-3 bg-white rounded-xl border border-slate-200 text-xs font-bold text-slate-900 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>{c.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {submitError && (
            <div className="rounded-xl bg-rose-50 border border-rose-200 p-3.5 text-xs sm:text-sm text-rose-800 flex items-start gap-2.5 animate-fadeIn">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>{submitError}</div>
            </div>
          )}

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-4">
            <button
              onClick={() => setCurrentStep('girls')}
              disabled={isSubmitting}
              className="px-4 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl text-xs font-bold transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-60 disabled:pointer-events-none"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Wysig Keuses</span>
            </button>

            <button
              onClick={handleFinalSubmit}
              disabled={isSubmitting}
              className="px-8 py-4 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-sm sm:text-base rounded-xl shadow-lg shadow-slate-900/10 transition-all cursor-pointer flex items-center gap-2.5 transform active:scale-95 disabled:opacity-60 disabled:pointer-events-none"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Besig om in te dien...</span>
                </>
              ) : (
                <>
                  <Vote className="w-5 h-5" />
                  <span>Dien My Stem In</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: THANK YOU PAGE */}
      {currentStep === 'thank_you' && (
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-xl p-8 sm:p-12 text-center space-y-6 max-w-lg mx-auto animate-scaleIn">
          <div className="w-20 h-20 rounded-full bg-slate-100 text-slate-900 flex items-center justify-center mx-auto shadow-inner ring-8 ring-slate-200">
            <CheckCircle2 className="w-12 h-12 stroke-[2.5]" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              Baie Dankie!
            </h2>
            <p className="text-base font-bold text-slate-900">
              Jou stem is suksesvol verwerk en aangeteken.
            </p>
          </div>

          <div className="pt-4">
            <button
              onClick={onFinishAndHome}
              className="w-full py-3.5 px-6 bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm rounded-xl shadow-md shadow-slate-900/10 transition-all cursor-pointer transform active:scale-95"
            >
              Voltooi & Sluit Af
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
