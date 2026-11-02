import { create } from 'zustand';
import { FareAlert, TravelTab, Trip } from './travel.types';
import { FARE_ALERTS, TRAVEL_TRIPS } from './travel.mock';

interface TravelState {
  currentTab: TravelTab;
  trips: Trip[];
  fares: FareAlert[];
  setTab: (tab: TravelTab) => void;
}

export const useTravelStore = create<TravelState>((set) => ({
  currentTab: 'trips',
  trips: TRAVEL_TRIPS,
  fares: FARE_ALERTS,

  setTab: (tab) => set({ currentTab: tab }),
}));
