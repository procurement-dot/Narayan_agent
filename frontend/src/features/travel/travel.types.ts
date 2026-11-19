export type TravelTab = 'trips' | 'fares' | 'family' | 'rail' | 'history';

export interface Segment {
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

export interface Trip {
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
  segments?: Segment[];
}

export interface FareAlert {
  id: string;
  route: string;
  journeyDate: string;
  currentFare: string;
  typicalFare: string;
  currentFareInr: number;
  typicalFareInr: number;
  targetFareInr?: number;
  status: string;
  bookingUrl: string;
  isActive: boolean;
}

export interface TravelDocument {
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

export interface TatkalPassenger {
  name: string;
  age: number;
  gender?: string;
  berthPreference?: string;
}

export interface TatkalTask {
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
  passengers: TatkalPassenger[];
  status: 'pending' | 'booked' | 'missed';
}

export interface TravelOverview {
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

// Form Inputs
export interface CreateTripInput {
  title: string;
  route: string;
  startDate: string;
  endDate: string;
  status?: 'planning' | 'confirmed' | 'completed' | 'cancelled';
  details?: string;
  purpose?: 'personal' | 'business' | 'family';
  budgetInr?: number;
}

export interface CreateFareInput {
  route: string;
  journeyDate: string;
  currentFareInr: number;
  typicalFareInr: number;
  targetFareInr?: number;
}

export interface CreateDocumentInput {
  familyMember: string;
  docType: 'passport' | 'visa' | 'id' | 'insurance';
  docTitle: string;
  docNumberMasked?: string;
  expiryDate: string;
  alertLeadMonths?: number;
  notes?: string;
}

// AI Multi-Modal Travel Planner
export interface AiTravelOption {
  type: 'flight' | 'train' | 'cab';
  title: string;
  provider: string;
  seatingClassLabel: string;
  departureTime: string;
  arrivalTime: string;
  returnDepartureTime?: string;
  returnArrivalTime?: string;
  duration: string;
  estimatedCostInr: number;
  formattedCost: string;
  offerBadge?: string;
  highlights: string[];
  aiReasoning: string;
  isRecommended: boolean;
  feasibilityWarning?: string;
}

export interface AiTravelPlanResponse {
  origin: string;
  destination: string;
  date: string;
  returnDate?: string;
  isRoundTrip: boolean;
  seatingClass: 'executive' | 'standard' | 'economy';
  preferredTime?: string;
  distanceKm?: number;
  aiSummary: string;
  options: AiTravelOption[];
}

export interface GenerateAiPlanInput {
  origin: string;
  destination: string;
  date: string;
  returnDate?: string;
  isRoundTrip?: boolean;
  seatingClass?: 'executive' | 'standard' | 'economy';
  preferredTime?: string;
  notes?: string;
}


