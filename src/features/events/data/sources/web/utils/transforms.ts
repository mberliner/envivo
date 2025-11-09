/**
 * Transformation utilities for web scraping
 *
 * Funciones para transformar datos scrapeados en formatos válidos.
 */

import DOMPurify from 'isomorphic-dompurify';

/**
 * Mapa de meses en español a números
 */
const SPANISH_MONTHS: Record<string, number> = {
  enero: 0,
  febrero: 1,
  marzo: 2,
  abril: 3,
  mayo: 4,
  junio: 5,
  julio: 6,
  agosto: 7,
  septiembre: 8,
  octubre: 9,
  noviembre: 10,
  diciembre: 11,
  ene: 0,
  feb: 1,
  mar: 2,
  abr: 3,
  may: 4,
  jun: 5,
  jul: 6,
  ago: 7,
  sep: 8,
  oct: 9,
  nov: 10,
  dic: 11,
};

/**
 * Parse fechas en español
 *
 * Soporta formatos:
 * - "15 de marzo de 2025"
 * - "Sábado 15/03/2025"
 * - "15-03-2025 20:00"
 * - "2025-03-15"
 *
 * @param dateString - String con la fecha
 * @returns Date object o undefined si no se puede parsear
 */
export function parseSpanishDate(dateString: string): Date | undefined {
  if (!dateString || typeof dateString !== 'string') {
    return undefined;
  }

  const normalized = dateString.toLowerCase().trim();

  // Formato: "15 de marzo de 2025" o "15 mar 2025"
  const spanishFormatMatch = normalized.match(
    /(\d{1,2})\s+(?:de\s+)?([a-z]+)\s+(?:de\s+)?(\d{4})/
  );
  if (spanishFormatMatch) {
    const [, day, monthName, year] = spanishFormatMatch;
    const month = SPANISH_MONTHS[monthName];
    if (month !== undefined) {
      return new Date(parseInt(year), month, parseInt(day));
    }
  }

  // Formato: "15/03/2025" o "15-03-2025"
  const numericFormatMatch = normalized.match(/(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})/);
  if (numericFormatMatch) {
    const [, day, month, year] = numericFormatMatch;
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  }

  // Formato ISO: "2025-03-15T20:00:00"
  const isoFormatMatch = normalized.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (isoFormatMatch) {
    const date = new Date(dateString);
    if (!isNaN(date.getTime())) {
      return date;
    }
  }

  // Intentar con Date.parse como fallback
  const parsed = Date.parse(dateString);
  if (!isNaN(parsed)) {
    return new Date(parsed);
  }

  return undefined;
}

/**
 * Extrae precio numérico de strings
 *
 * Soporta formatos:
 * - "$1.500"
 * - "ARS 1500"
 * - "1500 pesos"
 * - "Desde $1.500"
 * - "Gratis" → 0
 *
 * @param priceString - String con el precio
 * @returns Precio numérico o undefined
 */
export function extractPrice(priceString: string): number | undefined {
  if (!priceString || typeof priceString !== 'string') {
    return undefined;
  }

  const normalized = priceString.toLowerCase().trim();

  // Casos especiales
  if (normalized.includes('gratis') || normalized.includes('free')) {
    return 0;
  }

  // Extraer todos los dígitos (ignora separadores de miles)
  const digitsMatch = normalized.match(/\d[\d.,]*/);
  if (digitsMatch) {
    // Remover puntos (separadores de miles) y convertir comas a puntos (decimales)
    const cleanNumber = digitsMatch[0].replace(/\./g, '').replace(/,/g, '.');
    const price = parseFloat(cleanNumber);

    if (!isNaN(price) && price >= 0) {
      return Math.round(price); // Redondear a entero
    }
  }

  return undefined;
}

/**
 * Sanitiza HTML extraído
 *
 * Remueve tags peligrosos pero preserva estructura básica (p, br, strong, em).
 *
 * @param html - String HTML a sanitizar
 * @returns HTML limpio
 */
export function sanitizeHtml(html: string): string {
  if (!html || typeof html !== 'string') {
    return '';
  }

  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'b', 'i', 'u', 'a'],
    ALLOWED_ATTR: ['href', 'target'],
  });
}

/**
 * Limpia whitespace excesivo
 *
 * @param text - Texto a limpiar
 * @returns Texto limpio
 */
export function cleanWhitespace(text: string): string {
  if (!text || typeof text !== 'string') {
    return '';
  }

  return text
    .trim()
    .replace(/\s+/g, ' ') // Múltiples espacios → 1 espacio
    .replace(/\n\s*\n/g, '\n'); // Múltiples saltos de línea → 1 salto
}

/**
 * Extrae URL absoluta de una relativa
 *
 * @param relativeUrl - URL relativa o absoluta
 * @param baseUrl - URL base del sitio
 * @returns URL absoluta
 */
export function toAbsoluteUrl(relativeUrl: string, baseUrl: string): string {
  if (!relativeUrl) {
    return '';
  }

  // Ya es absoluta
  if (relativeUrl.startsWith('http://') || relativeUrl.startsWith('https://')) {
    return relativeUrl;
  }

  // Relativa
  const base = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  const path = relativeUrl.startsWith('/') ? relativeUrl : `/${relativeUrl}`;

  return `${base}${path}`;
}

/**
 * Mapeo de nombres de transformaciones a funciones
 *
 * Usado por GenericWebScraper para aplicar transformaciones por nombre.
 */
export const TRANSFORM_FUNCTIONS: Record<string, (value: string, baseUrl?: string) => any> = {
  parseSpanishDate: (value: string) => parseSpanishDate(value),
  extractPrice: (value: string) => extractPrice(value),
  sanitizeHtml: (value: string) => sanitizeHtml(value),
  cleanWhitespace: (value: string) => cleanWhitespace(value),
  toAbsoluteUrl: (value: string, baseUrl?: string) => toAbsoluteUrl(value, baseUrl || ''),
};

/**
 * Aplica transformación por nombre
 *
 * @param transformName - Nombre de la transformación
 * @param value - Valor a transformar
 * @param baseUrl - URL base (opcional, para toAbsoluteUrl)
 * @returns Valor transformado
 */
export function applyTransform(
  transformName: string,
  value: string,
  baseUrl?: string
): any {
  const transformFn = TRANSFORM_FUNCTIONS[transformName];

  if (!transformFn) {
    throw new Error(`Unknown transform function: ${transformName}`);
  }

  return transformFn(value, baseUrl);
}
