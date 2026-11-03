import { z } from 'zod';

// ==========================================
// 1. Trips & Segments
// ==========================================

export const createTripSchema = z.object({
  title: z.string().min(1, 'Trip title is required'),
  route: z.string().min(1, 'Route description is required'),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be YYYY-MM-DD'),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'End date must be YYYY-MM-DD'),
  status: z.enum(['planning', 'confirmed', 'completed', 'cancelled']).default('planning'),
  details: z.string().optional().default(''),
  purpose: z.enum(['personal', 'business', 'family']).default('personal'),
  budgetInr: z.number().nonnegative().optional().default(0),
});

export const updateTripSchema = createTripSchema.partial();

export const createSegmentSchema = z.object({
  type: z.enum(['flight', 'hotel', 'train', 'cab', 'meeting']),
  title: z.string().min(1, 'Segment title is required'),
  provider: z.string().optional().default(''),
  confirmationCode: z.string().optional().default(''),
  departureTime: z.string().optional(),
  arrivalTime: z.string().optional(),
  origin: z.string().optional().default(''),
  destination: z.string().optional().default(''),
  costInr: z.number().nonnegative().optional().default(0),
  status: z.enum(['confirmed', 'reserved', 'inquiry']).default('confirmed'),
});

export interface SegmentDto {
  id: string;
  tripId: string;
  type: 'flight' | 'hotel' | 'train' | 'cab' | 'meeting';
  title: string;
  provider: string;
  confirmationCode: string;
  departureTime?: string;
  arrivalTime?: string;
  origin: string;
  destination: string;
  costInr: number;
  status: string;
}

export interface TripDto {
  id: string;
  title: string;
  route: string;
  startDate: string;
  endDate: string;
  dates: string;
  status: 'planning' | 'confirmed' | 'completed' | 'cancelled';
  details: string;
  purpose: 'personal' | 'business' | 'family';
  budgetInr: number;
  segments?: SegmentDto[];
}

// ==========================================
// 2. Airfare Price Alerts
// ==========================================

export const createFareAlertSchema = z.object({
  route: z.string().min(1, 'Route is required (e.g. PNQ ➔ DEL)'),
  journeyDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Journey date must be YYYY-MM-DD'),
  currentFareInr: z.number().positive('Current fare must be greater than 0'),
  typicalFareInr: z.number().positive('Typical fare must be greater than 0'),
  targetFareInr: z.number().positive().optional(),
  bookingUrl: z.string().url().optional().default('https://www.makemytrip.com/flights'),
});

export interface FareAlertDto {
  id: string;
  route: string;
  journeyDate: string;
  currentFare: string;       // Formatted e.g. "₹4,850"
  typicalFare: string;       // Formatted e.g. "₹6,400"
  currentFareInr: number;
  typicalFareInr: number;
  targetFareInr?: number;
  status: string;            // e.g. "24% below average · Good time to book"
  bookingUrl: string;
  isActive: boolean;
}

// ==========================================
// 3. Travel Documents
// ==========================================

export const createDocumentSchema = z.object({
  familyMember: z.string().min(1, 'Family member name is required'),
  docType: z.enum(['passport', 'visa', 'id', 'insurance']),
  docTitle: z.string().min(1, 'Document title is required'),
  docNumberMasked: z.string().optional().default(''),
  expiryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Expiry date must be YYYY-MM-DD'),
  alertLeadMonths: z.number().int().positive().optional().default(6),
  notes: z.string().optional().default(''),
});

export interface DocumentDto {
  id: string;
  familyMember: string;
  docType: 'passport' | 'visa' | 'id' | 'insurance';
  docTitle: string;
  docNumberMasked: string;
  expiryDate: string;
  monthsRemaining: number;
  status: 'valid' | 'renewal_needed' | 'expired';
  notes: string;
}

// ==========================================
// 4. IRCTC Tatkal Assistant
// ==========================================

export const createTatkalSchema = z.object({
  trainNumber: z.string().min(1, 'Train number is required'),
  trainName: z.string().min(1, 'Train name is required'),
  origin: z.string().min(1, 'Origin station is required'),
  destination: z.string().min(1, 'Destination station is required'),
  travelDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Travel date must be YYYY-MM-DD'),
  classCode: z.string().default('AC Chair Car'),
  openingTime: z.string().default('10:00 AM'),
  passengers: z.array(z.object({
    name: z.string(),
    age: z.number(),
    gender: z.string().optional(),
    berthPreference: z.string().optional(),
  })).default([]),
});

export interface TatkalDto {
  id: string;
  trainNumber: string;
  trainName: string;
  origin: string;
  destination: string;
  route: string;
  travelDate: string;
  classCode: string;
  openingTime: string;
  passengersCount: number;
  passengers: Array<{
    name: string;
    age: number;
    gender?: string;
    berthPreference?: string;
  }>;
  status: 'pending' | 'booked' | 'missed';
}

// ==========================================
// 5. Travel Dashboard Overview
// ==========================================

export interface TravelOverviewDto {
  upcomingTripsCount: number;
  planningTripsCount: number;
  trackedFaresCount: number;
  faresBelowAverageCount: number;
  documentsNeedingRenewalCount: number;
  nextTatkalAlert?: {
    trainName: string;
    openingTime: string;
    travelDate: string;
  };
}
