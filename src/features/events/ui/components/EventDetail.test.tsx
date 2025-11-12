import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { EventDetail } from './EventDetail';
import { Event } from '@/features/events/domain/entities/Event';

// Mock Next.js Link component
vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

describe('EventDetail', () => {
  const mockEvent: Event = {
    id: 'event-1',
    title: 'Concierto de Rock',
    description: '<p>Gran concierto de rock en vivo</p>',
    date: new Date('2025-12-01T20:00:00'),
    city: 'Buenos Aires',
    country: 'Argentina',
    category: 'Concierto',
    genre: 'Rock',
    imageUrl: 'https://example.com/image.jpg',
    ticketUrl: 'https://example.com/tickets',
    price: 5000,
    priceMax: 8000,
    currency: 'ARS',
    venueName: 'Estadio Obras',
    source: 'allaccess',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  describe('Rendering', () => {
    it('should render event title', () => {
      render(<EventDetail event={mockEvent} />);
      expect(screen.getByText('Concierto de Rock')).toBeInTheDocument();
    });

    it('should render event image', () => {
      render(<EventDetail event={mockEvent} />);
      const image = screen.getByAltText('Concierto de Rock');
      expect(image).toBeInTheDocument();
      // Next.js Image component transforms src, so we check it contains the original URL
      expect(image.getAttribute('src')).toContain('example.com');
    });

    it('should render category badge', () => {
      render(<EventDetail event={mockEvent} />);
      expect(screen.getByText('Concierto')).toBeInTheDocument();
    });

    it('should render venue name', () => {
      render(<EventDetail event={mockEvent} />);
      expect(screen.getByText('Estadio Obras')).toBeInTheDocument();
    });

    it('should render location', () => {
      render(<EventDetail event={mockEvent} />);
      expect(screen.getByText(/Buenos Aires, Argentina/i)).toBeInTheDocument();
    });

    it('should render genre', () => {
      render(<EventDetail event={mockEvent} />);
      expect(screen.getByText('Rock')).toBeInTheDocument();
    });

    it('should render price range', () => {
      render(<EventDetail event={mockEvent} />);
      expect(screen.getByText(/5\.000.*8\.000/)).toBeInTheDocument();
    });

    it('should render ticket purchase button', () => {
      render(<EventDetail event={mockEvent} />);
      const button = screen.getByRole('link', { name: /Comprar Entradas/i });
      expect(button).toBeInTheDocument();
      expect(button).toHaveAttribute('href', 'https://example.com/tickets');
      expect(button).toHaveAttribute('target', '_blank');
    });

    it('should render back links', () => {
      render(<EventDetail event={mockEvent} />);
      const links = screen.getAllByText(/Volver a Eventos/i);
      expect(links).toHaveLength(2); // Top and bottom
      links.forEach((link) => {
        expect(link).toHaveAttribute('href', '/');
      });
    });
  });

  describe('Optional fields', () => {
    it('should not render genre section when genre is missing', () => {
      const eventWithoutGenre = { ...mockEvent, genre: undefined };
      render(<EventDetail event={eventWithoutGenre} />);
      expect(screen.queryByText('Género Musical')).not.toBeInTheDocument();
    });

    it('should render "Precio no disponible" when price is missing', () => {
      const eventWithoutPrice = { ...mockEvent, price: undefined };
      render(<EventDetail event={eventWithoutPrice} />);
      expect(screen.getByText('Precio no disponible')).toBeInTheDocument();
    });

    it('should not render ticket button when ticketUrl is missing', () => {
      const eventWithoutTicket = { ...mockEvent, ticketUrl: undefined };
      render(<EventDetail event={eventWithoutTicket} />);
      expect(screen.queryByRole('link', { name: /Comprar Entradas/i })).not.toBeInTheDocument();
    });

    it('should not render ticket button when ticketUrl is unsafe', () => {
      const eventWithUnsafeUrl = { ...mockEvent, ticketUrl: 'javascript:alert(1)' };
      render(<EventDetail event={eventWithUnsafeUrl} />);
      expect(screen.queryByRole('link', { name: /Comprar Entradas/i })).not.toBeInTheDocument();
    });

    it('should render artists section when artists are provided', () => {
      const eventWithArtists = { ...mockEvent, artists: ['Artista 1', 'Artista 2'] };
      render(<EventDetail event={eventWithArtists} />);
      expect(screen.getByText('Artistas')).toBeInTheDocument();
      expect(screen.getByText('Artista 1')).toBeInTheDocument();
      expect(screen.getByText('Artista 2')).toBeInTheDocument();
    });

    it('should not render artists section when artists are empty', () => {
      const eventWithoutArtists = { ...mockEvent, artists: [] };
      render(<EventDetail event={eventWithoutArtists} />);
      expect(screen.queryByText('Artistas')).not.toBeInTheDocument();
    });

    it('should render venue capacity when provided', () => {
      const eventWithCapacity = { ...mockEvent, venueCapacity: 5000 };
      render(<EventDetail event={eventWithCapacity} />);
      // Check for capacity section
      expect(screen.getByText(/Información Adicional/i)).toBeInTheDocument();
      expect(screen.getByText(/Capacidad aproximada/i)).toBeInTheDocument();
    });

    it('should not render capacity section when not provided', () => {
      render(<EventDetail event={mockEvent} />);
      expect(screen.queryByText(/Capacidad aproximada/i)).not.toBeInTheDocument();
    });

    it('should render end date when provided', () => {
      const eventWithEndDate = {
        ...mockEvent,
        endDate: new Date('2025-12-03T23:00:00'),
      };
      render(<EventDetail event={eventWithEndDate} />);
      expect(screen.getByText(/Hasta:/)).toBeInTheDocument();
    });
  });

  describe('Security', () => {
    it('should sanitize HTML description', () => {
      const eventWithScript = {
        ...mockEvent,
        description: '<p>Hello</p><script>alert("xss")</script>',
      };
      render(<EventDetail event={eventWithScript} />);
      const container = screen.getByText('Descripción').parentElement;
      expect(container?.innerHTML).not.toContain('<script>');
      expect(container?.innerHTML).toContain('Hello');
    });

    it('should not render description section when description is empty', () => {
      const eventWithoutDescription = { ...mockEvent, description: '' };
      render(<EventDetail event={eventWithoutDescription} />);
      expect(screen.queryByText('Descripción')).not.toBeInTheDocument();
    });

    it('should handle null description', () => {
      const eventWithNullDescription = { ...mockEvent, description: undefined };
      render(<EventDetail event={eventWithNullDescription} />);
      expect(screen.queryByText('Descripción')).not.toBeInTheDocument();
    });
  });

  describe('Price formatting', () => {
    it('should display "Gratis" for free events', () => {
      const freeEvent = { ...mockEvent, price: 0 };
      render(<EventDetail event={freeEvent} />);
      expect(screen.getByText('Gratis')).toBeInTheDocument();
    });

    it('should display price range when min and max differ', () => {
      render(<EventDetail event={mockEvent} />);
      // Check that both prices appear (formatted with dots as thousands separator)
      const priceElement = screen.getByText(/Precio de Entradas/i).nextElementSibling;
      expect(priceElement?.textContent).toContain('5.000');
      expect(priceElement?.textContent).toContain('8.000');
    });

    it('should display single price when min equals max', () => {
      const singlePriceEvent = { ...mockEvent, priceMax: 5000 };
      render(<EventDetail event={singlePriceEvent} />);
      expect(screen.getByText(/Desde.*5\.000/)).toBeInTheDocument();
    });
  });

  describe('Date formatting', () => {
    it('should format date in Spanish locale', () => {
      render(<EventDetail event={mockEvent} />);
      // Date should be formatted like "lunes, 1 de diciembre de 2025, 08:00 p. m."
      expect(screen.getByText(/diciembre/i)).toBeInTheDocument();
      expect(screen.getByText(/2025/)).toBeInTheDocument();
      expect(screen.getByText(/Fecha y Hora/i)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper link attributes for external ticket URL', () => {
      render(<EventDetail event={mockEvent} />);
      const ticketButton = screen.getByRole('link', { name: /Comprar Entradas/i });
      expect(ticketButton).toHaveAttribute('rel', 'noopener noreferrer');
    });

    it('should have descriptive alt text for image', () => {
      render(<EventDetail event={mockEvent} />);
      const image = screen.getByAltText('Concierto de Rock');
      expect(image).toBeInTheDocument();
    });
  });
});
