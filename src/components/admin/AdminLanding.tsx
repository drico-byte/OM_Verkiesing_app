import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import {
  Plus,
  Settings,
  Vote,
  Users,
  Key,
  Lock,
  Upload,
  Trash2,
  ChevronRight,
  CheckCircle2,
  Clock,
  Building2,
  Sparkles,
  RefreshCw,
  Image as ImageIcon,
  Loader2,
  QrCode,
  Download,
  AlertCircle
} from 'lucide-react';
import { AdminSettings, Ballot } from '../../types';
import { compressAndResizeImage } from '../../lib/imageUtils';
import { changeAdminPassword } from '../../lib/firebase';

interface AdminLandingProps {
  adminSettings: AdminSettings;
  ballots: Ballot[];
  onSaveAdminSettings: (settings: AdminSettings) => void;
  onCreateBallot: (name: string, accessCode: string) => void;
  onDeleteBallot: (ballotId: string) => void;
  onToggleManualOpen: (ballotId: string, isOpen: boolean) => void;
  onSelectBallot: (ballotId: string) => void;
  onResetDefaults: () => void;
}

export const AdminLanding: React.FC<AdminLandingProps> = ({
  adminSettings,
  ballots,
  onSaveAdminSettings,
  onCreateBallot,
  onDeleteBallot,
  onToggleManualOpen,
  onSelectBallot,
  onResetDefaults,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'ballots' | 'settings'>('ballots');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [ballotToDelete, setBallotToDelete] = useState<Ballot | null>(null);
  const [showResetModal, setShowResetModal] = useState(false);

  // New ballot form state
  const [newBallotName, setNewBallotName] = useState('');
  const [newAccessCode, setNewAccessCode] = useState('');
  const [createError, setCreateError] = useState<string | null>(null);

  // Admin settings edit state
  const [editSchoolName, setEditSchoolName] = useState(adminSettings.schoolName);
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [logoPreview, setLogoPreview] = useState<string | null>(adminSettings.schoolLogoUrl);
  const [isCompressingLogo, setIsCompressingLogo] = useState(false);
  const [settingsSuccess, setSettingsSuccess] = useState<string | null>(null);
  const [settingsError, setSettingsError] = useState<string | null>(null);
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  // QR code for easy learner access to the app
  const appUrl = window.location.origin;
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null);

  useEffect(() => {
    setEditSchoolName(adminSettings.schoolName);
    setLogoPreview(adminSettings.schoolLogoUrl);
  }, [adminSettings]);

  useEffect(() => {
    QRCode.toDataURL(appUrl, {
      width: 320,
      margin: 1,
      color: { dark: '#0f172a', light: '#ffffff' },
    })
      .then(setQrCodeDataUrl)
      .catch((err) => console.error('Kon nie QR-kode genereer nie:', err));
  }, [appUrl]);

  const handleDownloadQrCode = () => {
    if (!qrCodeDataUrl) return;

    const link = document.createElement('a');
    link.href = qrCodeDataUrl;
    link.download = 'skool_verkiesings_qr_kode.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);

    const name = newBallotName.trim();
    const code = newAccessCode.trim().toUpperCase();

    if (!name || !code) {
      setCreateError('Vul asseblief albei velde in.');
      return;
    }

    // Check if code is taken by existing ballot
    if (ballots.some((b) => b.accessCode.toUpperCase() === code)) {
      setCreateError(`Die toelatingskode "${code}" is reeds in gebruik deur 'n ander stembrief.`);
      return;
    }

    onCreateBallot(name, code);
    setNewBallotName('');
    setNewAccessCode('');
    setShowCreateModal(false);
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsCompressingLogo(true);
      try {
        const compressedDataUrl = await compressAndResizeImage(file, 350, 350);
        setLogoPreview(compressedDataUrl);
      } catch (err) {
        console.error('Fout met die samedrukking van logo:', err);
      } finally {
        setIsCompressingLogo(false);
        e.target.value = '';
      }
    }
  };

  const handleSaveSettingsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsError(null);
    setIsSavingSettings(true);

    const trimmedNewPassword = newAdminPassword.trim();

    if (trimmedNewPassword) {
      const result = await changeAdminPassword(trimmedNewPassword);

      if (!result.success) {
        setIsSavingSettings(false);
        setSettingsError(result.reason || 'Die wagwoord kon nie verander word nie.');
        return;
      }

      setNewAdminPassword('');
    }

    onSaveAdminSettings({
      schoolLogoUrl: logoPreview,
      schoolName: editSchoolName.trim(),
    });

    setIsSavingSettings(false);
    setSettingsSuccess('Stelsel-instellings is suksesvol opgedateer.');
    setTimeout(() => setSettingsSuccess(null), 4000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Navigation Sub-Tabs */}
      <div className="flex border-b border-slate-200 space-x-8">
        <button
          onClick={() => setActiveSubTab('ballots')}
          className={`pb-4 text-sm font-semibold flex items-center gap-2 transition-colors border-b-2 cursor-pointer ${
            activeSubTab === 'ballots'
              ? 'border-slate-900 text-slate-900'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Vote className="w-4 h-4" />
          <span>Stembriewe ({ballots.length})</span>
        </button>
        
        <button
          onClick={() => setActiveSubTab('settings')}
          className={`pb-4 text-sm font-semibold flex items-center gap-2 transition-colors border-b-2 cursor-pointer ${
            activeSubTab === 'settings'
              ? 'border-slate-900 text-slate-900'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>Stelsel & Skool Instellings</span>
        </button>
      </div>

      {/* TAB 1: BALLOTS LIST */}
      {activeSubTab === 'ballots' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Aktiewe & Vorige Stembriewe</h2>
              <p className="text-xs text-slate-500">Klik op 'n stembrief om kandidate, uitslae en instellings te bestuur.</p>
            </div>

            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs sm:text-sm shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Nuwe Stembrief Skep</span>
            </button>
          </div>

          {ballots.length === 0 ? (
            <div className="bg-white rounded-xl p-12 text-center border-2 border-dashed border-slate-200 space-y-4">
              <Vote className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="text-base font-semibold text-slate-700">Geen stembriewe gevind nie</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Skep jou eerste stembrief vir 'n klasverkieing of die Gr. 11 VRL-stemming om te begin.
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors"
              >
                Skep Stembrief
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {ballots.map((ballot) => {
                const totalValid = ballot.validVoterIds.length;
                const totalVoted = ballot.votes.length;
                const pct = totalValid > 0 ? Math.round((totalVoted / totalValid) * 100) : 0;
                
                const now = new Date();
                const openDate = new Date(ballot.openTime);
                const closeDate = new Date(ballot.closeTime);
                const isTimeOpen = now >= openDate && now <= closeDate;
                const isOpen = ballot.isManualOpen && isTimeOpen;

                return (
                  <div
                    key={ballot.id}
                    className="bg-white rounded-xl border border-slate-200/90 shadow-sm hover:shadow-md transition-all flex flex-col overflow-hidden group"
                  >
                    <div className="p-6 space-y-4 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold border ${
                            isOpen
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : 'bg-rose-50 text-rose-800 border-rose-200'
                          }`}
                        >
                          <span className={`w-2 h-2 rounded-full ${isOpen ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                          {isOpen ? 'Oop vir Stemme' : 'Gesluit'}
                        </span>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onToggleManualOpen(ballot.id, !ballot.isManualOpen);
                            }}
                            className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-colors border cursor-pointer ${
                              ballot.isManualOpen
                                ? 'bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-slate-700 border-slate-200'
                                : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200'
                            }`}
                            title="Skakelaar vir Handmatige Oop/Sluit"
                          >
                            {ballot.isManualOpen ? 'Sluit Handmatig' : 'Maak Oop'}
                          </button>
                          
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setBallotToDelete(ballot);
                            }}
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                            title="Skrap Stembrief"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <div>
                        <h3 className="text-lg font-bold text-slate-900 group-hover:text-slate-800 transition-colors line-clamp-1">
                          {ballot.name}
                        </h3>
                        <div className="mt-1 flex items-center gap-2 text-xs font-mono text-slate-600">
                          <Key className="w-3.5 h-3.5 text-slate-900" />
                          <span>Toelatingskode: <strong className="text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 font-mono">{ballot.accessCode}</strong></span>
                        </div>
                      </div>

                      {/* Vote progress stats */}
                      <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-100 space-y-2 text-xs">
                        <div className="flex items-center justify-between text-slate-700 font-medium">
                          <span>Stem-deelname</span>
                          <span><strong className="text-slate-900 font-bold">{totalVoted}</strong> / {totalValid} ({pct}%)</span>
                        </div>
                        <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-slate-900 h-full transition-all duration-500 rounded-full"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 font-medium">
                          <span>Seunskandidate: {ballot.boysCandidates.length}</span>
                          <span>Dogterskandidate: {ballot.girlsCandidates.length}</span>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Action Footer */}
                    <div className="px-6 py-3.5 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-xs text-slate-500 flex items-center gap-1 font-medium">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        Sluit: {new Date(ballot.closeTime).toLocaleDateString('af-ZA')}
                      </span>

                      <button
                        onClick={() => onSelectBallot(ballot.id)}
                        className="inline-flex items-center gap-1 text-xs font-bold text-slate-900 hover:text-slate-700 transition-colors cursor-pointer"
                      >
                        <span>Bestuur & Uitslae</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: SYSTEM SETTINGS */}
      {activeSubTab === 'settings' && (
        <div className="max-w-3xl space-y-6">
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-8">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Algemene Stelsel- & Skoolinstellings</h2>
            <p className="text-xs text-slate-500 mt-1">
              Opdateer die skoolnaam, adminwagwoord en die skoollogo wat op die beginblad verskyn.
            </p>
          </div>

          {settingsSuccess && (
            <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-xs sm:text-sm text-emerald-900 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>{settingsSuccess}</span>
            </div>
          )}

          {settingsError && (
            <div className="rounded-xl bg-rose-50 border border-rose-200 p-4 text-xs sm:text-sm text-rose-900 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
              <span>{settingsError}</span>
            </div>
          )}

          <form onSubmit={handleSaveSettingsSubmit} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Skoolnaam
                </label>
                <input
                  type="text"
                  required
                  value={editSchoolName}
                  onChange={(e) => setEditSchoolName(e.target.value)}
                  placeholder="Bv. Hoërskool ABC"
                  className="mt-2 block w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Admin Wagwoord
                </label>
                <div className="relative mt-2">
                  <input
                    type="text"
                    value={newAdminPassword}
                    onChange={(e) => setNewAdminPassword(e.target.value)}
                    placeholder="Los leeg om ongewysig te laat"
                    className="block w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white"
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Vul slegs hierdie veld in as jy die adminwagwoord wil verander. Dit word in die toelatingskode-teksboks ingesleutel vir admin-toegang.
                </p>
              </div>
            </div>

            {/* Logo Upload Section */}
            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Skool Emblem / Logo
              </label>
              
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div className="w-20 h-20 rounded-xl bg-white border border-slate-300 flex items-center justify-center overflow-hidden shrink-0 shadow-xs relative">
                  {isCompressingLogo ? (
                    <Loader2 className="w-6 h-6 text-slate-600 animate-spin" />
                  ) : logoPreview ? (
                    <img src={logoPreview} alt="Skool Logo Preview" className="w-full h-full object-contain p-1" />
                  ) : (
                    <ImageIcon className="w-8 h-8 text-slate-400" />
                  )}
                </div>

                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-3">
                    <label className={`px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors inline-flex items-center gap-2 ${isCompressingLogo ? 'opacity-50 pointer-events-none' : 'cursor-pointer'}`}>
                      {isCompressingLogo ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                      <span>{isCompressingLogo ? 'Verwerk...' : logoPreview ? 'Vervang Logo' : 'Laai Logo Op'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        disabled={isCompressingLogo}
                        className="hidden"
                      />
                    </label>

                    {logoPreview && !isCompressingLogo && (
                      <button
                        type="button"
                        onClick={() => setLogoPreview(null)}
                        className="text-xs text-rose-600 hover:text-rose-800 font-bold px-3 py-2 rounded-xl bg-rose-50 border border-rose-200 hover:bg-rose-100 transition-colors cursor-pointer"
                      >
                        Verwyder Logo
                      </button>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Aanbevole formaat: PNG of JPG met deursigtige agtergrond. Logo word outomaties geoptimaliseer en in die databasis gestoor.
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
              <button
                type="submit"
                disabled={isSavingSettings}
                className="w-full sm:w-auto px-6 py-3 bg-slate-900 hover:bg-slate-800 disabled:opacity-60 disabled:pointer-events-none text-white font-bold text-sm rounded-xl shadow-md shadow-slate-900/10 transition-all cursor-pointer"
              >
                {isSavingSettings ? 'Stoor...' : 'Stoor Instellings'}
              </button>

              <button
                type="button"
                onClick={() => setShowResetModal(true)}
                className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Herstel Demo Data na Oorspronklike</span>
              </button>
            </div>
          </form>
        </div>

        {/* QR Code for Easy Learner Access */}
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-5">
          <div>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <QrCode className="w-5 h-5 text-slate-700" />
              Toegang QR-kode
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Wys hierdie QR-kode op die projektor sodat leerders dit met hul selfoon kan skandeer om direk na die stemstelsel se toegangsbladsy te gaan.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-6 p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div className="w-40 h-40 rounded-xl bg-white border border-slate-300 flex items-center justify-center overflow-hidden shrink-0 shadow-xs">
              {qrCodeDataUrl ? (
                <img src={qrCodeDataUrl} alt="QR-kode vir toegang tot die stemstelsel" className="w-full h-full object-contain p-2" />
              ) : (
                <Loader2 className="w-6 h-6 text-slate-400 animate-spin" />
              )}
            </div>

            <div className="space-y-3 flex-1 text-center sm:text-left">
              <div>
                <span className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">Skakel</span>
                <span className="text-sm font-mono text-slate-900 break-all">{appUrl}</span>
              </div>

              <button
                type="button"
                onClick={handleDownloadQrCode}
                disabled={!qrCodeDataUrl}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 disabled:pointer-events-none text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Laai QR-kode af (PNG)</span>
              </button>
            </div>
          </div>
        </div>
        </div>
      )}

      {/* DELETE BALLOT CONFIRMATION MODAL */}
      {ballotToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-2xl border border-slate-100 animate-scaleIn">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-rose-600" />
              </div>
              <h3 className="text-base font-bold text-slate-900 font-serif">Skrap Stembrief?</h3>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Is jy seker jy wil die stembrief <strong>"{ballotToDelete.name}"</strong> skrap? Hierdie aksie kan nie ongedoen gemaak word nie.
            </p>

            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setBallotToDelete(null)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Kanselleer
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteBallot(ballotToDelete.id);
                  setBallotToDelete(null);
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-md transition-colors cursor-pointer"
              >
                Ja, Skrap Stembrief
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RESET DATA CONFIRMATION MODAL */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-2xl border border-slate-100 animate-scaleIn">
            <div className="flex items-center gap-3 text-amber-600">
              <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center shrink-0">
                <RefreshCw className="w-5 h-5 text-amber-600" />
              </div>
              <h3 className="text-base font-bold text-slate-900 font-serif">Herstel Demo Data?</h3>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Is jy seker jy wil al die demo data en stembriewe herstel na die oorspronklike staat?
            </p>

            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowResetModal(false)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Kanselleer
              </button>
              <button
                type="button"
                onClick={() => {
                  onResetDefaults();
                  setShowResetModal(false);
                }}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-md transition-colors cursor-pointer"
              >
                Ja, Herstel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE BALLOT MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-slate-100 animate-scaleIn">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-900">Skep Nuwe Stembrief</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {createError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800">
                {createError}
              </div>
            )}

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Stembrief Naam
                </label>
                <input
                  type="text"
                  required
                  value={newBallotName}
                  onChange={(e) => setNewBallotName(e.target.value)}
                  placeholder="Bv. Gr. 11 VRL Verkiesing 2026"
                  className="mt-1.5 block w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Unieke Toelatingskode (Vir leerders)
                </label>
                <input
                  type="text"
                  required
                  value={newAccessCode}
                  onChange={(e) => setNewAccessCode(e.target.value)}
                  placeholder="Bv. VRL2026 of KLAS8B"
                  className="mt-1.5 block w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm font-mono uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Hierdie kode word deur leerders ingesleutel om toegang tot die spesifieke stembrief te kry.
                </p>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Kanselleer
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-md shadow-slate-900/10 transition-colors cursor-pointer"
                >
                  Skep Stembrief
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

function ShieldCheckIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="m9 12 2 2 4-4" />
    </svg>
  );
}
