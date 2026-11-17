import { apiClient } from '../../shared/api/client';
import {
  Trip,
  FareAlert,
  TravelDocument,
  TatkalTask,
  TravelOverview,
  CreateTripInput,
  CreateFareInput,
  CreateDocumentInput,
  Segment,
} from './travel.types';

export const travelApi = {
  // 1. Overview Dashboard
  async getOverview(): Promise<TravelOverview> {
    const res = await apiClient.get<TravelOverview>('/travel/overview');
    return res.data;
  },

  // 2. Trips
  async getTrips(status?: string): Promise<Trip[]> {
    const res = await apiClient.get<Trip[]>('/travel/trips', {
      params: status ? { status } : undefined,
    });
    return res.data;
  },

  async getTripById(id: string): Promise<Trip> {
    const res = await apiClient.get<Trip>(`/travel/trips/${id}`);
    return res.data;
  },

  async createTrip(payload: CreateTripInput): Promise<Trip> {
    const res = await apiClient.post<Trip>('/travel/trips', payload);
    return res.data;
  },

  async updateTrip(id: string, payload: Partial<CreateTripInput>): Promise<Trip> {
    const res = await apiClient.put<Trip>(`/travel/trips/${id}`, payload);
    return res.data;
  },

  async deleteTrip(id: string): Promise<void> {
    await apiClient.delete(`/travel/trips/${id}`);
  },

  async addSegment(tripId: string, payload: Omit<Segment, 'id' | 'tripId'>): Promise<Segment> {
    const res = await apiClient.post<Segment>(`/travel/trips/${tripId}/segments`, payload);
    return res.data;
  },

  // 3. Airfare Alerts
  async getFares(): Promise<FareAlert[]> {
    const res = await apiClient.get<FareAlert[]>('/travel/fares');
    return res.data;
  },

  async createFare(payload: CreateFareInput): Promise<FareAlert> {
    const res = await apiClient.post<FareAlert>('/travel/fares', payload);
    return res.data;
  },

  async deleteFare(id: string): Promise<void> {
    await apiClient.delete(`/travel/fares/${id}`);
  },

  // 4. Documents & Passports
  async getDocuments(): Promise<TravelDocument[]> {
    const res = await apiClient.get<TravelDocument[]>('/travel/documents');
    return res.data;
  },

  async createDocument(payload: CreateDocumentInput): Promise<TravelDocument> {
    const res = await apiClient.post<TravelDocument>('/travel/documents', payload);
    return res.data;
  },

  // 5. Tatkal Assistant
  async getTatkal(): Promise<TatkalTask[]> {
    const res = await apiClient.get<TatkalTask[]>('/travel/tatkal');
    return res.data;
  },

  async createTatkal(payload: Partial<TatkalTask>): Promise<TatkalTask> {
    const res = await apiClient.post<TatkalTask>('/travel/tatkal', payload);
    return res.data;
  },
};
