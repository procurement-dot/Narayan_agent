import { travelRepository } from './travel.repository.js';
import {
  TripDto,
  SegmentDto,
  FareAlertDto,
  DocumentDto,
  TatkalDto,
  TravelOverviewDto,
} from './travel.dto.js';

function formatCurrencyINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDateRange(startDateStr: string, endDateStr: string): string {
  const start = new Date(startDateStr);
  const end = new Date(endDateStr);

  const startDay = start.getDate();
  const endDay = end.getDate();
  const startMonth = start.toLocaleDateString('en-GB', { month: 'short' });
  const endMonth = end.toLocaleDateString('en-GB', { month: 'short' });
  const year = end.getFullYear();

  if (startMonth === endMonth) {
    return `${startDay} ${startMonth} – ${endDay} ${endMonth} ${year}`;
  }
  return `${startDay} ${startMonth} – ${endDay} ${endMonth} ${year}`;
}

export const travelService = {
  // 1. Overview Dashboard
  async getOverview(): Promise<TravelOverviewDto> {
    const [trips, fares, docs, tatkal] = await Promise.all([
      travelRepository.getTrips(),
      travelRepository.getFareAlerts(),
      travelRepository.getDocuments(),
      travelRepository.getTatkalTasks(),
    ]);

    const upcomingTrips = trips.filter(t => t.status === 'confirmed' || t.status === 'planning');
    const planningTrips = trips.filter(t => t.status === 'planning');
    const faresBelowAvg = fares.filter(f => Number(f.current_fare_inr) < Number(f.typical_fare_inr));
    const docsNeedingRenewal = docs.filter(d => d.status === 'renewal_needed');
    const pendingTatkal = tatkal.find(t => t.status === 'pending');

    return {
      upcomingTripsCount: upcomingTrips.length,
      planningTripsCount: planningTrips.length,
      trackedFaresCount: fares.length,
      faresBelowAverageCount: faresBelowAvg.length,
      documentsNeedingRenewalCount: docsNeedingRenewal.length,
      nextTatkalAlert: pendingTatkal
        ? {
            trainName: pendingTatkal.train_name,
            openingTime: pendingTatkal.opening_time,
            travelDate: pendingTatkal.travel_date,
          }
        : undefined,
    };
  },

  // 2. Trips
  async getTrips(status?: string): Promise<TripDto[]> {
    const rawTrips = await travelRepository.getTrips(status);

    return rawTrips.map(t => ({
      id: t.id,
      title: t.title,
      route: t.route,
      startDate: t.start_date,
      endDate: t.end_date,
      dates: formatDateRange(t.start_date, t.end_date),
      status: t.status,
      details: t.details || '',
      purpose: t.purpose || 'personal',
      budgetInr: Number(t.budget_inr || 0),
    }));
  },

  async getTripById(id: string): Promise<TripDto | null> {
    const rawTrip = await travelRepository.getTripById(id);
    if (!rawTrip) return null;

    const segments: SegmentDto[] = (rawTrip.travel_segments || []).map((s: any) => ({
      id: s.id,
      tripId: s.trip_id,
      type: s.type,
      title: s.title,
      provider: s.provider || '',
      confirmationCode: s.confirmation_code || '',
      departureTime: s.departure_time,
      arrivalTime: s.arrival_time,
      origin: s.origin || '',
      destination: s.destination || '',
      costInr: Number(s.cost_inr || 0),
      status: s.status,
    }));

    return {
      id: rawTrip.id,
      title: rawTrip.title,
      route: rawTrip.route,
      startDate: rawTrip.start_date,
      endDate: rawTrip.end_date,
      dates: formatDateRange(rawTrip.start_date, rawTrip.end_date),
      status: rawTrip.status,
      details: rawTrip.details || '',
      purpose: rawTrip.purpose || 'personal',
      budgetInr: Number(rawTrip.budget_inr || 0),
      segments,
    };
  },

  async createTrip(data: any): Promise<TripDto> {
    const created = await travelRepository.createTrip(data);
    return {
      id: created.id,
      title: created.title,
      route: created.route,
      startDate: created.start_date,
      endDate: created.end_date,
      dates: formatDateRange(created.start_date, created.end_date),
      status: created.status,
      details: created.details || '',
      purpose: created.purpose || 'personal',
      budgetInr: Number(created.budget_inr || 0),
    };
  },

  async updateTrip(id: string, data: any): Promise<TripDto | null> {
    const updated = await travelRepository.updateTrip(id, data);
    if (!updated) return null;
    return {
      id: updated.id,
      title: updated.title,
      route: updated.route,
      startDate: updated.start_date,
      endDate: updated.end_date,
      dates: formatDateRange(updated.start_date, updated.end_date),
      status: updated.status,
      details: updated.details || '',
      purpose: updated.purpose || 'personal',
      budgetInr: Number(updated.budget_inr || 0),
    };
  },

  async deleteTrip(id: string): Promise<boolean> {
    return travelRepository.deleteTrip(id);
  },

  // 3. Segments
  async addSegment(tripId: string, data: any): Promise<SegmentDto> {
    const created = await travelRepository.createSegment({ ...data, tripId });
    return {
      id: created.id,
      tripId: created.trip_id,
      type: created.type,
      title: created.title,
      provider: created.provider || '',
      confirmationCode: created.confirmation_code || '',
      departureTime: created.departure_time,
      arrivalTime: created.arrival_time,
      origin: created.origin || '',
      destination: created.destination || '',
      costInr: Number(created.cost_inr || 0),
      status: created.status,
    };
  },

  // 4. Airfares
  async getFareAlerts(): Promise<FareAlertDto[]> {
    const rawFares = await travelRepository.getFareAlerts();

    return rawFares.map(f => {
      const current = Number(f.current_fare_inr);
      const typical = Number(f.typical_fare_inr);
      let status = f.status_note;

      if (!status) {
        if (current < typical) {
          const discountPct = Math.round(((typical - current) / typical) * 100);
          status = `${discountPct}% below average · Good time to book`;
        } else if (current > typical) {
          const markupPct = Math.round(((current - typical) / typical) * 100);
          status = `${markupPct}% above average`;
        } else {
          status = 'Typical pricing';
        }
      }

      return {
        id: f.id,
        route: f.route,
        journeyDate: f.journey_date,
        currentFare: formatCurrencyINR(current),
        typicalFare: formatCurrencyINR(typical),
        currentFareInr: current,
        typicalFareInr: typical,
        targetFareInr: f.target_fare_inr ? Number(f.target_fare_inr) : undefined,
        status,
        bookingUrl: f.booking_url || 'https://www.makemytrip.com/flights',
        isActive: !!f.is_active,
      };
    });
  },

  async createFareAlert(data: any): Promise<FareAlertDto> {
    const current = Number(data.currentFareInr);
    const typical = Number(data.typicalFareInr);
    let statusNote = '';

    if (current < typical) {
      const discountPct = Math.round(((typical - current) / typical) * 100);
      statusNote = `${discountPct}% below average · Good time to book`;
    } else {
      statusNote = 'Tracked airfare';
    }

    const created = await travelRepository.createFareAlert({
      ...data,
      statusNote,
    });

    return {
      id: created.id,
      route: created.route,
      journeyDate: created.journey_date,
      currentFare: formatCurrencyINR(current),
      typicalFare: formatCurrencyINR(typical),
      currentFareInr: current,
      typicalFareInr: typical,
      targetFareInr: created.target_fare_inr ? Number(created.target_fare_inr) : undefined,
      status: created.status_note,
      bookingUrl: created.booking_url,
      isActive: created.is_active,
    };
  },

  async deleteFareAlert(id: string): Promise<boolean> {
    return travelRepository.deleteFareAlert(id);
  },

  // 5. Travel Documents
  async getDocuments(): Promise<DocumentDto[]> {
    const rawDocs = await travelRepository.getDocuments();
    const today = new Date();

    return rawDocs.map(d => {
      const expDate = new Date(d.expiry_date);
      const diffMonths = Math.round((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24 * 30.4375));
      const alertThreshold = d.alert_lead_months || 6;

      let status: 'valid' | 'renewal_needed' | 'expired' = 'valid';
      if (diffMonths <= 0) {
        status = 'expired';
      } else if (diffMonths <= alertThreshold) {
        status = 'renewal_needed';
      }

      return {
        id: d.id,
        familyMember: d.family_member,
        docType: d.doc_type,
        docTitle: d.doc_title,
        docNumberMasked: d.doc_number_masked || '',
        expiryDate: d.expiry_date,
        monthsRemaining: diffMonths,
        status,
        notes: d.notes || '',
      };
    });
  },

  async createDocument(data: any): Promise<DocumentDto> {
    const today = new Date();
    const expDate = new Date(data.expiryDate);
    const diffMonths = Math.round((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24 * 30.4375));
    const alertThreshold = data.alertLeadMonths || 6;

    let status: 'valid' | 'renewal_needed' | 'expired' = 'valid';
    if (diffMonths <= 0) status = 'expired';
    else if (diffMonths <= alertThreshold) status = 'renewal_needed';

    const created = await travelRepository.createDocument({
      ...data,
      status,
    });

    return {
      id: created.id,
      familyMember: created.family_member,
      docType: created.doc_type,
      docTitle: created.doc_title,
      docNumberMasked: created.doc_number_masked || '',
      expiryDate: created.expiry_date,
      monthsRemaining: diffMonths,
      status: created.status,
      notes: created.notes || '',
    };
  },

  // 6. Tatkal Assistant
  async getTatkalTasks(): Promise<TatkalDto[]> {
    const rawTasks = await travelRepository.getTatkalTasks();

    return rawTasks.map(t => {
      const passengers = Array.isArray(t.passengers) ? t.passengers : [];
      return {
        id: t.id,
        trainNumber: t.train_number,
        trainName: t.train_name,
        origin: t.origin,
        destination: t.destination,
        route: `${t.origin} ➔ ${t.destination}`,
        travelDate: t.travel_date,
        classCode: t.class_code,
        openingTime: t.opening_time,
        passengersCount: passengers.length,
        passengers,
        status: t.status,
      };
    });
  },

  async createTatkalTask(data: any): Promise<TatkalDto> {
    const created = await travelRepository.createTatkalTask(data);
    const passengers = Array.isArray(created.passengers) ? created.passengers : [];

    return {
      id: created.id,
      trainNumber: created.train_number,
      trainName: created.train_name,
      origin: created.origin,
      destination: created.destination,
      route: `${created.origin} ➔ ${created.destination}`,
      travelDate: created.travel_date,
      classCode: created.class_code,
      openingTime: created.opening_time,
      passengersCount: passengers.length,
      passengers,
      status: created.status,
    };
  },
};
