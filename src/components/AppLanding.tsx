import React, { useState } from 'react';
import { KeyRound, ArrowRight, AlertCircle } from 'lucide-react';
import { AdminSettings, Ballot } from '../types';

interface AppLandingProps {
  adminSettings: AdminSettings;
  ballots: Ballot[];
  onAdminLogin: () => void;
  onEnterLearnerBallot: (ballotId: string) => void;
}

export const AppLanding: React.FC<AppLandingProps> = ({
  adminSettings,
  ballots,
  onAdminLogin,
  onEnterLearnerBallot,
}) => {
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedCode = code.trim();
    if (!trimmedCode) {
      setError('Voer asseblief n toelatingskode of adminwagwoord in.');
      return;
    }

    // 1. Check if it's the admin password
    if (trimmedCode === adminSettings.adminPassword) {
      onAdminLogin();
      return;
    }

    // 2. Check if it matches a ballot's access code (case insensitive)
    const matchingBallot = ballots.find(
      (b) => b.accessCode.trim().toLowerCase() === trimmedCode.toLowerCase()
    );

    if (matchingBallot) {
      // Check if ballot is manual closed or closed by date
      const now = new Date();
      const openDate = new Date(matchingBallot.openTime);
      const closeDate = new Date(matchingBallot.closeTime);

      const isTimeOpen = now >= openDate && now <= closeDate;
      const isOpen = matchingBallot.isManualOpen && isTimeOpen;

      if (!isOpen) {
        if (!matchingBallot.isManualOpen) {
          setError(`Die stembrief "${matchingBallot.name}" is tans handmatig gesluit deur die administrateur.`);
        } else if (now < openDate) {
          setError(`Die stembrief "${matchingBallot.name}" maak eers oop op ${openDate.toLocaleString('af-ZA')}.`);
        } else {
          setError(`Die stembrief "${matchingBallot.name}" het reeds gesluit op ${closeDate.toLocaleString('af-ZA')}.`);
        }
        return;
      }

      onEnterLearnerBallot(matchingBallot.id);
      return;
    }

    // 3. Otherwise invalid
    setError('Ongeldige verkiesingskode of admin-wagwoord. Kontroleer asseblief jou kode en probeer weer.');
  };

  return (
    <div className="min-h-[calc(100vh-5rem)] bg-slate-50 flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 mt-[22px] rounded-[30px]">
        {/* Input Form Card */}
        <div className="bg-white py-8 px-6 shadow-sm rounded-xl border border-slate-200/90 sm:px-8">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="text-center">
              <label htmlFor="toelatingskode" className="block text-xl sm:text-2xl font-bold text-slate-900 text-center">
                Verkiesingskode
              </label>
              <p className="text-xs text-slate-500 mt-1 text-center">
                Sleutel die kode in wat deur jou onderwyser / skool verskaf is.
              </p>
              
              <div className="mt-2 relative rounded-xl shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <KeyRound className="h-5 w-5" />
                </div>
                <input
                  id="toelatingskode"
                  name="toelatingskode"
                  type="text"
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder=""
                  className="block w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent focus:bg-white text-base font-mono uppercase tracking-wider transition-all"
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
              <span className="text-[#EAC321]">Gaan Voort na Stembrief</span>
              <ArrowRight className="w-5 h-5 text-[#EAC321]" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
