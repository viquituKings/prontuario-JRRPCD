import React from 'react';
import { Users, Accessibility, Brain, Activity } from 'lucide-react';

export default function StatsCards({ pacientes, activeFilter, onSelectFilter }) {
  const total = pacientes.length;

  const totalOpm = pacientes.filter(
    (p) => p.servico_especializado === 'OPM' || (!p.servico_especializado && p.tipoOpm)
  ).length;

  const totalIntelectual = pacientes.filter(
    (p) => p.servico_especializado === 'Reab. Intelectual'
  ).length;

  const totalFisica = pacientes.filter(
    (p) => p.servico_especializado === 'Reab. Fisica'
  ).length;

  const cards = [
    {
      id: 'todos',
      label: 'Total de Pacientes',
      count: total,
      icon: Users,
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-600',
      textColor: 'text-slate-900',
    },
    {
      id: 'OPM',
      label: 'Pedidos OPM',
      count: totalOpm,
      icon: Accessibility,
      bgColor: 'bg-indigo-50',
      iconColor: 'text-indigo-600',
      textColor: 'text-indigo-600',
    },
    {
      id: 'Reab. Intelectual',
      label: 'Reabilitação Intelectual',
      count: totalIntelectual,
      icon: Brain,
      bgColor: 'bg-purple-50',
      iconColor: 'text-purple-600',
      textColor: 'text-purple-600',
    },
    {
      id: 'Reab. Fisica',
      label: 'Reabilitação Física',
      count: totalFisica,
      icon: Activity,
      bgColor: 'bg-emerald-50',
      iconColor: 'text-emerald-600',
      textColor: 'text-emerald-600',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 my-6 no-print">
      {cards.map((card) => {
        const Icon = card.icon;
        const isSelected = activeFilter === card.id;

        return (
          <button
            key={card.id}
            onClick={() => onSelectFilter(card.id)}
            className={`text-left p-6 rounded-2xl border transition-all duration-200 flex items-center justify-between ${
              isSelected 
                ? 'ring-2 ring-blue-500 shadow-md bg-white border-blue-500 scale-[1.02]' 
                : 'bg-white hover:border-slate-300 hover:shadow-sm border-slate-100'
            }`}
          >
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                {card.label}
              </p>
              <h3 className={`text-2xl font-bold mt-1 ${card.textColor}`}>
                {card.count}
              </h3>
            </div>
            <div className={`w-12 h-12 rounded-2xl ${card.bgColor} ${card.iconColor} flex items-center justify-center text-xl shadow-sm`}>
              <Icon className="w-6 h-6" />
            </div>
          </button>
        );
      })}
    </div>
  );
}
