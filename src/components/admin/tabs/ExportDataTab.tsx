import React, { useState } from 'react';
import { Download, FileSpreadsheet, Printer, FileText, CheckSquare, ShieldCheck } from 'lucide-react';
import { Ballot } from '../../../types';
import { exportBallotResultsCsv } from '../../../lib/csvHelper';
import { PrintReportModal } from '../PrintReportModal';
import { PrintHardcopyBallotModal } from '../PrintHardcopyBallotModal';

interface ExportDataTabProps {
  ballot: Ballot;
}

export const ExportDataTab: React.FC<ExportDataTabProps> = ({ ballot }) => {
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [showHardcopyModal, setShowHardcopyModal] = useState(false);

  const totalValid = ballot.validVoterIds.length;
  const totalVotesCast = ballot.votes.length;
  const pct = totalValid > 0 ? ((totalVotesCast / totalValid) * 100).toFixed(1) : '0';

  const handleExportCsv = () => {
    exportBallotResultsCsv(ballot);
  };

  const handlePrintReport = () => {
    setShowPrintModal(true);
  };

  const handlePrintHardcopy = () => {
    setShowHardcopyModal(true);
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900 font-serif flex items-center gap-2">
            <Download className="w-5 h-5 text-emerald-700" />
            Eksporteer Uitslae, Verslae &amp; Hardekopie Stembriewe
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Laai die volledige verkiesingsuitslae af, druk 'n amptelike verkiesingsopsomming, of druk fisiese papier stemvorms (hardekopies) vir leerders sonder fone.
          </p>
        </div>

        {/* Action Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 space-y-4 hover:border-emerald-500 transition-colors flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Eksporteer Uitslae na CSV</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Laai 'n CSV-lêer af met die volledige mees onlangse telling per kandidaat (seuns en dogters) asook deelname statistieke.
                </p>
              </div>
            </div>
            <button
              onClick={handleExportCsv}
              className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer mt-2"
            >
              <Download className="w-4 h-4" />
              <span>Laai Uitslae CSV Af</span>
            </button>
          </div>

          <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 space-y-4 hover:border-blue-500 transition-colors flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center">
                <Printer className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Druk Amptelike Verslag</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Open 'n netjiese drukvriendelike weergawe van die finale uitslae om te onderteken deur die verkiesingsbeamptes en skoolhoof.
                </p>
              </div>
            </div>
            <button
              onClick={handlePrintReport}
              className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 bg-blue-800 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer mt-2"
            >
              <Printer className="w-4 h-4" />
              <span>Druk Verslag Opsomming</span>
            </button>
          </div>

          <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 space-y-4 hover:border-purple-500 transition-colors flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-900 flex items-center justify-center">
                <CheckSquare className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Hardekopie Stembrief (Papier)</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Druk of laai 'n amptelike fisiese papier-stembrief af as rugsteun vir leerders sonder selfone of slimfone.
                </p>
              </div>
            </div>
            <button
              onClick={handlePrintHardcopy}
              className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 bg-purple-900 hover:bg-purple-800 text-white rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer mt-2"
            >
              <FileText className="w-4 h-4" />
              <span>Druk / Laai Hardekopie Af</span>
            </button>
          </div>
        </div>

        {/* Audit summary table */}
        <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 space-y-3">
          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Opsomming van Huidige Stembrief
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
            <div>
              <span className="text-slate-500 block">Stembrief Naam</span>
              <strong className="text-slate-900 truncate block">{ballot.name}</strong>
            </div>
            <div>
              <span className="text-slate-500 block">Toelatingskode</span>
              <strong className="text-slate-900">{ballot.accessCode}</strong>
            </div>
            <div>
              <span className="text-slate-500 block">Stemgeregtigdes</span>
              <strong className="text-slate-900">{totalValid}</strong>
            </div>
            <div>
              <span className="text-slate-500 block">Stemme Ingedien</span>
              <strong className="text-emerald-700">{totalVotesCast} ({pct}%)</strong>
            </div>
          </div>
        </div>
      </div>

      {showPrintModal && (
        <PrintReportModal
          ballot={ballot}
          onClose={() => setShowPrintModal(false)}
        />
      )}

      {showHardcopyModal && (
        <PrintHardcopyBallotModal
          ballot={ballot}
          onClose={() => setShowHardcopyModal(false)}
        />
      )}
    </div>
  );
};
