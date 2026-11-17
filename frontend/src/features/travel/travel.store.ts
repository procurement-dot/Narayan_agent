import { create } from 'zustand';
import {
  FareAlert,
  TravelTab,
  Trip,
  TravelDocument,
  TatkalTask,
  TravelOverview,
  CreateTripInput,
  CreateFareInput,
  CreateDocumentInput,
} from './travel.types';
import {
  FARE_ALERTS,
  INITIAL_OVERVIEW,
  TATKAL_TASKS,
  TRAVEL_DOCUMENTS,
  TRAVEL_TRIPS,
} from './travel.mock';
import { travelApi } from './travel.api';

export type ModalType = 'addTrip' | 'addFare' | 'addDoc' | 'tripDetail' | null;

interface TravelState {
  currentTab: TravelTab;
  overview: TravelOverview;
  trips: Trip[];
  selectedTrip: Trip | null;
  fares: FareAlert[];
  documents: TravelDocument[];
  tatkal: TatkalTask[];
  isLoading: boolean;
  activeModal: ModalType;

  // Actions
  setTab: (tab: TravelTab) => void;
  openModal: (modal: ModalType, trip?: Trip | null) => void;
  closeModal: () => void;
  loadAllData: () => Promise<void>;
  createTrip: (input: CreateTripInput) => Promise<boolean>;
  updateTripStatus: (id: string, status: Trip['status']) => Promise<boolean>;
  deleteTrip: (id: string) => Promise<boolean>;
  createFare: (input: CreateFareInput) => Promise<boolean>;
  deleteFare: (id: string) => Promise<boolean>;
  createDocument: (input: CreateDocumentInput) => Promise<boolean>;
}

export const useTravelStore = create<TravelState>((set, get) => ({
  currentTab: 'trips',
  overview: INITIAL_OVERVIEW,
  trips: TRAVEL_TRIPS,
  selectedTrip: null,
  fares: FARE_ALERTS,
  documents: TRAVEL_DOCUMENTS,
  tatkal: TATKAL_TASKS,
  isLoading: false,
  activeModal: null,

  setTab: (tab) => set({ currentTab: tab }),

  openModal: (modal, trip = null) => set({ activeModal: modal, selectedTrip: trip }),
  closeModal: () => set({ activeModal: null, selectedTrip: null }),

  loadAllData: async () => {
    set({ isLoading: true });
    try {
      const [overviewData, tripsData, faresData, docsData, tatkalData] = await Promise.all([
        travelApi.getOverview().catch(() => INITIAL_OVERVIEW),
        travelApi.getTrips().catch(() => TRAVEL_TRIPS),
        travelApi.getFares().catch(() => FARE_ALERTS),
        travelApi.getDocuments().catch(() => TRAVEL_DOCUMENTS),
        travelApi.getTatkal().catch(() => TATKAL_TASKS),
      ]);

      set({
        overview: overviewData,
        trips: tripsData,
        fares: faresData,
        documents: docsData,
        tatkal: tatkalData,
        isLoading: false,
      });
    } catch {
      // Fallback already handled per promise
      set({ isLoading: false });
    }
  },

  createTrip: async (input) => {
    set({ isLoading: true });
    try {
      const newTrip = await travelApi.createTrip(input);
      set((state) => ({
        trips: [newTrip, ...state.trips],
        overview: {
          ...state.overview,
          upcomingTripsCount: state.overview.upcomingTripsCount + 1,
        },
        isLoading: false,
        activeModal: null,
      }));
      return true;
    } catch {
      // Offline fallback: create locally
      const localTrip: Trip = {
        id: `local-tr-${Date.now()}`,
        title: input.title,
        route: input.route,
        startDate: input.startDate,
        endDate: input.endDate,
        dates: `${input.startDate} – ${input.endDate}`,
        status: input.status || 'planning',
        details: input.details || '',
        purpose: input.purpose || 'personal',
        budgetInr: input.budgetInr || 0,
        segments: [],
      };
      set((state) => ({
        trips: [localTrip, ...state.trips],
        overview: {
          ...state.overview,
          upcomingTripsCount: state.overview.upcomingTripsCount + 1,
        },
        isLoading: false,
        activeModal: null,
      }));
      return true;
    }
  },

  updateTripStatus: async (id, status) => {
    try {
      await travelApi.updateTrip(id, { status });
      set((state) => ({
        trips: state.trips.map((t) => (t.id === id ? { ...t, status } : t)),
        selectedTrip:
          state.selectedTrip?.id === id
            ? { ...state.selectedTrip, status }
            : state.selectedTrip,
      }));
      return true;
    } catch {
      // Offline fallback
      set((state) => ({
        trips: state.trips.map((t) => (t.id === id ? { ...t, status } : t)),
        selectedTrip:
          state.selectedTrip?.id === id
            ? { ...state.selectedTrip, status }
            : state.selectedTrip,
      }));
      return true;
    }
  },

  deleteTrip: async (id) => {
    try {
      await travelApi.deleteTrip(id);
    } catch {
      // Continue locally
    }
    set((state) => ({
      trips: state.trips.filter((t) => t.id !== id),
      selectedTrip: null,
      activeModal: null,
    }));
    return true;
  },

  createFare: async (input) => {
    set({ isLoading: true });
    try {
      const newFare = await travelApi.createFare(input);
      set((state) => ({
        fares: [newFare, ...state.fares],
        isLoading: false,
        activeModal: null,
      }));
      return true;
    } catch {
      const diff = input.typicalFareInr - input.currentFareInr;
      const pct = Math.round((diff / input.typicalFareInr) * 100);
      const localFare: FareAlert = {
        id: `local-fare-${Date.now()}`,
        route: input.route,
        journeyDate: input.journeyDate,
        currentFare: `₹${input.currentFareInr.toLocaleString('en-IN')}`,
        typicalFare: `₹${input.typicalFareInr.toLocaleString('en-IN')}`,
        currentFareInr: input.currentFareInr,
        typicalFareInr: input.typicalFareInr,
        targetFareInr: input.targetFareInr,
        status: diff > 0 ? `${pct}% below average · Good time to book` : 'Tracked price',
        bookingUrl: 'https://www.makemytrip.com/flights',
        isActive: true,
      };
      set((state) => ({
        fares: [localFare, ...state.fares],
        isLoading: false,
        activeModal: null,
      }));
      return true;
    }
  },

  deleteFare: async (id) => {
    try {
      await travelApi.deleteFare(id);
    } catch {
      // Continue locally
    }
    set((state) => ({
      fares: state.fares.filter((f) => f.id !== id),
    }));
    return true;
  },

  createDocument: async (input) => {
    set({ isLoading: true });
    try {
      const newDoc = await travelApi.createDocument(input);
      set((state) => ({
        documents: [newDoc, ...state.documents],
        isLoading: false,
        activeModal: null,
      }));
      return true;
    } catch {
      const today = new Date();
      const exp = new Date(input.expiryDate);
      const diffMonths = Math.round((exp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24 * 30.4375));
      const localDoc: TravelDocument = {
        id: `local-doc-${Date.now()}`,
        familyMember: input.familyMember,
        docType: input.docType,
        docTitle: input.docTitle,
        docNumberMasked: input.docNumberMasked || '****',
        expiryDate: input.expiryDate,
        monthsRemaining: diffMonths,
        status: diffMonths <= (input.alertLeadMonths || 6) ? 'renewal_needed' : 'valid',
        notes: input.notes || '',
      };
      set((state) => ({
        documents: [localDoc, ...state.documents],
        isLoading: false,
        activeModal: null,
      }));
      return true;
    }
  },
}));
