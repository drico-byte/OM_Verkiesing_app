import React, { useState } from 'react';
import { Save, CheckCircle2, AlertCircle, Clock, MessageSquare, ToggleLeft, ToggleRight } from 'lucide-react';
import { Ballot } from '../../../types';

interface SettingsTabProps {
  ballot: Ballot;
  onUpdateBallot: (updatedBallot: Ballot) => void;
}

export const SettingsTab: React.FC<SettingsTabProps> = ({
  ballot,
  onUpdateBallot,
}) => {
  const [name, setName] = useState(ballot.name);
  const [accessCode, setAccessCode] = useState(ballot.accessCode);
  const [maxBoyPicks, setMaxBoyPicks] = useState(ballot.maxBoyPicks === 0 ? 15 : ballot.maxBoyPicks);
  const [maxGirlPicks, setMaxGirlPicks] = useState(ballot.maxGirlPicks === 0 ? 15 : ballot.maxGirlPicks);
  const [isBoyUnlimited, setIsBoyUnlimited] = useState(ballot.maxBoyPicks === 0);
  const [isGirlUnlimited, setIsGirlUnlimited] = useState(ballot.maxGirlPicks === 0);

  // Formats for datetime-local
  const formatForInput = (isoStr: string) => {
    try {
      const d = new Date(isoStr);
      const pad = (n: number) => (n < 10 ? '0' + n : n);
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    } catch {
      return '';
    }
  };

  const [openTimeInput, setOpenTimeInput] = useState(formatForInput(ballot.openTime));
  const [closeTimeInput, setCloseTimeInput] = useState(formatForInput(ballot.closeTime));
  const [isManualOpen, setIsManualOpen] = useState(ballot.isManualOpen);

  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const finalMaxBoy = isBoyUnlimited ? 0 : Math.min(30, Math.max(1, Number(maxBoyPicks) || 15));
    const finalMaxGirl = isGirlUnlimited ? 0 : Math.min(30, Math.max(1, Number(maxGirlPicks) || 15));

    const updatedBallot: Ballot = {
      ...ballot,
      name: name.trim() || ballot.name,
      accessCode: accessCode.trim().toUpperCase() || ballot.accessCode,
      maxBoyPicks: finalMaxBoy,
      maxGirlPicks: finalMaxGirl,
      openTime: new Date(openTimeInput).toISOString(),
      closeTime: new Date(closeTimeInput).toISOString(),
      isManualOpen,
    };

    onUpdateBallot(updatedBallot);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 4000);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-8 animate-fadeIn max-w-4xl">
      <div>
        <h2 className="text-xl font-bold text-slate-900 font-serif">Stembrief Instellings</h2>
        <p className="text-xs text-slate-500 mt-1">
          Wysig die stembrief se naam, toelatingskode, datum/tyd, maksimum stemkeuses en boodskappe.
        </p>
      </div>

      {savedSuccess && (
        <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-xs sm:text-sm text-emerald-900 flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>Stembrief instellings is suksesvol opgedateer!</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Manual Open / Close Radio Buttons */}
        <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
            Handmatige Oop / Sluit Beheer (Radioknoppie)
          </label>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 text-xs">
            <label className="flex items-center gap-2 font-bold cursor-pointer bg-white px-4 py-2.5 rounded-xl border border-slate-200 shadow-xs hover:border-emerald-500 transition-colors">
              <input
                type="radio"
                name="manualStatus"
                checked={isManualOpen === true}
                onChange={() => setIsManualOpen(true)}
                className="w-4 h-4 text-emerald-700 focus:ring-emerald-600"
              />
              <span className="text-emerald-800">● Oop vir Stemme</span>
            </label>

            <label className="flex items-center gap-2 font-bold cursor-pointer bg-white px-4 py-2.5 rounded-xl border border-slate-200 shadow-xs hover:border-rose-500 transition-colors">
              <input
                type="radio"
                name="manualStatus"
                checked={isManualOpen === false}
                onChange={() => setIsManualOpen(false)}
                className="w-4 h-4 text-rose-700 focus:ring-rose-600"
              />
              <span className="text-rose-800">● Handmatig Gesluit</span>
            </label>
          </div>
          <p className="text-[11px] text-slate-500">
            Selfs as die datums geldig is, sal leerders slegs kan stem as die status op "Oop vir Stemme" gestel is.
          </p>
        </div>

        {/* Name & Code */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Stembrief Naam
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1.5 block w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Toelatingskode (Vir leerders)
            </label>
            <input
              type="text"
              required
              value={accessCode}
              onChange={(e) => setAccessCode(e.target.value)}
              className="mt-1.5 block w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm font-mono uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white"
            />
          </div>
        </div>

        {/* Max picks per gender */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Seuns Limit Card */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Maksimum Seunskandidate Om Voor Te Stem (Max 30)
            </label>
            <input
              type="number"
              min={1}
              max={30}
              disabled={isBoyUnlimited}
              required={!isBoyUnlimited}
              value={isBoyUnlimited ? '' : maxBoyPicks}
              onChange={(e) => setMaxBoyPicks(Math.min(30, Math.max(1, Number(e.target.value))))}
              placeholder={isBoyUnlimited ? 'Onbeperk' : '15'}
              className="block w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed"
            />
            <label className="flex items-center gap-2 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={isBoyUnlimited}
                onChange={(e) => {
                  setIsBoyUnlimited(e.target.checked);
                  if (!e.target.checked && (!maxBoyPicks || maxBoyPicks === 0)) {
                    setMaxBoyPicks(15);
                  }
                }}
                className="w-4 h-4 rounded text-slate-900 focus:ring-slate-900 border-slate-300 cursor-pointer"
              />
              <span className="text-xs font-semibold text-slate-700">Geen beperking (Onbeperk stemme)</span>
            </label>
          </div>

          {/* Dogters Limit Card */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Maksimum Dogterskandidate Om Voor Te Stem (Max 30)
            </label>
            <input
              type="number"
              min={1}
              max={30}
              disabled={isGirlUnlimited}
              required={!isGirlUnlimited}
              value={isGirlUnlimited ? '' : maxGirlPicks}
              onChange={(e) => setMaxGirlPicks(Math.min(30, Math.max(1, Number(e.target.value))))}
              placeholder={isGirlUnlimited ? 'Onbeperk' : '15'}
              className="block w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed"
            />
            <label className="flex items-center gap-2 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={isGirlUnlimited}
                onChange={(e) => {
                  setIsGirlUnlimited(e.target.checked);
                  if (!e.target.checked && (!maxGirlPicks || maxGirlPicks === 0)) {
                    setMaxGirlPicks(15);
                  }
                }}
                className="w-4 h-4 rounded text-slate-900 focus:ring-slate-900 border-slate-300 cursor-pointer"
              />
              <span className="text-xs font-semibold text-slate-700">Geen beperking (Onbeperk stemme)</span>
            </label>
          </div>
        </div>

        {/* Dates */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Oopmaak Tydstip
            </label>
            <input
              type="datetime-local"
              required
              value={openTimeInput}
              onChange={(e) => setOpenTimeInput(e.target.value)}
              className="mt-1.5 block w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Sluiting Tydstip
            </label>
            <input
              type="datetime-local"
              required
              value={closeTimeInput}
              onChange={(e) => setCloseTimeInput(e.target.value)}
              className="mt-1.5 block w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white font-mono"
            />
          </div>
        </div>

        <div className="pt-4 border-t border-slate-200">
          <button
            type="submit"
            className="w-full sm:w-auto px-6 py-3 bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <Save className="w-4 h-4" />
            <span>Stoor Stembrief Instellings</span>
          </button>
        </div>
      </form>
    </div>
  );
};
