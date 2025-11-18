// Environment Variables Validation
// Uses Zod for type-safe environment variables

import { z } from 'zod';

const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  DATABASE_URL_E2E: z.preprocess((val) => (val === '' ? undefined : val), z.string().optional()), // BD separada para tests E2E/integración

  // API Keys (para futuras fuentes de datos)
  // TICKETMASTER_API_KEY: z.string().optional(), // Removido - Ticketmaster no opera en Argentina
  LIVEPASS_API_KEY: z.preprocess((val) => (val === '' ? undefined : val), z.string().optional()), // LivePass uses web scraping, API key optional
  EVENTBRITE_API_KEY: z.preprocess((val) => (val === '' ? undefined : val), z.string().optional()), // Optional - for future expansion
  ALLACCESS_API_KEY: z.preprocess((val) => (val === '' ? undefined : val), z.string().optional()), // Optional - for AllAccess Argentina

  // Admin
  ADMIN_API_KEY: z.preprocess(
    (val) => (val === '' ? undefined : val),
    z.string().min(32, 'ADMIN_API_KEY must be at least 32 characters').optional()
  ),

  // Environment
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // Public (exposed to client)
  NEXT_PUBLIC_APP_URL: z.preprocess(
    (val) => (val === '' ? undefined : val),
    z.string().url().optional()
  ),
  NEXT_PUBLIC_APP_NAME: z.string().default('EnVivo'),
  NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: z.preprocess(
    (val) => (val === '' ? undefined : val),
    z.string().optional()
  ),
});

// Parse and validate environment variables
// This will throw an error if validation fails
const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error('❌ Invalid environment variables:', parsedEnv.error.flatten().fieldErrors);
  throw new Error('Invalid environment variables');
}

export const env = parsedEnv.data;
