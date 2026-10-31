import React from 'react';
import { Users, Clock, Award, Activity } from 'lucide-react';

export default function StatsCards({ pacientes, activeFilter, onSelectFilter }) {
  const total = pacientes.length;
  
  const aguardandoOpm = pacientes.filter(
    (p) => p.status === 'aguardando_opm' || p.status === 'prova_ajuste'
  ).length;

  const emAvaliacao = pacientes.filter(
    (p) => p.status === 'triagem' || p.status === 'em_avaliacao'
  ).length;

  const concluidos = pacientes.filter(
    (p) => p.status === 'concluido' || p.status === 'acompanhamento'
  ).length;

  const cards = [
    {
      id: 'todos',
      label: 'Total de Pacientes',
      count: total,
      icon: Users,
      color: 'blue',
      borderColor: 'border-blue-200',
      bgColor: 'bg-blue-50/70',
      iconColor: 'text-blue-600',
    },
    {
      id: 'em_avaliacao',
      label: 'Triagem & Avaliação',
      count: emAvaliacao,
      icon: Activity,
      color: 'amber',
      borderColor: 'border-amber-200',
      bgColor: 'bg-amber-50/70',
      iconColor: 'text-amber-600',
    },
    {
      id: 'aguardando_opm',
      label: 'Em Processo de OPM',
      count: aguardandoOpm,
      icon: Clock,
      color: 'purple',
      borderColor: 'border-purple-200',
      bgColor: 'bg-purple-50/70',
      iconColor: 'text-purple-600',
    },
    {
      id: 'concluido',
      label: 'OPM Concedida / Concluídos',
      count: concluidos,
      icon: Award,
      color: 'emerald',
      borderColor: 'border-emerald-200',
      bgColor: 'bg-emerald-50/70',
      iconColor: 'text-emerald-600',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 my-6 no-print">
      {cards.map((card) => {
        const Icon = card.icon;
        const isSelected = activeFilter === card.id;

        return (
          <button
            key={card.id}
            onClick={() => onSelectFilter(card.id)}
            className={`text-left p-4 rounded-xl border transition-all duration-200 ${
              isSelected 
                ? 'ring-2 ring-blue-500 shadow-md bg-white border-blue-500' 
                : 'bg-white hover:border-slate-300 hover:shadow-sm border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                {card.label}
              </span>
              <div className={`p-2 rounded-lg ${card.bgColor} ${card.iconColor}`}>
                <Icon className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900">{card.count}</span>
              <span className="text-xs text-slate-400">
                {card.count === 1 ? 'paciente' : 'pacientes'}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
