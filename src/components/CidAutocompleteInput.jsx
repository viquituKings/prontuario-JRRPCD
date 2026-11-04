import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Search, X, Check, Stethoscope, ChevronDown, Plus } from 'lucide-react';
import allCids from '../data/cids.json';
import { normalizarTexto } from '../types';

// Pré-processamento dos CIDs em memória uma única vez para resposta instantânea ao digitar
const PREPARED_CIDS = allCids.map((entry) => ({
  raw: entry,
  normalized: normalizarTexto(entry)
}));

export default function CidAutocompleteInput({
  value = '',
  onChange,
  onRemove = null,
  canRemove = false,
  index = 0,
  required = false
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  // Fecha menu flutuante ao clicar fora
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const normalizedQuery = normalizarTexto(value);

  // Busca ultra-rápida nos 15.307 CIDs oficiais (CID.pdf + CID10.xml)
  const filteredCids = useMemo(() => {
    if (!normalizedQuery || normalizedQuery.length < 1) {
      // Sugestões populares para reabilitação/PCD quando vazio
      return [
        'G12.2 - Doença do neurônio motor (ELA)',
        'G80 - Paralisia cerebral',
        'G80.0 - Paralisia cerebral espástica quadriparética',
        'G82 - Paraplegia e tetraplegia',
        'B91 - Sequelas de poliomielite',
        'F84 - Transtornos globais do desenvolvimento',
        'F84.0 - Autismo infantil (TEA)',
        'F90 - Transtorno do déficit de atenção e hiperatividade (TDAH)',
        'I69.4 - Sequelas de acidente vascular cerebral (AVC)',
        'S88 - Amputação traumática da perna',
        'S78 - Amputação traumática da coxa e do quadril',
        'Q05 - Espinha bífida (Mielomeningocele)',
        'Q90 - Síndrome de Down',
        'E10.5 - Diabetes mellitus com complicações circulatórias'
      ];
    }

    const results = [];
    const query = normalizedQuery;

    for (let i = 0; i < PREPARED_CIDS.length; i++) {
      const item = PREPARED_CIDS[i];
      if (item.normalized.includes(query)) {
        results.push(item.raw);
        if (results.length >= 35) break; // Limita a 35 para fluidez instantânea
      }
    }
    return results;
  }, [normalizedQuery]);

  const handleSelect = (cid) => {
    onChange(cid.toUpperCase());
    setIsOpen(false);
  };

  const handleClear = () => {
    onChange('');
    setIsOpen(true);
    inputRef.current?.focus();
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="flex items-center gap-1.5">
        <div className="relative flex-1">
          <input
            ref={inputRef}
            type="text"
            required={required}
            value={value}
            onChange={(e) => {
              onChange(e.target.value.toUpperCase());
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            placeholder="Digite o código ou nome da doença (ex: F84, G80, ELA, AVC, Autismo)..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-3 pr-16 py-2 text-xs uppercase font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none transition"
            autoComplete="off"
          />

          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
            {value && (
              <button
                type="button"
                onClick={handleClear}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg transition"
                title="Limpar CID"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              type="button"
              tabIndex={-1}
              onClick={() => {
                setIsOpen(!isOpen);
                inputRef.current?.focus();
              }}
              className="p-1 text-slate-400 hover:text-slate-600 rounded-lg transition"
            >
              <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </div>

        {/* Botão de remoção se for CID adicional */}
        {canRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl border border-slate-200 transition shrink-0"
            title="Remover este CID"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Menu Flutuante de Autocomplete com os 14.349 CIDs do DATASUS */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 max-h-64 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
          
          {/* Cabeçalho do Menu */}
          <div className="px-3.5 py-2 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            <span className="flex items-center gap-1.5">
              <Stethoscope className="w-3.5 h-3.5 text-blue-600" />
              <span>Base Oficial CID-10 & CID-O ({allCids.length.toLocaleString('pt-BR')} CIDs)</span>
            </span>
            <span className="text-[9px] text-slate-400 font-normal">
              {filteredCids.length} resultados
            </span>
          </div>

          {/* Lista com rolagem */}
          <div className="overflow-y-auto divide-y divide-slate-100 flex-1 p-1">
            
            {/* Opção para usar texto livre caso não esteja no dicionário */}
            {value.trim() && (
              <button
                type="button"
                onMouseDown={() => handleSelect(value)}
                className="w-full text-left px-3 py-2 text-xs font-bold text-blue-700 bg-blue-50/70 hover:bg-blue-100 rounded-xl mb-1 flex items-center justify-between transition"
              >
                <span className="truncate">
                  + Usar "<strong>{value.toUpperCase()}</strong>"
                </span>
                <span className="text-[10px] bg-blue-600 text-white px-1.5 py-0.5 rounded-md font-bold shrink-0 ml-2">
                  Personalizado
                </span>
              </button>
            )}

            {filteredCids.map((cidItem) => {
              const isSelected = normalizarTexto(cidItem) === normalizarTexto(value);
              const parts = cidItem.split(' - ');
              const code = parts[0] || '';
              const description = parts.slice(1).join(' - ') || '';

              return (
                <button
                  key={cidItem}
                  type="button"
                  onMouseDown={() => handleSelect(cidItem)}
                  className={`w-full text-left px-3 py-2 text-xs rounded-xl flex items-center justify-between gap-2 transition ${
                    isSelected
                      ? 'bg-blue-50 text-blue-900 font-bold'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 font-mono font-bold text-[11px] shrink-0 border border-slate-200">
                      {code}
                    </span>
                    <span className="truncate font-medium text-slate-700">
                      {description}
                    </span>
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-blue-600 shrink-0" />}
                </button>
              );
            })}

            {filteredCids.length === 0 && (
              <div className="p-4 text-center text-slate-400 text-xs">
                Nenhum CID correspondente encontrado.
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
}

