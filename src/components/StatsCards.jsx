import React from 'react';
import { Users, Accessibility, Brain, Activity, Eye, Baby } from 'lucide-react';
import { extrairPacientesUnicos, contarOpmsSolicitadas, temOpmSolicitada } from '../types';

export default function StatsCards({ pacientes, activeFilter, onSelectFilter }) {
  const totalPacientesUnicos = extrairPacientesUnicos(pacientes).length;
  const totalOpms = contarOpmsSolicitadas(pacientes);
  const totalServicos = pacientes.length;

  const totalIntelectual = pacientes.filter(
    (p) => p.servico_especializado === 'Reab. Intelectual'
  ).length;

  const totalFisica = pacientes.filter(
    (p) => p.servico_especializado === 'Reab. Fisica'
  ).length;

  const totalVisual = pacientes.filter(
    (p) => p.servico_especializado === 'Reab. Visual' || p.servico_especializado === 'Reabilitação Visual'
  ).length;

  const totalNeonato = pacientes.filter(
    (p) => p.servico_especializado === 'Neonato de Risco' || p.servico_especializado === 'Neonato de risco'
  ).length;

  const pacientesOpm = extrairPacientesUnicos(pacientes.filter((p) => temOpmSolicitada(p))).length;
  const pacientesIntelectual = extrairPacientesUnicos(pacientes.filter((p) => p.servico_especializado === 'Reab. Intelectual')).length;
  const pacientesFisica = extrairPacientesUnicos(pacientes.filter((p) => p.servico_especializado === 'Reab. Fisica')).length;
  const pacientesVisual = extrairPacientesUnicos(pacientes.filter((p) => p.servico_especializado === 'Reab. Visual' || p.servico_especializado === 'Reabilitação Visual')).length;
  const pacientesNeonato = extrairPacientesUnicos(pacientes.filter((p) => p.servico_especializado === 'Neonato de Risco' || p.servico_especializado === 'Neonato de risco')).length;

  const cards = [
    {
      id: 'todos',
      label: 'Pacientes',
      count: totalPacientesUnicos,
      subtext: `${totalServicos} serviços registrados`,
      icon: Users,
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-600',
      textColor: 'text-slate-900',
    },
    {
      id: 'OPM',
      label: 'OPMs Solicitadas',
      count: totalOpms,
      subtext: `${pacientesOpm} pacientes com OPM`,
      icon: Accessibility,
      bgColor: 'bg-indigo-50',
      iconColor: 'text-indigo-600',
      textColor: 'text-indigo-600',
    },
    {
      id: 'Reab. Intelectual',
      label: 'Reab. Intelectual',
      count: totalIntelectual,
      subtext: `${pacientesIntelectual} pacientes`,
      icon: Brain,
      bgColor: 'bg-purple-50',
      iconColor: 'text-purple-600',
      textColor: 'text-purple-600',
    },
    {
      id: 'Reab. Fisica',
      label: 'Reab. Física',
      count: totalFisica,
      subtext: `${pacientesFisica} pacientes`,
      icon: Activity,
      bgColor: 'bg-emerald-50',
      iconColor: 'text-emerald-600',
      textColor: 'text-emerald-600',
    },
    {
      id: 'Reab. Visual',
      label: 'Reab. Visual',
      count: totalVisual,
      subtext: `${pacientesVisual} pacientes`,
      icon: Eye,
      bgColor: 'bg-amber-50',
      iconColor: 'text-amber-600',
      textColor: 'text-amber-600',
    },
    {
      id: 'Neonato de Risco',
      label: 'Neonato de Risco',
      count: totalNeonato,
      subtext: `${pacientesNeonato} pacientes`,
      icon: Baby,
      bgColor: 'bg-rose-50',
      iconColor: 'text-rose-600',
      textColor: 'text-rose-600',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5 sm:gap-4 my-6 no-print">
      {cards.map((card) => {
        const Icon = card.icon;
        const isSelected = activeFilter === card.id;

        return (
          <button
            key={card.id}
            onClick={() => onSelectFilter(card.id)}
            className={`text-left p-4 sm:p-5 rounded-2xl border transition-all duration-200 flex items-center justify-between ${
              isSelected 
                ? 'ring-2 ring-blue-500 shadow-md bg-white border-blue-500 scale-[1.02]' 
                : 'bg-white hover:border-slate-300 hover:shadow-sm border-slate-100'
            }`}
          >
            <div className="space-y-0.5 min-w-0">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider truncate">
                {card.label}
              </p>
              <h3 className={`text-2xl font-bold ${card.textColor}`}>
                {card.count}
              </h3>
              {card.subtext && (
                <p className="text-[10px] text-slate-400 font-medium truncate max-w-[130px] sm:max-w-[150px]">
                  {card.subtext}
                </p>
              )}
            </div>
            <div className={`w-11 h-11 rounded-2xl ${card.bgColor} ${card.iconColor} flex items-center justify-center text-lg shadow-sm shrink-0 ml-2`}>
              <Icon className="w-5 h-5" />
            </div>
          </button>
        );
      })}
    </div>
  );
}
