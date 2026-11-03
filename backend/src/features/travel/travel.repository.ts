import { supabase } from '../../config/supabase.js';

// In-Memory fallback store for robust local development when Supabase DB is offline
const memoryStore = {
  trips: [
    {
      id: '00000000-0000-0000-0001-000000000001',
      user_id: '00000000-0000-0000-0000-000000000001',
      title: 'Winter Family Break',
      route: 'Pune (PNQ) ➔ Goa (GOI)',
      start_date: '2026-12-24',
      end_date: '2026-12-29',
      status: 'confirmed',
      details: 'Indigo 6E 428 · Lemon Tree Beach Resort · 5 nights',
      purpose: 'family',
      budget_inr: 85000,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: '00000000-0000-0000-0001-000000000002',
      user_id: '00000000-0000-0000-0000-000000000001',
      title: 'Sports School Partners Meet',
      route: 'Pune (PNQ) ➔ Delhi (DEL)',
      start_date: '2026-11-20',
      end_date: '2026-11-22',
      status: 'planning',
      details: 'Meeting with academic partners & sports authorities.',
      purpose: 'business',
      budget_inr: 32000,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: '00000000-0000-0000-0001-000000000003',
      user_id: '00000000-0000-0000-0000-000000000001',
      title: 'Bangalore Marathon 2026',
      route: 'Pune (PNQ) ➔ Bangalore (BLR)',
      start_date: '2026-08-14',
      end_date: '2026-08-17',
      status: 'completed',
      details: 'Bengaluru Midnight Marathon 42k race and team meetup.',
      purpose: 'personal',
      budget_inr: 28000,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ],
  segments: [
    {
      id: '00000000-0000-0000-0002-000000000001',
      trip_id: '00000000-0000-0000-0001-000000000001',
      type: 'flight',
      title: 'IndiGo 6E 428 (PNQ ➔ GOI)',
      provider: 'IndiGo Airlines',
      confirmation_code: 'IND-PNQ-902',
      departure_time: '2026-12-24T06:45:00Z',
      arrival_time: '2026-12-24T07:50:00Z',
      origin: 'Pune Lohegaon Airport (PNQ)',
      destination: 'Goa Dabolim Airport (GOI)',
      cost_inr: 14500,
      status: 'confirmed',
      created_at: new Date().toISOString(),
    },
    {
      id: '00000000-0000-0000-0002-000000000002',
      trip_id: '00000000-0000-0000-0001-000000000001',
      type: 'hotel',
      title: 'Lemon Tree Beach Resort, Candolim',
      provider: 'Lemon Tree Hotels',
      confirmation_code: 'LTR-GOA-551',
      departure_time: '2026-12-24T14:00:00Z',
      arrival_time: '2026-12-29T11:00:00Z',
      origin: 'Candolim, North Goa',
      destination: 'Candolim, North Goa',
      cost_inr: 52000,
      status: 'confirmed',
      created_at: new Date().toISOString(),
    },
  ],
  fares: [
    {
      id: '00000000-0000-0000-0003-000000000001',
      user_id: '00000000-0000-0000-0000-000000000001',
      route: 'PNQ ➔ DEL (20 Nov)',
      journey_date: '2026-11-20',
      current_fare_inr: 4850,
      typical_fare_inr: 6400,
      target_fare_inr: 5000,
      status_note: '24% below average · Good time to book',
      booking_url: 'https://www.makemytrip.com/flights',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: '00000000-0000-0000-0003-000000000002',
      user_id: '00000000-0000-0000-0000-000000000001',
      route: 'PNQ ➔ BLR (Weekend)',
      journey_date: '2026-12-05',
      current_fare_inr: 3200,
      typical_fare_inr: 3500,
      target_fare_inr: 3000,
      status_note: 'Typical pricing',
      booking_url: 'https://www.makemytrip.com/flights',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ],
  documents: [
    {
      id: '00000000-0000-0000-0004-000000000001',
      user_id: '00000000-0000-0000-0000-000000000001',
      family_member: 'Neha',
      doc_type: 'passport',
      doc_title: "Neha's Passport Renewal Needed",
      doc_number_masked: 'Z****921',
      expiry_date: '2027-06-15',
      alert_lead_months: 8,
      notes: 'Expires in 7 months (June 2027). Recommend renewal before booking international summer travel.',
      status: 'renewal_needed',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: '00000000-0000-0000-0004-000000000002',
      user_id: '00000000-0000-0000-0000-000000000001',
      family_member: 'Nikhil',
      doc_type: 'passport',
      doc_title: "Nikhil's Indian Passport",
      doc_number_masked: 'P****481',
      expiry_date: '2031-10-20',
      alert_lead_months: 6,
      notes: 'Valid for next 5 years. All active visas stamped.',
      status: 'valid',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: '00000000-0000-0000-0004-000000000003',
      user_id: '00000000-0000-0000-0000-000000000001',
      family_member: 'Prayan',
      doc_type: 'passport',
      doc_title: "Prayan's Minor Passport",
      doc_number_masked: 'M****103',
      expiry_date: '2029-04-12',
      alert_lead_months: 6,
      notes: 'Child 5-year passport. Valid for domestic and international sports tours.',
      status: 'valid',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ],
  tatkal: [
    {
      id: '00000000-0000-0000-0005-000000000001',
      user_id: '00000000-0000-0000-0000-000000000001',
      train_number: '12124',
      train_name: 'Deccan Queen Express',
      origin: 'Pune (PUNE)',
      destination: 'CSMT Mumbai (CSMT)',
      travel_date: '2026-11-15',
      class_code: 'AC Chair Car',
      opening_time: '10:00 AM',
      passengers: [
        { name: 'Nikhil', age: 38, gender: 'M', berthPreference: 'Window' },
        { name: 'Neha', age: 36, gender: 'F', berthPreference: 'Aisle' },
        { name: 'Prayan', age: 10, gender: 'M', berthPreference: 'Window' },
      ],
      status: 'pending',
      created_at: new Date().toISOString(),
    },
  ],
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
