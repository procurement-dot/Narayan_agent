import { AiTravelOptionDto, AiTravelPlanResponseDto, GenerateAiPlanInput } from './travel.dto.js';

function formatINR(amount: number): string {
  const rounded = Math.round(amount);
  return `₹${rounded.toLocaleString('en-IN')}`;
}

interface CityInfo {
  kmFromPune: number;
  hasCommercialAirport: boolean;
  driveDurationStr: string;
  defaultTrain?: string;
  trainTime?: string;
  trainDuration?: string;
  trainFareStandard?: number;
  trainFareExec?: number;
  trainClassStandard?: string;
  trainClassExec?: string;
  cabSedanFare?: number;
  cabSuvFare?: number;
}

const MAHARASHTRA_CITIES: Record<string, CityInfo> = {
  satara: {
    kmFromPune: 110,
    hasCommercialAirport: false,
    driveDurationStr: '1h 45m via NH48',
    defaultTrain: 'Koyna Express (11029) / Sahyadri Express',
    trainTime: '12:40 PM',
    trainDuration: '2h 20m',
    trainFareStandard: 350,
    trainFareExec: 550,
    trainClassStandard: '🌿 2S / CC Chair Car',
    trainClassExec: '👑 AC Chair Car / 3A',
    cabSedanFare: 2100,
    cabSuvFare: 3200,
  },
  mahabaleshwar: {
    kmFromPune: 120,
    hasCommercialAirport: false,
    driveDurationStr: '2h 30m via Wai Ghat',
    cabSedanFare: 2600,
    cabSuvFare: 3800,
  },
  panchgani: {
    kmFromPune: 100,
    hasCommercialAirport: false,
    driveDurationStr: '2h 10m via NH48 & Pasarni Ghat',
    cabSedanFare: 2300,
    cabSuvFare: 3400,
  },
  lonavala: {
    kmFromPune: 65,
    hasCommercialAirport: false,
    driveDurationStr: '1h 00m via Expressway',
    defaultTrain: 'Deccan Express / Pragati Express',
    trainTime: '07:15 AM',
    trainDuration: '1h 00m',
    trainFareStandard: 120,
    trainFareExec: 310,
    trainClassStandard: '🌿 2S Chair Car',
    trainClassExec: '👑 AC Chair Car (CC)',
    cabSedanFare: 1600,
    cabSuvFare: 2400,
  },
  khandala: {
    kmFromPune: 70,
    hasCommercialAirport: false,
    driveDurationStr: '1h 10m via Expressway',
    cabSedanFare: 1700,
    cabSuvFare: 2500,
  },
  alibaug: {
    kmFromPune: 140,
    hasCommercialAirport: false,
    driveDurationStr: '3h 15m via Khopoli',
    cabSedanFare: 2800,
    cabSuvFare: 4200,
  },
  ahmednagar: {
    kmFromPune: 125,
    hasCommercialAirport: false,
    driveDurationStr: '2h 30m via Pune-Nagar Road',
    defaultTrain: 'Pune - Nizamuddin Express / Daund Connect',
    trainTime: '05:30 PM',
    trainDuration: '2h 15m',
    trainFareStandard: 280,
    trainFareExec: 490,
    trainClassStandard: '🌿 2S / CC',
    trainClassExec: '👑 AC Chair Car',
    cabSedanFare: 2400,
    cabSuvFare: 3500,
  },
  baramati: {
    kmFromPune: 100,
    hasCommercialAirport: false,
    driveDurationStr: '2h 00m via Hadapsar-Saswad',
    cabSedanFare: 2100,
    cabSuvFare: 3100,
  },
  karad: {
    kmFromPune: 160,
    hasCommercialAirport: false,
    driveDurationStr: '2h 45m via NH48',
    defaultTrain: 'Koyna Express (11029)',
    trainTime: '12:40 PM',
    trainDuration: '3h 15m',
    trainFareStandard: 420,
    trainFareExec: 690,
    trainClassStandard: '🌿 CC Chair Car',
    trainClassExec: '👑 AC 3A Berth',
    cabSedanFare: 2900,
    cabSuvFare: 4300,
  },
  sangli: {
    kmFromPune: 230,
    hasCommercialAirport: false,
    driveDurationStr: '4h 15m via NH48',
    defaultTrain: 'Rani Chennamma Express / Koyna Express',
    trainTime: '10:00 PM',
    trainDuration: '4h 30m',
    trainFareStandard: 520,
    trainFareExec: 890,
    trainClassStandard: '🌿 3A Berth',
    trainClassExec: '👑 2A Berth',
    cabSedanFare: 4200,
    cabSuvFare: 6200,
  },
  kolhapur: {
    kmFromPune: 235,
    hasCommercialAirport: false,
    driveDurationStr: '4h 00m via NH48',
    defaultTrain: 'Koyna Express (11029) / Mahalaxmi Express',
    trainTime: '12:40 PM',
    trainDuration: '4h 45m',
    trainFareStandard: 540,
    trainFareExec: 950,
    trainClassStandard: '🌿 3A Berth',
    trainClassExec: '👑 2A Berth / 1A',
    cabSedanFare: 4300,
    cabSuvFare: 6400,
  },
  solapur: {
    kmFromPune: 250,
    hasCommercialAirport: false,
    driveDurationStr: '4h 15m via Pune-Solapur Highway',
    defaultTrain: 'Vande Bharat Express (22225)',
    trainTime: '05:35 PM',
    trainDuration: '3h 10m',
    trainFareStandard: 640,
    trainFareExec: 1250,
    trainClassStandard: '🌿 AC Chair Car (CC)',
    trainClassExec: '👑 Executive Chair Car (EC)',
    cabSedanFare: 4500,
    cabSuvFare: 6600,
  },
  nashik: {
    kmFromPune: 210,
    hasCommercialAirport: false,
    driveDurationStr: '4h 00m via NH60',
    cabSedanFare: 3800,
    cabSuvFare: 5600,
  },
  shirdi: {
    kmFromPune: 185,
    hasCommercialAirport: false,
    driveDurationStr: '3h 45m via NH60',
    cabSedanFare: 3400,
    cabSuvFare: 5100,
  },
  aurangabad: {
    kmFromPune: 235,
    hasCommercialAirport: false,
    driveDurationStr: '4h 15m via Ahmednagar',
    defaultTrain: 'Vande Bharat Express (20706)',
    trainTime: '06:30 AM',
    trainDuration: '4h 00m',
    trainFareStandard: 580,
    trainFareExec: 1150,
    trainClassStandard: '🌿 AC Chair Car (CC)',
    trainClassExec: '👑 Executive Chair Car (EC)',
    cabSedanFare: 4200,
    cabSuvFare: 6200,
  },
  'chhatrapati sambhajinagar': {
    kmFromPune: 235,
    hasCommercialAirport: false,
    driveDurationStr: '4h 15m via Ahmednagar',
    defaultTrain: 'Vande Bharat Express (20706)',
    trainTime: '06:30 AM',
    trainDuration: '4h 00m',
    trainFareStandard: 580,
    trainFareExec: 1150,
    trainClassStandard: '🌿 AC Chair Car (CC)',
    trainClassExec: '👑 Executive Chair Car (EC)',
    cabSedanFare: 4200,
    cabSuvFare: 6200,
  },
  mumbai: {
    kmFromPune: 150,
    hasCommercialAirport: false,
    driveDurationStr: '2h 45m via Mumbai-Pune Expressway',
    defaultTrain: 'Vande Bharat Express (22226)',
    trainTime: '07:15 PM',
    trainDuration: '3h 10m',
    trainFareStandard: 560,
    trainFareExec: 1125,
    trainClassStandard: '🌿 AC Chair Car (CC)',
    trainClassExec: '👑 Executive Chair Car (EC)',
    cabSedanFare: 2450,
    cabSuvFare: 3600,
  },
  goa: {
    kmFromPune: 460,
    hasCommercialAirport: true,
    driveDurationStr: '8h 45m via NH48 & Kolhapur',
    defaultTrain: 'Goa Express (12780)',
    trainTime: '04:35 PM',
    trainDuration: '13h 05m',
    trainFareStandard: 920,
    trainFareExec: 2260,
    trainClassStandard: '🌿 3rd AC (3A) Berth',
    trainClassExec: '👑 1st AC (1A) Executive Coupe',
    cabSedanFare: 7800,
    cabSuvFare: 10800,
  },
};

export function buildRealWorldAiPlanBackend(input: GenerateAiPlanInput): AiTravelPlanResponseDto {
  const origin = (input.origin || 'Pune').trim();
  const destination = (input.destination || 'Goa').trim();
  const date = input.date;
  const isRound = !!input.isRoundTrip;
  const returnDate = input.returnDate;
  const isExec = input.seatingClass === 'executive';

  const normOrig = origin.toLowerCase();
  const normDest = destination.toLowerCase();

  let matchedCityKey = Object.keys(MAHARASHTRA_CITIES).find(
    (k) => normDest.includes(k) || k.includes(normDest)
  );

  const isReverse = !matchedCityKey && Object.keys(MAHARASHTRA_CITIES).find(
    (k) => normOrig.includes(k) || k.includes(normOrig)
  );
  if (isReverse) {
    matchedCityKey = isReverse;
  }

  const isPuneDelhi =
    (normOrig.includes('pune') && normDest.includes('delhi')) ||
    (normOrig.includes('delhi') && normDest.includes('pune'));
  const isMumbaiDelhi =
    (normOrig.includes('mumbai') && normDest.includes('delhi')) ||
    (normOrig.includes('delhi') && normDest.includes('mumbai'));
  const isPuneBengaluru =
    (normOrig.includes('pune') && (normDest.includes('bengaluru') || normDest.includes('bangalore'))) ||
    ((normOrig.includes('bengaluru') || normOrig.includes('bangalore')) && normDest.includes('pune'));

  const options: AiTravelOptionDto[] = [];
  let distanceKm = 110;
  let summaryText = '';

  // =========================================================================
  // CASE 1: NEARBY CITIES WITHOUT AIRPORTS (Satara, Mahabaleshwar, Lonavala, etc.)
  // =========================================================================
  if (matchedCityKey && !MAHARASHTRA_CITIES[matchedCityKey].hasCommercialAirport) {
    const city = MAHARASHTRA_CITIES[matchedCityKey];
    distanceKm = city.kmFromPune;

    // 1. CAB (TOP CHOICE FOR DIRECTORS)
    const baseCab = isExec ? city.cabSuvFare || 3200 : city.cabSedanFare || 2100;
    const cabCost = isRound ? Math.round(baseCab * 1.7) : baseCab;

    const cabOption: AiTravelOptionDto = {
      type: 'cab',
      title: `Intercity ${isExec ? 'Innova Crysta SUV' : 'AC Sedan'}`,
      provider: 'MakeMyTrip Outstation / Uber Intercity',
      seatingClassLabel: isExec ? '👑 Executive SUV (Innova)' : '🌿 AC Sedan (Dzire / Etios)',
      departureTime: 'Flexible (Leaves from home / office)',
      arrivalTime: `Direct drop in ${destination}`,
      returnDepartureTime: isRound ? 'Flexible Return' : undefined,
      returnArrivalTime: isRound ? 'Direct drop back at home' : undefined,
      duration: `${city.driveDurationStr}${isRound ? ' (each way)' : ''}`,
      estimatedCostInr: cabCost,
      formattedCost: formatINR(cabCost),
      offerBadge: isRound ? 'Round-Trip Package (Tolls Included)' : 'Door-to-Door Private',
      highlights: [
        `Fastest direct transit (${city.driveDurationStr})`,
        'Highway toll plaza charges included',
        'Zero waiting, zero airport/station queues',
        'Executive privacy for confidential calls & laptop work',
        isRound ? 'Vehicle remains reserved for local transit & return' : 'Doorstep pickup & direct drop',
      ],
      aiReasoning: `Top Executive Choice: ${destination} is only ${distanceKm} km away. A private executive cab gets the Director there in ${city.driveDurationStr} with zero fatigue.`,
      isRecommended: true,
    };
    options.push(cabOption);

    // 2. TRAIN
    if (city.defaultTrain) {
      const baseTrain = isExec ? city.trainFareExec || 550 : city.trainFareStandard || 350;
      const trainCost = isRound ? Math.round(baseTrain * 2.0) : baseTrain;

      const trainOption: AiTravelOptionDto = {
        type: 'train',
        title: `${city.defaultTrain} ${isRound ? '(Round-Trip)' : ''}`,
        provider: 'IRCTC / Indian Railways',
        seatingClassLabel: isExec ? city.trainClassExec || '👑 AC Chair Car' : city.trainClassStandard || '🌿 CC',
        departureTime: `${city.trainTime || '12:40 PM'} (Pune Jn)`,
        arrivalTime: `Direct at ${destination} Station`,
        returnDepartureTime: isRound ? '04:30 PM (Return Leg)' : undefined,
        returnArrivalTime: isRound ? '07:00 PM (Pune Jn)' : undefined,
        duration: `${city.trainDuration || '2h 20m'}${isRound ? ' (each way)' : ''}`,
        estimatedCostInr: trainCost,
        formattedCost: formatINR(trainCost),
        offerBadge: 'Confirmed IRCTC Seat',
        highlights: [
          'Comfortable scheduled rail journey',
          `Direct drop at ${destination} railway station`,
          'Zero airport security or baggage weight hassle',
        ],
        aiReasoning: `Reliable and economical rail connection between Pune and ${destination}.`,
        isRecommended: false,
      };
      options.push(trainOption);
    }

    summaryText = `For ${origin} ⇄ ${destination} (${distanceKm} km, ~${city.driveDurationStr}), Private Executive Cab is the top recommendation. No flights operate or are needed for this short highway distance.`;
  }
  // =========================================================================
  // CASE 2: PUNE ⇄ GOA
  // =========================================================================
  else if (matchedCityKey === 'goa') {
    distanceKm = 460;
    const fCost = isExec ? (isRound ? 8900 : 4450) : (isRound ? 5700 : 2850);
    const flightOption: AiTravelOptionDto = {
      type: 'flight',
      title: `IndiGo (Pune ${isRound ? '⇄' : '➔'} Goa)`,
      provider: 'IndiGo 6E-671 / Air India Express',
      seatingClassLabel: isExec ? '👑 Executive Priority / Flexi' : '🌿 Standard Economy',
      departureTime: '07:15 AM',
      arrivalTime: '08:25 AM',
      returnDepartureTime: isRound ? '07:30 PM' : undefined,
      returnArrivalTime: isRound ? '08:45 PM' : undefined,
      duration: `1h 10m nonstop${isRound ? ' (each way)' : ''}`,
      estimatedCostInr: fCost,
      formattedCost: formatINR(fCost),
      offerBadge: isRound ? '🏷️ Save ₹1,400 · MMT RoundTrip Special' : '🏷️ Save ₹650 · MMTSTEAL / Bank Deal',
      highlights: [
        isExec ? 'Front-row Priority Seat & Fast-track Baggage' : 'Standard Nonstop Window/Aisle Seat',
        'Direct morning flight (PNQ ➔ GOI / GOX Mopa)',
        'Shortest travel time: reaches Goa in 70 mins',
        isRound ? `Confirmed return flight on ${returnDate || 'Return date'}` : 'On-time flight guarantee',
      ],
      aiReasoning: 'Top Executive Recommendation: Saves 11+ hours over rail, Director arrives fully fresh for meetings or resort.',
      isRecommended: true,
    };
    options.push(flightOption);

    const tCost = isExec ? (isRound ? 4520 : 2260) : (isRound ? 1840 : 920);
    const trainOption: AiTravelOptionDto = {
      type: 'train',
      title: `Goa Express (12780) ${isRound ? '(Round-Trip)' : ''}`,
      provider: 'IRCTC / Indian Railways',
      seatingClassLabel: isExec ? '👑 1st AC (1A) / Executive Coupe' : '🌿 3rd AC (3A) / 3E Berth',
      departureTime: '04:35 PM (Pune Jn)',
      arrivalTime: '05:40 AM (Madgaon Jn)',
      returnDepartureTime: isRound ? '03:00 PM (12779 Madgaon)' : undefined,
      returnArrivalTime: isRound ? '03:50 AM (Pune Jn)' : undefined,
      duration: `13h 05m overnight${isRound ? ' (each way)' : ''}`,
      estimatedCostInr: tCost,
      formattedCost: formatINR(tCost),
      offerBadge: 'Tatkal 10:00 AM AC Alert',
      highlights: [
        isExec ? 'Dedicated 1A Lockable Coupe & Clean Bedding' : 'Confirmed 3A Berth with Fresh Linen',
        'Direct daily train (Pune Jn ➔ Madgaon MAO) without change',
        'Onboard pantry & dinner service included',
        'Zero airport luggage delays & generous baggage limit',
      ],
      aiReasoning: 'Goa Express (12780) is the official daily direct train from Pune to Goa (Madgaon). Highly punctual overnight journey with confirmed AC berths.',
      isRecommended: false,
    };
    options.push(trainOption);

    const cCost = isExec ? (isRound ? 18900 : 10800) : (isRound ? 13600 : 7800);
    const cabOption: AiTravelOptionDto = {
      type: 'cab',
      title: `Intercity ${isExec ? 'Innova Crysta SUV' : 'AC Sedan'}`,
      provider: 'MakeMyTrip Outstation / Savaari Intercity',
      seatingClassLabel: isExec ? '👑 Executive SUV (Innova Crysta)' : '🌿 AC Sedan (Dzire / Etios)',
      departureTime: 'Flexible (Leaves from home / office)',
      arrivalTime: 'Direct drop at destination venue / resort',
      returnDepartureTime: isRound ? 'Flexible Return' : undefined,
      returnArrivalTime: isRound ? 'Drop back at home' : undefined,
      duration: `8h 45m (door-to-door)${isRound ? ' (each way)' : ''}`,
      estimatedCostInr: cCost,
      formattedCost: formatINR(cCost),
      offerBadge: isRound ? 'Round-Trip Cab Package (Tolls Included)' : 'Door-to-Door Private',
      highlights: [
        'Scenic drive through Western Ghats (Anmod / Chorla Ghat)',
        'Direct point-to-point drop at any hotel/resort in Goa',
        'All highway tolls and inter-state permit taxes included',
        isRound ? 'Cab remains reserved for local transit in Goa' : 'Complete privacy for confidential calls',
      ],
      aiReasoning: 'Direct venue drop without needing taxi rentals in Goa. Best if traveling with family and luggage.',
      isRecommended: false,
    };
    options.push(cabOption);

    summaryText = `For Pune ⇄ Goa (460 km, ${isRound ? 'Round-Trip' : 'One-Way'}), IndiGo Flight (1h 10m) is the fastest executive choice. For rail, Goa Express (12780) offers direct daily 1A/3A overnight connectivity.`;
  }
  // =========================================================================
  // CASE 3: PUNE / MUMBAI ⇄ DELHI
  // =========================================================================
  else if (isPuneDelhi || isMumbaiDelhi) {
    distanceKm = isPuneDelhi ? 1430 : 1410;
    const fCost = isExec ? (isRound ? 14800 : 7800) : (isRound ? 9400 : 4950);
    const flightOption: AiTravelOptionDto = {
      type: 'flight',
      title: `IndiGo / Air India (${origin} ⇄ ${destination})`,
      provider: isPuneDelhi ? 'IndiGo 6E-205 / Air India AI-852' : 'IndiGo 6E-5324 / Air India AI-888',
      seatingClassLabel: isExec ? '👑 Executive Priority / Business' : '🌿 Standard Economy',
      departureTime: '07:45 AM',
      arrivalTime: '09:55 AM',
      returnDepartureTime: isRound ? '06:30 PM' : undefined,
      returnArrivalTime: isRound ? '08:40 PM' : undefined,
      duration: `2h 10m nonstop${isRound ? ' (each way)' : ''}`,
      estimatedCostInr: fCost,
      formattedCost: formatINR(fCost),
      offerBadge: isRound ? '🏷️ Save ₹1,800 · MMT RoundTrip Special' : '🏷️ Save ₹750 · Bank Deal',
      highlights: [
        isExec ? 'Front-row Priority Seat & Hot Meal' : '7kg Cabin + 15kg Baggage',
        'Direct morning flight: arrives before 10 AM meetings',
        isRound ? `Guaranteed return flight on ${returnDate || 'Return date'}` : 'High on-time reliability',
      ],
      aiReasoning: 'Top choice: Saves 17+ hours vs train, Director arrives fresh for North India meetings.',
      isRecommended: true,
    };
    options.push(flightOption);

    const trainName = isPuneDelhi
      ? 'Pune - H. Nizamuddin Duronto Express (12263)'
      : 'Mumbai Central - New Delhi Rajdhani Express (12951)';
    const tCost = isExec ? (isRound ? 9700 : 4850) : (isRound ? 4200 : 2100);
    const trainOption: AiTravelOptionDto = {
      type: 'train',
      title: `${trainName} ${isRound ? '(Round-Trip)' : ''}`,
      provider: 'IRCTC / Indian Railways',
      seatingClassLabel: isExec ? '👑 1st AC (1A) / Executive Coupe' : '🌿 3rd AC (3A) / 2A Berth',
      departureTime: isPuneDelhi ? '11:10 AM (Pune Jn)' : '05:00 PM (Mumbai Central)',
      arrivalTime: isPuneDelhi ? '06:55 AM (H. Nizamuddin)' : '08:32 AM (New Delhi)',
      returnDepartureTime: isRound ? (isPuneDelhi ? '10:55 PM (12264)' : '04:50 PM (12952)') : undefined,
      returnArrivalTime: isRound ? (isPuneDelhi ? '07:05 PM' : '08:35 AM') : undefined,
      duration: `${isPuneDelhi ? '19h 45m' : '15h 32m'}${isRound ? ' (each way)' : ''}`,
      estimatedCostInr: tCost,
      formattedCost: formatINR(tCost),
      offerBadge: 'Tatkal 10:00 AM AC Alert',
      highlights: [
        isExec ? 'Exclusive Lockable 1A Coupe with Bedding' : 'Clean 3A/2A AC Berth',
        'Complimentary dinner and breakfast included onboard',
        'Zero airport luggage queues & central railway drop',
      ],
      aiReasoning: 'Premier trunk line train with high punctuality and fully catered executive AC compartments.',
      isRecommended: false,
    };
    options.push(trainOption);

    const cabOption: AiTravelOptionDto = {
      type: 'cab',
      title: `Intercity ${isExec ? 'Innova Crysta SUV' : 'AC Sedan'}`,
      provider: 'MakeMyTrip Outstation',
      seatingClassLabel: isExec ? '👑 Executive SUV' : '🌿 AC Sedan',
      departureTime: 'Flexible',
      arrivalTime: 'Next Day Evening',
      duration: '26h 00m (each way)',
      estimatedCostInr: isRound ? 38500 : 22000,
      formattedCost: formatINR(isRound ? 38500 : 22000),
      highlights: ['Private chauffeur'],
      aiReasoning: 'Impractical for corporate executives due to 1,400+ km road distance.',
      isRecommended: false,
      feasibilityWarning: '⚠️ Long distance (1,400+ km). Flight is 12x faster, saves 24 hours, and costs 60% less.',
    };
    options.push(cabOption);

    summaryText = `For ${origin} ⇄ ${destination} (~1,400 km), Nonstop Flight (2h 10m) is the only practical executive choice. Duronto/Rajdhani offers reliable overnight rail.`;
  }
  // =========================================================================
  // CASE 4: PUNE ⇄ BENGALURU
  // =========================================================================
  else if (isPuneBengaluru) {
    distanceKm = 840;
    const fCost = isExec ? (isRound ? 11200 : 5800) : (isRound ? 7400 : 3890);
    const flightOption: AiTravelOptionDto = {
      type: 'flight',
      title: `IndiGo / Akasa Air (Pune ⇄ Bengaluru)`,
      provider: 'IndiGo 6E-457 / Akasa Air QP-1428',
      seatingClassLabel: isExec ? '👑 Executive Priority' : '🌿 Standard Economy',
      departureTime: '06:45 AM',
      arrivalTime: '08:10 AM',
      returnDepartureTime: isRound ? '08:45 PM' : undefined,
      returnArrivalTime: isRound ? '10:15 PM' : undefined,
      duration: `1h 25m nonstop${isRound ? ' (each way)' : ''}`,
      estimatedCostInr: fCost,
      formattedCost: formatINR(fCost),
      highlights: ['Direct morning connection', 'Reaches Bengaluru early for tech meetings'],
      aiReasoning: 'Top executive choice: 85 mins flight vs 17 hours train.',
      isRecommended: true,
    };
    options.push(flightOption);

    const tCost = isExec ? (isRound ? 3700 : 1850) : (isRound ? 2580 : 1290);
    const trainOption: AiTravelOptionDto = {
      type: 'train',
      title: `Udyan Express (11301) ${isRound ? '(Round-Trip)' : ''}`,
      provider: 'IRCTC / Indian Railways',
      seatingClassLabel: isExec ? '👑 2nd AC (2A) Berth' : '🌿 3rd AC (3A) Berth',
      departureTime: '11:45 AM (Pune Jn)',
      arrivalTime: '06:00 AM (Bengaluru SBC)',
      duration: `18h 15m${isRound ? ' (each way)' : ''}`,
      estimatedCostInr: tCost,
      formattedCost: formatINR(tCost),
      highlights: ['Direct daily train', 'Comfortable AC sleeper berths'],
      aiReasoning: 'Overnight train option for leisure or heavy baggage.',
      isRecommended: false,
    };
    options.push(trainOption);

    const cabOption: AiTravelOptionDto = {
      type: 'cab',
      title: `Intercity ${isExec ? 'Innova Crysta SUV' : 'AC Sedan'}`,
      provider: 'MakeMyTrip Outstation',
      seatingClassLabel: isExec ? '👑 Executive SUV' : '🌿 AC Sedan',
      departureTime: 'Flexible',
      arrivalTime: 'Next Day',
      duration: `14h 30m via NH48${isRound ? ' (each way)' : ''}`,
      estimatedCostInr: isRound ? 29000 : 16500,
      formattedCost: formatINR(isRound ? 29000 : 16500),
      highlights: ['Highway transit'],
      aiReasoning: 'Long drive via NH48.',
      isRecommended: false,
      feasibilityWarning: '⚠️ 840 km road distance. Flight is 10x faster and recommended.',
    };
    options.push(cabOption);

    summaryText = `For Pune ⇄ Bengaluru (840 km), Direct Flight (1h 25m) is strongly recommended for directors.`;
  }
  // =========================================================================
  // CASE 5: GENERIC INTERCITY WITH COMMERCIAL AIRPORT
  // =========================================================================
  else {
    distanceKm = 550;
    const roundMul = isRound ? 1.88 : 1.0;

    const baseF = Math.round(3200 + distanceKm * 1.5);
    const fCost = Math.round(baseF * (isExec ? 1.4 : 1.0) * roundMul);
    const flightOption: AiTravelOptionDto = {
      type: 'flight',
      title: `Scheduled Airline (${origin} ${isRound ? '⇄' : '➔'} ${destination})`,
      provider: 'IndiGo / Air India Express',
      seatingClassLabel: isExec ? '👑 Executive Priority / Business' : '🌿 Standard Economy',
      departureTime: '07:30 AM',
      arrivalTime: '09:40 AM',
      returnDepartureTime: isRound ? '06:30 PM' : undefined,
      returnArrivalTime: isRound ? '08:40 PM' : undefined,
      duration: `2h 10m${isRound ? ' (each way)' : ''}`,
      estimatedCostInr: fCost,
      formattedCost: formatINR(fCost),
      highlights: [
        isExec ? 'Priority Seat with Fast-track Baggage' : 'Standard Economy Seat',
        'Direct connection between major hubs',
        isRound ? `Return flight on ${returnDate || 'Return date'}` : 'High punctuality rate',
      ],
      aiReasoning: 'Recommended option for saving travel time between distant business hubs.',
      isRecommended: true,
    };
    options.push(flightOption);

    const baseT = Math.round(distanceKm * 1.8);
    const tCost = Math.round(baseT * (isExec ? 1.7 : 1.0) * roundMul);
    const trainOption: AiTravelOptionDto = {
      type: 'train',
      title: `Superfast Express (${origin} ➔ ${destination})`,
      provider: 'IRCTC / Indian Railways',
      seatingClassLabel: isExec ? '👑 1st AC / 2A Berth' : '🌿 3rd AC (3A) Berth',
      departureTime: '06:30 AM',
      arrivalTime: '03:45 PM',
      returnDepartureTime: isRound ? '04:15 PM' : undefined,
      returnArrivalTime: isRound ? '11:30 PM' : undefined,
      duration: `${Math.round(distanceKm / 65)}h 00m${isRound ? ' (each way)' : ''}`,
      estimatedCostInr: tCost,
      formattedCost: formatINR(tCost),
      offerBadge: 'Tatkal 10:00 AM AC Alert',
      highlights: ['Confirmed AC reservation', 'Zero luggage restrictions'],
      aiReasoning: 'Reliable rail connection with confirmed AC booking.',
      isRecommended: false,
    };
    options.push(trainOption);

    const baseC = Math.round(distanceKm * 16 + 500);
    const cCost = Math.round(baseC * (isExec ? 1.4 : 1.0) * (isRound ? 1.75 : 1.0));
    const cabOption: AiTravelOptionDto = {
      type: 'cab',
      title: `Intercity ${isExec ? 'Innova Crysta SUV' : 'AC Sedan'}`,
      provider: 'MakeMyTrip Outstation / Uber Intercity',
      seatingClassLabel: isExec ? '👑 Executive SUV (Innova)' : '🌿 AC Sedan (Dzire / Etios)',
      departureTime: 'Flexible (Leaves from home / office)',
      arrivalTime: 'Direct drop at destination address',
      duration: `${Math.round(distanceKm / 55)}h 00m (door-to-door)${isRound ? ' (each way)' : ''}`,
      estimatedCostInr: cCost,
      formattedCost: formatINR(cCost),
      highlights: ['Door-to-door private transit', 'Highway tolls included'],
      aiReasoning: 'Direct drop without changing vehicles.',
      isRecommended: false,
      feasibilityWarning: `⚠️ Distance is approx ${distanceKm} km. Flight is much faster and recommended.`,
    };
    options.push(cabOption);

    summaryText = `Travel comparison for ${origin} ⇄ ${destination} (~${distanceKm} km, ${isRound ? 'Round-Trip' : 'One-Way'}). Flight is fastest while Train offers economical AC comfort.`;
  }

  return {
    origin,
    destination,
    date,
    returnDate,
    isRoundTrip: isRound,
    seatingClass: input.seatingClass || 'executive',
    preferredTime: input.preferredTime || 'Morning / Flexible',
    distanceKm,
    aiSummary: summaryText,
    options,
  };
}
