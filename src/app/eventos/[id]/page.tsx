import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { createEventService } from '@/shared/infrastructure/factories/service-factory';
import { EventDetail } from '@/features/events/ui/components/EventDetail';
import { stripHTML, truncateText } from '@/shared/utils/sanitize';

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

/**
 * Get event by ID
 *
 * Helper function to fetch event data with proper error handling
 */
async function getEvent(id: string) {
  const eventService = createEventService();

  try {
    const event = await eventService.findById(id);
    return event;
  } catch (error) {
    console.error(`Error fetching event ${id}:`, error);
    return null;
  }
}

/**
 * Generate dynamic metadata for SEO
 *
 * Includes:
 * - Title with event name
 * - Description excerpt from event description
 * - Open Graph image from event
 * - Structured data for search engines
 */
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const event = await getEvent(id);

  if (!event) {
    return {
      title: 'Evento no encontrado - EnVivo',
      description: 'El evento que buscás no existe o fue eliminado.',
    };
  }

  // Create plain text excerpt from description
  const plainDescription = stripHTML(event.description);
  const excerpt = truncateText(plainDescription, 160);

  // Format date for structured data
  const dateString = new Date(event.date).toISOString();

  return {
    title: `${event.title} - EnVivo`,
    description: excerpt || `${event.title} en ${event.venueName || event.city}`,
    openGraph: {
      title: event.title,
      description: excerpt || `${event.title} en ${event.venueName || event.city}`,
      images: event.imageUrl ? [{ url: event.imageUrl, alt: event.title }] : [],
      type: 'website',
      siteName: 'EnVivo',
    },
    twitter: {
      card: 'summary_large_image',
      title: event.title,
      description: excerpt || `${event.title} en ${event.venueName || event.city}`,
      images: event.imageUrl ? [event.imageUrl] : [],
    },
    other: {
      // Structured data hints for search engines
      'event:date': dateString,
      'event:location': `${event.venueName || ''} - ${event.city}, ${event.country}`,
      'event:category': event.category,
    },
  };
}

/**
 * Event Detail Page - Server Component
 *
 * Fetches event data from database and renders EventDetail component
 *
 * Features:
 * - Dynamic route with event ID
 * - 404 handling for non-existent events
 * - SEO optimization with generateMetadata
 * - Server-side data fetching for fast initial load
 *
 * @route /eventos/[id]
 */
export default async function EventDetailPage({ params }: PageProps) {
  const { id } = await params;
  const event = await getEvent(id);

  if (!event) {
    notFound();
  }

  return <EventDetail event={event} />;
}

/**
 * Enable static generation for existing events
 *
 * Note: This will be disabled in MVP (dynamic rendering only)
 * Can be enabled in production for better performance
 */
export const dynamic = 'force-dynamic';
