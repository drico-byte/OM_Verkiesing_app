import React, { useState } from 'react';
import { UserCheck, ArrowRight, AlertCircle, School, Lock, ArrowLeft } from 'lucide-react';
import { AdminSettings, Ballot } from '../../types';

interface LearnerBallotLandingProps {
  adminSettings: AdminSettings;
  ballot: Ballot;
  onValidIdSubmitted: (voterId: string) => void;
  onCancel: () => void;
}

export const LearnerBallotLanding: React.FC<LearnerBallotLandingProps> = ({
  adminSettings,
  ballot,
  onValidIdSubmitted,
  onCancel,
}) => {
  const [voterIdInput, setVoterIdInput] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedId = voterIdInput.trim();
    if (!trimmedId) {
      setError('Voer asseblief jou skool Leerder ID / Admiskode in.');
      return;
    }

    // 1. Check if ID is in valid voters list (case insensitive string match)
    const isValidId = ballot.validVoterIds.some(
      (id) => id.trim().toLowerCase() === trimmedId.toLowerCase()
    );

    if (!isValidId) {
      setError('Hierdie Leerder ID is nie gemagtig om in hierdie verkiesing te stem nie. Kontroleer asseblief jou ID-nommer.');
      return;
    }

    // 2. Check if ID has already voted in this ballot
    const hasAlreadyVoted = ballot.votes.some(
      (v) => v.voterId.trim().toLowerCase() === trimmedId.toLowerCase()
    );

    if (hasAlreadyVoted) {
      setError('Hierdie Leerder ID het reeds n stem vir hierdie verkiesing ingedien. Elkeen mag slegs een keer stem.');
      return;
    }

    // Valid and not voted yet!
    onValidIdSubmitted(trimmedId);
  };

  return (
    <div className="min-h-[calc(100vh-5rem)] bg-slate-50 flex flex-col justify-start items-center pt-4 sm:pt-8 pb-10 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-4">
        {/* Header Branding */}
        <div className="text-center">
          <div className="mx-auto w-[140px] h-[140px] rounded-[36px] bg-white flex items-center justify-center p-2 shadow-xl shadow-slate-900/10 border-0">
            {adminSettings.schoolLogoUrl ? (
              <img
                src={adminSettings.schoolLogoUrl}
                alt="Skool Emblem"
                className="w-full h-full object-contain rounded-xl"
              />
            ) : (
              <School className="w-12 h-12 text-slate-800" />
            )}
          </div>

          <h1 className="mt-3 text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            {ballot.name}
          </h1>
        </div>

        {/* Input Form Card */}
        <div className="bg-white py-6 px-6 shadow-sm rounded-xl border border-slate-200/90 sm:px-8 space-y-5">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="text-center">
              <label htmlFor="voterId" className="block text-xl sm:text-2xl font-bold text-slate-900 text-center">
                Toelatingsnommer
              </label>
              <p className="text-xs text-slate-500 mt-1 text-center">
                Tik jou unieke 6-syfer toelatingsnommer in
              </p>

              <div className="mt-2 relative rounded-xl shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <UserCheck className="h-5 w-5" />
                </div>
                <input
                  id="voterId"
                  name="voterId"
                  type="text"
                  required
                  value={voterIdInput}
                  onChange={(e) => setVoterIdInput(e.target.value)}
                  className="block w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white text-base font-mono tracking-wider transition-all"
                />
              </div>
            </div>

            {error && (
              <div className="rounded-xl bg-rose-50 border border-rose-200 p-3.5 text-xs sm:text-sm text-rose-800 flex items-start gap-2.5 animate-fadeIn">
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div>{error}</div>
              </div>
            )}

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 py-3.5 px-4 border border-transparent rounded-xl shadow-md shadow-slate-900/10 text-base font-bold text-white bg-slate-900 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-900 transition-all cursor-pointer transform active:scale-[0.99]"
            >
              <span>Begin Stemming</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </form>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
            <button
              type="button"
              onClick={onCancel}
              title="Terug"
              aria-label="Terug"
              className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg font-medium transition-colors cursor-pointer flex items-center justify-center"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            
            <span className="flex items-center gap-1 text-slate-400">
              <Lock className="w-3.5 h-3.5 text-slate-900" /> Gevalideerde ID
            </span>
          </div>
        </div>


      </div>
    </div>
  );
};
