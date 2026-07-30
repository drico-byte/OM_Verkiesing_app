import React, { useState, useEffect } from 'react';
import { Users, UserCheck, UserX, PieChart, Clock, Calendar, AlertCircle } from 'lucide-react';
import { Ballot } from '../../../types';

interface OverviewTabProps {
  ballot: Ballot;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({ ballot }) => {
  const totalValid = ballot.validVoterIds.length;
  const totalVoted = ballot.votes.length;
  const yetToVote = Math.max(0, totalValid - totalVoted);
  const percentageVoted = totalValid > 0 ? ((totalVoted / totalValid) * 100).toFixed(1) : '0';

  const [timeLeftStr, setTimeLeftStr] = useState<string>('');

  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date().getTime();
      const close = new Date(ballot.closeTime).getTime();
      const open = new Date(ballot.openTime).getTime();

      if (now < open) {
        setTimeLeftStr('Stembrief het nog nie oopgemaak nie');
        return;
      }

      const diff = close - now;
      if (diff <= 0) {
        setTimeLeftStr('Stembrief is reeds gesluit');
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeftStr(`${hours}u ${minutes}m ${seconds}s`);
    };

    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);
    return () => clearInterval(timer);
  }, [ballot.closeTime, ballot.openTime]);

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Stat Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Stat 1: % Stemme Uitgebring */}
        <div className="bg-white rounded-xl p-6 border border-slate-200/90 shadow-sm space-y-3 relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">% Stemme Uitgebring</span>
            <div className="p-2.5 rounded-xl bg-slate-100 text-slate-900">
              <PieChart className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-900 font-mono">
            {percentageVoted}%
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div
              className="bg-slate-900 h-full transition-all duration-700 rounded-full"
              style={{ width: `${percentageVoted}%` }}
            />
          </div>
          <p className="text-[11px] text-slate-500">
            Van alle gemagtigde leerders wat mag stem.
          </p>
        </div>

        {/* Stat 2: Totaal Gemagtig */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-sm space-y-3">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Totaal Stemgeregtigdes</span>
            <div className="p-2.5 rounded-xl bg-blue-50 text-blue-700">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-900 font-mono">
            {totalValid}
          </div>
          <p className="text-[11px] text-slate-500">
            Aantal goedgekeurde Leerder ID's in databasis.
          </p>
        </div>

        {/* Stat 3: Reeds Gestem */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-sm space-y-3">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Reeds Gestem</span>
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700">
              <UserCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-900 font-mono">
            {totalVoted}
          </div>
          <p className="text-[11px] text-slate-500">
            Leerders wat alreeds hul stembrief ingedien het.
          </p>
        </div>

        {/* Stat 4: Nog Nie Gestem Nie */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-sm space-y-3">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Nog Nie Gestem Nie</span>
            <div className="p-2.5 rounded-xl bg-amber-50 text-amber-700">
              <UserX className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-900 font-mono">
            {yetToVote}
          </div>
          <p className="text-[11px] text-slate-500">
            Leerders wat nog wag om hul stem in te dien.
          </p>
        </div>
      </div>

      {/* Countdown & Status Banner */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2 text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start gap-2 text-xs font-bold uppercase text-slate-500 tracking-wider">
            <Clock className="w-4 h-4 text-emerald-700" />
            <span>Tyd Status Voor Sluiting</span>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono">
            {timeLeftStr}
          </div>
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-xs text-slate-500 pt-1">
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              Oop: <strong>{new Date(ballot.openTime).toLocaleString('af-ZA')}</strong>
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              Sluit: <strong>{new Date(ballot.closeTime).toLocaleString('af-ZA')}</strong>
            </span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-700 space-y-1.5 max-w-sm">
          <div className="font-bold flex items-center gap-1.5 text-slate-900">
            <AlertCircle className="w-4 h-4 text-amber-600" />
            <span>Handmatige Beheer Status</span>
          </div>
          <p>
            Status is tans:{' '}
            <strong className={ballot.isManualOpen ? 'text-emerald-700' : 'text-rose-700'}>
              {ballot.isManualOpen ? 'Oopgestel (Handmatig Oop)' : 'Handmatig Gesluit'}
            </strong>.
          </p>
        </div>
      </div>
    </div>
  );
};
