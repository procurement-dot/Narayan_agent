export type TravelTab = 'trips' | 'fares' | 'family' | 'rail' | 'history';

export interface Trip {
  id: string;
  title: string;
  route: string;
  dates: string;
  status: 'confirmed' | 'planning';
  details: string;
}

export interface FareAlert {
  route: string;
  currentFare: string;
  typicalFare: string;
  status: string;
}
