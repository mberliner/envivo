'use client';

import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useCallback } from 'react';

/**
 * Hook para sincronizar state con URL query params
 *
 * Permite actualizar query params sin recargar la página
 * y mantener el estado sincronizado con la URL.
 *
 * @returns { params, setParams, clearParams }
 *
 * @example
 * ```tsx
 * const { params, setParams, clearParams } = useQueryParams();
 *
 * // Leer params
 * const search = params.get('q');
 *
 * // Actualizar params
 * setParams({ q: 'metallica', city: 'Buenos Aires' });
 *
 * // Limpiar params
 * clearParams();
 * ```
 */
export function useQueryParams() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  /**
   * Actualizar query params en la URL
   */
  const setParams = useCallback(
    (newParams: Record<string, string | undefined>) => {
      const current = new URLSearchParams(Array.from(searchParams.entries()));

      // Actualizar o eliminar params
      Object.entries(newParams).forEach(([key, value]) => {
        if (value === undefined || value === '') {
          current.delete(key);
        } else {
          current.set(key, value);
        }
      });

      // Construir nueva URL
      const search = current.toString();
      const query = search ? `?${search}` : '';

      // Navegar sin recargar página
      router.push(`${pathname}${query}`, { scroll: false });
    },
    [pathname, router, searchParams]
  );

  /**
   * Limpiar todos los query params
   */
  const clearParams = useCallback(() => {
    router.push(pathname, { scroll: false });
  }, [pathname, router]);

  return {
    params: searchParams,
    setParams,
    clearParams,
  };
}
