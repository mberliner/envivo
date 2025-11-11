'use client';

import { useState, useEffect, useRef } from 'react';

export interface EventFiltersProps {
  /** Ciudades disponibles para filtrar */
  cities: string[];
  /** Categorías disponibles para filtrar */
  categories: string[];
  /** Valores iniciales de filtros */
  initialFilters?: {
    city?: string;
    category?: string;
    dateFrom?: string; // ISO date string
    dateTo?: string; // ISO date string
  };
  /** Callback cuando los filtros cambian */
  onFiltersChange: (filters: {
    city?: string;
    category?: string;
    dateFrom?: string;
    dateTo?: string;
  }) => void;
}

/**
 * Panel de filtros para eventos
 *
 * Features:
 * - Filtro por ciudad (dropdown)
 * - Filtro por categoría (dropdown)
 * - Filtro por rango de fechas (date pickers)
 * - Botón para limpiar todos los filtros
 * - Responsive (stacked en mobile, inline en desktop)
 */
export function EventFilters({
  cities,
  categories,
  initialFilters = {},
  onFiltersChange,
}: EventFiltersProps) {
  const [city, setCity] = useState(initialFilters.city || '');
  const [category, setCategory] = useState(initialFilters.category || '');
  const [dateFrom, setDateFrom] = useState(initialFilters.dateFrom || '');
  const [dateTo, setDateTo] = useState(initialFilters.dateTo || '');

  // Usar ref para evitar que el callback cause re-renders
  const onFiltersChangeRef = useRef(onFiltersChange);

  useEffect(() => {
    onFiltersChangeRef.current = onFiltersChange;
  }, [onFiltersChange]);

  // Notificar cambios al padre
  useEffect(() => {
    onFiltersChangeRef.current({
      city: city || undefined,
      category: category || undefined,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
    });
     
  }, [city, category, dateFrom, dateTo]);

  // Limpiar todos los filtros
  const handleClearFilters = () => {
    setCity('');
    setCategory('');
    setDateFrom('');
    setDateTo('');
  };

  // Verificar si hay filtros activos
  const hasActiveFilters = city || category || dateFrom || dateTo;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:gap-3">
        {/* Filtro por Ciudad */}
        <div className="flex-1">
          <label
            htmlFor="city-filter"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Ciudad
          </label>
          <select
            id="city-filter"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-600 focus:border-transparent text-gray-900"
          >
            <option value="">Todas las ciudades</option>
            {cities.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {/* Filtro por Categoría */}
        <div className="flex-1">
          <label
            htmlFor="category-filter"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Categoría
          </label>
          <select
            id="category-filter"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-600 focus:border-transparent text-gray-900"
          >
            <option value="">Todas las categorías</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Filtro por Fecha Desde */}
        <div className="flex-1">
          <label
            htmlFor="date-from-filter"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Desde
          </label>
          <input
            type="date"
            id="date-from-filter"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-600 focus:border-transparent text-gray-900"
          />
        </div>

        {/* Filtro por Fecha Hasta */}
        <div className="flex-1">
          <label
            htmlFor="date-to-filter"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Hasta
          </label>
          <input
            type="date"
            id="date-to-filter"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            min={dateFrom || undefined}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-600 focus:border-transparent text-gray-900"
          />
        </div>

        {/* Botón Limpiar Filtros */}
        {hasActiveFilters && (
          <div className="md:flex-shrink-0">
            <button
              type="button"
              onClick={handleClearFilters}
              className="w-full md:w-auto px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-md transition-colors duration-200"
              aria-label="Limpiar todos los filtros"
            >
              Limpiar filtros
            </button>
          </div>
        )}
      </div>

      {/* Indicador de filtros activos */}
      {hasActiveFilters && (
        <div className="mt-3 flex flex-wrap gap-2">
          {city && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
              Ciudad: {city}
              <button
                type="button"
                onClick={() => setCity('')}
                className="ml-1 hover:text-purple-900"
                aria-label={`Quitar filtro de ciudad ${city}`}
              >
                ×
              </button>
            </span>
          )}
          {category && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
              Categoría: {category}
              <button
                type="button"
                onClick={() => setCategory('')}
                className="ml-1 hover:text-purple-900"
                aria-label={`Quitar filtro de categoría ${category}`}
              >
                ×
              </button>
            </span>
          )}
          {dateFrom && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
              Desde: {new Date(dateFrom).toLocaleDateString('es-AR')}
              <button
                type="button"
                onClick={() => setDateFrom('')}
                className="ml-1 hover:text-purple-900"
                aria-label="Quitar filtro de fecha desde"
              >
                ×
              </button>
            </span>
          )}
          {dateTo && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
              Hasta: {new Date(dateTo).toLocaleDateString('es-AR')}
              <button
                type="button"
                onClick={() => setDateTo('')}
                className="ml-1 hover:text-purple-900"
                aria-label="Quitar filtro de fecha hasta"
              >
                ×
              </button>
            </span>
          )}
        </div>
      )}
    </div>
  );
}
