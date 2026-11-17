import { supabase } from '../../config/supabase.js';

export async function seedDemoTravel(userId = '00000000-0000-0000-0000-000000000001') {
  console.log('[Seed] Seeding demo travel data into Supabase...');

  // 1. Seed Trips
  const tripsData = [
    {
      id: '00000000-0000-0000-0001-000000000001',
      user_id: userId,
      title: 'Winter Family Break',
      route: 'Pune (PNQ) ➔ Goa (GOI)',
      start_date: '2026-12-24',
      end_date: '2026-12-29',
      status: 'confirmed',
      details: 'Indigo 6E 428 · Lemon Tree Beach Resort · 5 nights',
      purpose: 'family',
      budget_inr: 85000,
    },
    {
      id: '00000000-0000-0000-0001-000000000002',
      user_id: userId,
      title: 'Sports School Partners Meet',
      route: 'Pune (PNQ) ➔ Delhi (DEL)',
      start_date: '2026-11-20',
      end_date: '2026-11-22',
      status: 'planning',
      details: 'Meeting with academic partners & sports authorities.',
      purpose: 'business',
      budget_inr: 32000,
    },
    {
      id: '00000000-0000-0000-0001-000000000003',
      user_id: userId,
      title: 'Bangalore Marathon 2026',
      route: 'Pune (PNQ) ➔ Bangalore (BLR)',
      start_date: '2026-08-14',
      end_date: '2026-08-17',
      status: 'completed',
      details: 'Bengaluru Midnight Marathon 42k race and team meetup.',
      purpose: 'personal',
      budget_inr: 28000,
    },
  ];

  for (const trip of tripsData) {
    const { error } = await supabase.from('travel_trips').upsert(trip, { onConflict: 'id' });
    if (error) console.error(`[Seed Error] Trip ${trip.title}:`, error.message);
  }

  // 2. Seed Itinerary Segments for Trip 1
  const segmentsData = [
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
    },
  ];

  for (const seg of segmentsData) {
    const { error } = await supabase.from('travel_segments').upsert(seg, { onConflict: 'id' });
    if (error) console.error(`[Seed Error] Segment ${seg.title}:`, error.message);
  }

  // 3. Seed Airfare Price Alerts
  const fareAlertsData = [
    {
      id: '00000000-0000-0000-0003-000000000001',
      user_id: userId,
      route: 'PNQ ➔ DEL (20 Nov)',
      journey_date: '2026-11-20',
      current_fare_inr: 4850,
      typical_fare_inr: 6400,
      target_fare_inr: 5000,
      status_note: '24% below average · Good time to book',
      booking_url: 'https://www.makemytrip.com/flights',
      is_active: true,
    },
    {
      id: '00000000-0000-0000-0003-000000000002',
      user_id: userId,
      route: 'PNQ ➔ BLR (Weekend)',
      journey_date: '2026-12-05',
      current_fare_inr: 3200,
      typical_fare_inr: 3500,
      target_fare_inr: 3000,
      status_note: 'Typical pricing',
      booking_url: 'https://www.makemytrip.com/flights',
      is_active: true,
    },
  ];

  for (const fare of fareAlertsData) {
    const { error } = await supabase.from('travel_fare_alerts').upsert(fare, { onConflict: 'id' });
    if (error) console.error(`[Seed Error] Fare Alert ${fare.route}:`, error.message);
  }

  // 4. Seed Travel Documents
  const documentsData = [
    {
      id: '00000000-0000-0000-0004-000000000001',
      user_id: userId,
      family_member: 'Neha',
      doc_type: 'passport',
      doc_title: "Neha's Passport Renewal Needed",
      doc_number_masked: 'Z****921',
      expiry_date: '2027-06-15',
      alert_lead_months: 8,
      notes: 'Expires in 7 months (June 2027). Recommend renewal before booking international summer travel.',
      status: 'renewal_needed',
    },
    {
      id: '00000000-0000-0000-0004-000000000002',
      user_id: userId,
      family_member: 'Nikhil',
      doc_type: 'passport',
      doc_title: "Nikhil's Indian Passport",
      doc_number_masked: 'P****481',
      expiry_date: '2031-10-20',
      alert_lead_months: 6,
      notes: 'Valid for next 5 years. All active visas stamped.',
      status: 'valid',
    },
    {
      id: '00000000-0000-0000-0004-000000000003',
      user_id: userId,
      family_member: 'Prayan',
      doc_type: 'passport',
      doc_title: "Prayan's Minor Passport",
      doc_number_masked: 'M****103',
      expiry_date: '2029-04-12',
      alert_lead_months: 6,
      notes: 'Child 5-year passport. Valid for domestic and international sports tours.',
      status: 'valid',
    },
  ];

  for (const doc of documentsData) {
    const { error } = await supabase.from('travel_documents').upsert(doc, { onConflict: 'id' });
    if (error) console.error(`[Seed Error] Document ${doc.doc_title}:`, error.message);
  }

  // 5. Seed Tatkal Assistant
  const tatkalData = [
    {
      id: '00000000-0000-0000-0005-000000000001',
      user_id: userId,
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
    },
  ];

  for (const rail of tatkalData) {
    const { error } = await supabase.from('travel_tatkal_assist').upsert(rail, { onConflict: 'id' });
    if (error) console.error(`[Seed Error] Tatkal ${rail.train_name}:`, error.message);
  }

  console.log('[Seed] Demo travel data seeding finished!');
}
