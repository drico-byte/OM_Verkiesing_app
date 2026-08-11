import React, { useState } from 'react';
import { KeyRound, ArrowRight, AlertCircle, Loader2, School, Lock, ArrowLeft, Mail } from 'lucide-react';
import { AdminSettings } from '../types';
import { signInAdmin, findBallotByAccessCode } from '../lib/firebase';

interface AppLandingProps {
  adminSettings: AdminSettings;
  onAdminLogin: () => void;
  onEnterLearnerBallot: (ballotId: string) => void;
}

export const AppLanding: React.FC<AppLandingProps> = ({
  adminSettings,
  onAdminLogin,
  onEnterLearnerBallot,
}) => {
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminError, setAdminError] = useState<string | null>(null);
  const [isAdminSubmitting, setIsAdminSubmitting] = useState(false);

  /*
   * This only ever checks ballot access codes - it never attempts an
   * admin sign-in. Mixing the two used to mean every mistyped ballot
   * code silently fired a failed admin login attempt in the background,
   * and during a live vote with hundreds of typos, that was enough to
   * trip Firebase Auth's brute-force protection and lock the real admin
   * out. Admin login now lives in its own separate form below.
   *
   * The ballot itself is looked up fresh from Firestore on every
   * submit, rather than matched against a locally cached list. Access
   * codes get reused across ballots (e.g. a same-day retry reusing the
   * original code), so a device with a stale local copy of an old
   * ballot under that code could otherwise show a false "closed" error
   * even though the current ballot with that code is open.
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedCode = code.trim();
    if (!trimmedCode) {
      setError('Voer asseblief \'n toelatingskode in.');
      return;
    }

    setIsSubmitting(true);
    const matchingBallot = await findBallotByAccessCode(trimmedCode);
    setIsSubmitting(false);

    if (!matchingBallot) {
      setError('Ongeldige verkiesingskode. Kontroleer asseblief jou kode en probeer weer.');
      return;
    }

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
  };

  const handleAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminError(null);

    const trimmedEmail = adminEmail.trim();
    const trimmedPassword = adminPassword.trim();

    if (!trimmedEmail || !trimmedPassword) {
      setAdminError('Voer asseblief jou admin e-pos en wagwoord in.');
      return;
    }

    setIsAdminSubmitting(true);
    const isAdmin = await signInAdmin(trimmedEmail, trimmedPassword);
    setIsAdminSubmitting(false);

    if (isAdmin) {
      onAdminLogin();
      return;
    }

    setAdminError('Verkeerde admin-wagwoord. Probeer asseblief weer.');
  };

  return (
    <div className="min-h-[calc(100vh-5rem)] bg-slate-50 flex flex-col items-center px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md flex-1 flex flex-col items-center">
        {/* Equal spacer above the logo - capped so the gap stays modest, but
            matches the spacer below it exactly, so the logo sits exactly
            halfway between the header and the form card either way. */}
        <div className="flex-1 max-h-10" />

        {/* School Branding */}
        <div className="text-center">
          <div className="mx-auto w-[210px] h-[210px] rounded-2xl bg-white flex items-center justify-center p-2 shadow-xl shadow-slate-900/10 border-0">
            {adminSettings.schoolLogoUrl ? (
              <img
                src={adminSettings.schoolLogoUrl}
                alt="Skool Emblem"
                className="w-full h-full object-contain rounded-xl"
              />
            ) : (
              <School className="w-[72px] h-[72px] text-slate-800" />
            )}
          </div>
        </div>

        {/* Equal spacer below the logo - see note above. */}
        <div className="flex-1 max-h-10" />

        {/* Input Form Card */}
        <div className="w-full bg-white py-8 px-6 shadow-sm rounded-xl border border-slate-200/90 sm:px-8 mb-12">
          {!showAdminLogin ? (
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
                    className="block w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent focus:bg-white text-base font-mono tracking-wider transition-all"
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
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2 py-3.5 px-4 border border-transparent rounded-xl shadow-md shadow-slate-900/10 text-base font-bold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-60 disabled:pointer-events-none focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-900 transition-all cursor-pointer transform active:scale-[0.99]"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 text-[#EAC321] animate-spin" />
                    <span className="text-[#EAC321]">Besig...</span>
                  </>
                ) : (
                  <>
                    <span className="text-[#EAC321]">Gaan Voort na Stembrief</span>
                    <ArrowRight className="w-5 h-5 text-[#EAC321]" />
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowAdminLogin(true);
                  setError(null);
                }}
                className="w-full text-center text-xs text-slate-400 hover:text-slate-600 font-medium transition-colors cursor-pointer"
              >
                Administrateur-toegang
              </button>
            </form>
          ) : (
            <form className="space-y-6" onSubmit={handleAdminSubmit}>
              <div className="text-center space-y-4">
                <div>
                  <label htmlFor="adminEmail" className="block text-xl sm:text-2xl font-bold text-slate-900 text-center">
                    Admin Aanmelding
                  </label>
                  <p className="text-xs text-slate-500 mt-1 text-center">
                    Voer jou admin e-posadres en wagwoord in.
                  </p>
                </div>

                <div className="relative rounded-xl shadow-xs">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="h-5 w-5" />
                  </div>
                  <input
                    id="adminEmail"
                    name="adminEmail"
                    type="email"
                    required
                    autoFocus
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    placeholder="jou@skool.co.za"
                    className="block w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent focus:bg-white text-base tracking-wider transition-all"
                  />
                </div>

                <div className="relative rounded-xl shadow-xs">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="h-5 w-5" />
                  </div>
                  <input
                    id="adminPassword"
                    name="adminPassword"
                    type="password"
                    required
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    className="block w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent focus:bg-white text-base font-mono tracking-wider transition-all"
                  />
                </div>
              </div>

              {adminError && (
                <div className="rounded-xl bg-rose-50 border border-rose-200 p-3.5 text-xs sm:text-sm text-rose-800 flex items-start gap-2.5 animate-fadeIn">
                  <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  <div>{adminError}</div>
                </div>
              )}

              <button
                type="submit"
                disabled={isAdminSubmitting}
                className="w-full flex items-center justify-center gap-2 py-3.5 px-4 border border-transparent rounded-xl shadow-md shadow-slate-900/10 text-base font-bold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-60 disabled:pointer-events-none focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-900 transition-all cursor-pointer transform active:scale-[0.99]"
              >
                {isAdminSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 text-[#EAC321] animate-spin" />
                    <span className="text-[#EAC321]">Besig...</span>
                  </>
                ) : (
                  <>
                    <span className="text-[#EAC321]">Meld Aan</span>
                    <ArrowRight className="w-5 h-5 text-[#EAC321]" />
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowAdminLogin(false);
                  setAdminEmail('');
                  setAdminPassword('');
                  setAdminError(null);
                }}
                className="w-full flex items-center justify-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 font-bold transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Terug na Verkiesingskode</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
