import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Printer, Download, Copy, Check, X, FileText, CheckSquare } from 'lucide-react';
import { Ballot, Candidate } from '../../types';
import { getStoredAdminSettings } from '../../lib/storage';

interface PrintHardcopyBallotModalProps {
  ballot: Ballot;
  onClose: () => void;
}

export const PrintHardcopyBallotModal: React.FC<PrintHardcopyBallotModalProps> = ({ ballot, onClose }) => {
  const [copied, setCopied] = useState(false);
  const [includeVoterDetails, setIncludeVoterDetails] = useState(true);
  const [includeStampBox, setIncludeStampBox] = useState(true);
  const settings = getStoredAdminSettings();
  const schoolName = settings.schoolName || 'Hoërskool Verkiesings';

  const issueDate = new Date().toLocaleDateString('af-ZA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadHtml = () => {
    const buildCandidateRows = (candidates: Candidate[], numberOffset: number) => candidates.map((c, i) => `
      <tr>
        <td style="border: 1px solid #334155; padding: 6px; text-align: center; width: 36px;">
          <div style="width: 16px; height: 16px; border: 2px solid #0f172a; margin: 0 auto; background: #ffffff;"></div>
        </td>
        <td style="border: 1px solid #334155; padding: 6px; font-weight: bold; width: 28px; text-align: center;">${numberOffset + i + 1}</td>
        <td style="border: 1px solid #334155; padding: 6px; font-weight: bold;">${c.name}</td>
      </tr>
    `).join('');

    const buildCandidateTable = (rows: string, emptyMessage: string) => `
      <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
        <thead>
          <tr>
            <th style="width: 36px; text-align: center; background: #f1f5f9; border: 1px solid #334155; padding: 6px; text-transform: uppercase; font-size: 10px;">Stem</th>
            <th style="width: 28px; text-align: center; background: #f1f5f9; border: 1px solid #334155; padding: 6px; text-transform: uppercase; font-size: 10px;">Nr</th>
            <th style="text-align: left; background: #f1f5f9; border: 1px solid #334155; padding: 6px; text-transform: uppercase; font-size: 10px;">Kandidaat Naam</th>
          </tr>
        </thead>
        <tbody>
          ${rows || `<tr><td colspan="3" style="text-align:center; padding:15px; color:#64748b;">${emptyMessage}</td></tr>`}
        </tbody>
      </table>
    `;

    const buildCandidateColumnsHtml = (candidates: Candidate[], emptyMessage: string) => {
      const mid = Math.ceil(candidates.length / 2);
      const left = candidates.slice(0, mid);
      const right = candidates.slice(mid);
      const leftTable = buildCandidateTable(buildCandidateRows(left, 0), emptyMessage);

      if (right.length === 0) {
        return `<div style="margin-top: 10px; margin-bottom: 25px;">${leftTable}</div>`;
      }

      const rightTable = buildCandidateTable(buildCandidateRows(right, left.length), emptyMessage);

      return `
        <div style="display: flex; gap: 20px; margin-top: 10px; margin-bottom: 25px;">
          <div style="flex: 1;">${leftTable}</div>
          <div style="flex: 1;">${rightTable}</div>
        </div>
      `;
    };

    const boysTablesHtml = buildCandidateColumnsHtml(ballot.boysCandidates, 'Geen seunskandidate gelys nie');
    const girlsTablesHtml = buildCandidateColumnsHtml(ballot.girlsCandidates, 'Geen dogterskandidate gelys nie');

    const htmlContent = `
<!DOCTYPE html>
<html lang="af">
<head>
  <meta charset="UTF-8">
  <title>Hardekopie Stembrief - ${ballot.name}</title>
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; margin: 40px; color: #0f172a; line-height: 1.4; }
    .header { border-bottom: 2px solid #0f172a; padding-bottom: 15px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: flex-start; }
    .title { font-size: 22px; font-weight: 900; text-transform: uppercase; margin: 0; }
    .info-box { background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 15px; margin-bottom: 20px; font-size: 13px; }
    .rules-box { background: #fffbe6; border: 1px solid #ffe58f; border-radius: 8px; padding: 12px 15px; margin-bottom: 20px; font-size: 12px; }
    .section-title { font-size: 15px; font-weight: bold; margin-top: 20px; border-bottom: 1px solid #94a3b8; padding-bottom: 5px; text-transform: uppercase; }
    .footer { border-top: 2px solid #0f172a; padding-top: 15px; margin-top: 30px; font-size: 11px; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <h1 class="title">${schoolName}</h1>
    </div>
    <div style="text-align: right; font-size: 12px; font-family: monospace;">
      <div><strong>Stembrief:</strong> ${ballot.name}</div>
      <div><strong>Kode:</strong> ${ballot.accessCode}</div>
      <div><strong>Datum:</strong> ${issueDate}</div>
    </div>
  </div>

  ${includeVoterDetails ? `
  <div class="info-box">
    <div style="display: flex; justify-content: space-between; gap: 20px;">
      <div style="flex: 1;"><strong>Leerder Toelatingsnommer:</strong> ____________________________</div>
      <div style="flex: 1;"><strong>Handtekening van Leerder:</strong> ____________________________</div>
    </div>
  </div>
  ` : ''}

  <div class="rules-box">
    <strong>INSTRUKSIES VIR PAPIERSTEMMING:</strong><br>
    1. Plaas 'n duidelike <strong>[X]</strong> in die blokkie langs die naam van jou gekose kandidate.<br>
    2. Jy mag vir hoogstens <strong>${ballot.maxBoyPicks} seuns</strong> en <strong>${ballot.maxGirlPicks} dogters</strong> stem.<br>
    3. Stembriewe met meer merke as die maksimum toegelate sal as bedorwe gekanselleer word.
  </div>

  <div class="section-title">Seunskandidate (Kies Maksimum ${ballot.maxBoyPicks})</div>
  ${boysTablesHtml}

  <div class="section-title page-break-before" style="page-break-before: always; break-before: page;">Dogterskandidate (Kies Maksimum ${ballot.maxGirlPicks})</div>
  ${girlsTablesHtml}

  ${includeStampBox ? `
  <div class="footer">
    <div style="display: flex; justify-content: space-between; align-items: flex-end;">
      <div>
        <div style="margin-bottom: 6px;"><strong>Toesighouer / Verkiesingsbeampte Naam:</strong> ___________________________________</div>
        <div><strong>Handtekening:</strong> ___________________________________  <strong>Datum:</strong> __________________</div>
      </div>
      <div style="border: 2px dashed #94a3b8; width: 140px; height: 75px; display: flex; align-items: center; justify-content: center; text-align: center; color: #64748b; font-size: 10px; text-transform: uppercase;">
        Amptelike Skool Stempel
      </div>
    </div>
  </div>
  ` : ''}
</body>
</html>
    `;

    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    const sanitizedName = ballot.name.toLowerCase().replace(/[^a-z0-9]/g, '_');
    link.setAttribute('download', `hardekopie_stembrief_${sanitizedName}.html`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopyTextVersion = () => {
    let text = `AMPTELIKE HARDEKOPIE STEMBRIEF: ${ballot.name}\n`;
    text += `Skool: ${schoolName}\n`;
    text += `Toelatingskode: ${ballot.accessCode}\n`;
    text += `Datum: ${issueDate}\n\n`;

    text += `--- LEERDER INLIGTING ---\n`;
    text += `Leerder Toelatingsnommer: ______________________\n`;
    text += `Handtekening van Leerder: _________________\n\n`;

    text += `--- INSTRUKSIES ---\n`;
    text += `Merk 'n [X] langs jou gekose kandidate.\n`;
    text += `Maksimum: ${ballot.maxBoyPicks} Seuns | ${ballot.maxGirlPicks} Dogters\n\n`;

    text += `--- SEUNSKANDIDATE ---\n`;
    ballot.boysCandidates.forEach((c, i) => {
      text += `[   ] ${i + 1}. ${c.name} (${c.grade || 'Graad N/V'})\n`;
    });

    text += `\n--- DOGTERSKANDIDATE ---\n`;
    ballot.girlsCandidates.forEach((c, i) => {
      text += `[   ] ${i + 1}. ${c.name} (${c.grade || 'Graad N/V'})\n`;
    });

    text += `\nToesighouer Paraaf: ___________________\n`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const renderCandidateTable = (candidates: Candidate[], numberOffset: number) => (
    <table className="w-full text-xs text-left border-collapse border border-slate-900">
      <thead>
        <tr className="bg-slate-100 text-slate-900 border-b border-slate-900 font-extrabold uppercase tracking-wider">
          <th className="py-1.5 px-2 w-10 text-center border-r border-slate-900">Stem</th>
          <th className="py-1.5 px-2 w-8 text-center border-r border-slate-900">Nr</th>
          <th className="py-1.5 px-2">Kandidaat Naam</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-900">
        {candidates.map((c, index) => (
          <tr key={c.id} className="hover:bg-slate-50">
            <td className="py-1.5 px-2 text-center border-r border-slate-900">
              <div className="w-5 h-5 border-2 border-slate-900 rounded bg-white mx-auto"></div>
            </td>
            <td className="py-1.5 px-2 font-mono font-bold text-center text-slate-800 border-r border-slate-900">{numberOffset + index + 1}</td>
            <td className="py-1.5 px-2 font-bold text-slate-900 text-sm">{c.name}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  const renderCandidateColumns = (candidates: Candidate[]) => {
    const mid = Math.ceil(candidates.length / 2);
    const left = candidates.slice(0, mid);
    const right = candidates.slice(mid);

    if (right.length === 0) {
      return renderCandidateTable(left, 0);
    }

    return (
      <div className="flex gap-4">
        <div className="flex-1">{renderCandidateTable(left, 0)}</div>
        <div className="flex-1">{renderCandidateTable(right, left.length)}</div>
      </div>
    );
  };

  return createPortal(
    <div className="print-modal-overlay fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-sm flex items-start justify-center p-2 sm:p-4 md:p-6 animate-fadeIn">
      {/* Container Box */}
      <div className="print-modal-shell bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl overflow-hidden my-4 sm:my-8 flex flex-col">
        
        {/* Modal Sticky Top Toolbar (Hidden during browser print) */}
        <div className="no-print bg-slate-900 text-white p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3 sticky top-0 z-10 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
              <CheckSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold leading-tight">Hardekopie Stembrief (Drukstuk)</h3>
              <p className="text-[11px] text-slate-400">{ballot.name} • Kode: {ballot.accessCode}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Druk Stembrief (A4 / PDF)</span>
            </button>

            <button
              onClick={handleDownloadHtml}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition-all cursor-pointer"
              title="Laai selfstandige HTML papierstembrief af"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">HTML Lêer</span>
            </button>

            <button
              onClick={handleCopyTextVersion}
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

        {/* Customization Options Sub-bar (no-print) */}
        <div className="no-print bg-slate-100 border-b border-slate-200 px-6 py-3 flex flex-wrap items-center justify-between gap-4 text-xs font-medium text-slate-700">
          <div className="flex items-center gap-4">
            <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">Stembrief Opsies:</span>
            <label className="inline-flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={includeVoterDetails}
                onChange={(e) => setIncludeVoterDetails(e.target.checked)}
                className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300"
              />
              <span>Sluit Leerder Identifikasie Blok In</span>
            </label>

            <label className="inline-flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={includeStampBox}
                onChange={(e) => setIncludeStampBox(e.target.checked)}
                className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300"
              />
              <span>Sluit Skool Stempel Blok In</span>
            </label>
          </div>

          <div className="text-[11px] text-slate-500 italic">
            💡 Druk veelvuldige kopieë vir leerders wat nie 'n selfoon het nie.
          </div>
        </div>

        {/* Printable Hardcopy Ballot Paper Sheet */}
        <div className="p-6 sm:p-10 md:p-12 bg-white text-slate-900 space-y-6 overflow-x-auto" id="printable-hardcopy-ballot">
          
          {/* Header Section */}
          <div className="border-b-2 border-slate-900 pb-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {settings.schoolLogoUrl ? (
                <img src={settings.schoolLogoUrl} alt={schoolName} className="h-12 w-12 object-contain shrink-0" />
              ) : null}
              <h1 className="text-2xl font-black font-serif text-slate-900 tracking-tight uppercase">
                {schoolName}
              </h1>
            </div>

            <div className="text-left sm:text-right text-xs text-slate-700 font-mono space-y-1 bg-slate-50 p-3 rounded-lg border border-slate-200 shrink-0">
              <div><strong className="text-slate-900">Stembrief:</strong> {ballot.name}</div>
              <div><strong className="text-slate-900">Toelatingskode:</strong> {ballot.accessCode}</div>
              <div><strong className="text-slate-900">Datum van Uitreiking:</strong> {issueDate}</div>
            </div>
          </div>

          {/* Learner Identity Box (If enabled) */}
          {includeVoterDetails && (
            <div className="bg-slate-50 border-2 border-slate-900 rounded-xl p-4 sm:p-5 space-y-3 font-mono text-xs text-slate-900">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-2">
                <span className="font-bold uppercase tracking-wider text-slate-800 text-[11px]">Leerder Identifikasie (Vir Papier Oudit):</span>
                <span className="text-[10px] text-slate-500 italic font-sans">Vul asseblief duidelik in drukskrif in</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <span className="text-slate-600 block text-[11px]">Leerder Toelatingsnommer:</span>
                  <div className="border-b-2 border-slate-800 h-7 flex items-end font-bold text-sm"></div>
                </div>
                <div>
                  <span className="text-slate-600 block text-[11px]">Handtekening van Leerder:</span>
                  <div className="border-b-2 border-slate-800 h-7"></div>
                </div>
              </div>
            </div>
          )}

          {/* Voting Rules Banner */}
          <div className="bg-amber-50/80 border border-amber-300 rounded-xl p-4 text-slate-900 text-xs space-y-1">
            <h4 className="font-extrabold uppercase tracking-wider text-amber-950 flex items-center gap-1.5">
              <span>⚠️ Belangrike Instruksies vir Stemming:</span>
            </h4>
            <ol className="list-decimal list-inside space-y-1 text-slate-800 font-medium pt-1">
              <li>Plaas 'n duidelike <strong>[X]</strong> in die vierkantige blokkie langs die naam van jou gekose kandidate.</li>
              <li>
                Jy mag vir hoogstens <strong>{ballot.maxBoyPicks} seun(s)</strong> en <strong>{ballot.maxGirlPicks} dogter(s)</strong> stem.
              </li>
              <li>Stembriewe met meer merke as toegelaat of enige ongemagtigde merke sal as bedorwe beskou word.</li>
            </ol>
          </div>

          {/* Boys Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b-2 border-slate-900 pb-1.5">
              <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <span>Seunskandidate</span>
                <span className="text-xs font-bold text-slate-600 font-mono">(Kies Maksimum {ballot.maxBoyPicks})</span>
              </h2>
              <span className="text-xs font-mono text-slate-500">{ballot.boysCandidates.length} Kandidate</span>
            </div>

            {ballot.boysCandidates.length === 0 ? (
              <p className="text-xs text-slate-500 italic py-2">Geen seunskandidate vir hierdie stembrief gelys nie.</p>
            ) : (
              renderCandidateColumns(ballot.boysCandidates)
            )}
          </div>

          {/* Girls Section */}
          <div className="space-y-3 pt-6 page-break-before print:break-before-page" style={{ breakBefore: 'page', pageBreakBefore: 'always' }}>
            <div className="flex items-center justify-between border-b-2 border-slate-900 pb-1.5">
              <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <span>Dogterskandidate</span>
                <span className="text-xs font-bold text-slate-600 font-mono">(Kies Maksimum {ballot.maxGirlPicks})</span>
              </h2>
              <span className="text-xs font-mono text-slate-500">{ballot.girlsCandidates.length} Kandidate</span>
            </div>

            {ballot.girlsCandidates.length === 0 ? (
              <p className="text-xs text-slate-500 italic py-2">Geen dogterskandidate vir hierdie stembrief gelys nie.</p>
            ) : (
              renderCandidateColumns(ballot.girlsCandidates)
            )}
          </div>

          {/* Invigilator Audit & Stamp Stub */}
          {includeStampBox && (
            <div className="pt-6 border-t-2 border-slate-900 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 items-center">
                <div className="sm:col-span-2 space-y-3">
                  <div className="text-xs font-bold text-slate-900 uppercase tracking-wider">Amptelike Verkiesingsbeampte Sertifisering:</div>
                  <div className="text-xs text-slate-700 space-y-2 font-mono">
                    <div>Gekontroleer &amp; Ontvang deur (Naam): ____________________________________</div>
                    <div>Handtekening van Toesighouer: _____________________  Datum: ____________</div>
                  </div>
                </div>

                <div className="border-2 border-dashed border-slate-400 rounded-xl h-24 flex items-center justify-center p-2 text-center text-[10px] font-mono text-slate-500 uppercase tracking-wider">
                  Amptelike Skool Stempel / Kantoor Paraaf
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>,
    document.body
  );
};
