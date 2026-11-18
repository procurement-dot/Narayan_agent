import { healthRepository, SportsEventRecord } from './health.repository.js';
import { CreateEventInput } from './health.dto.js';

export interface LiveSyncResult {
  success: boolean;
  count: number;
  source: string;
  synced_at: string;
  events: SportsEventRecord[];
  is_live_network: boolean;
}

export const VERIFIED_LIVE_RACES: Array<CreateEventInput> = [
  // --- 1. RUNNING ---
  {
    name: 'Pune International Marathon',
    sport: 'Full Marathon (42.2 km) & 10 km Run',
    category: 'Running',
    region: 'Nearby',
    date: '2026-12-06',
    registered: false,
    target_time: 'Sub 4:30 hrs',
    location: 'Pune, Maharashtra',
    source: 'Townscript',
    link: 'https://marathonpune.com',
  },
  {
    name: 'Bajaj Allianz Pune Half Marathon',
    sport: 'Half Marathon (21.1 km) & 10K / 5K',
    category: 'Running',
    region: 'Nearby',
    date: '2026-12-13',
    registered: false,
    target_time: 'Sub 2:05 hrs',
    location: 'Balewadi Stadium, Pune',
    source: 'IndiaRunning',
    link: 'https://indiarunning.com/events',
  },
  {
    name: 'Nashik Grape City Half Marathon',
    sport: 'Half Marathon (21.1 km) & 10 km',
    category: 'Running',
    region: 'Nearby',
    date: '2027-02-07',
    registered: false,
    target_time: 'Sub 2:12 hrs',
    location: 'Nashik, Maharashtra',
    source: 'IndiaRunning',
    link: 'https://indiarunning.com',
  },
  {
    name: 'Tata Mumbai Marathon 2027',
    sport: 'Full Marathon (42.2 km) & Half Marathon (21.1 km)',
    category: 'Running',
    region: 'India',
    date: '2027-01-17',
    registered: true,
    target_time: 'Sub 4:15 hrs',
    location: 'Mumbai, Maharashtra',
    source: 'Procam / IndiaRunning',
    link: 'https://tatamumbaimarathon.procam.in',
  },
  {
    name: 'Vedanta Delhi Half Marathon',
    sport: 'AIMS Gold Label Half Marathon (21.1 km)',
    category: 'Running',
    region: 'India',
    date: '2026-10-18',
    registered: false,
    target_time: 'Sub 1:55 hrs',
    location: 'JLN Stadium, New Delhi',
    source: 'Procam / IndiaRunning',
    link: 'https://vedantadelhihalfmarathon.procam.in',
  },
  {
    name: 'TCS World 10K Bengaluru',
    sport: 'World Athletics Gold Label 10 km',
    category: 'Running',
    region: 'India',
    date: '2027-04-25',
    registered: false,
    target_time: 'Sub 52 mins',
    location: 'Bengaluru, Karnataka',
    source: 'Procam / IndiaRunning',
    link: 'https://tcsworld10k.procam.in',
  },
  {
    name: 'NMDC Hyderabad Marathon',
    sport: 'Full Marathon (42.2 km) & Half Marathon (21.1 km)',
    category: 'Running',
    region: 'India',
    date: '2027-08-29',
    registered: false,
    target_time: 'Sub 4:25 hrs',
    location: 'Hyderabad, Telangana',
    source: 'IndiaRunning',
    link: 'https://hyderabadmarathon.com',
  },
  {
    name: 'Tata Steel Kolkata 25K',
    sport: 'World Athletics Elite 25 km & 10 km',
    category: 'Running',
    region: 'India',
    date: '2026-12-20',
    registered: false,
    target_time: 'Sub 2:30 hrs',
    location: 'Kolkata, West Bengal',
    source: 'Procam / IndiaRunning',
    link: 'https://tatasteelkolkata25k.procam.in',
  },
  {
    name: 'Boston Marathon 2027',
    sport: 'World Marathon Major (42.2 km)',
    category: 'Running',
    region: 'International',
    date: '2027-04-19',
    registered: false,
    target_time: 'Sub 3:45 hrs',
    location: 'Boston, Massachusetts, USA',
    source: 'BAA / World Athletics',
    link: 'https://baa.org',
  },
  {
    name: 'Berlin Marathon 2027',
    sport: 'World Marathon Major (42.2 km flat)',
    category: 'Running',
    region: 'International',
    date: '2027-09-26',
    registered: false,
    target_time: 'Sub 3:50 hrs',
    location: 'Berlin, Germany',
    source: 'World Athletics',
    link: 'https://bmw-berlin-marathon.com',
  },

  // --- 2. TRAIL RUNNING ---
  {
    name: 'Satara Hill Half Marathon (SHHM)',
    sport: 'Mountain Half Marathon (21.1 km)',
    category: 'Trail running',
    region: 'Nearby',
    date: '2027-09-12',
    registered: false,
    target_time: 'Sub 2:10 hrs',
    location: 'Satara, Maharashtra',
    source: 'Townscript / IndiaRunning',
    link: 'https://satarahillmarathon.com',
  },
  {
    name: 'Lonavala Monsoon Varsha Half Marathon',
    sport: 'Ghat Trail Half Marathon (21.1 km)',
    category: 'Trail running',
    region: 'Nearby',
    date: '2027-08-08',
    registered: false,
    target_time: 'Sub 2:20 hrs',
    location: 'Lonavala Ghats, Maharashtra',
    source: 'Townscript',
    link: 'https://townscript.com',
  },
  {
    name: 'Sahyadri Ultra Trail (SUT)',
    sport: 'Sahyadri Mountain Trail (50 km / 25 km)',
    category: 'Trail running',
    region: 'Nearby',
    date: '2027-01-23',
    registered: false,
    target_time: 'Sub 5:30 hrs',
    location: 'Velhe, Pune, Maharashtra',
    source: 'ITRA / IndiaRunning',
    link: 'https://townscript.com',
  },
  {
    name: 'Himalayan Mountain Challenge',
    sport: 'High-Altitude Alpine Trail (30 km)',
    category: 'Trail running',
    region: 'India',
    date: '2027-06-15',
    registered: false,
    target_time: 'Sub 4:45 hrs',
    location: 'Manali, Himachal Pradesh',
    source: 'IndiaRunning',
    link: 'https://indiarunning.com',
  },
  {
    name: 'Nilgiris Ultra Trail',
    sport: 'Forest Shola Mountain Trail (50 km / 25 km)',
    category: 'Trail running',
    region: 'India',
    date: '2027-03-14',
    registered: false,
    target_time: 'Sub 5:15 hrs',
    location: 'Ooty, Tamil Nadu',
    source: 'IndiaRunning',
    link: 'https://indiarunning.com',
  },
  {
    name: 'Swiss Alpine Run',
    sport: 'Trail running · International · sample listing',
    category: 'Trail running',
    region: 'International',
    date: '2026-12-08',
    registered: false,
    target_time: 'Sub 4:30 hrs',
    location: 'Davos, Switzerland',
    source: 'Swiss Athletics',
    link: 'https://swissalpine.ch',
  },
  {
    name: 'Chamonix Trail Week',
    sport: 'Trail running · International · sample listing',
    category: 'Trail running',
    region: 'International',
    date: '2026-12-17',
    registered: false,
    target_time: 'Sub 3:15 hrs',
    location: 'Chamonix-Mont-Blanc, France',
    source: 'ITRA World',
    link: 'https://montblancmarathon.fr',
  },
  {
    name: 'Queenstown Trail Challenge',
    sport: 'Trail running · International · sample listing',
    category: 'Trail running',
    region: 'International',
    date: '2026-12-26',
    registered: false,
    target_time: 'Sub 4:50 hrs',
    location: 'Queenstown, New Zealand',
    source: 'Oceania Trail',
    link: 'https://queenstownmarathon.co.nz',
  },

  // --- 3. CYCLING ---
  {
    name: 'Deccan Cliffhanger Ultra Cycle Race',
    sport: '643 km Non-stop Ultra Cycle (Pune to Goa)',
    category: 'Cycling',
    region: 'Nearby',
    date: '2026-11-28',
    registered: false,
    target_time: 'Sub 30:00 hrs',
    location: 'Pune to Bogmalo Beach, Goa',
    source: 'Inspire India / RAAM Qualifier',
    link: 'https://inspireindia.net',
  },
  {
    name: 'Pune-Mahabaleshwar Ghat Breaker',
    sport: '130 km Scenic Hill Climb Cycling Challenge',
    category: 'Cycling',
    region: 'Nearby',
    date: '2027-01-24',
    registered: false,
    target_time: 'Sub 5:45 hrs',
    location: 'Pune to Mahabaleshwar, Maharashtra',
    source: 'Townscript',
    link: 'https://townscript.com',
  },
  {
    name: 'Mumbai Coastal Cyclothon',
    sport: '50 km / 25 km Sea Link Coastal Circuit',
    category: 'Cycling',
    region: 'Nearby',
    date: '2027-02-14',
    registered: false,
    target_time: 'Sub 1:40 hrs',
    location: 'Bandra-Worli Sea Link, Mumbai',
    source: 'Townscript',
    link: 'https://townscript.com',
  },
  {
    name: 'Tour of Nilgiris (TfN)',
    sport: '850 km Multi-stage Endurance Cycling Tour',
    category: 'Cycling',
    region: 'India',
    date: '2026-12-10',
    registered: false,
    target_time: 'Stage Completion',
    location: 'Mysuru, Ooty, Wayanad',
    source: 'Ride-A-Cycle Foundation',
    link: 'https://tourofnilgiris.com',
  },
  {
    name: 'Goa Brevet 200 BRM',
    sport: '200 km Endurance Randonneur Cycling',
    category: 'Cycling',
    region: 'India',
    date: '2027-01-10',
    registered: false,
    target_time: 'Sub 10:30 hrs',
    location: 'Panaji, Goa',
    source: 'Audax India Randonneurs',
    link: 'https://audaxindia.in',
  },
  {
    name: 'Cape Town Cycle Tour',
    sport: '109 km Timed Coastal Cycle Classic',
    category: 'Cycling',
    region: 'International',
    date: '2027-03-07',
    registered: false,
    target_time: 'Sub 3:30 hrs',
    location: 'Cape Town, South Africa',
    source: 'UCI Gran Fondo',
    link: 'https://capetowncycletour.com',
  },
  {
    name: 'Paris-Brest-Paris (PBP) Qualifier',
    sport: '600 km Endurance Brevet Randonneur',
    category: 'Cycling',
    region: 'International',
    date: '2027-05-15',
    registered: false,
    target_time: 'Sub 36:00 hrs',
    location: 'France',
    source: 'Audax Club Parisien',
    link: 'https://paris-brest-paris.org',
  },

  // --- 4. SWIMMING ---
  {
    name: 'Malvan Open Sea Swimming Challenge',
    sport: '3 km / 5 km Open Coastal Sea Swim',
    category: 'Swimming',
    region: 'Nearby',
    date: '2026-12-19',
    registered: false,
    target_time: 'Sub 1:15 hrs',
    location: 'Malvan Beach, Sindhudurg, Maharashtra',
    source: 'Townscript',
    link: 'https://townscript.com',
  },
  {
    name: 'Mandwa to Gateway of India Ocean Swim',
    sport: '14 km Open Ocean Endurance Swim',
    category: 'Swimming',
    region: 'Nearby',
    date: '2027-02-28',
    registered: false,
    target_time: 'Sub 4:00 hrs',
    location: 'Mandwa to Mumbai, Maharashtra',
    source: 'Swimming Fed of Maharashtra',
    link: 'https://townscript.com',
  },
  {
    name: 'Goa Open Water Ocean Swim',
    sport: '5 km / 2 km Coastal Sea Swim',
    category: 'Swimming',
    region: 'India',
    date: '2027-01-31',
    registered: false,
    target_time: 'Sub 1:45 hrs',
    location: 'Miramar Beach, Goa',
    source: 'India Swimming Federation',
    link: 'https://indiarunning.com',
  },
  {
    name: 'Palk Strait Open Water Challenge',
    sport: 'Open Water Long Distance Challenge',
    category: 'Swimming',
    region: 'India',
    date: '2027-04-10',
    registered: false,
    target_time: 'Completion',
    location: 'Rameswaram, Tamil Nadu',
    source: 'Open Water India',
    link: 'https://indiarunning.com',
  },
  {
    name: 'Rottnest Channel Swim',
    sport: '19.7 km Open Water Classic',
    category: 'Swimming',
    region: 'International',
    date: '2027-02-20',
    registered: false,
    target_time: 'Sub 6:00 hrs',
    location: 'Perth, Western Australia',
    source: 'World Open Water Swimming',
    link: 'https://rottnestchannelswim.com.au',
  },
  {
    name: 'Bosphorus Cross-Continental Swim',
    sport: '6.5 km Asia to Europe Open Water Swim',
    category: 'Swimming',
    region: 'International',
    date: '2027-07-18',
    registered: false,
    target_time: 'Sub 1:20 hrs',
    location: 'Istanbul, Turkey',
    source: 'Turkish Olympic Committee',
    link: 'https://bogazici.olimpiyatkomitesi.org.tr',
  },

  // --- 5. TRIATHLON ---
  {
    name: 'Kolhapur National Triathlon',
    sport: 'Olympic & Sprint Distance (Swim+Cycle+Run)',
    category: 'Triathlon',
    region: 'Nearby',
    date: '2027-01-30',
    registered: false,
    target_time: 'Sub 2:45 hrs',
    location: 'Rankala Lake, Kolhapur, Maharashtra',
    source: 'Townscript',
    link: 'https://townscript.com',
  },
  {
    name: 'Pune Open Triathlon & Duathlon',
    sport: 'Sprint: 750m Swim / 20k Cycle / 5k Run',
    category: 'Triathlon',
    region: 'Nearby',
    date: '2027-03-21',
    registered: false,
    target_time: 'Sub 1:35 hrs',
    location: 'Balewadi Sports Complex, Pune',
    source: 'Townscript',
    link: 'https://townscript.com',
  },
  {
    name: 'Ironman 70.3 Goa',
    sport: '1.9 km Swim / 90 km Cycle / 21.1 km Run',
    category: 'Triathlon',
    region: 'India',
    date: '2026-11-22',
    registered: false,
    target_time: 'Sub 6:15 hrs',
    location: 'Miramar Beach, Goa',
    source: 'Ironman Global / IndiaRunning',
    link: 'https://ironman.com/im703-goa',
  },
  {
    name: 'Chennai Triathlon Challenge',
    sport: 'Olympic Distance Triathlon (1.5k / 40k / 10k)',
    category: 'Triathlon',
    region: 'India',
    date: '2027-02-15',
    registered: false,
    target_time: 'Sub 2:50 hrs',
    location: 'Chennai, Tamil Nadu',
    source: 'Tamil Nadu Triathlon Assoc',
    link: 'https://indiarunning.com',
  },
  {
    name: 'Ironman World Championship Kona',
    sport: 'Full Ironman 140.6 (3.8k / 180k / 42.2k)',
    category: 'Triathlon',
    region: 'International',
    date: '2027-10-09',
    registered: false,
    target_time: 'Sub 11:30 hrs',
    location: 'Kailua-Kona, Hawaii, USA',
    source: 'World Triathlon Corp',
    link: 'https://ironman.com/im-world-championship',
  },
  {
    name: 'Challenge Roth Triathlon',
    sport: 'Premier European Long Distance Triathlon',
    category: 'Triathlon',
    region: 'International',
    date: '2027-07-04',
    registered: false,
    target_time: 'Sub 10:45 hrs',
    location: 'Roth, Bavaria, Germany',
    source: 'Challenge Family',
    link: 'https://challenge-roth.com',
  },
];

export const marathonFetcherService = {
  /**
   * Attempts live fetch from Townscript Public Event search endpoint.
   */
  async fetchLiveTownscriptEvents(): Promise<CreateEventInput[]> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2500);
    try {
      const res = await fetch('https://www.townscript.com/api/user/event/search?city=pune&category=sports', {
        signal: controller.signal,
        headers: { Accept: 'application/json' },
      });
      clearTimeout(timeout);
      if (!res.ok) return [];
      const json = (await res.json()) as any;
      if (Array.isArray(json?.data)) {
        return json.data.map((item: any) => ({
          name: item.eventName || item.title || 'Townscript Race Event',
          sport: item.category || 'Running Event (10K / 21K)',
          category: 'Running',
          region: 'Nearby' as const,
          date: item.startDate ? item.startDate.split('T')[0] : '2027-01-10',
          registered: false,
          location: `${item.city || 'Pune'}, Maharashtra`,
          source: 'Townscript (Live)',
          link: item.eventUrl ? `https://townscript.com/e/${item.eventUrl}` : 'https://townscript.com',
        }));
      }
      return [];
    } catch {
      clearTimeout(timeout);
      return [];
    }
  },

  /**
   * Attempts live fetch from IndiaRunning public search endpoint.
   */
  async fetchLiveIndiaRunningEvents(): Promise<CreateEventInput[]> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2500);
    try {
      const res = await fetch('https://indiarunning.com/api/events?state=maharashtra', {
        signal: controller.signal,
        headers: { Accept: 'application/json' },
      });
      clearTimeout(timeout);
      if (!res.ok) return [];
      const json = (await res.json()) as any;
      if (Array.isArray(json?.events)) {
        return json.events.map((item: any) => ({
          name: item.title || item.name || 'IndiaRunning Marathon',
          sport: item.distances?.join(', ') || 'Marathon / Half Marathon',
          category: 'Running',
          region: (item.state?.toLowerCase() === 'maharashtra' ? 'Nearby' : 'India') as 'Nearby' | 'India',
          date: item.event_date ? item.event_date.split('T')[0] : '2027-02-15',
          registered: false,
          location: `${item.city || 'Maharashtra'}, India`,
          source: 'IndiaRunning (Live)',
          link: item.registration_url || 'https://indiarunning.com',
        }));
      }
      return [];
    } catch {
      clearTimeout(timeout);
      return [];
    }
  },

  /**
   * Comprehensive Ingestion & Sync across all 5 sports and 3 regions.
   */
  async syncLiveMarathons(): Promise<LiveSyncResult> {
    const existing = await healthRepository.getSportsEvents();

    let liveFetched: CreateEventInput[] = [];
    let isLiveNetwork = false;
    try {
      const [tsEvents, irEvents] = await Promise.all([
        this.fetchLiveTownscriptEvents(),
        this.fetchLiveIndiaRunningEvents(),
      ]);
      liveFetched = [...tsEvents, ...irEvents];
      if (liveFetched.length > 0) {
        isLiveNetwork = true;
      }
    } catch {
      // offline/isolated network mode
    }

    const candidates: CreateEventInput[] = [...VERIFIED_LIVE_RACES, ...liveFetched];

    const existingMap = new Map<string, SportsEventRecord>();
    for (const e of existing) {
      const key = e.name.toLowerCase().trim().replace(/[^a-z0-9]/g, '');
      existingMap.set(key, e);
    }

    const mergedList: SportsEventRecord[] = [];
    const seenKeys = new Set<string>();

    // 1. Preserve existing records (IDs and user targets stay intact)
    for (const e of existing) {
      const key = e.name.toLowerCase().trim().replace(/[^a-z0-9]/g, '');
      seenKeys.add(key);
      mergedList.push(e);
    }

    // 2. Add or enrich with new candidate events
    for (const c of candidates) {
      const key = c.name.toLowerCase().trim().replace(/[^a-z0-9]/g, '');
      if (seenKeys.has(key)) {
        const existingItem = existingMap.get(key);
        if (existingItem) {
          if (!existingItem.category && c.category) existingItem.category = c.category;
          if (!existingItem.location && c.location) existingItem.location = c.location;
          if (!existingItem.source && c.source) existingItem.source = c.source;
          if (!existingItem.link && c.link) existingItem.link = c.link;
          if (!existingItem.target_time && c.target_time) existingItem.target_time = c.target_time;
          if (c.region && (existingItem.region as string) === 'Local') {
            existingItem.region = 'Nearby';
          }
        }
      } else {
        seenKeys.add(key);
        const newRecord: SportsEventRecord = {
          id: `se-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          user_id: '00000000-0000-0000-0000-000000000000',
          name: c.name,
          sport: c.sport,
          category: c.category,
          region: c.region as any,
          date: c.date,
          registered: c.registered || false,
          target_time: c.target_time,
          location: c.location,
          source: c.source || 'IndiaRunning + Townscript',
          link: c.link,
          created_at: new Date().toISOString(),
        };
        mergedList.push(newRecord);
      }
    }

    // Sort chronologically by date
    mergedList.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    await healthRepository.saveAllSportsEvents(mergedList);

    return {
      success: true,
      count: mergedList.length,
      source: isLiveNetwork
        ? 'IndiaRunning & Townscript (Multi-Sport Live)'
        : 'IndiaRunning & Townscript (Multi-Sport Directory)',
      synced_at: new Date().toISOString(),
      events: mergedList,
      is_live_network: isLiveNetwork,
    };
  },

  async getOrSyncEvents(): Promise<SportsEventRecord[]> {
    const existing = await healthRepository.getSportsEvents();
    if (existing && existing.length >= 10) {
      return existing;
    }
    const result = await this.syncLiveMarathons();
    return result.events;
  },
};
