'use client';

import { useState, useEffect, useRef } from 'react';
import { useDebounce } from '@/shared/hooks/useDebounce';

export interface SearchBarProps {
  /** Valor inicial del search */
  initialValue?: string;
  /** Callback cuando el valor debounced cambia */
  onSearch: (query: string) => void;
  /** Delay del debounce en ms (default: 300) */
  debounceDelay?: number;
  /** Placeholder del input */
  placeholder?: string;
}

/**
 * Barra de búsqueda con debouncing
 *
 * Features:
 * - Input de texto con debouncing (300ms default)
 * - Botón para limpiar búsqueda
 * - Ícono de búsqueda
 * - Responsive
 */
export function SearchBar({
  initialValue = '',
  onSearch,
  debounceDelay = 300,
  placeholder = 'Buscar eventos, artistas, venues...',
}: SearchBarProps) {
  const [inputValue, setInputValue] = useState(initialValue);
  const debouncedValue = useDebounce(inputValue, debounceDelay);

  // Usar ref para evitar que el callback cause re-renders
  const onSearchRef = useRef(onSearch);

  useEffect(() => {
    onSearchRef.current = onSearch;
  }, [onSearch]);

  // Ejecutar onSearch cuando el valor debounced cambia
  useEffect(() => {
    onSearchRef.current(debouncedValue);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedValue]);

  // Limpiar búsqueda
  const handleClear = () => {
    setInputValue('');
  };

  return (
    <div className="relative w-full">
      {/* Ícono de búsqueda */}
      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
        <svg
          className="w-5 h-5 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </div>

      {/* Input */}
      <input
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        placeholder={placeholder}
        className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent text-gray-900 placeholder-gray-400"
        aria-label="Buscar eventos"
      />

      {/* Botón limpiar (solo visible si hay texto) */}
      {inputValue && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
          aria-label="Limpiar búsqueda"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      )}
    </div>
  );
}
