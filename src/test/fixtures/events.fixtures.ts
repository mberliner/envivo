/**
 * Fixtures de eventos realistas para desarrollo y testing
 *
 * Eventos basados en artistas reales, venues reales de Argentina,
 * y precios aproximados del mercado argentino.
 */

import { Event } from '@/features/events/domain/entities/Event';

/**
 * Fixtures de eventos - Datos realistas de Argentina
 */
export const mockEvents: Event[] = [
  // Conciertos Internacionales
  {
    id: 'evt-001',
    title: 'Metallica - World Tour 2025',
    description:
      'La legendaria banda de heavy metal regresa a Argentina con su tour mundial, presentando sus grandes éxitos y canciones de su último álbum.',
    date: new Date('2025-03-15T21:00:00'),
    endDate: new Date('2025-03-15T23:30:00'),
    venueName: 'Estadio River Plate',
    city: 'Buenos Aires',
    country: 'AR',
    category: 'Concierto',
    genre: 'Heavy Metal',
    imageUrl: 'https://images.unsplash.com/photo-1524368535928-5b5e00ddc76b?w=800',
    ticketUrl: 'https://allaccess.com.ar/metallica',
    price: 25000,
    priceMax: 45000,
    currency: 'ARS',
    source: 'allaccess',
    externalId: 'aa-metallica-2025',
    createdAt: new Date('2024-11-01'),
    updatedAt: new Date('2024-11-01'),
  },
  {
    id: 'evt-002',
    title: 'Coldplay - Music of the Spheres Tour',
    description:
      'Coldplay vuelve a Argentina con un show espectacular lleno de luces, efectos visuales y todos sus grandes éxitos.',
    date: new Date('2025-04-20T20:00:00'),
    venueName: 'Estadio Monumental',
    city: 'Buenos Aires',
    country: 'AR',
    category: 'Concierto',
    genre: 'Pop Rock',
    imageUrl: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800',
    ticketUrl: 'https://allaccess.com.ar/coldplay',
    price: 30000,
    priceMax: 60000,
    currency: 'ARS',
    source: 'allaccess',
    externalId: 'aa-coldplay-2025',
    createdAt: new Date('2024-11-02'),
    updatedAt: new Date('2024-11-02'),
  },
  {
    id: 'evt-003',
    title: 'Taylor Swift - The Eras Tour',
    description:
      'El evento más esperado del año. Taylor Swift presenta todos sus álbumes en un show de más de 3 horas.',
    date: new Date('2025-05-10T19:00:00'),
    venueName: 'Estadio River Plate',
    city: 'Buenos Aires',
    country: 'AR',
    category: 'Concierto',
    genre: 'Pop',
    imageUrl: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800',
    ticketUrl: 'https://allaccess.com.ar/taylor-swift',
    price: 40000,
    priceMax: 80000,
    currency: 'ARS',
    source: 'allaccess',
    externalId: 'aa-taylorswift-2025',
    createdAt: new Date('2024-11-03'),
    updatedAt: new Date('2024-11-03'),
  },

  // Artistas Nacionales
  {
    id: 'evt-004',
    title: 'Fito Páez - Euforia Tour',
    description:
      'Fito Páez presenta su nuevo disco "Euforia" en un concierto imperdible en el Luna Park.',
    date: new Date('2025-02-14T21:00:00'),
    venueName: 'Luna Park',
    city: 'Buenos Aires',
    country: 'AR',
    category: 'Concierto',
    genre: 'Rock Nacional',
    imageUrl: 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=800',
    ticketUrl: 'https://lunapark.com.ar/fito-paez',
    price: 15000,
    priceMax: 25000,
    currency: 'ARS',
    source: 'eventbrite',
    externalId: 'eb-fitopaez-2025',
    createdAt: new Date('2024-11-04'),
    updatedAt: new Date('2024-11-04'),
  },
  {
    id: 'evt-005',
    title: 'Los Fabulosos Cadillacs - 40 Años',
    description:
      'Celebrando 40 años de trayectoria, Los Fabulosos Cadillacs presentan todos sus clásicos en un show único.',
    date: new Date('2025-03-08T21:00:00'),
    venueName: 'Movistar Arena',
    city: 'Buenos Aires',
    country: 'AR',
    category: 'Concierto',
    genre: 'Ska',
    imageUrl: 'https://images.unsplash.com/photo-1506157786151-b8491531f063?w=800',
    ticketUrl: 'https://movistararena.com.ar/cadillacs',
    price: 18000,
    priceMax: 30000,
    currency: 'ARS',
    source: 'eventbrite',
    externalId: 'eb-cadillacs-40',
    createdAt: new Date('2024-11-05'),
    updatedAt: new Date('2024-11-05'),
  },

  // Eventos en Córdoba
  {
    id: 'evt-006',
    title: 'Iron Maiden - Legacy of the Beast',
    description:
      'La bestia vuelve a Córdoba con su icónico show lleno de pirotecnia y grandes clásicos del heavy metal.',
    date: new Date('2025-04-05T21:00:00'),
    venueName: 'Estadio Mario Alberto Kempes',
    city: 'Córdoba',
    country: 'AR',
    category: 'Concierto',
    genre: 'Heavy Metal',
    imageUrl: 'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=800',
    ticketUrl: 'https://allaccess.com.ar/iron-maiden',
    price: 22000,
    priceMax: 40000,
    currency: 'ARS',
    source: 'allaccess',
    externalId: 'aa-ironmaiden-cba',
    createdAt: new Date('2024-11-06'),
    updatedAt: new Date('2024-11-06'),
  },
  {
    id: 'evt-007',
    title: 'La Vela Puerca - Gira Argentina',
    description: 'La banda uruguaya más querida en Argentina presenta su nuevo disco en Córdoba.',
    date: new Date('2025-02-28T21:00:00'),
    venueName: 'Quality Espacio',
    city: 'Córdoba',
    country: 'AR',
    category: 'Concierto',
    genre: 'Rock',
    imageUrl: 'https://images.unsplash.com/photo-1511735111819-9a3f7709049c?w=800',
    ticketUrl: 'https://eventbrite.com.ar/la-vela-puerca',
    price: 12000,
    priceMax: 18000,
    currency: 'ARS',
    source: 'eventbrite',
    externalId: 'eb-lavelapuerca-cba',
    createdAt: new Date('2024-11-07'),
    updatedAt: new Date('2024-11-07'),
  },

  // Eventos en Rosario
  {
    id: 'evt-008',
    title: 'Divididos - Gira Por Siempre',
    description:
      'Ricardo Mollo y Divididos presentan lo mejor de su repertorio en el Gigante de Arroyito.',
    date: new Date('2025-03-22T21:00:00'),
    venueName: 'Estadio Gigante de Arroyito',
    city: 'Rosario',
    country: 'AR',
    category: 'Concierto',
    genre: 'Rock Nacional',
    imageUrl: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800',
    ticketUrl: 'https://rosario.eventbrite.com/divididos',
    price: 14000,
    priceMax: 22000,
    currency: 'ARS',
    source: 'eventbrite',
    externalId: 'eb-divididos-rosario',
    createdAt: new Date('2024-11-08'),
    updatedAt: new Date('2024-11-08'),
  },

  // Festivales
  {
    id: 'evt-009',
    title: 'Lollapalooza Argentina 2025',
    description:
      'El festival más grande de Argentina regresa con un line-up increíble de artistas nacionales e internacionales.',
    date: new Date('2025-03-28T12:00:00'),
    endDate: new Date('2025-03-30T23:00:00'),
    venueName: 'Hipódromo de San Isidro',
    city: 'Buenos Aires',
    country: 'AR',
    category: 'Festival',
    genre: 'Multi-género',
    imageUrl: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800',
    ticketUrl: 'https://lollapaloozaar.com',
    price: 45000,
    priceMax: 120000,
    currency: 'ARS',
    source: 'allaccess',
    externalId: 'aa-lollapalooza-2025',
    createdAt: new Date('2024-10-15'),
    updatedAt: new Date('2024-10-15'),
  },
  {
    id: 'evt-010',
    title: 'Cosquín Rock 2025',
    description:
      'El festival de rock más tradicional de Argentina con bandas nacionales e internacionales.',
    date: new Date('2025-02-08T14:00:00'),
    endDate: new Date('2025-02-09T23:00:00'),
    venueName: 'Aeródromo Santa María de Punilla',
    city: 'Cosquín',
    country: 'AR',
    category: 'Festival',
    genre: 'Rock',
    imageUrl: 'https://images.unsplash.com/photo-1506157786151-b8491531f063?w=800',
    ticketUrl: 'https://cosquinrock.net',
    price: 35000,
    priceMax: 55000,
    currency: 'ARS',
    source: 'eventbrite',
    externalId: 'eb-cosquinrock-2025',
    createdAt: new Date('2024-10-20'),
    updatedAt: new Date('2024-10-20'),
  },

  // Teatro y Stand-up
  {
    id: 'evt-011',
    title: 'Les Luthiers - Viejos Hazmerreíres',
    description:
      'El legendario grupo de humor vuelve con su espectáculo más exitoso, lleno de música y risas.',
    date: new Date('2025-02-20T20:00:00'),
    venueName: 'Teatro Colón',
    city: 'Buenos Aires',
    country: 'AR',
    category: 'Teatro',
    genre: 'Comedia Musical',
    imageUrl: 'https://images.unsplash.com/photo-1503095396549-807759245b35?w=800',
    ticketUrl: 'https://teatrocolon.org.ar/luthiers',
    price: 12000,
    priceMax: 20000,
    currency: 'ARS',
    source: 'eventbrite',
    externalId: 'eb-lesluthiers-2025',
    createdAt: new Date('2024-11-10'),
    updatedAt: new Date('2024-11-10'),
  },
  {
    id: 'evt-012',
    title: 'Dalia Gutmann - Nada del Otro Mundo',
    description:
      'Stand-up de Dalia Gutmann con su nuevo show lleno de anécdotas y observaciones cotidianas.',
    date: new Date('2025-01-25T21:00:00'),
    venueName: 'Teatro Metropolitan',
    city: 'Buenos Aires',
    country: 'AR',
    category: 'Stand-up',
    genre: 'Comedia',
    imageUrl: 'https://images.unsplash.com/photo-1585699324551-f6c309eedeca?w=800',
    ticketUrl: 'https://metropolitan.com.ar/dalia',
    price: 8000,
    priceMax: 12000,
    currency: 'ARS',
    source: 'eventbrite',
    externalId: 'eb-daliagutmann',
    createdAt: new Date('2024-11-12'),
    updatedAt: new Date('2024-11-12'),
  },

  // Eventos Próximos (para testing de filtros por fecha)
  {
    id: 'evt-013',
    title: 'Babasónicos - Trinchera Tour',
    description: 'Babasónicos presenta su nuevo disco Trinchera en un show íntimo en Niceto Club.',
    date: new Date('2025-12-05T22:00:00'),
    venueName: 'Niceto Club',
    city: 'Buenos Aires',
    country: 'AR',
    category: 'Concierto',
    genre: 'Rock Alternativo',
    imageUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800',
    ticketUrl: 'https://nicetoclub.com/babasonicos',
    price: 10000,
    priceMax: 15000,
    currency: 'ARS',
    source: 'scraper_local',
    externalId: 'niceto-babasonicos',
    createdAt: new Date('2024-11-14'),
    updatedAt: new Date('2024-11-14'),
  },
  {
    id: 'evt-014',
    title: 'Red Hot Chili Peppers - Unlimited Love Tour',
    description:
      'Los californianos regresan a Argentina con su gira mundial presentando su último álbum.',
    date: new Date('2025-11-18T20:00:00'),
    venueName: 'Estadio Vélez Sarsfield',
    city: 'Buenos Aires',
    country: 'AR',
    category: 'Concierto',
    genre: 'Rock Alternativo',
    imageUrl: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800',
    ticketUrl: 'https://allaccess.com.ar/rhcp',
    price: 28000,
    priceMax: 50000,
    currency: 'ARS',
    source: 'allaccess',
    externalId: 'aa-rhcp-2025',
    createdAt: new Date('2024-11-15'),
    updatedAt: new Date('2024-11-15'),
  },
  {
    id: 'evt-015',
    title: 'Charly García - Piano Bar',
    description:
      'Charly García en formato íntimo presentando sus clásicos al piano en el Teatro Gran Rex.',
    date: new Date('2025-12-12T21:00:00'),
    venueName: 'Teatro Gran Rex',
    city: 'Buenos Aires',
    country: 'AR',
    category: 'Concierto',
    genre: 'Rock Nacional',
    imageUrl: 'https://images.unsplash.com/photo-1511735111819-9a3f7709049c?w=800',
    ticketUrl: 'https://teatrogranrex.com/charly',
    price: 20000,
    priceMax: 35000,
    currency: 'ARS',
    source: 'eventbrite',
    externalId: 'eb-charlygarcia-piano',
    createdAt: new Date('2024-11-16'),
    updatedAt: new Date('2024-11-16'),
  },
];

/**
 * Obtener ciudades únicas de los fixtures
 */
export const getUniqueCities = (): string[] => {
  return Array.from(new Set(mockEvents.map((e) => e.city))).sort();
};

/**
 * Obtener categorías únicas de los fixtures
 */
export const getUniqueCategories = (): string[] => {
  return Array.from(new Set(mockEvents.map((e) => e.category))).sort();
};

/**
 * Filtrar eventos por query (búsqueda por texto)
 */
export const filterEventsByQuery = (query: string): Event[] => {
  const lowerQuery = query.toLowerCase();
  return mockEvents.filter(
    (event) =>
      event.title.toLowerCase().includes(lowerQuery) ||
      event.description?.toLowerCase().includes(lowerQuery) ||
      event.venueName?.toLowerCase().includes(lowerQuery) ||
      event.genre?.toLowerCase().includes(lowerQuery)
  );
};

/**
 * Filtrar eventos por ciudad
 */
export const filterEventsByCity = (city: string): Event[] => {
  return mockEvents.filter((event) => event.city === city);
};

/**
 * Filtrar eventos por categoría
 */
export const filterEventsByCategory = (category: string): Event[] => {
  return mockEvents.filter((event) => event.category === category);
};

/**
 * Filtrar eventos por rango de fechas
 */
export const filterEventsByDateRange = (from?: Date, to?: Date): Event[] => {
  return mockEvents.filter((event) => {
    if (from && event.date < from) return false;
    if (to && event.date > to) return false;
    return true;
  });
};
