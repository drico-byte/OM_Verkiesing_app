import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Printer, Download, Copy, Check, X, FileText, Award, Users, CheckCircle2 } from 'lucide-react';
import { Ballot } from '../../types';
import { getStoredAdminSettings } from '../../lib/storage';
import { exportBallotResultsCsv } from '../../lib/csvHelper';

interface PrintReportModalProps {
  ballot: Ballot;
  onClose: () => void;
}

export const PrintReportModal: React.FC<PrintReportModalProps> = ({ ballot, onClose }) => {
  const [copied, setCopied] = useState(false);
  const settings = getStoredAdminSettings();
  const schoolName = settings.schoolName || 'Hoërskool Verkiesings';

  const totalValid = ballot.validVoterIds.length;
  const totalVotesCast = ballot.votes.length;
  const pct = totalValid > 0 ? ((totalVotesCast / totalValid) * 100).toFixed(1) : '0';

  // Calculate boy counts
  const boyCounts: { [id: string]: number } = {};
  ballot.boysCandidates.forEach((c) => { boyCounts[c.id] = 0; });
  ballot.votes.forEach((v) => {
    v.selectedBoyIds.forEach((id) => {
      if (boyCounts[id] !== undefined) boyCounts[id]++;
    });
  });

  const sortedBoys = [...ballot.boysCandidates].sort((a, b) => boyCounts[b.id] - boyCounts[a.id]);

  // Calculate girl counts
  const girlCounts: { [id: string]: number } = {};
  ballot.girlsCandidates.forEach((c) => { girlCounts[c.id] = 0; });
  ballot.votes.forEach((v) => {
    v.selectedGirlIds.forEach((id) => {
      if (girlCounts[id] !== undefined) girlCounts[id]++;
    });
  });

  const sortedGirls = [...ballot.girlsCandidates].sort((a, b) => girlCounts[b.id] - girlCounts[a.id]);

  const reportDate = new Date().toLocaleDateString('af-ZA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const handlePrint = () => {
    window.print();
  };

  const handleCopySummaryText = () => {
    let text = `AMPTELIKE VERKIESINGSVERSLAG: ${ballot.name}\n`;
    text += `Skool: ${schoolName}\n`;
    text += `Datum van Verkiesing: ${reportDate}\n`;
    text += `Totaal Gemagtig: ${totalValid} | Stemme Ingedien: ${totalVotesCast} (${pct}%)\n\n`;

    text += `--- SEUNS KANDIDATE UITSLAE ---\n`;
    sortedBoys.forEach((c, i) => {
      const votes = boyCounts[c.id] || 0;
      const cPct = totalVotesCast > 0 ? ((votes / totalVotesCast) * 100).toFixed(1) : '0';
      text += `${i + 1}. ${c.name} - ${votes} stemme (${cPct}%)\n`;
    });

    text += `\n--- DOGTERS KANDIDATE UITSLAE ---\n`;
    sortedGirls.forEach((c, i) => {
      const votes = girlCounts[c.id] || 0;
      const cPct = totalVotesCast > 0 ? ((votes / totalVotesCast) * 100).toFixed(1) : '0';
      text += `${i + 1}. ${c.name} - ${votes} stemme (${cPct}%)\n`;
    });

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return createPortal(
    <div className="print-modal-overlay fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-sm flex items-start justify-center p-2 sm:p-4 md:p-6 animate-fadeIn">
      {/* Container Box */}
      <div className="print-modal-shell bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl overflow-hidden my-4 sm:my-8 flex flex-col">
        {/* Modal Sticky Top Toolbar (Hidden during browser print) */}
        <div className="no-print bg-slate-900 text-white p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3 sticky top-0 z-10 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <h3 className="text-sm font-bold leading-tight">Drukbare Verkiesingsverslag</h3>
              <p className="text-[11px] text-slate-400">{ballot.name}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Druk Verslag (A4 / PDF)</span>
            </button>

            <button
              onClick={() => exportBallotResultsCsv(ballot)}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition-all cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">CSV</span>
            </button>

            <button
              onClick={handleCopySummaryText}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition-all cursor-pointer"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span className="hidden sm:inline">{copied ? 'Gekopieer!' : 'Kopieer Teks'}</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer ml-1"
              title="Sluit"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Report Body Document Sheet */}
        <div className="p-6 sm:p-10 md:p-12 bg-white text-slate-900 space-y-8 overflow-x-auto" id="printable-election-report">
          {/* Header Section */}
          <div className="border-b-2 border-slate-900 pb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              {settings.schoolLogoUrl ? (
                <img src={settings.schoolLogoUrl} alt={schoolName} className="h-14 object-contain mb-2" />
              ) : null}
              <h1 className="text-2xl font-black font-serif text-slate-900 tracking-tight uppercase">
                {schoolName}
              </h1>
              <p className="text-sm font-bold text-slate-700 uppercase tracking-widest mt-0.5">
                Amptelike Verkiesingsverslag &amp; Uitslae
              </p>
            </div>

            <div className="text-left sm:text-right text-xs text-slate-600 font-mono space-y-1">
              <div><strong className="text-slate-900">Stembrief:</strong> {ballot.name}</div>
              <div><strong className="text-slate-900">Datum van Verkiesing:</strong> {reportDate}</div>
            </div>
          </div>

          {/* Stats Overview Banner */}
          <div className="bg-slate-50 border border-slate-300 rounded-xl p-5 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div className="space-y-1">
              <span className="text-slate-500 font-medium block">Gemagtigde Kiesers</span>
              <span className="text-lg font-black text-slate-900 font-mono">{totalValid}</span>
            </div>

            <div className="space-y-1">
              <span className="text-slate-500 font-medium block">Stemme Ingedien</span>
              <span className="text-lg font-black text-emerald-800 font-mono">{totalVotesCast}</span>
            </div>

            <div className="space-y-1">
              <span className="text-slate-500 font-medium block">Deelname Persentasie</span>
              <span className="text-lg font-black text-blue-800 font-mono">{pct}%</span>
            </div>

            <div className="space-y-1">
              <span className="text-slate-500 font-medium block">Maks. Keuses (S / D)</span>
              <span className="text-lg font-black text-slate-900 font-mono">
                {ballot.maxBoyPicks} Seuns / {ballot.maxGirlPicks} Dogters
              </span>
            </div>
          </div>

          {/* Boys Results Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-300 pb-2">
              <h2 className="text-base font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <span>1. Uitslae: Seuns Kandidate</span>
                <span className="text-xs font-normal text-slate-500 font-mono">({ballot.boysCandidates.length} Kandidate)</span>
              </h2>
            </div>

            {sortedBoys.length === 0 ? (
              <p className="text-xs text-slate-500 italic py-2">Geen seuns kandidate vir hierdie stembrief gelys nie.</p>
            ) : (
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-800 border-y border-slate-300 font-bold uppercase tracking-wider">
                    <th className="py-1.5 px-3 w-12 text-center">Rang</th>
                    <th className="py-1.5 px-3">Kandidaat Naam</th>
                    <th className="py-1.5 px-3 w-28 text-right">Totaal Stemme</th>
                    <th className="py-1.5 px-3 w-28 text-right">Persentasie</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {sortedBoys.map((c, index) => {
                    const votes = boyCounts[c.id] || 0;
                    const candidatePct = totalVotesCast > 0 ? ((votes / totalVotesCast) * 100).toFixed(1) : '0';
                    const isElected = index < ballot.maxBoyPicks && votes > 0;

                    return (
                      <tr key={c.id} className={isElected ? 'bg-emerald-50/50' : ''}>
                        <td className="py-1.5 px-3 font-mono font-bold text-center text-slate-700">{index + 1}</td>
                        <td className="py-1.5 px-3 font-bold text-slate-900">{c.name}</td>
                        <td className="py-1.5 px-3 font-mono font-bold text-right text-slate-900">{votes}</td>
                        <td className="py-1.5 px-3 font-mono text-right text-slate-700">{candidatePct}%</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Girls Results Section */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between border-b border-slate-300 pb-2">
              <h2 className="text-base font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <span>2. Uitslae: Dogters Kandidate</span>
                <span className="text-xs font-normal text-slate-500 font-mono">({ballot.girlsCandidates.length} Kandidate)</span>
              </h2>
            </div>

            {sortedGirls.length === 0 ? (
              <p className="text-xs text-slate-500 italic py-2">Geen dogters kandidate vir hierdie stembrief gelys nie.</p>
            ) : (
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-800 border-y border-slate-300 font-bold uppercase tracking-wider">
                    <th className="py-1.5 px-3 w-12 text-center">Rang</th>
                    <th className="py-1.5 px-3">Kandidaat Naam</th>
                    <th className="py-1.5 px-3 w-28 text-right">Totaal Stemme</th>
                    <th className="py-1.5 px-3 w-28 text-right">Persentasie</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {sortedGirls.map((c, index) => {
                    const votes = girlCounts[c.id] || 0;
                    const candidatePct = totalVotesCast > 0 ? ((votes / totalVotesCast) * 100).toFixed(1) : '0';
                    const isElected = index < ballot.maxGirlPicks && votes > 0;

                    return (
                      <tr key={c.id} className={isElected ? 'bg-emerald-50/50' : ''}>
                        <td className="py-1.5 px-3 font-mono font-bold text-center text-slate-700">{index + 1}</td>
                        <td className="py-1.5 px-3 font-bold text-slate-900">{c.name}</td>
                        <td className="py-1.5 px-3 font-mono font-bold text-right text-slate-900">{votes}</td>
                        <td className="py-1.5 px-3 font-mono text-right text-slate-700">{candidatePct}%</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Official Sign-Off Section */}
          <div className="pt-8 border-t-2 border-slate-900 space-y-6">
            <p className="text-xs text-slate-700 italic leading-relaxed">
              Hiermee word gesertifiseer dat bogenoemde uitslae 'n akkurate en finale weergawe is van die stemme wat ingedien is vir die <strong>{ballot.name}</strong>.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 pt-6">
              <div className="border-t border-slate-900 pt-2 space-y-1">
                <div className="text-xs font-bold text-slate-900">Handtekening Hoofkiesbeampte</div>
                <div className="text-[11px] text-slate-500 font-mono">Naam: ___________________________</div>
                <div className="text-[11px] text-slate-500 font-mono">Datum: __________________________</div>
              </div>

              <div className="border-t border-slate-900 pt-2 space-y-1">
                <div className="text-xs font-bold text-slate-900">Handtekening Skoolhoof / Adjunkhoof</div>
                <div className="text-[11px] text-slate-500 font-mono">Naam: ___________________________</div>
                <div className="text-[11px] text-slate-500 font-mono">Datum: __________________________</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
