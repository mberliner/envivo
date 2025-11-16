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
    const [, dayStr, monthStr, yearStr] = numericFormatMatch;
    const day = parseInt(dayStr);
    const month = parseInt(monthStr);
    const year = parseInt(yearStr);

    // Validar rangos antes de crear el Date
    if (day < 1 || day > 31 || month < 1 || month > 12 || year < 1900 || year > 2100) {
      return undefined;
    }

    const date = new Date(year, month - 1, day);
    // Validar que la fecha sea válida (por ej. 31/02 no es válida)
    if (isNaN(date.getTime())) {
      return undefined;
    }
    return date;
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

  // Extraer todos los dígitos con separadores
  const digitsMatch = normalized.match(/\d[\d.,]*/);
  if (digitsMatch) {
    const numberString = digitsMatch[0];

    // Detectar formato: ¿punto decimal o separador de miles?
    // Si hay UN SOLO punto seguido de 1-2 dígitos al final, es formato decimal (ej: "22400.0", "22400.50")
    // Si hay múltiples puntos o punto con más de 2 decimales, es formato argentino (ej: "1.500", "10.500")
    const decimalFormatMatch = numberString.match(/^\d+\.\d{1,2}$/);

    let cleanNumber: string;
    if (decimalFormatMatch) {
      // Formato decimal inglés/JSON: "22400.0" o "22400.50"
      cleanNumber = numberString; // Mantener el punto como decimal
    } else {
      // Formato argentino: remover puntos (separadores de miles) y convertir comas a puntos (decimales)
      cleanNumber = numberString.replace(/\./g, '').replace(/,/g, '.');
    }

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
    .replace(/\n\s*\n+/g, '\n') // Múltiples saltos de línea → 1 salto (hacer esto primero)
    .replace(/[^\S\n]+/g, ' '); // Múltiples espacios (no newlines) → 1 espacio
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
 * Parse fechas de LivePass (formato "09 NOV" sin año)
 *
 * LivePass usa formato corto: "09 NOV", "21 DIC"
 * Inferimos el año basándonos en la fecha actual.
 *
 * @param dateString - String con la fecha ("09 NOV", "21 DIC")
 * @returns Date object o undefined si no se puede parsear
 */
export function parseLivepassDate(dateString: string): Date | undefined {
  if (!dateString || typeof dateString !== 'string') {
    return undefined;
  }

  const normalized = dateString.toLowerCase().trim();

  // Formato: "09 NOV" o "21 DIC"
  const match = normalized.match(/(\d{1,2})\s+([a-z]+)/);
  if (!match) {
    return undefined;
  }

  const [, dayStr, monthName] = match;
  const day = parseInt(dayStr);
  const month = SPANISH_MONTHS[monthName];

  if (month === undefined || isNaN(day) || day < 1 || day > 31) {
    return undefined;
  }

  // Inferir el año: usar año actual, pero si el mes ya pasó, usar año siguiente
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  // Si el mes del evento es anterior al mes actual, probablemente es del año siguiente
  let year = currentYear;
  if (month < currentMonth) {
    year = currentYear + 1;
  } else if (month === currentMonth && day < now.getDate()) {
    // Si es el mismo mes pero el día ya pasó, también usar año siguiente
    year = currentYear + 1;
  }

  const date = new Date(year, month, day);

  // Validar que la fecha sea válida
  if (isNaN(date.getTime())) {
    return undefined;
  }

  return date;
}

/**
 * Limpia títulos de LivePass removiendo el venue del final
 *
 * LivePass incluye el venue en el título: "Santiago Molina en Café Berlín"
 * Necesitamos extraer solo el nombre del artista/evento.
 *
 * @param title - Título completo con venue
 * @returns Título limpio sin venue
 */
export function cleanLivepassTitle(title: string): string {
  if (!title || typeof title !== 'string') {
    return '';
  }

  // Remover " en Café Berlín" (con o sin acento)
  const cleaned = title
    .replace(/\s+en\s+Caf[eé]\s+Berl[ií]n\s*$/i, '')
    .trim();

  return cleaned || title; // Si el resultado está vacío, devolver título original
}

/**
 * Parse fechas de LivePass con hora incluida
 *
 * Soporta múltiples formatos comunes en páginas de eventos:
 * - "Sábado 9 de Noviembre - 21:00 hs"
 * - "9 de noviembre de 2025 a las 21:00"
 * - "09/11/2025 21:00"
 * - "09/11/2025 - 21:00hs"
 * - "2025-11-09T21:00:00" (ISO)
 *
 * @param dateTimeString - String con fecha y hora
 * @returns Date object o undefined si no se puede parsear
 */
export function parseLivepassDateTime(dateTimeString: string): Date | undefined {
  if (!dateTimeString || typeof dateTimeString !== 'string') {
    return undefined;
  }

  const normalized = dateTimeString.toLowerCase().trim();

  // Formato ISO (más común en atributos datetime)
  // "2025-11-09T21:00:00" o "2025-11-09 21:00"
  if (normalized.match(/\d{4}-\d{2}-\d{2}/)) {
    const date = new Date(dateTimeString);
    if (!isNaN(date.getTime())) {
      return date;
    }
  }

  // Formato: "9 de noviembre de 2025 a las 21:00"
  const fullSpanishMatch = normalized.match(
    /(\d{1,2})\s+de\s+([a-z]+)\s+de\s+(\d{4})\s+(?:a las|-)?\s*(\d{1,2}):(\d{2})/
  );
  if (fullSpanishMatch) {
    const [, dayStr, monthName, yearStr, hourStr, minuteStr] = fullSpanishMatch;
    const day = parseInt(dayStr);
    const month = SPANISH_MONTHS[monthName];
    const year = parseInt(yearStr);
    const hour = parseInt(hourStr);
    const minute = parseInt(minuteStr);

    if (month !== undefined && !isNaN(day) && !isNaN(year) && !isNaN(hour) && !isNaN(minute)) {
      const date = new Date(year, month, day, hour, minute);
      if (!isNaN(date.getTime())) {
        return date;
      }
    }
  }

  // Formato: "Martes 11 NOV - 20:45 hrs" (abreviado, sin "de", sin año)
  // Común en meta descriptions de LivePass
  const abbreviatedMatch = normalized.match(
    /(?:\w+\s+)?(\d{1,2})\s+([a-z]+)\s*-\s*(\d{1,2}):(\d{2})/
  );
  if (abbreviatedMatch) {
    const [, dayStr, monthName, hourStr, minuteStr] = abbreviatedMatch;
    const day = parseInt(dayStr);
    const month = SPANISH_MONTHS[monthName];
    const hour = parseInt(hourStr);
    const minute = parseInt(minuteStr);

    if (month !== undefined && !isNaN(day) && !isNaN(hour) && !isNaN(minute)) {
      // Inferir año (igual que parseLivepassDate)
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth();

      let year = currentYear;
      if (month < currentMonth || (month === currentMonth && day < now.getDate())) {
        year = currentYear + 1;
      }

      // Validar rangos antes de crear el Date
      if (
        day >= 1 && day <= 31 &&
        hour >= 0 && hour <= 23 &&
        minute >= 0 && minute <= 59
      ) {
        const date = new Date(year, month, day, hour, minute);
        if (!isNaN(date.getTime())) {
          return date;
        }
      }
    }
  }

  // Formato: "Sábado 9 de Noviembre - 21:00" (con "de", sin año)
  const shortSpanishMatch = normalized.match(
    /(?:\w+\s+)?(\d{1,2})\s+de\s+([a-z]+)\s*-?\s*(\d{1,2}):(\d{2})/
  );
  if (shortSpanishMatch) {
    const [, dayStr, monthName, hourStr, minuteStr] = shortSpanishMatch;
    const day = parseInt(dayStr);
    const month = SPANISH_MONTHS[monthName];
    const hour = parseInt(hourStr);
    const minute = parseInt(minuteStr);

    if (month !== undefined && !isNaN(day) && !isNaN(hour) && !isNaN(minute)) {
      // Inferir año (igual que parseLivepassDate)
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth();

      let year = currentYear;
      if (month < currentMonth || (month === currentMonth && day < now.getDate())) {
        year = currentYear + 1;
      }

      // Validar rangos antes de crear el Date
      if (
        day >= 1 && day <= 31 &&
        hour >= 0 && hour <= 23 &&
        minute >= 0 && minute <= 59
      ) {
        const date = new Date(year, month, day, hour, minute);
        if (!isNaN(date.getTime())) {
          return date;
        }
      }
    }
  }

  // Formato: "09/11/2025 21:00" o "09/11/2025 - 21:00hs"
  const numericMatch = normalized.match(
    /(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})\s*-?\s*(\d{1,2}):(\d{2})/
  );
  if (numericMatch) {
    const [, dayStr, monthStr, yearStr, hourStr, minuteStr] = numericMatch;
    const day = parseInt(dayStr);
    const month = parseInt(monthStr);
    const year = parseInt(yearStr);
    const hour = parseInt(hourStr);
    const minute = parseInt(minuteStr);

    // Validar rangos antes de crear el Date
    if (
      day >= 1 && day <= 31 &&
      month >= 1 && month <= 12 &&
      year >= 1900 && year <= 2100 &&
      hour >= 0 && hour <= 23 &&
      minute >= 0 && minute <= 59
    ) {
      const date = new Date(year, month - 1, day, hour, minute);
      // Validar que la fecha sea válida (por ej. 31/02 no es válida)
      if (!isNaN(date.getTime())) {
        return date;
      }
    }
  }

  // Fallback: intentar parseSpanishDate (sin hora) si no hay hora en el string
  const dateOnly = parseSpanishDate(dateTimeString);
  if (dateOnly) {
    return dateOnly;
  }

  // Último intento: Date.parse
  const parsed = Date.parse(dateTimeString);
  if (!isNaN(parsed)) {
    return new Date(parsed);
  }

  return undefined;
}

/**
 * Extrae el nombre del venue de texto con formato "Recinto: Nombre del Venue"
 *
 * LivePass usa el formato "Recinto: Café Berlín" en sus páginas.
 * Esta función extrae solo el nombre del venue.
 *
 * @param text - Texto que contiene el venue (ej: "Recinto: Café Berlín")
 * @returns Nombre del venue sin prefijo
 *
 * @example
 * extractLivepassVenue("Recinto: Café Berlín")
 * // => "Café Berlín"
 *
 * extractLivepassVenue("Recinto:Café Berlín")
 * // => "Café Berlín"
 */
export function extractLivepassVenue(text: string): string | undefined {
  if (!text || typeof text !== 'string') {
    return undefined;
  }

  // Buscar patrón "Recinto:" seguido del nombre
  const match = text.match(/recinto:\s*(.+)/i);
  if (match && match[1]) {
    return match[1].trim();
  }

  // Si no coincide, devolver el texto original limpio
  return text.trim();
}

/**
 * Parse fechas de Teatro Coliseo
 *
 * Teatro Coliseo usa formatos específicos en sus páginas:
 * - Título: "ARTISTA <br> Viernes 19 de diciembre 20.30h <br> 2025"
 * - Detalle: "Viernes 19 de diciembre 20.30h 2025"
 * - También: "19 de diciembre de 2025"
 *
 * Soporta múltiples variaciones con/sin día de semana, con/sin hora.
 *
 * @param dateString - String con la fecha
 * @returns Date object o undefined si no se puede parsear
 *
 * @example
 * parseTeatroColiseoDate("Viernes 19 de diciembre 20.30h 2025")
 * // => Date(2025, 11, 19, 20, 30)
 *
 * parseTeatroColiseoDate("19 de diciembre de 2025")
 * // => Date(2025, 11, 19)
 */
export function parseTeatroColiseoDate(dateString: string): Date | undefined {
  if (!dateString || typeof dateString !== 'string') {
    return undefined;
  }

  // DEBUG: Log raw input
  console.log(`[parseTeatroColiseoDate] RAW INPUT: "${dateString.substring(0, 200)}"`);

  const normalized = dateString.toLowerCase().trim();

  // Validar rango de años razonable (común a todos los formatos)
  const currentYear = new Date().getFullYear();
  const minYear = currentYear - 1; // Permitir eventos del año pasado
  const maxYear = currentYear + 2; // Hasta 2 años en el futuro

  // Formato 1: "Viernes 19 de diciembre 20.30h 2025"
  // Con día de la semana, hora con punto, y año al final
  const fullFormatMatch = normalized.match(
    /(?:\w+\s+)?(\d{1,2})\s+de\s+([a-z]+)\s+(\d{1,2})[.:](\d{2})\s*h?\s+(\d{4})/
  );
  if (fullFormatMatch) {
    const [, dayStr, monthName, hourStr, minuteStr, yearStr] = fullFormatMatch;
    const day = parseInt(dayStr);
    const month = SPANISH_MONTHS[monthName];
    const hour = parseInt(hourStr);
    const minute = parseInt(minuteStr);
    const year = parseInt(yearStr);

    if (
      month !== undefined &&
      !isNaN(day) &&
      !isNaN(hour) &&
      !isNaN(minute) &&
      !isNaN(year) &&
      day >= 1 && day <= 31 &&
      hour >= 0 && hour <= 23 &&
      minute >= 0 && minute <= 59 &&
      year >= minYear && year <= maxYear // Validación de rango
    ) {
      const date = new Date(year, month, day, hour, minute);
      if (!isNaN(date.getTime())) {
        console.log(`[parseTeatroColiseoDate] MATCHED FORMAT 1: ${date.toISOString()}`);
        return date;
      }
    } else if (year < minYear || year > maxYear) {
      console.log(`[parseTeatroColiseoDate] REJECTED FORMAT 1: year ${year} out of range (${minYear}-${maxYear})`);
    }
  }

  // Formato 2: "6 de mayo 20h 2026" o "12 de diciembre 21h2025" (hora sin minutos, con/sin espacio antes del año)
  const hourOnlyMatch = normalized.match(
    /(?:\w+\s+)?(\d{1,2})\s+de\s+([a-z]+)\s+(\d{1,2})\s*h\s*(\d{4})/
  );
  if (hourOnlyMatch) {
    const [, dayStr, monthName, hourStr, yearStr] = hourOnlyMatch;
    const day = parseInt(dayStr);
    const month = SPANISH_MONTHS[monthName];
    const hour = parseInt(hourStr);
    const year = parseInt(yearStr);

    if (
      month !== undefined &&
      !isNaN(day) &&
      !isNaN(hour) &&
      !isNaN(year) &&
      day >= 1 && day <= 31 &&
      hour >= 0 && hour <= 23 &&
      year >= minYear && year <= maxYear // Validación de rango
    ) {
      const date = new Date(year, month, day, hour, 0);
      if (!isNaN(date.getTime())) {
        console.log(`[parseTeatroColiseoDate] MATCHED FORMAT 2: ${date.toISOString()}`);
        return date;
      }
    } else if (year < minYear || year > maxYear) {
      console.log(`[parseTeatroColiseoDate] REJECTED FORMAT 2: year ${year} out of range (${minYear}-${maxYear})`);
    }
  }

  // Formato 3: "Viernes 19 de diciembre 2025" (sin hora)
  const dateOnlyMatch = normalized.match(
    /(?:\w+\s+)?(\d{1,2})\s+de\s+([a-z]+)\s+(?:de\s+)?(\d{4})/
  );
  if (dateOnlyMatch) {
    const [, dayStr, monthName, yearStr] = dateOnlyMatch;
    const day = parseInt(dayStr);
    const month = SPANISH_MONTHS[monthName];
    const year = parseInt(yearStr);

    if (
      month !== undefined &&
      !isNaN(day) &&
      !isNaN(year) &&
      day >= 1 && day <= 31 &&
      year >= minYear && year <= maxYear // Validación de rango
    ) {
      const date = new Date(year, month, day);
      if (!isNaN(date.getTime())) {
        console.log(`[parseTeatroColiseoDate] MATCHED FORMAT 3: ${date.toISOString()}`);
        return date;
      }
    } else if (year < minYear || year > maxYear) {
      console.log(`[parseTeatroColiseoDate] REJECTED FORMAT 3: year ${year} out of range (${minYear}-${maxYear})`);
    }
  }

  // Formato 4: "NOVIEMBRE 2025" o "OCTUBRE-NOVIEMBRE 2025" (solo mes y año, sin día)
  // Asume el primer día del último mes mencionado
  const monthOnlyMatch = normalized.match(
    /(?:^|\s)([a-z]+)(?:-[a-z]+)?\s+(\d{4})(?:\s|$)/
  );
  if (monthOnlyMatch) {
    const [, monthName, yearStr] = monthOnlyMatch;
    const month = SPANISH_MONTHS[monthName];
    const year = parseInt(yearStr);

    if (
      month !== undefined &&
      !isNaN(year) &&
      year >= minYear && year <= maxYear
    ) {
      const date = new Date(year, month, 1); // Día 1 del mes
      if (!isNaN(date.getTime())) {
        console.log(`[parseTeatroColiseoDate] MATCHED FORMAT 4 (month-only): ${date.toISOString()} (assuming day 1)`);
        return date;
      }
    } else if (year < minYear || year > maxYear) {
      console.log(`[parseTeatroColiseoDate] REJECTED FORMAT 4: year ${year} out of range (${minYear}-${maxYear})`);
    }
  }

  // Formato 5: Fechas SIN año (inferir año automáticamente)
  // - "Viernes 31 de octubre 20.30h" (con hora y minutos)
  // - "Sábado 1 de noviembre 20.30h" (con hora y minutos)
  // Inferir año: si el mes ya pasó o el día ya pasó en el mes actual, usar año siguiente
  const noYearWithTimeMatch = normalized.match(
    /(?:\w+\s+)?(\d{1,2})\s+de\s+([a-z]+)\s+(\d{1,2})[.:](\d{2})\s*h?\s*$/
  );
  if (noYearWithTimeMatch) {
    const [, dayStr, monthName, hourStr, minuteStr] = noYearWithTimeMatch;
    const day = parseInt(dayStr);
    const month = SPANISH_MONTHS[monthName];
    const hour = parseInt(hourStr);
    const minute = parseInt(minuteStr);

    if (
      month !== undefined &&
      !isNaN(day) &&
      !isNaN(hour) &&
      !isNaN(minute) &&
      day >= 1 && day <= 31 &&
      hour >= 0 && hour <= 23 &&
      minute >= 0 && minute <= 59
    ) {
      // Inferir año basado en si el mes/día ya pasó
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentDay = now.getDate();

      let year = currentYear;
      if (month < currentMonth || (month === currentMonth && day < currentDay)) {
        year = currentYear + 1;
      }

      const date = new Date(year, month, day, hour, minute);
      if (!isNaN(date.getTime())) {
        console.log(`[parseTeatroColiseoDate] MATCHED FORMAT 5 (no year, inferred ${year}): ${date.toISOString()}`);
        return date;
      }
    }
  }

  // Fallback: intentar con parseSpanishDate genérico
  console.log(`[parseTeatroColiseoDate] NO MATCH, trying parseSpanishDate...`);
  const fallback = parseSpanishDate(dateString);
  if (fallback) {
    // Validar que el año del fallback también esté en rango razonable
    const fallbackYear = fallback.getFullYear();
    if (fallbackYear >= minYear && fallbackYear <= maxYear) {
      console.log(`[parseTeatroColiseoDate] FALLBACK SUCCESS: ${fallback.toISOString()}`);
      return fallback;
    } else {
      console.log(`[parseTeatroColiseoDate] FALLBACK REJECTED: year ${fallbackYear} out of range (${minYear}-${maxYear})`);
      return undefined;
    }
  } else {
    console.log(`[parseTeatroColiseoDate] FALLBACK FAILED: returning undefined`);
    return undefined;
  }
}

/**
 * Extrae URL de CSS background-image
 *
 * Movistar Arena usa inline styles: background-image: url('...')
 * Esta función extrae la URL del estilo.
 *
 * @param styleValue - Valor del atributo style
 * @returns URL de la imagen o undefined
 *
 * @example
 * extractBackgroundImage("background-image: url('https://example.com/image.jpg')")
 * // => "https://example.com/image.jpg"
 */
export function extractBackgroundImage(styleValue: string): string | undefined {
  if (!styleValue || typeof styleValue !== 'string') {
    return undefined;
  }

  // Buscar patrón: url('...') o url("...")
  const match = styleValue.match(/url\(['"]?([^'"()]+)['"]?\)/);
  if (match && match[1]) {
    return match[1].trim();
  }

  return undefined;
}

/**
 * Limpia fechas de Movistar Arena removiendo información de fechas múltiples
 *
 * Movistar Arena incluye texto extra: "20 noviembre 2025 y 2 fechas más"
 * Esta función extrae solo la primera fecha para poder parsearla.
 *
 * @param dateString - String con la fecha
 * @returns String limpio con solo la primera fecha
 *
 * @example
 * cleanMovistarDate("20 noviembre 2025 y 2 fechas más")
 * // => "20 noviembre 2025"
 *
 * cleanMovistarDate("15 noviembre 2025")
 * // => "15 noviembre 2025"
 */
export function cleanMovistarDate(dateString: string): string {
  if (!dateString || typeof dateString !== 'string') {
    return '';
  }

  // Remover " y X fecha(s) más" o " y X fechas mas" (con/sin tilde)
  const cleaned = dateString.replace(/\s+y\s+\d+\s+fechas?\s+m[áa]s\s*$/i, '').trim();

  return cleaned || dateString; // Si el resultado está vacío, devolver original
}

/**
 * Parsea fechas de Movistar Arena (wrapper sobre parseSpanishDate con limpieza)
 *
 * @param dateString - String con la fecha
 * @returns Date object o undefined si no se puede parsear
 */
export function parseMovistarDate(dateString: string): Date | undefined {
  const cleaned = cleanMovistarDate(dateString);
  return parseSpanishDate(cleaned);
}

/**
 * Extrae la hora del show de Movistar Arena
 *
 * Ejemplos:
 * extractMovistarTime("21:00 hs Show") → "21:00"
 * extractMovistarTime("19:00 hs\n                    Puertas") → "19:00"
 *
 * @param timeString - String con la hora del evento
 * @returns String con la hora en formato HH:MM o undefined si no se encuentra
 */
export function extractMovistarTime(timeString: string): string | undefined {
  if (!timeString) return undefined;

  // Buscar patrón HH:MM en el texto
  const match = timeString.match(/\b(\d{1,2}):(\d{2})\b/);
  if (!match) return undefined;

  return match[0]; // Retorna "21:00"
}

/**
 * Extrae el precio de Movistar Arena del texto de la página
 *
 * Ejemplos:
 * extractMovistarPrice("desde $ 60.000") → 60000
 * extractMovistarPrice("$ 15.500") → 15500
 * extractMovistarPrice("$ 45.000,50") → 45000.50
 *
 * IMPORTANTE: Evita capturar números de fecha que aparecen después del precio
 * (ej: "$ 60.000 16 noviembre" no debe capturar "16" como parte del precio)
 *
 * @param bodyText - Texto completo de la página
 * @returns Número con el precio o undefined si no se encuentra
 */
export function extractMovistarPrice(bodyText: string): number | undefined {
  if (!bodyText) return undefined;

  // Buscar patrón "desde $ XXXXX" o "$ XXXXX"
  // Formato argentino: $ 60.000 o $ 60.000,50 (punto = separador miles, coma = decimal)
  // Usa negative lookahead (?![.,\d]) para evitar backtracking y captura parcial
  // Ejemplo: "$ 60.00010" captura "60.000" completo (no permite . , o dígitos después)
  const match = bodyText.match(/\$\s*([\d]{1,3}(?:[.,]\d{3})*(?:,\d{1,2})?)(?![.,\d])/);
  if (!match) return undefined;

  let priceStr = match[1];

  // Detectar si tiene coma decimal (formato argentino: $ 60.000,50)
  if (priceStr.includes(',')) {
    // Remover puntos (separadores de miles) y reemplazar coma por punto (decimal)
    priceStr = priceStr.replace(/\./g, '').replace(',', '.');
  } else {
    // Solo tiene puntos, son separadores de miles → removerlos
    priceStr = priceStr.replace(/\./g, '');
  }

  const price = parseFloat(priceStr);
  return isNaN(price) ? undefined : price;
}

/**
 * Extrae y limpia la descripción de eventos de Movistar Arena
 *
 * Filtra párrafos que contienen información de transporte/estacionamiento
 * y sanitiza el HTML resultante.
 *
 * @param rawDescription - Texto completo de la descripción (puede contener múltiples párrafos)
 * @returns Descripción limpia y sanitizada
 */
export function extractMovistarDescription(rawDescription: string): string {
  if (!rawDescription) return '';

  // Filtros para eliminar párrafos no relacionados con la descripción del evento
  const excludePatterns = [
    /colectivos?\s+\d+/i, // "Colectivos 34, 42, 55..."
    /estacionamiento/i, // Información de estacionamiento
    /registres de nuevo/i, // Mensajes de registro
    /reservá tu estacionamiento/i, // Call-to-action de estacionamiento
    /encontrá estacionamiento/i, // Títulos de sección de estacionamiento
  ];

  // Dividir en párrafos (separados por múltiples espacios/saltos de línea)
  const paragraphs = rawDescription
    .split(/\n\n+/)
    .map(p => p.trim())
    .filter(p => p.length > 0);

  // Filtrar párrafos no deseados
  const filteredParagraphs = paragraphs.filter(paragraph => {
    return !excludePatterns.some(pattern => pattern.test(paragraph));
  });

  // Unir párrafos con doble salto de línea
  const cleanedDescription = filteredParagraphs.join('\n\n');

  // Sanitizar HTML para seguridad
  return sanitizeHtml(cleanedDescription);
}

/**
 * Mapeo de nombres de transformaciones a funciones
 *
 * Usado por GenericWebScraper para aplicar transformaciones por nombre.
 */
export const TRANSFORM_FUNCTIONS: Record<string, (value: string, baseUrl?: string) => unknown> = {
  parseSpanishDate: (value: string) => parseSpanishDate(value),
  extractPrice: (value: string) => extractPrice(value),
  sanitizeHtml: (value: string) => sanitizeHtml(value),
  cleanWhitespace: (value: string) => cleanWhitespace(value),
  toAbsoluteUrl: (value: string, baseUrl?: string) => toAbsoluteUrl(value, baseUrl || ''),
  parseLivepassDate: (value: string) => parseLivepassDate(value),
  parseLivepassDateTime: (value: string) => parseLivepassDateTime(value),
  cleanLivepassTitle: (value: string) => cleanLivepassTitle(value),
  extractLivepassVenue: (value: string) => extractLivepassVenue(value),
  parseTeatroColiseoDate: (value: string) => parseTeatroColiseoDate(value),
  extractBackgroundImage: (value: string) => extractBackgroundImage(value),
  cleanMovistarDate: (value: string) => cleanMovistarDate(value),
  parseMovistarDate: (value: string) => parseMovistarDate(value),
  extractMovistarTime: (value: string) => extractMovistarTime(value),
  extractMovistarPrice: (value: string) => extractMovistarPrice(value),
  extractMovistarDescription: (value: string) => extractMovistarDescription(value),
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
): unknown {
  const transformFn = TRANSFORM_FUNCTIONS[transformName];

  if (!transformFn) {
    throw new Error(`Unknown transform function: ${transformName}`);
  }

  return transformFn(value, baseUrl);
}
