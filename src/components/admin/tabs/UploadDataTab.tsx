import React, { useState } from 'react';
import { Download, Upload, FileText, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { Ballot, Candidate } from '../../../types';
import { downloadEmptyTemplate, parseDataCsv, ParsedCsvResult } from '../../../lib/csvHelper';

interface UploadDataTabProps {
  ballot: Ballot;
  onUpdateBallot: (updatedBallot: Ballot) => void;
}

export const UploadDataTab: React.FC<UploadDataTabProps> = ({
  ballot,
  onUpdateBallot,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parsedPreview, setParsedPreview] = useState<ParsedCsvResult | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [importSuccessMessage, setImportSuccessMessage] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setIsParsing(true);
      setImportSuccessMessage(null);

      const parsed = await parseDataCsv(file);
      setParsedPreview(parsed);
      setIsParsing(false);
    }
  };

  const handleApplyImport = () => {
    if (!parsedPreview) return;

    // Merge or replace
    const updatedVoters = Array.from(
      new Set([...ballot.validVoterIds, ...parsedPreview.validVoterIds])
    );

    // Filter out candidates with duplicate names
    const existingBoyNames = new Set(ballot.boysCandidates.map((b) => b.name.toLowerCase()));
    const newBoys = parsedPreview.boysCandidates.filter(
      (b) => !existingBoyNames.has(b.name.toLowerCase())
    );

    const existingGirlNames = new Set(ballot.girlsCandidates.map((g) => g.name.toLowerCase()));
    const newGirls = parsedPreview.girlsCandidates.filter(
      (g) => !existingGirlNames.has(g.name.toLowerCase())
    );

    const updatedBallot: Ballot = {
      ...ballot,
      validVoterIds: updatedVoters,
      boysCandidates: [...ballot.boysCandidates, ...newBoys],
      girlsCandidates: [...ballot.girlsCandidates, ...newGirls],
    };

    onUpdateBallot(updatedBallot);

    setImportSuccessMessage(
      `Sleuteldata suksesvol ingevoer! ${parsedPreview.validVoterIds.length} stemgemagtigde ID's, ${newBoys.length} nuwe seuns en ${newGirls.length} nuwe dogters is bygevoeg.`
    );
    setSelectedFile(null);
    setParsedPreview(null);
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Intro & Template Download Box */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border-b border-slate-100 pb-6">
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-slate-900 font-serif flex items-center gap-2">
              <Upload className="w-5 h-5 text-emerald-700" />
              Grootmaat Data Oplaai (CSV / Excel)
            </h2>
            <p className="text-xs text-slate-500 max-w-2xl">
              Laai 'n CSV-lêer op met gemagtigde Leerder ID's (Kolom A), Seunskandidate (Kolom B) en Dogterskandidate (Kolom C). Spesiale karakters (é, ë, ê, è, ï) word outomaties korrek verwerk en vertoon.
            </p>
          </div>

          <button
            onClick={downloadEmptyTemplate}
            className="w-full md:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 bg-amber-400 hover:bg-amber-300 text-emerald-950 font-bold text-xs sm:text-sm rounded-xl shadow-md transition-all cursor-pointer transform active:scale-95"
          >
            <Download className="w-4 h-4" />
            <span>Laai leë CSV templaat af</span>
          </button>
        </div>

        {/* Format Explanation Steps */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs pt-2">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
            <strong className="text-slate-900 font-mono block">Kolom A: Leerder_ID</strong>
            <p className="text-slate-500">Unieke skoolnommers of toelatingsnommers van leerders wat mag stem (bv. 1001, 1002).</p>
          </div>
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
            <strong className="text-blue-950 font-mono block">Kolom B: Seunskandidaat</strong>
            <p className="text-slate-500">Volle name van seunskandidate wat verkiesbaar is.</p>
          </div>
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
            <strong className="text-rose-950 font-mono block">Kolom C: Dogterskandidaat</strong>
            <p className="text-slate-500">Volle name van dogterskandidate wat verkiesbaar is.</p>
          </div>
        </div>
      </div>

      {importSuccessMessage && (
        <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-4 text-xs sm:text-sm text-emerald-900 flex items-center gap-3">
          <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
          <span>{importSuccessMessage}</span>
        </div>
      )}

      {/* File Dropzone */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-6">
        <label className="border-2 border-dashed border-slate-300 hover:border-emerald-600 rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-colors bg-slate-50/50 hover:bg-emerald-50/30">
          <FileText className="w-12 h-12 text-slate-400 mb-3" />
          <span className="text-sm font-bold text-slate-800">
            {selectedFile ? selectedFile.name : 'Klik hier om n CSV-lêer te kies of te sleep'}
          </span>
          <span className="text-xs text-slate-500 mt-1">
            Slegs .csv formaat lêers word ondersteun
          </span>
          <input
            type="file"
            accept=".csv,text/csv"
            onChange={handleFileChange}
            className="hidden"
          />
        </label>

        {isParsing && (
          <div className="flex items-center justify-center gap-2 text-xs text-slate-600 py-4 font-mono">
            <RefreshCw className="w-4 h-4 animate-spin text-emerald-700" />
            <span>Ontleed tans CSV-data...</span>
          </div>
        )}

        {/* Parsed Data Preview & Confirmation */}
        {parsedPreview && !isParsing && (
          <div className="border border-slate-200 rounded-2xl p-6 bg-slate-50 space-y-4">
            <h3 className="text-base font-bold text-slate-900 font-serif">Voorbeskouing van Geontleede Data</h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono">
              <div className="bg-white p-3.5 rounded-xl border border-slate-200">
                <span className="text-slate-500 block">Gemagtigde Leerder ID's</span>
                <strong className="text-lg text-slate-900">{parsedPreview.validVoterIds.length}</strong>
              </div>
              <div className="bg-white p-3.5 rounded-xl border border-slate-200">
                <span className="text-slate-500 block">Seunskandidate</span>
                <strong className="text-lg text-blue-700">{parsedPreview.boysCandidates.length}</strong>
              </div>
              <div className="bg-white p-3.5 rounded-xl border border-slate-200">
                <span className="text-slate-500 block">Dogterskandidate</span>
                <strong className="text-lg text-rose-700">{parsedPreview.girlsCandidates.length}</strong>
              </div>
            </div>

            {parsedPreview.errors.length > 0 && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 space-y-1">
                {parsedPreview.errors.map((err, i) => (
                  <p key={i}>• {err}</p>
                ))}
              </div>
            )}

            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setSelectedFile(null);
                  setParsedPreview(null);
                }}
                className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-xl text-xs font-bold transition-colors"
              >
                Kanselleer
              </button>

              <button
                type="button"
                onClick={handleApplyImport}
                className="px-6 py-2.5 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer"
              >
                Invoering Bevestig & Voeg By Stembrief
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
