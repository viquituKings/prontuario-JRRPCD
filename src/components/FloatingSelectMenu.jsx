import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, X, Plus, Search } from 'lucide-react';
import { normalizarTexto } from '../types';

export default function FloatingSelectMenu({
  label,
  value,
  onChange,
  options = [],
  placeholder = 'Selecione ou digite...',
  required = false,
  icon: Icon = null,
  title = 'Selecione uma opção'
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  // Fecha o menu flutuante ao clicar fora
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

  // Filtra opções compatíveis com o texto digitado
  const filteredOptions = options.filter((opt) =>
    normalizarTexto(opt).includes(normalizedQuery)
  );

  const exactMatch = options.some(
    (opt) => normalizarTexto(opt) === normalizedQuery
  );

  const handleSelect = (option) => {
    onChange(option.toUpperCase());
    setIsOpen(false);
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange('');
    inputRef.current?.focus();
  };

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Label */}
      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center justify-between">
        <span className="flex items-center gap-1">
          {Icon && <Icon className="w-3 h-3 text-blue-600" />}
          {label} {required && <span className="text-red-500">*</span>}
        </span>
        {value && (
          <button
            type="button"
            onClick={handleClear}
            className="text-[9px] text-slate-400 hover:text-slate-600 font-normal lowercase"
          >
            limpar
          </button>
        )}
      </label>

      {/* Input com gatilho para menu flutuante */}
      <div className="relative">
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
          placeholder={placeholder}
          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 pr-9 text-xs font-semibold uppercase focus:ring-2 focus:ring-blue-500 outline-none text-slate-800 transition"
          autoComplete="off"
        />

        <button
          type="button"
          tabIndex={-1}
          onClick={() => {
            setIsOpen(!isOpen);
            inputRef.current?.focus();
          }}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded-lg transition"
        >
          <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* Menu Flutuante (Floating Dropdown) */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 max-h-60 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
          
          {/* Cabeçalho do menu flutuante */}
          <div className="px-3.5 py-2 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            <span>{title}</span>
            <span className="text-[9px] font-medium text-slate-400 lowercase">
              {filteredOptions.length} sugestões
            </span>
          </div>

          {/* Lista com rolagem suave */}
          <div className="overflow-y-auto divide-y divide-slate-50 flex-1 p-1">
            
            {/* Opção de Usar Texto Livre se não for match exato */}
            {value.trim() && !exactMatch && (
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

            {filteredOptions.length === 0 && !value.trim() && (
              <div className="p-4 text-center text-slate-400 text-xs">
                Nenhuma opção disponível.
              </div>
            )}

            {filteredOptions.length === 0 && value.trim() && exactMatch && (
              <div className="p-3 text-center text-slate-400 text-xs">
                Item selecionado.
              </div>
            )}

            {filteredOptions.map((opt) => {
              const isSelected = normalizarTexto(opt) === normalizarTexto(value);
              return (
                <button
                  key={opt}
                  type="button"
                  onMouseDown={() => handleSelect(opt)}
                  className={`w-full text-left px-3 py-2 text-xs font-semibold rounded-lg flex items-center justify-between transition ${
                    isSelected
                      ? 'bg-blue-50 text-blue-800 font-bold'
                      : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <span className="truncate">{opt}</span>
                  {isSelected && <Check className="w-3.5 h-3.5 text-blue-600 shrink-0 ml-1.5" />}
                </button>
              );
            })}
          </div>

        </div>
      )}
    </div>
  );
}
