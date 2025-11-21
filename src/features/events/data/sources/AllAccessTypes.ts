/**
 * AllAccess Shared Types
 *
 * Tipos compartidos entre AllAccessJsonScraper y AllAccessMapper.
 * Separados en su propio archivo para evitar dependencias circulares.
 */

/**
 * Estructura de una card dentro de un widget component de Crowder
 */
export interface CrowderCard {
  title?: string | null;
  description?: string | null;
  line1?: string | null;
  line2?: string | null;
  label?: string | null;
  buttonText?: string | null;
  link: string;
  imgUrl: string;
  content?: string | null;
  moveTimestamp?: number;
}

/**
 * Estructura de un widget component de tipo Grid
 */
export interface CrowderWidgetComponent {
  id: string;
  widgetType: string;
  state: {
    enabled: boolean;
    header?: {
      title?: string;
    };
    config?: {
      deviceVisibility?: string;
    };
    cards?: CrowderCard[];
  };
  version: number;
}

/**
 * Estructura del JSON en App.bootstrapData()
 */
export interface CrowderBootstrapData {
  model?: {
    data?: {
      widgetComponents?: CrowderWidgetComponent[];
    };
  };
}

/**
 * Estructura del JSON-LD (schema.org) en páginas de detalle
 */
export interface SchemaOrgEvent {
  '@type': 'Event';
  name: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  location?: {
    '@type': 'Place';
    name?: string;
    address?: {
      streetAddress?: string;
      addressLocality?: string;
      postalCode?: string;
    };
  };
  offers?: Array<{
    '@type': 'Offer';
    price?: number;
    priceCurrency?: string;
    url?: string;
  }>;
  performer?: unknown[];
  image?: string;
  url?: string;
}

/**
 * Datos adicionales extraídos de la página de detalle
 */
export interface EventDetailData {
  startTime?: Date;
  endTime?: Date;
  price?: number;
  priceMax?: number;
  venue?: string;
  address?: string;
}
