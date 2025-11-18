// Event Repository Interface
// Domain layer - defines contract for data persistence

import { Event } from '../entities/Event';

export interface IEventRepository {
  findAll(): Promise<Event[]>;
  findById(id: string): Promise<Event | null>;
  findByFilters(filters: EventFilters): Promise<Event[]>;
  upsertMany(events: Event[]): Promise<number>;
  deleteById(id: string): Promise<void>;
  deleteAll(): Promise<number>;
  count(): Promise<number>;
}

export interface EventFilters {
  city?: string;
  country?: string;
  category?: string;
  genre?: string;
  dateFrom?: Date;
  dateTo?: Date;
  search?: string;
}
