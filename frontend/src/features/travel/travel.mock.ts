import { FareAlert, Trip, TravelDocument, TatkalTask, TravelOverview } from './travel.types';

export const INITIAL_OVERVIEW: TravelOverview = {
  upcomingTripsCount: 0,
  planningTripsCount: 0,
  trackedFaresCount: 0,
  faresBelowAverageCount: 0,
  documentsNeedingRenewalCount: 0,
};

export const TRAVEL_TRIPS: Trip[] = [];
export const FARE_ALERTS: FareAlert[] = [];
export const TRAVEL_DOCUMENTS: TravelDocument[] = [];
export const TATKAL_TASKS: TatkalTask[] = [];
