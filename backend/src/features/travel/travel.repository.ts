import { supabase } from '../../config/supabase.js';

// In-Memory fallback store for robust local development when Supabase DB is offline
const memoryStore = {
  trips: [] as any[],
  segments: [] as any[],
  fares: [] as any[],
  documents: [] as any[],
  tatkal: [] as any[],
};

export const travelRepository = {
  // 1. Trips
  async getTrips(status?: string) {
    try {
      let query = supabase.from('travel_trips').select('*').order('start_date', { ascending: true });
      if (status && status !== 'all') {
        query = query.eq('status', status);
      }
      const { data, error } = await query;
      if (error || !data) throw error || new Error('No DB response');
      return data;
    } catch {
      // Memory fallback
      let list = memoryStore.trips;
      if (status && status !== 'all') {
        list = list.filter(t => t.status === status);
      }
      return list;
    }
  },

  async getTripById(id: string) {
    try {
      const { data, error } = await supabase
        .from('travel_trips')
        .select('*, travel_segments(*)')
        .eq('id', id)
        .single();
      if (error || !data) throw error || new Error('Trip not found');
      return data;
    } catch {
      const trip = memoryStore.trips.find(t => t.id === id);
      if (!trip) return null;
      const segments = memoryStore.segments.filter(s => s.trip_id === id);
      return { ...trip, travel_segments: segments };
    }
  },

  async createTrip(tripData: any) {
    const newTrip = {
      id: crypto.randomUUID(),
      user_id: '00000000-0000-0000-0000-000000000001',
      title: tripData.title,
      route: tripData.route,
      start_date: tripData.startDate,
      end_date: tripData.endDate,
      status: tripData.status || 'planning',
      details: tripData.details || '',
      purpose: tripData.purpose || 'personal',
      budget_inr: tripData.budgetInr || 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    try {
      const { data, error } = await supabase
        .from('travel_trips')
        .insert(newTrip)
        .select()
        .single();
      if (error || !data) throw error;
      return data;
    } catch {
      memoryStore.trips.push(newTrip);
      return newTrip;
    }
  },

  async updateTrip(id: string, tripData: any) {
    const updates: Record<string, any> = { updated_at: new Date().toISOString() };
    if (tripData.title) updates.title = tripData.title;
    if (tripData.route) updates.route = tripData.route;
    if (tripData.startDate) updates.start_date = tripData.startDate;
    if (tripData.endDate) updates.end_date = tripData.endDate;
    if (tripData.status) updates.status = tripData.status;
    if (tripData.details !== undefined) updates.details = tripData.details;
    if (tripData.purpose) updates.purpose = tripData.purpose;
    if (tripData.budgetInr !== undefined) updates.budget_inr = tripData.budgetInr;

    try {
      const { data, error } = await supabase
        .from('travel_trips')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error || !data) throw error;
      return data;
    } catch {
      const idx = memoryStore.trips.findIndex(t => t.id === id);
      if (idx === -1) return null;
      memoryStore.trips[idx] = { ...memoryStore.trips[idx], ...updates };
      return memoryStore.trips[idx];
    }
  },

  async deleteTrip(id: string) {
    try {
      const { error } = await supabase.from('travel_trips').delete().eq('id', id);
      if (error) throw error;
      return true;
    } catch {
      const idx = memoryStore.trips.findIndex(t => t.id === id);
      if (idx !== -1) {
        memoryStore.trips.splice(idx, 1);
        return true;
      }
      return false;
    }
  },

  // 2. Segments
  async getSegmentsByTripId(tripId: string) {
    try {
      const { data, error } = await supabase
        .from('travel_segments')
        .select('*')
        .eq('trip_id', tripId)
        .order('departure_time', { ascending: true });
      if (error || !data) throw error;
      return data;
    } catch {
      return memoryStore.segments.filter(s => s.trip_id === tripId);
    }
  },

  async createSegment(segmentData: any) {
    const newSegment = {
      id: crypto.randomUUID(),
      trip_id: segmentData.tripId,
      type: segmentData.type,
      title: segmentData.title,
      provider: segmentData.provider || '',
      confirmation_code: segmentData.confirmationCode || '',
      departure_time: segmentData.departureTime,
      arrival_time: segmentData.arrivalTime,
      origin: segmentData.origin || '',
      destination: segmentData.destination || '',
      cost_inr: segmentData.costInr || 0,
      status: segmentData.status || 'confirmed',
      created_at: new Date().toISOString(),
    };

    try {
      const { data, error } = await supabase
        .from('travel_segments')
        .insert(newSegment)
        .select()
        .single();
      if (error || !data) throw error;
      return data;
    } catch {
      memoryStore.segments.push(newSegment);
      return newSegment;
    }
  },

  // 3. Airfare Alerts
  async getFareAlerts() {
    try {
      const { data, error } = await supabase
        .from('travel_fare_alerts')
        .select('*')
        .order('created_at', { ascending: false });
      if (error || !data) throw error;
      return data;
    } catch {
      return memoryStore.fares;
    }
  },

  async createFareAlert(fareData: any) {
    const newFare = {
      id: crypto.randomUUID(),
      user_id: '00000000-0000-0000-0000-000000000001',
      route: fareData.route,
      journey_date: fareData.journeyDate,
      current_fare_inr: fareData.currentFareInr,
      typical_fare_inr: fareData.typicalFareInr,
      target_fare_inr: fareData.targetFareInr || null,
      status_note: fareData.statusNote || 'Tracked price',
      booking_url: fareData.bookingUrl || 'https://www.makemytrip.com/flights',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    try {
      const { data, error } = await supabase
        .from('travel_fare_alerts')
        .insert(newFare)
        .select()
        .single();
      if (error || !data) throw error;
      return data;
    } catch {
      memoryStore.fares.push(newFare);
      return newFare;
    }
  },

  async deleteFareAlert(id: string) {
    try {
      const { error } = await supabase.from('travel_fare_alerts').delete().eq('id', id);
      if (error) throw error;
      return true;
    } catch {
      const idx = memoryStore.fares.findIndex(f => f.id === id);
      if (idx !== -1) {
        memoryStore.fares.splice(idx, 1);
        return true;
      }
      return false;
    }
  },

  // 4. Documents
  async getDocuments() {
    try {
      const { data, error } = await supabase
        .from('travel_documents')
        .select('*')
        .order('expiry_date', { ascending: true });
      if (error || !data) throw error;
      return data;
    } catch {
      return memoryStore.documents;
    }
  },

  async createDocument(docData: any) {
    const newDoc = {
      id: crypto.randomUUID(),
      user_id: '00000000-0000-0000-0000-000000000001',
      family_member: docData.familyMember,
      doc_type: docData.docType,
      doc_title: docData.docTitle,
      doc_number_masked: docData.docNumberMasked || '',
      expiry_date: docData.expiryDate,
      alert_lead_months: docData.alertLeadMonths || 6,
      notes: docData.notes || '',
      status: docData.status || 'valid',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    try {
      const { data, error } = await supabase
        .from('travel_documents')
        .insert(newDoc)
        .select()
        .single();
      if (error || !data) throw error;
      return data;
    } catch {
      memoryStore.documents.push(newDoc);
      return newDoc;
    }
  },

  // 5. Tatkal Assistant
  async getTatkalTasks() {
    try {
      const { data, error } = await supabase
        .from('travel_tatkal_assist')
        .select('*')
        .order('travel_date', { ascending: true });
      if (error || !data) throw error;
      return data;
    } catch {
      return memoryStore.tatkal;
    }
  },

  async createTatkalTask(tatkalData: any) {
    const newTask = {
      id: crypto.randomUUID(),
      user_id: '00000000-0000-0000-0000-000000000001',
      train_number: tatkalData.trainNumber,
      train_name: tatkalData.trainName,
      origin: tatkalData.origin,
      destination: tatkalData.destination,
      travel_date: tatkalData.travelDate,
      class_code: tatkalData.classCode || 'AC Chair Car',
      opening_time: tatkalData.openingTime || '10:00 AM',
      passengers: tatkalData.passengers || [],
      status: 'pending',
      created_at: new Date().toISOString(),
    };

    try {
      const { data, error } = await supabase
        .from('travel_tatkal_assist')
        .insert(newTask)
        .select()
        .single();
      if (error || !data) throw error;
      return data;
    } catch {
      memoryStore.tatkal.push(newTask);
      return newTask;
    }
  },
};
