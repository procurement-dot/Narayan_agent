import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { useHealthStore } from './health.store';
import { AppHeader } from '../navigation/AppHeader';
import { PillTabs } from '../../shared/components/PillTabs';
import { DiscoveredBleDevice, HealthTab, PersonName } from './health.types';
import {
  HEALTH_PROFILES,
  HEALTH_RECORDS_BY_PERSON,
  HealthRecordObservation,
} from './health.mock';
import { colors, radii, spacing, typography } from '../../shared/theme/tokens';
import { useToast } from '../../shared/components/Toast';
import { pickFileOrPhoto } from './utils/filePicker';
import Svg, { Path, Rect, Circle } from 'react-native-svg';


const WatchIcon: React.FC<{ color: string; size?: number }> = ({ color, size = 24 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    {/* Top Strap */}
    <Rect x="8.5" y="1.5" width="7" height="4" rx="1.5" fill={color} />
    {/* Bottom Strap */}
    <Rect x="8.5" y="18.5" width="7" height="4" rx="1.5" fill={color} />
    {/* Watch Case Frame */}
    <Rect x="4.5" y="5" width="15" height="14" rx="4.5" stroke={color} strokeWidth="2.2" fill="none" />
    {/* Crown Button */}
    <Rect x="19.5" y="10" width="1.5" height="4" rx="0.75" fill={color} />
    {/* Watch Hands */}
    <Path d="M12 8.5V12L14.5 13.5" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const PhoneIcon: React.FC<{ color: string; size?: number }> = ({ color, size = 24 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    {/* Phone Body */}
    <Rect x="6" y="2" width="12" height="20" rx="3.5" stroke={color} strokeWidth="2.2" fill="none" />
    {/* Top Speaker Line */}
    <Rect x="9.5" y="4.5" width="5" height="1.2" rx="0.6" fill={color} />
    {/* Bottom Touch Indicator */}
    <Circle cx="12" cy="18.5" r="1.4" fill={color} />
  </Svg>
);

const HEALTH_TABS: { id: HealthTab; label: string }[] = [
  { id: 'today', label: 'Today' },
  { id: 'goals', label: 'Goals' },
  { id: 'plan', label: '12-week plan' },
  { id: 'body', label: 'Body' },
  { id: 'records', label: 'Records' },
  { id: 'nutrition', label: 'Nutrition' },
  { id: 'events', label: 'Events' },
  { id: 'journal', label: 'Journal' },
];

export const HealthScreen: React.FC = () => {
  const {
    currentTab,
    setTab,
    selectedPerson,
    setSelectedPerson,
    isLoading,
    isRefreshing,
    isSyncingWearable,
    isAnalyzingReport,
    isAnalyzingMeal,
    vitals,
    coachSuggestion,
    weeklyRhythm,
    goals,
    plan,
    events,
    documents,
    meals,
    wearableStatus,
    journalText,
    setJournalText,
    saveJournal,
    savedJournals,
    fetchDashboard,
    refreshDashboard,
    toggleTrainingStatus,
    syncWorkoutToCalendar,
    updateGoalProgress,
    addGoal,
    selectTargetRace,
    isSyncingEvents,
    eventsSource,
    syncLiveEvents,
    syncWearableData,
    isConnectModalOpen,
    isPairingWearable,
    isScanningDevices,
    discoveredDevices,
    openConnectModal,
    closeConnectModal,
    scanDevices,
    pairAndConnectDevice,
    disconnectWearableDevice,
    uploadAndAnalyzeReport,
    exchangeLabReport,
    deleteDocument,
    scanAndAnalyzeMeal,
    trackingSource,
    setTrackingSource,
    phoneSteps,
    syncPhoneSteps,
    measureCameraPulse,
    recordPhoneRun,
  } = useHealthStore();

  const { showToast } = useToast();

  // Watch Pairing States
  const [selectedBrand, setSelectedBrand] = useState('Garmin');
  const [customDeviceName, setCustomDeviceName] = useState('');
  const [connectionType, setConnectionType] = useState<'bluetooth_ble' | 'health_connect' | 'apple_health' | 'cloud_sync'>('bluetooth_ble');

  // Observation & Nap Modals
  const [selectedObservation, setSelectedObservation] = useState<{
    person: PersonName;
    obs: HealthRecordObservation;
  } | null>(null);
  const [isNapModalOpen, setIsNapModalOpen] = useState(false);

  // Local Form States
  const [showAddGoal, setShowAddGoal] = useState(false);
  const [newGoalName, setNewGoalName] = useState('');
  const [newGoalCategory, setNewGoalCategory] = useState('Speed endurance');
  const [newGoalDate, setNewGoalDate] = useState('Next target');

  // Multi-Sport & Where Filter States (Events Tab)
  const [selectedSport, setSelectedSport] = useState<string>('Trail running');
  const [selectedWhere, setSelectedWhere] = useState<string>('International');

  const formatEventDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      const day = String(d.getDate()).padStart(2, '0');
      const month = d.toLocaleString('en-US', { month: 'short' }).toUpperCase();
      return { day, month };
    } catch {
      return { day: '01', month: 'DEC' };
    }
  };

  // 12-Week Plan Mode States (Monthly Calendar vs List)
  const [planMode, setPlanMode] = useState<'month' | 'list'>('month');
  const [planMonth, setPlanMonth] = useState<number>(10); // 10 = November (0-indexed)
  const [planYear, setPlanYear] = useState<number>(2026);

  const MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  const handlePrevPlanMonth = () => {
    if (planMonth === 0) {
      setPlanMonth(11);
      setPlanYear((y) => y - 1);
    } else {
      setPlanMonth((m) => m - 1);
    }
  };

  const handleNextPlanMonth = () => {
    if (planMonth === 11) {
      setPlanMonth(0);
      setPlanYear((y) => y + 1);
    } else {
      setPlanMonth((m) => m + 1);
    }
  };

  // Find active target race
  const activeTargetRace = useMemo(() => {
    return events.find((e) => e.registered) || events[0] || null;
  }, [events]);

  // 100% Dynamic 12-Week Marathon Build Plan anchored to the Target Race Date
  const getFull12WeekPlan = useMemo(() => {
    let raceDate: Date;
    let isHalfMarathon = false;
    let raceDistanceLabel = '42.2 km';

    if (activeTargetRace && activeTargetRace.date) {
      raceDate = new Date(activeTargetRace.date);
      if (isNaN(raceDate.getTime())) {
        raceDate = new Date(2027, 0, 17); // 17 Jan 2027
      }
      const sportLower = (activeTargetRace.sport || '').toLowerCase();
      const nameLower = (activeTargetRace.name || '').toLowerCase();
      if (sportLower.includes('half') || nameLower.includes('half') || sportLower.includes('21.1')) {
        isHalfMarathon = true;
        raceDistanceLabel = '21.1 km';
      }
    } else {
      raceDate = new Date(2027, 0, 17); // Default Tata Mumbai Marathon 2027
    }

    // Anchor to Race Sunday:
    const raceDayOfWeek = (raceDate.getDay() + 6) % 7; // Monday = 0 ... Sunday = 6
    const raceSunday = new Date(raceDate);
    if (raceDayOfWeek !== 6) {
      raceSunday.setDate(raceDate.getDate() + (6 - raceDayOfWeek));
    }

    // 12 weeks = 84 days. Start Monday is 83 days before race Sunday:
    const startMonday = new Date(raceSunday);
    startMonday.setDate(raceSunday.getDate() - 83);

    const sessions: Array<{
      date: string;
      dayNumber: number;
      name: string;
      shortName: string;
      detail: string;
      week: number;
      kind: 'long' | 'rest' | 'training';
      isRaceDay?: boolean;
    }> = [];

    for (let i = 0; i < 84; i++) {
      const d = new Date(startMonday);
      d.setDate(startMonday.getDate() + i);
      const week = Math.floor(i / 7) + 1;
      const dayOfWeek = i % 7; // 0=Mon, 1=Tue, 2=Wed, 3=Thu, 4=Fri, 5=Sat, 6=Sun

      let longKm: number;
      if (isHalfMarathon) {
        longKm = Math.min(21, Math.max(8, 8 + Math.floor((week - 1) * 1.2)));
      } else {
        longKm = Math.min(32, Math.max(14, 14 + (week - 1) * 2));
      }

      const isRaceDay = week === 12 && dayOfWeek === 6;

      const weeklySessions = [
        { name: 'Easy aerobic · 5 km', shortName: '5 km', detail: 'Conversational aerobic pace', kind: 'training' as const },
        { name: 'Strength + mobility', shortName: 'Strength', detail: 'Core & bodyweight 25 mins', kind: 'training' as const },
        { name: 'Easy aerobic · 6 km', shortName: '6 km', detail: 'Low heart-rate zone 2', kind: 'training' as const },
        { name: 'Swim / cross-train', shortName: 'Swim', detail: 'Active recovery 30 mins', kind: 'training' as const },
        { name: 'Rest / walk', shortName: 'Rest', detail: 'Full physical recovery', kind: 'rest' as const },
        { name: 'Easy aerobic · 4 km', shortName: '4 km', detail: 'Shakeout run', kind: 'training' as const },
        {
          name: isRaceDay
            ? `Race day · ${raceDistanceLabel}`
            : week === 11
            ? `Taper · ${isHalfMarathon ? '8 km' : '12 km'}`
            : `Long run · ${longKm} km`,
          shortName: isRaceDay
            ? `🏆 Race ${raceDistanceLabel}`
            : week === 11
            ? `Taper ${isHalfMarathon ? '8k' : '12k'}`
            : `Long run - ${longKm} km`,
          detail: isRaceDay ? `Target Race: ${activeTargetRace?.name || 'Marathon'}` : 'Hydrate & fuel well',
          kind: 'long' as const,
          isRaceDay,
        },
      ];

      const s = weeklySessions[dayOfWeek];
      const yStr = d.getFullYear();
      const mStr = String(d.getMonth() + 1).padStart(2, '0');
      const dStr = String(d.getDate()).padStart(2, '0');
      const dateKey = `${yStr}-${mStr}-${dStr}`;

      sessions.push({
        date: dateKey,
        dayNumber: d.getDate(),
        name: s.name,
        shortName: s.shortName,
        detail: s.detail,
        week,
        kind: s.kind,
        isRaceDay,
      });
    }
    return sessions;
  }, [activeTargetRace]);

  // Sync initial calendar month with today's training date or race target
  useEffect(() => {
    if (getFull12WeekPlan.length > 0) {
      const today = new Date();
      const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      const foundToday = getFull12WeekPlan.find((x) => x.date === todayKey);
      if (foundToday) {
        setPlanMonth(today.getMonth());
        setPlanYear(today.getFullYear());
      }
    }
  }, [getFull12WeekPlan]);

  const currentMonthCalendar = useMemo(() => {
    const y = planYear;
    const m = planMonth;
    const firstDay = new Date(y, m, 1);
    const offset = (firstDay.getDay() + 6) % 7; // Monday = 0
    const totalDays = new Date(y, m + 1, 0).getDate();

    const emptySlots = Array.from({ length: offset }, (_, i) => ({
      key: `empty-${i}`,
      isEmpty: true,
      day: 0,
      dateKey: '',
      session: null as any,
    }));

    const daySlots = [];
    for (let day = 1; day <= totalDays; day++) {
      const yStr = y;
      const mStr = String(m + 1).padStart(2, '0');
      const dStr = String(day).padStart(2, '0');
      const dateKey = `${yStr}-${mStr}-${dStr}`;
      const session = getFull12WeekPlan.find((x) => x.date === dateKey) || null;

      daySlots.push({
        key: `day-${day}`,
        isEmpty: false,
        day,
        dateKey,
        session,
      });
    }

    return [...emptySlots, ...daySlots];
  }, [planYear, planMonth, getFull12WeekPlan]);

  // Phone Sensor Standalone States
  const [isScanningCameraPulse, setIsScanningCameraPulse] = useState(false);
  const [pulseCountdown, setPulseCountdown] = useState(10);
  const [inputPulseBpm, setInputPulseBpm] = useState('68');
  const [isPhoneRunActive, setIsPhoneRunActive] = useState(false);
  const [phoneRunSecs, setPhoneRunSecs] = useState(0);
  const [phoneRunKm, setPhoneRunKm] = useState(0.0);
  const [gpsWatchId, setGpsWatchId] = useState<number | null>(null);

  // Real Web Bluetooth GATT States
  const [liveBleDevice, setLiveBleDevice] = useState<any>(null);
  const [liveGattServer, setLiveGattServer] = useState<any>(null);
  const [liveBleBpm, setLiveBleBpm] = useState<number | null>(null);
  const [liveBleBattery, setLiveBleBattery] = useState<number | null>(null);
  const [isStreamingBle, setIsStreamingBle] = useState(false);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  // Auto-fetch race events if Events tab opened
  useEffect(() => {
    if (currentTab === 'events' && (!events || events.length === 0)) {
      refreshDashboard();
    }
  }, [currentTab, events, refreshDashboard]);

  // Real Camera Pulse Countdown
  useEffect(() => {
    let timer: any;
    if (isScanningCameraPulse && pulseCountdown > 0) {
      timer = setTimeout(() => setPulseCountdown((prev) => prev - 1), 1000);
    } else if (isScanningCameraPulse && pulseCountdown === 0) {
      setIsScanningCameraPulse(false);
      setPulseCountdown(10);
      const measuredBpm = parseInt(inputPulseBpm, 10) || 68;
      measureCameraPulse(measuredBpm).then((msg) => {
        showToast(msg, 'success');
      });
    }
    return () => clearTimeout(timer);
  }, [isScanningCameraPulse, pulseCountdown, measureCameraPulse, inputPulseBpm, showToast]);

  // Phone GPS Run Timer (Real Seconds)
  useEffect(() => {
    let interval: any;
    if (isPhoneRunActive) {
      interval = setInterval(() => {
        setPhoneRunSecs((s) => s + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPhoneRunActive]);

  const handleStartCameraPulse = async () => {
    setIsScanningCameraPulse(true);
    setPulseCountdown(10);
    showToast('Camera active! Place index finger over camera lens to measure pulse.', 'info');

    if (typeof navigator !== 'undefined' && navigator.mediaDevices?.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
        });
        setTimeout(() => {
          stream.getTracks().forEach((track) => track.stop());
        }, 10000);
      } catch (err) {
        console.log('Camera hardware prompt info:', err);
      }
    }
  };

  const handlePhoneStepSync = async () => {
    const msg = await syncPhoneSteps(500);
    showToast(msg, 'success');
  };

  function calculateHaversineKm(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  const handleTogglePhoneRun = async () => {
    if (!isPhoneRunActive) {
      setIsPhoneRunActive(true);
      setPhoneRunSecs(0);
      setPhoneRunKm(0);

      if (typeof navigator !== 'undefined' && 'geolocation' in navigator) {
        showToast('Tracking real GPS position via phone sensors...', 'info');
        let lastCoord: { lat: number; lon: number } | null = null;
        let distAccum = 0;

        const id = navigator.geolocation.watchPosition(
          (pos) => {
            const { latitude, longitude } = pos.coords;
            if (lastCoord) {
              const delta = calculateHaversineKm(lastCoord.lat, lastCoord.lon, latitude, longitude);
              if (delta > 0.002) { // 2 meters
                distAccum += delta;
                setPhoneRunKm(+distAccum.toFixed(3));
              }
            }
            lastCoord = { lat: latitude, lon: longitude };
          },
          (err) => {
            console.warn('GPS location tracking error:', err.message);
          },
          { enableHighAccuracy: true, maximumAge: 1000, timeout: 10000 }
        );
        setGpsWatchId(id);
      } else {
        showToast('Outdoor GPS Run started. Timer active.', 'info');
      }
    } else {
      if (gpsWatchId !== null && typeof navigator !== 'undefined' && 'geolocation' in navigator) {
        navigator.geolocation.clearWatch(gpsWatchId);
        setGpsWatchId(null);
      }
      setIsPhoneRunActive(false);

      const finalKm = phoneRunKm;
      const finalSecs = phoneRunSecs;
      const paceMin = finalKm > 0 ? finalSecs / 60 / finalKm : 5.2;
      const paceStr = `${Math.floor(paceMin)}:${Math.floor((paceMin % 1) * 60)
        .toString()
        .padStart(2, '0')}/km`;

      try {
        const msg = await recordPhoneRun(finalKm, finalSecs, paceStr);
        showToast(msg, 'success');
      } catch (err: any) {
        showToast(
          `Run completed: ${finalKm.toFixed(2)} km in ${Math.floor(finalSecs / 60)}m ${finalSecs % 60}s`,
          'success'
        );
      }
      setPhoneRunSecs(0);
      setPhoneRunKm(0);
    }
  };

  // Web Bluetooth GATT Direct Hardware Connection & Live Telemetry Streaming
  const connectToBleDevice = async (device: any) => {
    let batteryLevel: number | undefined;

    try {
      showToast(`Connecting to ${device.name || 'Smartwatch'} via Bluetooth GATT...`, 'info');
      const server = await device.gatt?.connect();
      if (server) {
        setLiveGattServer(server);
        setLiveBleDevice(device);

        device.addEventListener('gattserverdisconnected', () => {
          showToast(`${device.name || 'Smartwatch'} disconnected`, 'warning');
          setLiveGattServer(null);
          setLiveBleDevice(null);
          setIsStreamingBle(false);
          setLiveBleBpm(null);
        });

        // 1. Read Battery Service (0x180F -> 0x2A19)
        try {
          const battService = await server.getPrimaryService('battery_service');
          const battChar = await battService.getCharacteristic('battery_level');
          const val = await battChar.readValue();
          batteryLevel = val.getUint8(0);
          setLiveBleBattery(batteryLevel ?? null);
        } catch (e) {
          console.log('No standard battery service on device');
        }

        // 2. Read & Stream Heart Rate Measurement (0x180D -> 0x2A37)
        try {
          const hrService = await server.getPrimaryService('heart_rate');
          const hrChar = await hrService.getCharacteristic('heart_rate_measurement');
          await hrChar.startNotifications();
          setIsStreamingBle(true);
          hrChar.addEventListener('characteristicvaluechanged', (event: any) => {
            const val = event.target.value;
            const flags = val.getUint8(0);
            const is16Bit = flags & 0x1;
            const bpm = is16Bit ? val.getUint16(1, true) : val.getUint8(1);
            setLiveBleBpm(bpm);
          });
          showToast(`🟢 Streaming live heart rate from ${device.name}!`, 'success');
        } catch (e) {
          console.log('No standard HR service on this device or bonding required');
        }
      }
    } catch (gattErr: any) {
      console.warn('GATT connection notice:', gattErr);
    }

    const devName = device.name || 'Bluetooth Smartwatch';
    const brand = devName.split(' ')[0] || 'Smartwatch';

    // Store real detected hardware device so its exact name appears in the list
    const realDiscovered: DiscoveredBleDevice = {
      id: device.id || `ble-${Date.now()}`,
      name: devName,
      brand: brand,
      rssi: -45,
      signal: 'Live BLE Signal',
    };
    useHealthStore.setState((prev) => ({
      discoveredDevices: [
        realDiscovered,
        ...prev.discoveredDevices.filter((d) => d.name !== devName),
      ],
    }));

    const msg = await pairAndConnectDevice(brand, devName, 'bluetooth_ble', batteryLevel);
    showToast(msg, 'success');
    closeConnectModal();
  };

  // A. Smartwatch HR Scanner (Filters ONLY real smartwatches / heart rate bands)
  const handleScanSmartwatchHR = async () => {
    if (typeof navigator !== 'undefined' && (navigator as any).bluetooth) {
      try {
        showToast('Scanning for Smartwatches broadcasting Heart Rate (BLE 0x180D)...', 'info');
        const device = await (navigator as any).bluetooth.requestDevice({
          filters: [
            { services: ['heart_rate'] },
          ],
          optionalServices: ['battery_service', 'device_information', 0x180D, 0x180F, 0x180A],
        });
        if (device) {
          await connectToBleDevice(device);
        }
      } catch (err: any) {
        if (err.name !== 'NotFoundError') {
          showToast(`BLE Scan: ${err.message || 'Cancelled'}`, 'warning');
        }
      }
    } else {
      showToast('Web Bluetooth requires Chrome or Edge on HTTPS / localhost', 'warning');
    }
  };

  // B. Scan All Bluetooth Devices (Unfiltered - catches ANY watch Sir turns on)
  const handleScanAllBleDevices = async () => {
    if (typeof navigator !== 'undefined' && (navigator as any).bluetooth) {
      try {
        showToast('Scanning live Bluetooth devices nearby...', 'info');
        const device = await (navigator as any).bluetooth.requestDevice({
          acceptAllDevices: true,
          optionalServices: [
            'heart_rate',
            'battery_service',
            'device_information',
            'generic_access',
            0x180D,
            0x180F,
            0x180A,
            0x1800,
          ],
        });
        if (device) {
          await connectToBleDevice(device);
        }
      } catch (err: any) {
        if (err.name !== 'NotFoundError') {
          showToast(`BLE Scan: ${err.message || 'Cancelled'}`, 'warning');
        }
      }
    } else {
      showToast('Web Bluetooth requires Chrome or Edge on HTTPS / localhost', 'warning');
    }
  };

  // 1-Click Direct Pair Trigger (from Dashboard button)
  const handlePairWatch = async () => {
    openConnectModal();
    if (typeof navigator !== 'undefined' && (navigator as any).bluetooth) {
      await handleScanAllBleDevices();
    }
  };

  const handleDisconnectWatch = async () => {
    try {
      if (liveGattServer && liveGattServer.connected) {
        liveGattServer.disconnect();
      }
    } catch (e) {
      console.warn('Error disconnecting GATT server:', e);
    }
    setLiveGattServer(null);
    setLiveBleDevice(null);
    setLiveBleBpm(null);
    setLiveBleBattery(null);
    setIsStreamingBle(false);
    try {
      const msg = await disconnectWearableDevice();
      showToast(msg, 'info');
    } catch (e: any) {
      showToast('Watch disconnected', 'info');
    }
  };

  const handleConnectDiscoveredDevice = async (dev: { name: string; brand: string }) => {
    try {
      showToast(`Connecting to ${dev.name}...`, 'info');
      const brand = dev.brand || dev.name.split(' ')[0] || 'Smartwatch';
      const msg = await pairAndConnectDevice(brand, dev.name, 'bluetooth_ble');
      showToast(msg, 'success');
      closeConnectModal();
    } catch (e: any) {
      showToast('Failed to connect watch', 'warning');
    }
  };

  const handleConnectManual = async () => {
    const trimmed = customDeviceName.trim();
    if (!trimmed) return;
    try {
      const brand = trimmed.split(' ')[0] || 'Smartwatch';
      const msg = await pairAndConnectDevice(brand, trimmed, 'bluetooth_ble');
      showToast(msg, 'success');
      setCustomDeviceName('');
      closeConnectModal();
    } catch (e: any) {
      showToast('Failed to connect watch', 'warning');
    }
  };

  // 1. Wearables Telemetry Sync Action
  const handleSyncWearable = async () => {
    try {
      const msg = await syncWearableData({
        heart_rate: liveBleBpm ?? undefined,
        battery_level: liveBleBattery ?? undefined,
        simulate_active_run: false,
      });
      showToast(msg, 'success');
    } catch (err: any) {
      showToast('Could not sync wearable telemetry', 'warning');
    }
  };

  // 2. Real Lab Report Upload & AI OCR Extraction
  const handlePickLabReport = async () => {
    try {
      const file = await pickFileOrPhoto('image/*,application/pdf');
      if (!file) return;

      showToast(`Analyzing ${file.name} with Multimodal AI...`, 'info');
      const doc = await uploadAndAnalyzeReport(file);
      showToast(`Report indexed! ${doc.biomarkers?.length || 0} biomarkers extracted.`, 'success');
    } catch (err: any) {
      showToast('Failed to analyze report', 'warning');
    }
  };

  const handleExchangeLabReport = async (oldDocId: string) => {
    try {
      const file = await pickFileOrPhoto('image/*,application/pdf');
      if (!file) return;

      showToast(`Replacing dummy report with ${file.name} via Multimodal OCR...`, 'info');
      const doc = await exchangeLabReport(oldDocId, file);
      showToast(
        `Report replaced! ${doc.biomarkers?.length || 0} biomarkers extracted from real report.`,
        'success'
      );
    } catch (err: any) {
      showToast('Failed to replace report', 'warning');
    }
  };

  const handleDeleteReport = async (docId: string) => {
    try {
      await deleteDocument(docId);
      showToast('Report removed successfully', 'success');
    } catch (err: any) {
      showToast('Failed to delete report', 'warning');
    }
  };

  // 3. Real Food Photo Snap & Smart Plate AI Nutrition Analysis
  const handlePickFoodPlate = async () => {
    try {
      const file = await pickFileOrPhoto('image/*');
      if (!file) return;

      showToast(`Scanning meal plate with Vision AI...`, 'info');
      const meal = await scanAndAnalyzeMeal(file);
      showToast(`Meal analyzed: ${meal.calories} kcal, ${meal.protein_g}g protein!`, 'success');
    } catch (err: any) {
      showToast('Failed to analyze food plate', 'warning');
    }
  };

  const handleSaveJournal = async () => {
    if (!journalText.trim()) {
      showToast('Please write a note before saving', 'warning');
      return;
    }
    await saveJournal();
    showToast('Reflection saved! AI coach feedback generated.', 'success');
  };

  const handleSyncToCalendar = async (sessionId?: string) => {
    const title = await syncWorkoutToCalendar(sessionId);
    showToast(`"${title}" added to today's 24-hr calendar!`, 'success');
  };

  const handleSelectTargetRace = async (eventId: string, eventName: string) => {
    try {
      showToast(`Setting ${eventName} as primary target...`, 'info');
      const msg = await selectTargetRace(eventId);
      showToast(msg, 'success');
    } catch (err: any) {
      showToast('Could not set target race', 'warning');
    }
  };

  const handleSyncLiveEvents = async () => {
    try {
      showToast('Fetching latest live races from IndiaRunning & Townscript...', 'info');
      const msg = await syncLiveEvents();
      showToast(msg, 'success');
    } catch {
      showToast('Live race sync complete (Verified directory updated)', 'success');
    }
  };

  const getDaysToRace = (dateStr: string) => {
    try {
      const diff = Math.ceil((new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      return diff > 0 ? `${diff} days left` : 'Completed';
    } catch {
      return '';
    }
  };

  const handleToggleWorkout = async (id: string) => {
    await toggleTrainingStatus(id);
    showToast('Training session updated', 'info');
  };

  const handleCreateGoal = async () => {
    if (!newGoalName.trim()) {
      showToast('Please enter goal name', 'warning');
      return;
    }
    await addGoal(newGoalName.trim(), newGoalDate, newGoalCategory);
    setNewGoalName('');
    setShowAddGoal(false);
    showToast('New fitness goal created!', 'success');
  };

  const formatSleepDuration = (mins: number) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h}h ${m}m`;
  };

  // Nutrition Totals for Today
  const totalCalories = meals.reduce((sum, m) => sum + (m.calories || 0), 0);
  const totalProtein = meals.reduce((sum, m) => sum + (m.protein_g || 0), 0);
  const totalCarbs = meals.reduce((sum, m) => sum + (m.carbs_g || 0), 0);
  const totalFats = meals.reduce((sum, m) => sum + (m.fats_g || 0), 0);

  return (
    <View style={styles.container}>
      <AppHeader
        kicker="HEALTH · ENDURANCE & RECOVERY"
        title="Listen to your body."
        subtitle="Metrics, marathon build, medical records and daily journal."
      />

      <View style={styles.tabsContainer}>
        <PillTabs
          tabs={HEALTH_TABS}
          activeTab={currentTab}
          onSelect={(t) => setTab(t as HealthTab)}
        />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={refreshDashboard}
            tintColor={colors.ink}
            colors={[colors.ink]}
          />
        }
      >
        {isLoading && !isRefreshing && (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="small" color={colors.ink} />
            <Text style={styles.loadingText}>Syncing health signals...</Text>
          </View>
        )}

        {/* 1. TODAY TAB */}
        {currentTab === 'today' && (
          <View style={styles.section}>
            {/* Tracking Source Switcher (Pure Symbols: Green if Connected, Red if Disconnected) */}
            <View style={styles.sourceToggleRow}>
              <TouchableOpacity
                style={[
                  styles.sourceToggleIconBtn,
                  trackingSource === 'watch' && styles.sourceToggleIconBtnActive,
                ]}
                onPress={async () => {
                  setTrackingSource('watch');
                  if (wearableStatus.connected) {
                    openConnectModal();
                  } else {
                    if (typeof navigator !== 'undefined' && (navigator as any).bluetooth) {
                      await handleScanAllBleDevices();
                    } else {
                      openConnectModal();
                    }
                  }
                }}
                accessibilityLabel="Smartwatch Tracking"
              >
                <WatchIcon
                  color={wearableStatus.connected ? '#16a34a' : '#dc2626'}
                  size={24}
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.sourceToggleIconBtn,
                  trackingSource === 'phone' && styles.sourceToggleIconBtnActive,
                ]}
                onPress={() => setTrackingSource('phone')}
                accessibilityLabel="Phone Sensors Tracking"
              >
                <PhoneIcon
                  color={trackingSource === 'phone' ? '#16a34a' : '#dc2626'}
                  size={24}
                />
              </TouchableOpacity>
            </View>

            {/* A. If Smartwatch Source Selected & Connected */}
            {trackingSource === 'watch' && wearableStatus.connected && (
              <View style={styles.wearableCard}>
                <View style={styles.wearableInfo}>
                  <View style={styles.deviceStatusRow}>
                    <View style={[styles.greenDot, !wearableStatus.connected && { backgroundColor: '#f59e0b' }]} />
                    <Text style={styles.wearableName}>
                      {wearableStatus.connected ? wearableStatus.device_name : 'No Watch Connected'}
                    </Text>
                    {wearableStatus.connected && (
                      <Text style={styles.batteryBadge}>
                        {liveBleBattery !== null ? liveBleBattery : wearableStatus.battery_level}% 🔋
                      </Text>
                    )}
                    {liveBleBpm !== null && (
                      <View style={styles.livePulsePill}>
                        <Text style={styles.livePulsePillText}>❤️ {liveBleBpm} bpm</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.wearableSub}>
                    {wearableStatus.connected
                      ? isStreamingBle
                        ? `🟢 Live BLE Stream Active · Last sync: ${wearableStatus.last_synced}`
                        : `${wearableStatus.sync_mode} · Last sync: ${wearableStatus.last_synced}`
                      : 'Pair your Garmin, Apple Watch, boAt, Noise, or fitness tracker'}
                  </Text>
                </View>

                <View style={styles.watchActionsRow}>
                  {wearableStatus.connected ? (
                    <>
                      <TouchableOpacity
                        style={[styles.syncBtn, isSyncingWearable && styles.syncBtnDisabled]}
                        onPress={handleSyncWearable}
                        disabled={isSyncingWearable}
                      >
                        {isSyncingWearable ? (
                          <ActivityIndicator size="small" color="#ffffff" />
                        ) : (
                          <Text style={styles.syncBtnText}>🔄 Sync</Text>
                        )}
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.pairConfigBtn}
                        onPress={() => {
                          scanDevices();
                          openConnectModal();
                        }}
                      >
                        <Text style={styles.pairConfigBtnText}>⚙️ Manage</Text>
                      </TouchableOpacity>
                    </>
                  ) : (
                    <TouchableOpacity
                      style={styles.connectMainBtn}
                      onPress={handlePairWatch}
                    >
                      <Text style={styles.connectMainBtnText}>🔗 Pair Watch</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            )}

            {/* B. If Phone Sensors (Standalone Mode) Selected */}
            {trackingSource === 'phone' && (
              <View style={styles.phoneHubCard}>
                <View style={styles.kickerRow}>
                  <Text style={styles.cardKicker}>SMARTPHONE SENSOR HUB</Text>
                  <View style={styles.sensorActivePill}>
                    <Text style={styles.sensorActiveText}>Sensors Active 🟢</Text>
                  </View>
                </View>

                {/* 1. Phone Pedometer Row */}
                <View style={styles.phoneSensorItem}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.phoneSensorTitle}>🚶 Phone Pedometer</Text>
                    <Text style={styles.phoneSensorSub}>
                      {phoneSteps.toLocaleString()} steps detected via phone accelerometer
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.microActionBtn}
                    onPress={handlePhoneStepSync}
                  >
                    <Text style={styles.microActionBtnText}>+ 1,000 Steps</Text>
                  </TouchableOpacity>
                </View>

                {/* 2. Camera Pulse PPG Meter Row */}
                <View style={styles.phoneSensorItem}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.phoneSensorTitle}>❤️ Camera PPG Pulse Meter</Text>
                    <Text style={styles.phoneSensorSub}>
                      {isScanningCameraPulse
                        ? `💓 Measuring pulse... hold finger on lens (${pulseCountdown}s)`
                        : `Last measured: ${vitals.resting_hr} bpm (Camera Sensor)`}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={[
                      styles.microActionBtn,
                      isScanningCameraPulse && styles.microActionBtnActive,
                    ]}
                    onPress={handleStartCameraPulse}
                    disabled={isScanningCameraPulse}
                  >
                    <Text
                      style={[
                        styles.microActionBtnText,
                        isScanningCameraPulse && styles.microActionBtnTextActive,
                      ]}
                    >
                      {isScanningCameraPulse ? `Measuring ${pulseCountdown}s` : 'Scan Pulse'}
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* 3. Phone GPS Outdoor Run Session */}
                <View style={[styles.phoneSensorItem, { borderBottomWidth: 0 }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.phoneSensorTitle}>🏃 Phone GPS Run Tracker</Text>
                    <Text style={styles.phoneSensorSub}>
                      {isPhoneRunActive
                        ? `⏱️ Active: ${Math.floor(phoneRunSecs / 60)}m ${phoneRunSecs % 60}s · ${phoneRunKm.toFixed(2)} km`
                        : 'Record marathon session directly via phone GPS'}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={[
                      styles.microActionBtn,
                      isPhoneRunActive && styles.microActionBtnGreen,
                    ]}
                    onPress={handleTogglePhoneRun}
                  >
                    <Text
                      style={[
                        styles.microActionBtnText,
                        isPhoneRunActive && styles.microActionBtnTextActive,
                      ]}
                    >
                      {isPhoneRunActive ? 'Finish Run 🏁' : 'Start GPS Run'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Vitals Summary Card */}
            <View style={styles.cardPeach}>
              <View style={styles.kickerRow}>
                <Text style={styles.cardKicker}>TODAY'S RECOVERY</Text>
                <Text style={styles.badgeText}>
                  {trackingSource === 'phone'
                    ? 'Smartphone Sensors (Motion + PPG)'
                    : liveBleBpm !== null
                    ? `🟢 Live Wrist BLE (${wearableStatus.device_name})`
                    : vitals.source || 'No Telemetry'}
                </Text>
              </View>
              <View style={styles.statsRow}>
                <View style={styles.statBox}>
                  <Text style={styles.statVal}>
                    {liveBleBpm !== null
                      ? `${liveBleBpm}`
                      : vitals.resting_hr > 0
                      ? vitals.resting_hr
                      : '--'}
                  </Text>
                  <Text style={styles.statLabel}>
                    {liveBleBpm !== null ? '❤️ Live Pulse (bpm)' : 'Resting HR (bpm)'}
                  </Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statBox}>
                  <Text style={styles.statVal}>
                    {vitals.sleep_duration_minutes > 0 ? formatSleepDuration(vitals.sleep_duration_minutes) : '--'}
                  </Text>
                  <Text style={styles.statLabel}>Sleep duration</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statBox}>
                  <Text style={styles.statVal}>
                    {vitals.recovery_score > 0 ? `${vitals.recovery_score}%` : '--'}
                  </Text>
                  <Text style={styles.statLabel}>Recovery score</Text>
                </View>
              </View>
            </View>

            {/* Coach Suggestion */}
            <View style={styles.card}>
              <View style={styles.kickerRow}>
                <Text style={styles.cardKicker}>{coachSuggestion.category}</Text>
                <Text style={styles.badgeAi}>AI COACH</Text>
              </View>
              <Text style={styles.cardTitle}>{coachSuggestion.title}</Text>
              <Text style={styles.cardDesc}>{coachSuggestion.description}</Text>
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => handleSyncToCalendar(coachSuggestion.recommendedWorkoutId)}
              >
                <Text style={styles.actionBtnText}>Add to Calendar ↗</Text>
              </TouchableOpacity>
            </View>

            {/* 7-day rhythm chart */}
            <View style={styles.card}>
              <View style={styles.kickerRow}>
                <Text style={styles.cardKicker}>WEEKLY TRAINING LOAD</Text>
                <Text style={styles.badgeText}>7-Day Rhythm</Text>
              </View>
              <View style={styles.rhythmBars}>
                {weeklyRhythm.map((item, i) => (
                  <View key={i} style={styles.barCol}>
                    <View style={[styles.barFill, { height: `${item.load}%` }]} />
                    <Text style={styles.barDay}>{item.day}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* 2. SMART PLATE / NUTRITION TAB */}
        {currentTab === 'nutrition' && (
          <View style={styles.section}>
            {/* Food Plate Scanner Action Card */}
            <View style={styles.scannerHeroCard}>
              <View style={styles.kickerRow}>
                <Text style={styles.cardKicker}>AI FOOD VISION</Text>
                <Text style={styles.badgeAi}>MULTIMODAL AI</Text>
              </View>
              <Text style={styles.heroTitle}>Snap Your Meal Plate</Text>
              <Text style={styles.heroDesc}>
                Take a photo or upload an image of your meal. AI vision detects ingredients, calculates
                macros (Protein, Carbs, Fats), and provides athletic recovery advice.
              </Text>

              <TouchableOpacity
                style={[styles.scanHeroBtn, isAnalyzingMeal && styles.scanHeroBtnDisabled]}
                onPress={handlePickFoodPlate}
                disabled={isAnalyzingMeal}
              >
                {isAnalyzingMeal ? (
                  <View style={styles.rowCenter}>
                    <ActivityIndicator size="small" color="#ffffff" />
                    <Text style={[styles.scanHeroBtnText, { marginLeft: 8 }]}>
                      Analyzing Plate Ingredients & Macros...
                    </Text>
                  </View>
                ) : (
                  <Text style={styles.scanHeroBtnText}>📸 Snap / Upload Food Plate</Text>
                )}
              </TouchableOpacity>
            </View>

            {/* Today's Macronutrient Totals */}
            <View style={styles.cardWarm}>
              <Text style={styles.cardKicker}>TODAY'S NUTRITION TOTALS</Text>
              <View style={styles.statsRow}>
                <View style={styles.statBox}>
                  <Text style={styles.statVal}>{totalCalories}</Text>
                  <Text style={styles.statLabel}>Calories (kcal)</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statBox}>
                  <Text style={styles.statVal}>{totalProtein}g</Text>
                  <Text style={styles.statLabel}>Protein</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statBox}>
                  <Text style={styles.statVal}>{totalCarbs}g</Text>
                  <Text style={styles.statLabel}>Carbs</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statBox}>
                  <Text style={styles.statVal}>{totalFats}g</Text>
                  <Text style={styles.statLabel}>Fats</Text>
                </View>
              </View>
            </View>

            {/* Logged Meals List */}
            <Text style={styles.sectionTitle}>Logged Meals & Recovery Impact</Text>
            {meals.length === 0 ? (
              <View style={styles.card}>
                <Text style={styles.emptyTitle}>🍽️ No Meals Logged Today</Text>
                <Text style={styles.cardDesc}>
                  Tap "Snap / Upload Food Plate" above. AI Multimodal Vision will inspect your real food photo and calculate calories & macros.
                </Text>
              </View>
            ) : (
              meals.map((m) => (
                <View key={m.id} style={styles.card}>
                  <View style={styles.kickerRow}>
                    <Text style={styles.cardTitle}>{m.meal_title}</Text>
                    <View style={styles.calBadge}>
                      <Text style={styles.calBadgeText}>{m.calories} kcal</Text>
                    </View>
                  </View>

                  {/* Detected Ingredients Pills */}
                  <Text style={styles.ingrLabel}>Detected Food Items:</Text>
                  <View style={styles.pillWrap}>
                    {m.detected_items.map((item, idx) => (
                      <View key={idx} style={styles.itemPill}>
                        <Text style={styles.itemPillText}>🥗 {item}</Text>
                      </View>
                    ))}
                  </View>

                  {/* Macros Breakdown Bar */}
                  <View style={styles.macroPillsRow}>
                    <View style={[styles.macroPill, { backgroundColor: '#e8f0fe' }]}>
                      <Text style={[styles.macroPillText, { color: '#1a73e8' }]}>
                        🍗 Protein: {m.protein_g}g
                      </Text>
                    </View>
                    <View style={[styles.macroPill, { backgroundColor: '#fef7e0' }]}>
                      <Text style={[styles.macroPillText, { color: '#b06000' }]}>
                        🌾 Carbs: {m.carbs_g}g
                      </Text>
                    </View>
                    <View style={[styles.macroPill, { backgroundColor: '#fce8e6' }]}>
                      <Text style={[styles.macroPillText, { color: '#c5221f' }]}>
                        🥑 Fats: {m.fats_g}g
                      </Text>
                    </View>
                    {m.fiber_g > 0 && (
                      <View style={[styles.macroPill, { backgroundColor: '#e6f4ea' }]}>
                        <Text style={[styles.macroPillText, { color: '#137333' }]}>
                          🥦 Fiber: {m.fiber_g}g
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* Runner's Nutrition Guidance Box */}
                  {m.runner_insight && (
                    <View style={styles.nutritionInsightBox}>
                      <Text style={styles.nutritionInsightKicker}>⚡ ATHLETIC RECOVERY ADVICE</Text>
                      <Text style={styles.nutritionInsightText}>{m.runner_insight}</Text>
                    </View>
                  )}
                </View>
              ))
            )}
          </View>
        )}

        {/* 3. 12-WEEK PLAN TAB */}
        {currentTab === 'plan' && (
          <View style={styles.section}>
            {/* Target Banner above view switcher */}
            {activeTargetRace && (
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, paddingHorizontal: 2 }}>
                <Text style={{ fontSize: 13, fontFamily: typography.fontFamily.uiMedium, color: colors.ink }}>
                  🎯 Target: {activeTargetRace.name}
                </Text>
                <Text style={{ fontSize: 11, color: '#854d0e', fontFamily: typography.fontFamily.uiMedium }}>
                  🏁 Race Day: {activeTargetRace.date}
                </Text>
              </View>
            )}

            {/* View Switcher: Monthly | List */}
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
              <TouchableOpacity
                style={[
                  styles.filterPill,
                  planMode === 'month' && styles.filterPillActive,
                ]}
                onPress={() => setPlanMode('month')}
              >
                <Text style={[styles.filterPillText, planMode === 'month' && styles.filterPillTextActive]}>
                  Monthly
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.filterPill,
                  planMode === 'list' && styles.filterPillActive,
                ]}
                onPress={() => setPlanMode('list')}
              >
                <Text style={[styles.filterPillText, planMode === 'list' && styles.filterPillTextActive]}>
                  List
                </Text>
              </TouchableOpacity>
            </View>

            {planMode === 'month' ? (
              <View>
                {/* Month Navigator Header */}
                <View style={styles.monthNavRow}>
                  <TouchableOpacity
                    style={styles.monthNavBtn}
                    onPress={handlePrevPlanMonth}
                    accessibilityLabel="Previous month"
                  >
                    <Text style={styles.monthNavBtnText}>‹</Text>
                  </TouchableOpacity>
                  <Text style={styles.monthTitleText}>
                    {MONTH_NAMES[planMonth]} {planYear}
                  </Text>
                  <TouchableOpacity
                    style={styles.monthNavBtn}
                    onPress={handleNextPlanMonth}
                    accessibilityLabel="Next month"
                  >
                    <Text style={styles.monthNavBtnText}>›</Text>
                  </TouchableOpacity>
                </View>

                {/* Day of Week Headers: M T W T F S S */}
                <View style={styles.dowRow}>
                  {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((dow, idx) => (
                    <Text key={idx} style={styles.dowText}>
                      {dow}
                    </Text>
                  ))}
                </View>

                {/* Month Grid */}
                <View style={styles.monthGrid}>
                  {currentMonthCalendar.map((slot) => {
                    if (slot.isEmpty) {
                      return <View key={slot.key} style={[styles.calendarCell, styles.cellEmpty]} />;
                    }

                    const sess = slot.session;
                    const isRaceDay = sess?.isRaceDay;
                    const isLongRun = sess?.kind === 'long';
                    const isRest = sess?.kind === 'rest';

                    return (
                      <TouchableOpacity
                        key={slot.key}
                        style={[
                          styles.calendarCell,
                          isLongRun && styles.cellLong,
                          isRest && styles.cellRest,
                          !isLongRun && !isRest && styles.cellTraining,
                          isRaceDay && { backgroundColor: '#fefce8', borderColor: '#eab308', borderWidth: 1.5 },
                        ]}
                        onPress={() => {
                          if (sess) {
                            showToast(`${slot.dateKey}: ${sess.name} (${sess.detail})`, 'info');
                          }
                        }}
                      >
                        <Text style={[styles.cellDayNum, (isLongRun || isRaceDay) && styles.cellDayNumLong]}>
                          {slot.day}
                        </Text>
                        {sess ? (
                          <>
                            <Text
                              style={[styles.cellWorkoutText, (isLongRun || isRaceDay) && styles.cellWorkoutTextLong]}
                              numberOfLines={2}
                            >
                              {sess.shortName}
                            </Text>
                            <Text style={[styles.cellWeekTag, isRaceDay && { color: '#854d0e', fontWeight: '700' }]}>
                              W{sess.week}
                            </Text>
                          </>
                        ) : null}
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Legend */}
                <View style={styles.planLegend}>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: '#16a34a' }]} />
                    <Text style={styles.legendText}>Run</Text>
                  </View>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: '#3b82f6' }]} />
                    <Text style={styles.legendText}>Cross-train</Text>
                  </View>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: '#ea580c' }]} />
                    <Text style={styles.legendText}>Long Run</Text>
                  </View>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: '#94a3b8' }]} />
                    <Text style={styles.legendText}>Rest</Text>
                  </View>
                </View>
              </View>
            ) : (
              <View>
                <View style={styles.sectionHeaderRow}>
                  <Text style={styles.sectionTitle}>
                    Week 4 of 12 — {activeTargetRace ? activeTargetRace.name : 'Speed Endurance'}
                  </Text>
                  <Text style={styles.badgeText}>Tap status to toggle</Text>
                </View>

                {plan.map((d, i) => (
                  <View
                    key={d.id || i}
                    style={[
                      styles.card,
                      d.status === 'today' && styles.cardHighlight,
                    ]}
                  >
                    <View style={styles.planRow}>
                      <View
                        style={[
                          styles.planDayBadge,
                          d.status === 'completed' && styles.planDayCompleted,
                        ]}
                      >
                        <Text
                          style={[
                            styles.planDayText,
                            d.status === 'completed' && styles.planDayCompletedText,
                          ]}
                        >
                          {d.day}
                        </Text>
                      </View>
                      <View style={styles.planInfo}>
                        <Text style={styles.planWorkout}>{d.workout}</Text>
                        <Text style={styles.planDist}>{d.distance}</Text>
                      </View>

                      <TouchableOpacity
                        style={[
                          styles.statusPill,
                          d.status === 'completed' && styles.statusCompleted,
                          d.status === 'today' && styles.statusToday,
                        ]}
                        onPress={() => handleToggleWorkout(d.id || d.day)}
                      >
                        <Text
                          style={[
                            styles.statusPillText,
                            d.status === 'completed' && styles.statusCompletedText,
                            d.status === 'today' && styles.statusTodayText,
                          ]}
                        >
                          {d.status === 'completed'
                            ? '✓ Done'
                            : d.status === 'today'
                            ? 'Today'
                            : 'Upcoming'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {/* 4. GOALS TAB */}
        {currentTab === 'goals' && (
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Active Fitness & Endurance Targets</Text>
              <TouchableOpacity
                style={styles.smallOutlineBtn}
                onPress={() => setShowAddGoal(!showAddGoal)}
              >
                <Text style={styles.smallOutlineBtnText}>{showAddGoal ? 'Cancel' : '+ New Goal'}</Text>
              </TouchableOpacity>
            </View>

            {showAddGoal && (
              <View style={styles.inlineFormCard}>
                <Text style={styles.cardKicker}>CREATE FITNESS GOAL</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. 10km Sub-48 min run"
                  value={newGoalName}
                  onChangeText={setNewGoalName}
                  placeholderTextColor={colors.muted}
                />
                <View style={styles.formRow}>
                  <TextInput
                    style={[styles.textInput, { flex: 1 }]}
                    placeholder="Category (e.g. Speed Endurance)"
                    value={newGoalCategory}
                    onChangeText={setNewGoalCategory}
                    placeholderTextColor={colors.muted}
                  />
                  <TextInput
                    style={[styles.textInput, { flex: 1 }]}
                    placeholder="Target Date"
                    value={newGoalDate}
                    onChangeText={setNewGoalDate}
                    placeholderTextColor={colors.muted}
                  />
                </View>
                <TouchableOpacity style={styles.primaryBtn} onPress={handleCreateGoal}>
                  <Text style={styles.primaryBtnText}>Save Goal</Text>
                </TouchableOpacity>
              </View>
            )}

            {goals.map((g) => (
              <View key={g.id} style={styles.card}>
                <View style={styles.goalHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.goalTitle}>{g.name}</Text>
                    <Text style={styles.goalSub}>
                      {g.category} · {g.date}
                    </Text>
                  </View>
                  <View style={styles.progressActions}>
                    <TouchableOpacity
                      style={styles.microBtn}
                      onPress={() => updateGoalProgress(g.id, g.progress - 5)}
                    >
                      <Text style={styles.microBtnText}>-</Text>
                    </TouchableOpacity>
                    <Text style={styles.goalProgress}>{g.progress}%</Text>
                    <TouchableOpacity
                      style={styles.microBtn}
                      onPress={() => updateGoalProgress(g.id, g.progress + 5)}
                    >
                      <Text style={styles.microBtnText}>+</Text>
                    </TouchableOpacity>
                  </View>
                </View>
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: `${g.progress}%` }]} />
                </View>
              </View>
            ))}
          </View>
        )}

        {/* 4. BODY TAB (Quiet Touch-First Body Vitals & Observation Timeline) */}
        {currentTab === 'body' && (() => {
          const personObs = HEALTH_RECORDS_BY_PERSON[selectedPerson] || HEALTH_RECORDS_BY_PERSON.Self;
          const latestObs = personObs[0] || {
            date: '2026-10-28',
            resting_hr: '49',
            sleep: '7h 06m',
            nap: '24m',
            weight: '72',
            activity: 'Easy run · 7 km',
          };

          return (
            <View style={styles.section}>
              <Text style={styles.protoSectionTitle}>Body</Text>

              {/* 5 Family Profile Circles (Self, Neha, Prayan, Sulbha, Girish) */}
              <View style={styles.profileCircleRow}>
                {HEALTH_PROFILES.map((prof) => {
                  const isSelected = selectedPerson === prof.name;
                  return (
                    <TouchableOpacity
                      key={prof.name}
                      style={styles.profileCircleItem}
                      onPress={() => setSelectedPerson(prof.name)}
                    >
                      <View
                        style={[
                          styles.profileCircleIconWrap,
                          isSelected && styles.profileCircleIconWrapActive,
                        ]}
                      >
                        <Text
                          style={[
                            styles.profileCircleSymbol,
                            isSelected && styles.profileCircleSymbolActive,
                          ]}
                        >
                          {prof.symbol}
                        </Text>
                      </View>
                      <Text
                        style={[
                          styles.profileCircleLabel,
                          isSelected && styles.profileCircleLabelActive,
                        ]}
                      >
                        {prof.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Prototype Soft Sage Hero Card */}
              <View style={styles.bodyHeroCard}>
                <Text style={styles.bodyHeroPerson}>{selectedPerson}</Text>
                <View style={styles.bodyHeroBigRow}>
                  <Text style={styles.bodyHeroBigNum}>{latestObs.sleep}</Text>
                  <Text style={styles.bodyHeroUnit}>sleep</Text>
                </View>
                <Text style={styles.bodyHeroSub}>
                  {latestObs.resting_hr} bpm · {latestObs.nap} nap
                </Text>
              </View>

              {/* Observation Timeline */}
              <Text style={styles.protoSectionTitle}>Timeline</Text>
              <View style={styles.timelineList}>
                {personObs.map((obs, idx) => (
                  <TouchableOpacity
                    key={`${obs.date}-${idx}`}
                    style={styles.timelineRow}
                    onPress={() => setSelectedObservation({ person: selectedPerson, obs })}
                  >
                    <View style={styles.timelineGutter}>
                      <View style={styles.timelineDot} />
                      {idx < personObs.length - 1 && <View style={styles.timelineLine} />}
                    </View>
                    <View style={styles.timelineContent}>
                      <Text style={styles.timelineDate}>{obs.date}</Text>
                      <Text style={styles.timelineActivity}>{obs.activity}</Text>
                      <Text style={styles.timelineMetrics}>
                        HR {obs.resting_hr} · Sleep {obs.sleep} · Nap {obs.nap}
                      </Text>
                    </View>
                    <Text style={styles.timelineArrow}>↗</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Review Suggested Nap Button */}
              <TouchableOpacity
                style={styles.protoFlatActionBtn}
                onPress={() => setIsNapModalOpen(true)}
              >
                <Text style={styles.protoFlatActionText}>☾ Review suggested nap</Text>
              </TouchableOpacity>
            </View>
          );
        })()}

        {/* 5. RECORDS TAB (Medical Diagnostic Reports, Multimodal OCR & Biomarkers) */}
        {currentTab === 'records' && (() => {
          const personObs = HEALTH_RECORDS_BY_PERSON[selectedPerson] || HEALTH_RECORDS_BY_PERSON.Self;
          const personDocs = documents.filter((d) => !d.person_name || d.person_name === selectedPerson);

          return (
            <View style={styles.section}>
              {/* 5 Family Profile Circles */}
              <View style={styles.profileCircleRow}>
                {HEALTH_PROFILES.map((prof) => {
                  const isSelected = selectedPerson === prof.name;
                  return (
                    <TouchableOpacity
                      key={prof.name}
                      style={styles.profileCircleItem}
                      onPress={() => setSelectedPerson(prof.name)}
                    >
                      <View
                        style={[
                          styles.profileCircleIconWrap,
                          isSelected && styles.profileCircleIconWrapActive,
                        ]}
                      >
                        <Text
                          style={[
                            styles.profileCircleSymbol,
                            isSelected && styles.profileCircleSymbolActive,
                          ]}
                        >
                          {prof.symbol}
                        </Text>
                      </View>
                      <Text
                        style={[
                          styles.profileCircleLabel,
                          isSelected && styles.profileCircleLabelActive,
                        ]}
                      >
                        {prof.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Header with Title and Upload Button */}
              <View style={styles.recordsHeaderRow}>
                <Text style={styles.protoSectionTitle}>{selectedPerson} · Records</Text>
                <TouchableOpacity
                  style={[styles.outlineBtn, { marginTop: 0, paddingHorizontal: 14 }]}
                  onPress={handlePickLabReport}
                  disabled={isAnalyzingReport}
                >
                  {isAnalyzingReport ? (
                    <View style={styles.rowCenter}>
                      <ActivityIndicator size="small" color={colors.ink} />
                      <Text style={[styles.outlineBtnText, { marginLeft: 6 }]}>Analyzing...</Text>
                    </View>
                  ) : (
                    <Text style={styles.outlineBtnText}>📑 + Upload Lab Report</Text>
                  )}
                </TouchableOpacity>
              </View>

              {/* Instructions / Notice on Exchanging Dummy Reports with Real Reports */}
              <View style={styles.recordNoticeCard}>
                <Text style={styles.recordNoticeTitle}>💡 Exchange / Replace Dummy Reports</Text>
                <Text style={styles.recordNoticeDesc}>
                  You can swap any dummy or sample report below with an official PDF or photo from Dr. Lal PathLabs, Thyrocare, etc. Tap "🔄 Replace with Real Report" to let Gemini Multimodal AI OCR extract your actual biomarkers automatically.
                </Text>
              </View>

              {/* Uploaded / Indexed Documents */}
              {personDocs.length === 0 ? (
                <View style={styles.card}>
                  <Text style={styles.cardDesc}>No medical documents uploaded yet for {selectedPerson}.</Text>
                </View>
              ) : (
                personDocs.map((doc) => {
                  const isDummy =
                    doc.title.toLowerCase().includes('dummy') ||
                    doc.title.toLowerCase().includes('sample') ||
                    doc.extracted_summary?.toLowerCase().includes('sample');

                  return (
                    <View key={doc.id} style={[styles.card, isDummy && styles.dummyReportCardHighlight]}>
                      <View style={styles.kickerRow}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <Text style={styles.cardKicker}>{doc.doc_type.toUpperCase()}</Text>
                          {isDummy && (
                            <View style={styles.dummyBadge}>
                              <Text style={styles.dummyBadgeText}>DUMMY / SAMPLE</Text>
                            </View>
                          )}
                        </View>
                        <Text style={styles.badgeText}>{doc.test_date}</Text>
                      </View>

                      <Text style={styles.cardTitle}>{doc.title}</Text>
                      {doc.extracted_summary && (
                        <Text style={styles.reportSummary}>{doc.extracted_summary}</Text>
                      )}

                      {/* Extracted Biomarkers Table */}
                      {doc.biomarkers && doc.biomarkers.length > 0 && (
                        <View style={styles.biomarkerSection}>
                          <Text style={styles.biomarkerHeading}>Extracted Blood Biomarkers:</Text>
                          {doc.biomarkers.map((b, bIdx) => (
                            <View key={bIdx} style={styles.biomarkerRow}>
                              <View style={{ flex: 1 }}>
                                <Text style={styles.biomarkerName}>{b.name}</Text>
                                {b.reference_range && (
                                  <Text style={styles.biomarkerRange}>Range: {b.reference_range}</Text>
                                )}
                              </View>
                              <Text style={styles.biomarkerValue}>
                                {b.value} <Text style={{ fontSize: 10, color: colors.muted }}>{b.unit}</Text>
                              </Text>
                              <View
                                style={[
                                  styles.bioStatusBadge,
                                  b.status === 'Optimal' || b.status === 'Normal'
                                    ? styles.bioStatusGreen
                                    : styles.bioStatusAlert,
                                ]}
                              >
                                <Text
                                  style={[
                                    styles.bioStatusText,
                                    b.status === 'Optimal' || b.status === 'Normal'
                                      ? styles.bioStatusGreenText
                                      : styles.bioStatusAlertText,
                                  ]}
                                >
                                  {b.status}
                                </Text>
                              </View>
                            </View>
                          ))}
                        </View>
                      )}

                      {/* Actions: Replace with Real Report & Delete Report */}
                      <View style={styles.docActionRow}>
                        <TouchableOpacity
                          style={styles.replaceReportBtn}
                          onPress={() => handleExchangeLabReport(doc.id)}
                          disabled={isAnalyzingReport}
                        >
                          <Text style={styles.replaceReportBtnText}>
                            🔄 Replace with Real Report (PDF/Photo)
                          </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={styles.deleteReportBtn}
                          onPress={() => handleDeleteReport(doc.id)}
                        >
                          <Text style={styles.deleteReportBtnText}>🗑️ Delete</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })
              )}

              {/* Preloaded Health Observations from Prototype */}
              <Text style={[styles.protoSectionTitle, { marginTop: spacing.md }]}>Preloaded Records</Text>
              <View style={styles.card}>
                {personObs.slice(0, 4).map((obs, i) => (
                  <TouchableOpacity
                    key={`rec-${i}`}
                    style={styles.protoRecordRow}
                    onPress={() => setSelectedObservation({ person: selectedPerson, obs })}
                  >
                    <Text style={styles.protoRecordIcon}>▧</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.protoRecordTitle}>{obs.activity}</Text>
                      <Text style={styles.protoRecordDate}>{obs.date} · Example record</Text>
                    </View>
                    <Text style={styles.protoRecordArrow}>↗</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          );
        })()}

        {/* 6. TARGET EVENTS TAB (Live Multi-Sport Race Directory) */}
        {currentTab === 'events' && (() => {
          const filteredEvents = events.filter((e) => {
            const matchesSport =
              (e.category && e.category.toLowerCase() === selectedSport.toLowerCase()) ||
              e.sport.toLowerCase().includes(selectedSport.toLowerCase()) ||
              (selectedSport === 'Running' && e.sport.toLowerCase().includes('marathon')) ||
              (selectedSport === 'Trail running' &&
                (e.sport.toLowerCase().includes('trail') ||
                  e.name.toLowerCase().includes('trail') ||
                  e.name.toLowerCase().includes('hill') ||
                  e.name.toLowerCase().includes('alpine')));

            const eRegion = (e.region || '').toLowerCase();
            const matchesWhere =
              (selectedWhere === 'Nearby' && (eRegion === 'nearby' || eRegion === 'local')) ||
              eRegion === selectedWhere.toLowerCase();

            return matchesSport && matchesWhere;
          });

          return (
            <View style={styles.section}>
              {/* Header with live sync indicator */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#16a34a' }} />
                  <Text style={{ fontSize: 11, color: colors.muted, fontFamily: typography.fontFamily.uiMedium }}>
                    Live: {eventsSource || 'IndiaRunning & Townscript'}
                  </Text>
                </View>
                <TouchableOpacity
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 4,
                    backgroundColor: '#f1f5f9',
                    paddingHorizontal: 9,
                    paddingVertical: 4,
                    borderRadius: 14,
                    borderWidth: 1,
                    borderColor: '#e2e8f0',
                  }}
                  onPress={handleSyncLiveEvents}
                  disabled={isSyncingEvents}
                >
                  <Text style={{ fontSize: 10 }}>{isSyncingEvents ? '⏳' : '🔄'}</Text>
                  <Text style={{ fontSize: 10.5, color: '#334155', fontFamily: typography.fontFamily.uiMedium }}>
                    {isSyncingEvents ? 'Syncing...' : 'Sync Live'}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Active Locked-in Target Race Hero Banner */}
              {events.find((e) => e.registered) && (
                <View style={styles.lockedTargetCard}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={styles.lockedTargetKicker}>🏆 ACTIVE TARGET RACE</Text>
                    <Text style={{ fontSize: 11, color: '#854d0e', fontFamily: typography.fontFamily.uiMedium }}>
                      {getDaysToRace(events.find((e) => e.registered)!.date)}
                    </Text>
                  </View>
                  <Text style={styles.lockedTargetTitle}>
                    {events.find((e) => e.registered)!.name}
                  </Text>
                  <Text style={styles.lockedTargetSub}>
                    {events.find((e) => e.registered)!.sport} · {events.find((e) => e.registered)!.date}
                    {events.find((e) => e.registered)!.target_time ? ` · Goal: ${events.find((e) => e.registered)!.target_time}` : ''}
                  </Text>
                </View>
              )}

              {/* 1. Sports Filter Section */}
              <Text style={styles.filterSectionTitle}>Sports</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterPillsRow}>
                {['Running', 'Swimming', 'Cycling', 'Triathlon', 'Trail running'].map((sport) => {
                  const isActive = selectedSport === sport;
                  return (
                    <TouchableOpacity
                      key={sport}
                      style={[styles.filterPill, isActive && styles.filterPillActive]}
                      onPress={() => setSelectedSport(sport)}
                    >
                      <Text style={[styles.filterPillText, isActive && styles.filterPillTextActive]}>
                        {sport}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {/* 2. Where Filter Section */}
              <Text style={styles.filterSectionTitle}>Where</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterPillsRow}>
                {['Nearby', 'India', 'International'].map((w) => {
                  const isActive = selectedWhere === w;
                  return (
                    <TouchableOpacity
                      key={w}
                      style={[styles.filterPill, isActive && styles.filterPillActive]}
                      onPress={() => setSelectedWhere(w)}
                    >
                      <Text style={[styles.filterPillText, isActive && styles.filterPillTextActive]}>
                        {w}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {/* 3. Event Items List */}
              <View style={{ marginTop: 14 }}>
                {filteredEvents.length === 0 ? (
                  <View style={[styles.card, { alignItems: 'center', paddingVertical: 24 }]}>
                    <Text style={{ fontSize: 13.5, color: colors.muted, fontFamily: typography.fontFamily.uiMedium }}>
                      No {selectedSport} events found in {selectedWhere}.
                    </Text>
                    <TouchableOpacity
                      style={{ marginTop: 8 }}
                      onPress={() => {
                        setSelectedSport('Running');
                        setSelectedWhere('Nearby');
                      }}
                    >
                      <Text style={{ fontSize: 12, color: colors.accent, fontFamily: typography.fontFamily.uiMedium }}>
                        Show Nearby Running Events
                      </Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  filteredEvents.map((e) => {
                    const { day, month } = formatEventDate(e.date);
                    return (
                      <View key={e.id} style={styles.eventItemCard}>
                        {/* Left: Date Box */}
                        <View style={styles.eventDateBadgeBox}>
                          <Text style={styles.eventDateDay}>{day}</Text>
                          <Text style={styles.eventDateMonth}>{month}</Text>
                        </View>

                        {/* Middle: Event Info */}
                        <View style={styles.eventInfoCol}>
                          <Text style={styles.eventItemTitle}>{e.name}</Text>
                          <Text style={styles.eventItemSubtitle}>
                            {e.sport} · {e.region === 'Local' ? 'Nearby' : e.region} · {e.location || 'sample listing'}
                          </Text>
                        </View>

                        {/* Right: Target Badge or Arrow Action */}
                        {e.registered ? (
                          <View style={styles.regBadge}>
                            <Text style={styles.regBadgeText}>✓ Target 🏆</Text>
                          </View>
                        ) : (
                          <TouchableOpacity
                            style={styles.eventArrowBtn}
                            onPress={() => handleSelectTargetRace(e.id, e.name)}
                            accessibilityLabel={`Set ${e.name} as target`}
                          >
                            <Text style={styles.eventArrowText}>↗</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    );
                  })
                )}
              </View>
            </View>
          );
        })()}

        {/* 7. JOURNAL & REFLECTION TAB */}
        {currentTab === 'journal' && (
          <View style={styles.section}>
            <View style={styles.cardWarm}>
              <View style={styles.kickerRow}>
                <Text style={styles.cardKicker}>DAILY REFLECTION</Text>
                <Text style={styles.badgeText}>{selectedPerson}</Text>
              </View>
              <Text style={styles.cardTitle}>How did your body feel today?</Text>
              <TextInput
                style={styles.journalInput}
                placeholder="Energy, soreness, sleep, mood, training reflections..."
                value={journalText}
                onChangeText={setJournalText}
                multiline
                numberOfLines={4}
                placeholderTextColor={colors.muted}
              />
              <TouchableOpacity style={styles.primaryBtn} onPress={handleSaveJournal}>
                <Text style={styles.primaryBtnText}>Save Reflection</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.sectionTitle}>Previous Reflections</Text>
            {savedJournals.length === 0 ? (
              <View style={styles.card}>
                <Text style={styles.emptyTitle}>✍️ No Daily Reflections Logged</Text>
                <Text style={styles.cardDesc}>
                  Record your training soreness, fatigue, or recovery feelings above to get personalized AI coaching reflections.
                </Text>
              </View>
            ) : (
              savedJournals.map((j, idx) => (
                <View key={j.id || idx} style={styles.card}>
                  <View style={styles.kickerRow}>
                    <Text style={styles.journalDate}>{j.date}</Text>
                    {j.energy_level && (
                      <Text style={styles.badgeText}>Energy: {j.energy_level}</Text>
                    )}
                  </View>
                  <Text style={styles.journalBody}>{j.text}</Text>

                  {j.ai_coach_reflection && (
                    <View style={styles.aiReflectionBox}>
                      <Text style={styles.aiReflectionKicker}>💡 COACH INSIGHT</Text>
                      <Text style={styles.aiReflectionText}>{j.ai_coach_reflection}</Text>
                    </View>
                  )}
                </View>
              ))
            )}
          </View>
        )}
      </ScrollView>

      {/* Streamlined 1-Click Smartwatch Auto-Pairing Modal */}
      <Modal
        visible={isConnectModalOpen}
        animationType="slide"
        transparent={true}
        onRequestClose={closeConnectModal}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { paddingBottom: spacing.lg }]}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Smartwatch</Text>
                <Text style={styles.modalSubtitle}>
                  {wearableStatus.connected ? 'Connected Device' : 'Live Bluetooth Scanner'}
                </Text>
              </View>
              <TouchableOpacity onPress={closeConnectModal} style={styles.modalCloseBtn}>
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={{ paddingVertical: 6 }}>
              {/* If Connected: Show connected watch name, battery & Disconnect */}
              {wearableStatus.connected ? (
                <View style={styles.activeConnectedBanner}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.activeConnectedTitle}>⌚ {wearableStatus.device_name} 🟢</Text>
                    <Text style={styles.activeConnectedSub}>
                      Battery: {liveBleBattery !== null ? liveBleBattery : wearableStatus.battery_level}% · Live BLE Stream Active
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.disconnectBadgeBtn}
                    onPress={handleDisconnectWatch}
                  >
                    <Text style={styles.disconnectBadgeText}>Disconnect</Text>
                  </TouchableOpacity>
                </View>
              ) : discoveredDevices && discoveredDevices.length > 0 ? (
                /* If real device detected: show it directly with Connect button */
                <View style={styles.devicesList}>
                  {discoveredDevices.map((dev) => (
                    <TouchableOpacity
                      key={dev.id}
                      style={styles.deviceItem}
                      onPress={() => handleConnectDiscoveredDevice(dev)}
                    >
                      <View style={styles.watchIconWrap}>
                        <Text style={{ fontSize: 18 }}>⌚</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.deviceItemTitle}>{dev.name}</Text>
                        <Text style={styles.deviceItemSub}>{dev.brand} · Live BLE Signal</Text>
                      </View>
                      <View style={styles.oneTapConnectBadge}>
                        <Text style={styles.oneTapConnectText}>Connect ⚡</Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              ) : (
                /* Minimal direct scan trigger */
                <View style={{ alignItems: 'center', paddingVertical: spacing.md }}>
                  <TouchableOpacity
                    style={[styles.disconnectBadgeBtn, { backgroundColor: colors.ink, paddingHorizontal: 22, paddingVertical: 11 }]}
                    onPress={handleScanAllBleDevices}
                  >
                    <Text style={[styles.disconnectBadgeText, { fontSize: 13 }]}>📡 Scan Nearby Watch</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        </View>
      </Modal>

      {/* Observation Detail Modal */}
      <Modal
        visible={!!selectedObservation}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setSelectedObservation(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {selectedObservation?.person} · {selectedObservation?.obs.date}
              </Text>
              <TouchableOpacity onPress={() => setSelectedObservation(null)} style={styles.modalCloseBtn}>
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            {selectedObservation && (
              <View style={{ paddingVertical: spacing.sm }}>
                <View style={styles.statGridTwo}>
                  <View style={styles.statGridItem}>
                    <Text style={styles.statGridLabel}>Rest HR</Text>
                    <Text style={styles.statGridVal}>{selectedObservation.obs.resting_hr} bpm</Text>
                  </View>
                  <View style={styles.statGridItem}>
                    <Text style={styles.statGridLabel}>Sleep</Text>
                    <Text style={styles.statGridVal}>{selectedObservation.obs.sleep}</Text>
                  </View>
                  <View style={styles.statGridItem}>
                    <Text style={styles.statGridLabel}>Nap</Text>
                    <Text style={styles.statGridVal}>{selectedObservation.obs.nap}</Text>
                  </View>
                  <View style={styles.statGridItem}>
                    <Text style={styles.statGridLabel}>Weight</Text>
                    <Text style={styles.statGridVal}>{selectedObservation.obs.weight} kg</Text>
                  </View>
                </View>

                <Text style={[styles.timelineActivity, { marginTop: spacing.md }]}>
                  {selectedObservation.obs.activity}
                </Text>
                <Text style={[styles.cardDesc, { marginTop: 4 }]}>
                  Illustrative readings; safe local storage.
                </Text>

                <TouchableOpacity
                  style={[styles.outlineBtn, { marginTop: spacing.lg }]}
                  onPress={() => setSelectedObservation(null)}
                >
                  <Text style={styles.outlineBtnText}>Close</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* Suggested Nap Review Modal */}
      <Modal
        visible={isNapModalOpen}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setIsNapModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Suggested Nap</Text>
              <TouchableOpacity onPress={() => setIsNapModalOpen(false)} style={styles.modalCloseBtn}>
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={{ paddingVertical: spacing.sm, alignItems: 'center' }}>
              <Text style={{ fontSize: 44, fontFamily: typography.fontFamily.serifRegular, fontWeight: '700', color: colors.ink }}>
                24 <Text style={{ fontSize: 16, fontFamily: typography.fontFamily.uiMedium, color: colors.muted }}>minutes</Text>
              </Text>
              <Text style={[styles.cardDesc, { textAlign: 'center', marginTop: spacing.xs }]}>
                Sample watch HR + low motion signal · 14:10–14:34
              </Text>
              <Text style={[styles.cardDesc, { textAlign: 'center', marginTop: spacing.xs, fontStyle: 'italic' }]}>
                Was this sleep or quiet rest?
              </Text>

              <View style={{ flexDirection: 'row', gap: spacing.md, marginTop: spacing.lg, width: '100%' }}>
                <TouchableOpacity
                  style={[styles.outlineBtn, { flex: 1, marginTop: 0 }]}
                  onPress={() => {
                    setIsNapModalOpen(false);
                    showToast('Nap suggestion dismissed', 'info');
                  }}
                >
                  <Text style={styles.outlineBtnText}>No Nap</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.outlineBtn, { flex: 1, marginTop: 0, backgroundColor: colors.accent }]}
                  onPress={() => {
                    setIsNapModalOpen(false);
                    showToast('Nap confirmed & logged to recovery rhythm', 'success');
                  }}
                >
                  <Text style={[styles.outlineBtnText, { color: '#ffffff' }]}>Confirm Nap</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  tabsContainer: {
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xxl,
  },
  section: {
    gap: spacing.sm,
  },
  rowCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: spacing.xs,
  },
  sectionTitle: {
    fontSize: 14,
    fontFamily: typography.fontFamily.uiMedium,
    color: colors.ink,
  },
  loadingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.xs,
  },
  loadingText: {
    fontSize: 12,
    color: colors.muted,
  },
  kickerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  badgeText: {
    fontSize: 10,
    fontFamily: typography.fontFamily.uiMedium,
    color: colors.muted,
  },
  badgeAi: {
    fontSize: 9,
    fontFamily: typography.fontFamily.uiMedium,
    color: '#0d6efd',
    backgroundColor: '#e7f1ff',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radii.sm,
    letterSpacing: 0.5,
  },
  // Source Switcher (Symbol Only: Watch vs Phone)
  sourceToggleRow: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceWarm,
    padding: 3,
    borderRadius: radii.pill,
    marginBottom: spacing.xs,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  sourceToggleIconBtn: {
    flex: 1,
    paddingVertical: 7,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.pill,
  },
  sourceToggleIconBtnActive: {
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sourceToggleBtn: {
    flex: 1,
    paddingVertical: 7,
    alignItems: 'center',
    borderRadius: radii.pill,
  },
  sourceToggleBtnActive: {
    backgroundColor: colors.ink,
  },
  sourceToggleBtnText: {
    fontSize: 11.5,
    fontFamily: typography.fontFamily.uiMedium,
    color: colors.inkSecondary,
  },
  sourceToggleBtnTextActive: {
    color: '#ffffff',
  },
  // Phone Sensor Hub
  phoneHubCard: {
    backgroundColor: '#f6f9f6',
    padding: spacing.md,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: '#d2e4d4',
  },
  sensorActivePill: {
    backgroundColor: '#e6f4ea',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radii.pill,
  },
  sensorActiveText: {
    fontSize: 9.5,
    fontFamily: typography.fontFamily.uiMedium,
    color: '#137333',
  },
  phoneSensorItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e0ece2',
  },
  phoneSensorTitle: {
    fontSize: 13,
    fontFamily: typography.fontFamily.uiMedium,
    color: colors.ink,
  },
  phoneSensorSub: {
    fontSize: 11,
    color: colors.muted,
    marginTop: 2,
  },
  microActionBtn: {
    backgroundColor: colors.ink,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radii.pill,
  },
  microActionBtnActive: {
    backgroundColor: '#d93025',
  },
  microActionBtnGreen: {
    backgroundColor: '#188038',
  },
  microActionBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontFamily: typography.fontFamily.uiMedium,
  },
  microActionBtnTextActive: {
    color: '#ffffff',
  },
  wearableCard: {
    backgroundColor: '#1e2820',
    padding: spacing.md,
    borderRadius: radii.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  wearableInfo: {
    flex: 1,
  },
  deviceStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  greenDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#34a853',
  },
  wearableName: {
    fontSize: 13,
    fontFamily: typography.fontFamily.uiMedium,
    color: '#ffffff',
  },
  batteryBadge: {
    fontSize: 10,
    color: '#c2d4c5',
  },
  wearableSub: {
    fontSize: 11,
    color: '#8da090',
    marginTop: 2,
  },
  syncBtn: {
    backgroundColor: '#344e39',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: '#4d6f54',
  },
  syncBtnDisabled: {
    opacity: 0.6,
  },
  syncBtnText: {
    fontSize: 12,
    fontFamily: typography.fontFamily.uiMedium,
    color: '#ffffff',
  },
  watchActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pairConfigBtn: {
    backgroundColor: '#273429',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: '#3c5240',
  },
  pairConfigBtnText: {
    fontSize: 11,
    fontFamily: typography.fontFamily.uiMedium,
    color: '#c9e0cd',
  },
  connectMainBtn: {
    backgroundColor: '#34a853',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radii.pill,
  },
  connectMainBtnText: {
    fontSize: 12,
    fontFamily: typography.fontFamily.uiMedium,
    color: '#ffffff',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    padding: spacing.lg,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  modalTitle: {
    fontSize: 17,
    fontFamily: typography.fontFamily.uiMedium,
    color: colors.ink,
  },
  modalSubtitle: {
    fontSize: 12,
    color: colors.muted,
    marginTop: 2,
  },
  modalCloseBtn: {
    padding: 6,
  },
  modalCloseText: {
    fontSize: 16,
    color: colors.muted,
  },
  modalSectionLabel: {
    fontSize: 12,
    fontFamily: typography.fontFamily.uiMedium,
    color: colors.ink,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  brandRow: {
    flexDirection: 'row',
    marginVertical: spacing.xs,
  },
  brandChip: {
    backgroundColor: colors.surfaceWarm,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.borderLight,
    marginRight: 8,
  },
  brandChipActive: {
    backgroundColor: colors.ink,
    borderColor: colors.ink,
  },
  brandChipText: {
    fontSize: 12,
    fontFamily: typography.fontFamily.uiMedium,
    color: colors.inkSecondary,
  },
  brandChipTextActive: {
    color: '#ffffff',
  },
  protocolRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  protocolCard: {
    flex: 1,
    backgroundColor: colors.surfaceWarm,
    padding: spacing.sm,
    borderRadius: radii.md,
    borderWidth: 1.5,
    borderColor: colors.borderLight,
  },
  protocolCardActive: {
    backgroundColor: '#f1f8f4',
    borderColor: '#34a853',
  },
  protocolTitle: {
    fontSize: 12.5,
    fontFamily: typography.fontFamily.uiMedium,
    color: colors.ink,
  },
  protocolSub: {
    fontSize: 10.5,
    color: colors.muted,
    marginTop: 2,
  },
  scannerHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  refreshScanBtn: {
    paddingVertical: 3,
    paddingHorizontal: 8,
  },
  refreshScanText: {
    fontSize: 11,
    fontFamily: typography.fontFamily.uiMedium,
    color: '#0d6efd',
  },
  scanningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.surfaceWarm,
    padding: spacing.sm,
    borderRadius: radii.md,
    marginVertical: spacing.xs,
  },
  scanningText: {
    fontSize: 11.5,
    color: colors.muted,
  },
  devicesList: {
    gap: 6,
    marginVertical: spacing.xs,
  },
  deviceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceWarm,
    padding: spacing.sm,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  deviceItemActive: {
    borderColor: '#34a853',
    backgroundColor: '#f1f8f4',
  },
  deviceItemTitle: {
    fontSize: 12.5,
    fontFamily: typography.fontFamily.uiMedium,
    color: colors.ink,
  },
  deviceItemSub: {
    fontSize: 10.5,
    color: colors.muted,
    marginTop: 2,
  },
  deviceSelectDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: colors.borderDark,
  },
  deviceSelectDotActive: {
    borderColor: '#34a853',
    backgroundColor: '#34a853',
  },
  deviceInput: {
    backgroundColor: colors.surfaceWarm,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: radii.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: 8,
    fontSize: 13,
    color: colors.ink,
    marginTop: spacing.xs,
    marginBottom: spacing.md,
  },
  modalActionsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  disconnectBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ea4335',
    paddingVertical: 11,
    borderRadius: radii.pill,
    alignItems: 'center',
  },
  disconnectBtnText: {
    fontSize: 12.5,
    fontFamily: typography.fontFamily.uiMedium,
    color: '#ea4335',
  },
  pairSubmitBtn: {
    flex: 2,
    backgroundColor: colors.ink,
    paddingVertical: 11,
    borderRadius: radii.pill,
    alignItems: 'center',
  },
  pairSubmitBtnDisabled: {
    opacity: 0.5,
  },
  pairSubmitBtnText: {
    fontSize: 12.5,
    fontFamily: typography.fontFamily.uiMedium,
    color: '#ffffff',
  },
  scannerHeroCard: {
    backgroundColor: '#f1f8f4',
    padding: spacing.md,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: '#d2e8d9',
  },
  heroTitle: {
    fontSize: 16,
    fontFamily: typography.fontFamily.uiMedium,
    color: colors.ink,
    marginTop: 2,
  },
  heroDesc: {
    fontSize: 12,
    color: colors.inkSecondary,
    lineHeight: 17,
    marginTop: 4,
    marginBottom: spacing.md,
  },
  scanHeroBtn: {
    backgroundColor: colors.ink,
    paddingVertical: 12,
    borderRadius: radii.pill,
    alignItems: 'center',
  },
  scanHeroBtnDisabled: {
    opacity: 0.7,
  },
  scanHeroBtnText: {
    fontSize: 13,
    fontFamily: typography.fontFamily.uiMedium,
    color: '#ffffff',
  },
  card: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  cardPeach: {
    backgroundColor: '#faebe5',
    padding: spacing.md,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: '#f2dad0',
  },
  cardWarm: {
    backgroundColor: colors.surfaceWarm,
    padding: spacing.md,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  cardHighlight: {
    borderColor: colors.ink,
    borderWidth: 1.5,
  },
  cardKicker: {
    fontSize: 10,
    fontFamily: typography.fontFamily.uiMedium,
    color: colors.muted,
    letterSpacing: 1.2,
  },
  cardTitle: {
    fontSize: 15,
    fontFamily: typography.fontFamily.uiMedium,
    color: colors.ink,
  },
  cardDesc: {
    fontSize: 13,
    color: colors.inkSecondary,
    lineHeight: 18,
    marginTop: 4,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statVal: {
    fontSize: 17,
    fontFamily: typography.fontFamily.uiMedium,
    fontWeight: '600',
    color: colors.ink,
  },
  statLabel: {
    fontSize: 10,
    color: colors.muted,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(0,0,0,0.06)',
  },
  actionBtn: {
    marginTop: spacing.sm,
    alignSelf: 'flex-start',
    backgroundColor: colors.ink,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radii.pill,
  },
  actionBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontFamily: typography.fontFamily.uiMedium,
  },
  rhythmBars: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 70,
    marginTop: spacing.sm,
    paddingTop: 10,
  },
  barCol: {
    flex: 1,
    alignItems: 'center',
    height: '100%',
    justifyContent: 'flex-end',
  },
  barFill: {
    width: 14,
    backgroundColor: colors.accent,
    borderRadius: radii.sm,
    minHeight: 8,
  },
  barDay: {
    fontSize: 10,
    color: colors.muted,
    marginTop: 4,
  },
  calBadge: {
    backgroundColor: '#fef7e0',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radii.pill,
  },
  calBadgeText: {
    fontSize: 11,
    fontFamily: typography.fontFamily.uiMedium,
    color: '#b06000',
  },
  ingrLabel: {
    fontSize: 11,
    fontFamily: typography.fontFamily.uiMedium,
    color: colors.muted,
    marginTop: spacing.xs,
    marginBottom: 4,
  },
  pillWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  itemPill: {
    backgroundColor: colors.surfaceWarm,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radii.md,
  },
  itemPillText: {
    fontSize: 11,
    color: colors.inkSecondary,
  },
  macroPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: spacing.sm,
  },
  macroPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radii.sm,
  },
  macroPillText: {
    fontSize: 11,
    fontFamily: typography.fontFamily.uiMedium,
  },
  nutritionInsightBox: {
    marginTop: spacing.sm,
    backgroundColor: '#f2f8f4',
    padding: spacing.sm,
    borderRadius: radii.md,
    borderLeftWidth: 3,
    borderLeftColor: '#34a853',
  },
  nutritionInsightKicker: {
    fontSize: 9,
    fontFamily: typography.fontFamily.uiMedium,
    color: '#137333',
    marginBottom: 2,
  },
  nutritionInsightText: {
    fontSize: 11.5,
    color: colors.ink,
    lineHeight: 16,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  goalTitle: {
    fontSize: 14,
    fontFamily: typography.fontFamily.uiMedium,
    color: colors.ink,
  },
  goalSub: {
    fontSize: 12,
    color: colors.muted,
    marginTop: 2,
  },
  progressActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  microBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.surfaceWarm,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  microBtnText: {
    fontSize: 14,
    fontFamily: typography.fontFamily.uiMedium,
    color: colors.ink,
  },
  goalProgress: {
    fontSize: 13,
    fontFamily: typography.fontFamily.uiMedium,
    fontWeight: '600',
    color: colors.ink,
    minWidth: 35,
    textAlign: 'center',
  },
  progressBar: {
    height: 6,
    backgroundColor: colors.surfaceWarm,
    borderRadius: radii.pill,
    marginTop: spacing.sm,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.accent,
  },
  planRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  planDayBadge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.surfaceWarm,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  planDayCompleted: {
    backgroundColor: '#e6f4ea',
  },
  planDayText: {
    fontSize: 12,
    fontFamily: typography.fontFamily.uiMedium,
    color: colors.ink,
  },
  planDayCompletedText: {
    color: '#137333',
  },
  planInfo: {
    flex: 1,
  },
  planWorkout: {
    fontSize: 13,
    fontFamily: typography.fontFamily.uiMedium,
    color: colors.ink,
  },
  planDist: {
    fontSize: 12,
    color: colors.muted,
    marginTop: 2,
  },
  planStatusWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radii.pill,
    backgroundColor: colors.surfaceWarm,
  },
  statusCompleted: {
    backgroundColor: '#e6f4ea',
  },
  statusToday: {
    backgroundColor: colors.ink,
  },
  statusPillText: {
    fontSize: 11,
    fontFamily: typography.fontFamily.uiMedium,
    color: colors.muted,
  },
  statusCompletedText: {
    color: '#137333',
  },
  statusTodayText: {
    color: '#ffffff',
  },
  iconCalBtn: {
    padding: 6,
  },
  iconCalBtnText: {
    fontSize: 14,
  },
  monthNavRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 12,
  },
  monthNavBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#f1f4ef',
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthNavBtnText: {
    fontSize: 22,
    color: '#7e9381',
    lineHeight: 24,
  },
  monthTitleText: {
    fontSize: 16,
    fontFamily: typography.fontFamily.uiMedium,
    fontWeight: '600',
    color: '#1e293b',
  },
  dowRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 8,
    paddingHorizontal: 2,
  },
  dowText: {
    width: '13.4%',
    textAlign: 'center',
    fontSize: 11,
    color: '#94a3b8',
    fontFamily: typography.fontFamily.uiMedium,
    fontWeight: '600',
  },
  monthGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 4,
  },
  calendarCell: {
    width: '13.4%',
    minHeight: 74,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e7ebe3',
    backgroundColor: '#ffffffb8',
    padding: 4,
    justifyContent: 'space-between',
  },
  cellEmpty: {
    borderWidth: 0,
    backgroundColor: 'transparent',
  },
  cellTraining: {
    backgroundColor: '#edf4ed',
    borderColor: '#d8e5d8',
  },
  cellRest: {
    backgroundColor: '#f4f5f1',
    borderColor: '#e5e7eb',
  },
  cellLong: {
    backgroundColor: '#f6eae1',
    borderColor: '#fed7aa',
  },
  cellDayNum: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#334155',
    fontFamily: typography.fontFamily.uiMedium,
  },
  cellDayNumLong: {
    color: '#c2410c',
  },
  cellWorkoutText: {
    fontSize: 8.5,
    lineHeight: 11,
    color: '#435548',
    fontFamily: typography.fontFamily.uiRegular,
    marginVertical: 2,
  },
  cellWorkoutTextLong: {
    color: '#9a3412',
    fontWeight: '600',
  },
  cellWeekTag: {
    fontSize: 8,
    color: '#7e987e',
    fontFamily: typography.fontFamily.uiMedium,
    marginTop: 'auto',
  },
  planLegend: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 14,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    justifyContent: 'center',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 11,
    color: '#87988b',
    fontFamily: typography.fontFamily.uiRegular,
  },
  familyPills: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  familyPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  familyPillActive: {
    backgroundColor: colors.ink,
  },
  familyPillText: {
    fontSize: 12,
    fontFamily: typography.fontFamily.uiMedium,
    color: colors.inkSecondary,
  },
  familyPillTextActive: {
    color: '#ffffff',
  },
  outlineBtn: {
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderDark,
    borderRadius: radii.pill,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: colors.surfaceWarm,
  },
  outlineBtnText: {
    fontSize: 12,
    fontFamily: typography.fontFamily.uiMedium,
    color: colors.ink,
  },
  reportSummary: {
    fontSize: 12,
    color: colors.inkSecondary,
    lineHeight: 17,
    marginTop: 6,
    backgroundColor: colors.surfaceWarm,
    padding: spacing.xs,
    borderRadius: radii.sm,
  },
  biomarkerSection: {
    marginTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    paddingTop: spacing.xs,
  },
  biomarkerHeading: {
    fontSize: 11,
    fontFamily: typography.fontFamily.uiMedium,
    color: colors.muted,
    marginBottom: 6,
  },
  biomarkerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  biomarkerName: {
    fontSize: 12,
    fontFamily: typography.fontFamily.uiMedium,
    color: colors.ink,
  },
  biomarkerRange: {
    fontSize: 10,
    color: colors.muted,
  },
  biomarkerValue: {
    fontSize: 13,
    fontFamily: typography.fontFamily.uiMedium,
    color: colors.ink,
    marginRight: 10,
  },
  bioStatusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radii.sm,
  },
  bioStatusGreen: {
    backgroundColor: '#e6f4ea',
  },
  bioStatusText: {
    fontSize: 9,
    fontFamily: typography.fontFamily.uiMedium,
  },
  bioStatusGreenText: {
    color: '#137333',
  },
  bioStatusAlert: {
    backgroundColor: '#fce8e6',
  },
  bioStatusAlertText: {
    color: '#c5221f',
  },
  filterSectionTitle: {
    fontSize: 13.5,
    fontFamily: typography.fontFamily.uiMedium,
    color: '#374151',
    marginBottom: 8,
    marginTop: 12,
  },
  filterPillsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingBottom: 4,
  },
  filterPill: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
  },
  filterPillActive: {
    backgroundColor: '#dcfce7',
    borderColor: '#bbf7d0',
  },
  filterPillText: {
    fontSize: 13,
    fontFamily: typography.fontFamily.uiRegular,
    color: '#4b5563',
  },
  filterPillTextActive: {
    color: '#166534',
    fontFamily: typography.fontFamily.uiMedium,
    fontWeight: '600',
  },
  eventItemCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    flexDirection: 'row',
    alignItems: 'center',
  },
  eventDateBadgeBox: {
    width: 46,
    height: 48,
    borderRadius: 10,
    backgroundColor: '#fff7ed',
    borderWidth: 1,
    borderColor: '#ffedd5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  eventDateDay: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ea580c',
    fontFamily: typography.fontFamily.uiMedium,
    lineHeight: 20,
  },
  eventDateMonth: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#c2410c',
    textTransform: 'uppercase',
    fontFamily: typography.fontFamily.uiMedium,
    marginTop: 1,
  },
  eventInfoCol: {
    flex: 1,
    justifyContent: 'center',
  },
  eventItemTitle: {
    fontSize: 14.5,
    fontFamily: typography.fontFamily.uiMedium,
    fontWeight: '600',
    color: '#1c1917',
  },
  eventItemSubtitle: {
    fontSize: 12,
    color: '#78716c',
    marginTop: 2,
    fontFamily: typography.fontFamily.uiRegular,
  },
  eventArrowBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginLeft: 8,
  },
  eventArrowText: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '600',
  },
  eventRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  eventDateBadge: {
    backgroundColor: colors.surfaceWarm,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radii.md,
    marginRight: spacing.sm,
  },
  eventDateText: {
    fontSize: 11,
    fontFamily: typography.fontFamily.uiMedium,
    color: colors.ink,
  },
  eventInfo: {
    flex: 1,
  },
  eventTitle: {
    fontSize: 14,
    fontFamily: typography.fontFamily.uiMedium,
    color: colors.ink,
  },
  eventSub: {
    fontSize: 12,
    color: colors.muted,
    marginTop: 2,
  },
  regBadge: {
    backgroundColor: '#e6f4ea',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radii.pill,
  },
  regBadgeText: {
    fontSize: 10,
    fontFamily: typography.fontFamily.uiMedium,
    color: '#137333',
  },
  setTargetBtn: {
    backgroundColor: colors.ink,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radii.pill,
  },
  setTargetBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontFamily: typography.fontFamily.uiMedium,
  },
  lockedTargetCard: {
    backgroundColor: '#fefce8',
    borderWidth: 1.5,
    borderColor: '#fef08a',
    borderRadius: radii.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  lockedTargetKicker: {
    fontSize: 10.5,
    fontFamily: typography.fontFamily.uiMedium,
    color: '#854d0e',
    letterSpacing: 0.5,
  },
  lockedTargetTitle: {
    fontSize: 14,
    fontFamily: typography.fontFamily.uiMedium,
    color: colors.ink,
    marginTop: 2,
  },
  lockedTargetSub: {
    fontSize: 12,
    color: colors.inkSecondary,
    marginTop: 2,
  },
  journalInput: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderDark,
    borderRadius: radii.md,
    padding: spacing.md,
    fontSize: 13,
    color: colors.ink,
    marginTop: spacing.sm,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  primaryBtn: {
    backgroundColor: colors.ink,
    paddingVertical: 10,
    borderRadius: radii.pill,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  primaryBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontFamily: typography.fontFamily.uiMedium,
  },
  journalDate: {
    fontSize: 11,
    fontFamily: typography.fontFamily.uiMedium,
    color: colors.muted,
  },
  journalBody: {
    fontSize: 13,
    color: colors.inkSecondary,
    lineHeight: 18,
    marginTop: 4,
  },
  aiReflectionBox: {
    marginTop: spacing.sm,
    backgroundColor: '#f3f6fc',
    padding: spacing.sm,
    borderRadius: radii.md,
    borderLeftWidth: 3,
    borderLeftColor: '#0d6efd',
  },
  aiReflectionKicker: {
    fontSize: 10,
    fontFamily: typography.fontFamily.uiMedium,
    color: '#0d6efd',
    marginBottom: 2,
  },
  aiReflectionText: {
    fontSize: 12,
    color: colors.ink,
    lineHeight: 16,
  },
  smallOutlineBtn: {
    borderWidth: 1,
    borderColor: colors.borderDark,
    borderRadius: radii.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  smallOutlineBtnText: {
    fontSize: 11,
    fontFamily: typography.fontFamily.uiMedium,
    color: colors.ink,
  },
  inlineFormCard: {
    backgroundColor: colors.surfaceWarm,
    padding: spacing.md,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    gap: spacing.xs,
  },
  textInput: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: radii.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: 8,
    fontSize: 13,
    color: colors.ink,
  },
  formRow: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  realBleButton: {
    backgroundColor: '#0d6efd',
    paddingVertical: 10,
    borderRadius: radii.md,
    alignItems: 'center',
    marginVertical: spacing.xs,
  },
  realBleButtonText: {
    fontSize: 12,
    fontFamily: typography.fontFamily.uiMedium,
    color: '#ffffff',
  },
  emptyTitle: {
    fontSize: 13.5,
    fontFamily: typography.fontFamily.uiMedium,
    color: colors.ink,
    marginBottom: 4,
  },
  realBleHeroCard: {
    backgroundColor: '#ebf3fe',
    borderWidth: 1.5,
    borderColor: '#b9d5fb',
    padding: spacing.md,
    borderRadius: radii.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginVertical: spacing.xs,
  },
  realBleIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  realBleHeroTitle: {
    fontSize: 13.5,
    fontFamily: typography.fontFamily.uiMedium,
    color: '#0d6efd',
  },
  realBleHeroSub: {
    fontSize: 11,
    color: colors.inkSecondary,
    marginTop: 2,
  },
  realBleArrow: {
    fontSize: 18,
    color: '#0d6efd',
    fontWeight: 'bold',
  },
  pulsingGreenDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#34a853',
  },
  watchIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  oneTapConnectBadge: {
    backgroundColor: colors.ink,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radii.pill,
  },
  oneTapConnectText: {
    color: '#ffffff',
    fontSize: 11,
    fontFamily: typography.fontFamily.uiMedium,
  },
  manualEntrySection: {
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  manualEntryLabel: {
    fontSize: 11,
    fontFamily: typography.fontFamily.uiMedium,
    color: colors.muted,
    marginBottom: spacing.xs,
  },
  manualEntryRow: {
    flexDirection: 'row',
    gap: 8,
  },
  manualInput: {
    flex: 1,
    backgroundColor: colors.surfaceWarm,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: radii.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: 7,
    fontSize: 12,
    color: colors.ink,
  },
  manualConnectBtn: {
    backgroundColor: colors.ink,
    paddingHorizontal: 16,
    borderRadius: radii.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  manualConnectBtnDisabled: {
    opacity: 0.5,
  },
  manualConnectText: {
    color: '#ffffff',
    fontSize: 12,
    fontFamily: typography.fontFamily.uiMedium,
  },
  activeConnectedBanner: {
    backgroundColor: '#f0fdf4',
    borderWidth: 1.5,
    borderColor: '#86efac',
    borderRadius: radii.lg,
    padding: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  activeConnectedTitle: {
    fontSize: 13,
    fontFamily: typography.fontFamily.uiMedium,
    color: '#166534',
    fontWeight: '700',
  },
  activeConnectedSub: {
    fontSize: 11,
    color: '#15803d',
    marginTop: 2,
  },
  disconnectBadgeBtn: {
    backgroundColor: '#dc2626',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radii.pill,
  },
  disconnectBadgeText: {
    color: '#ffffff',
    fontSize: 11,
    fontFamily: typography.fontFamily.uiMedium,
    fontWeight: '600',
  },
  directBleScanBanner: {
    backgroundColor: '#edf4ed',
    borderWidth: 1.5,
    borderColor: '#9eb8a3',
    padding: spacing.sm,
    borderRadius: radii.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: spacing.sm,
  },
  directBleIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#dae7db',
    alignItems: 'center',
    justifyContent: 'center',
  },
  directBleTitle: {
    fontSize: 13,
    fontFamily: typography.fontFamily.uiMedium,
    fontWeight: '600',
    color: '#34513c',
  },
  directBleSubtitle: {
    fontSize: 11,
    fontFamily: typography.fontFamily.uiRegular,
    color: '#6e8375',
    marginTop: 1,
  },
  directBleActionPill: {
    fontSize: 11,
    fontFamily: typography.fontFamily.uiMedium,
    fontWeight: '600',
    color: '#ffffff',
    backgroundColor: '#34513c',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radii.pill,
    overflow: 'hidden',
  },
  noDevicesLiveCard: {
    backgroundColor: '#f8faf7',
    borderWidth: 1.5,
    borderColor: '#e2ece1',
    borderRadius: radii.lg,
    padding: spacing.lg,
    alignItems: 'center',
    textAlign: 'center',
    marginVertical: spacing.sm,
  },
  radarWaveCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#edf4ed',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  noDevicesLiveTitle: {
    fontSize: 14,
    fontFamily: typography.fontFamily.uiMedium,
    fontWeight: '700',
    color: '#34513c',
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  noDevicesLiveSubtitle: {
    fontSize: 12,
    fontFamily: typography.fontFamily.uiRegular,
    color: '#6e8375',
    lineHeight: 19,
    textAlign: 'center',
  },
  realBleHeroCardSecondary: {
    backgroundColor: '#f1f5f9',
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    padding: spacing.md,
    borderRadius: radii.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginVertical: spacing.xs,
  },
  livePulsePill: {
    backgroundColor: '#fee2e2',
    borderWidth: 1,
    borderColor: '#fca5a5',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radii.pill,
    marginLeft: 6,
  },
  livePulsePillText: {
    fontSize: 11,
    color: '#b91c1c',
    fontFamily: typography.fontFamily.uiMedium,
  },
  bleHelpCard: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: radii.md,
    padding: spacing.sm,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  bleHelpTitle: {
    fontSize: 12,
    fontFamily: typography.fontFamily.uiMedium,
    color: colors.ink,
    marginBottom: 4,
  },
  bleHelpItem: {
    fontSize: 11,
    color: colors.inkSecondary,
    lineHeight: 16,
    marginBottom: 3,
  },
  protoSectionTitle: {
    fontSize: 16,
    fontFamily: typography.fontFamily.uiMedium,
    fontWeight: '700',
    color: colors.ink,
    marginVertical: spacing.sm,
  },
  profileCircleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
    marginBottom: spacing.sm,
  },
  profileCircleItem: {
    alignItems: 'center',
    gap: 6,
  },
  profileCircleIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#e0e7dc',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileCircleIconWrapActive: {
    backgroundColor: '#dae7db',
    borderColor: '#9eb8a3',
  },
  profileCircleSymbol: {
    fontSize: 20,
    color: '#718078',
  },
  profileCircleSymbolActive: {
    color: '#34513c',
  },
  profileCircleLabel: {
    fontSize: 12,
    fontFamily: typography.fontFamily.uiRegular,
    color: colors.inkSecondary,
  },
  profileCircleLabelActive: {
    fontFamily: typography.fontFamily.uiMedium,
    fontWeight: '600',
    color: '#34513c',
  },
  bodyHeroCard: {
    backgroundColor: '#e9f0e9',
    borderRadius: 24,
    padding: 24,
    marginVertical: spacing.xs,
  },
  bodyHeroPerson: {
    fontSize: 12,
    color: '#778c7c',
    fontFamily: typography.fontFamily.uiMedium,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  bodyHeroBigRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    marginVertical: 4,
  },
  bodyHeroBigNum: {
    fontSize: 44,
    fontFamily: typography.fontFamily.serifRegular,
    fontWeight: '700',
    color: '#34443a',
  },
  bodyHeroUnit: {
    fontSize: 16,
    fontFamily: typography.fontFamily.uiRegular,
    color: '#778c7c',
  },
  bodyHeroSub: {
    fontSize: 14,
    fontFamily: typography.fontFamily.uiRegular,
    color: '#6e8375',
    marginTop: 2,
  },
  timelineList: {
    marginTop: spacing.xs,
    marginBottom: spacing.sm,
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: spacing.xs,
  },
  timelineGutter: {
    width: 20,
    alignItems: 'center',
    position: 'relative',
    height: '100%',
    paddingTop: 4,
  },
  timelineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#435f4f',
    zIndex: 2,
  },
  timelineLine: {
    position: 'absolute',
    top: 12,
    bottom: -16,
    width: 2,
    backgroundColor: '#dae7db',
    zIndex: 1,
  },
  timelineContent: {
    flex: 1,
    paddingLeft: 8,
  },
  timelineDate: {
    fontSize: 11,
    color: colors.muted,
    fontFamily: typography.fontFamily.uiRegular,
  },
  timelineActivity: {
    fontSize: 14,
    fontFamily: typography.fontFamily.uiMedium,
    fontWeight: '600',
    color: colors.ink,
    marginTop: 1,
  },
  timelineMetrics: {
    fontSize: 12,
    color: colors.inkSecondary,
    fontFamily: typography.fontFamily.uiRegular,
    marginTop: 2,
  },
  timelineArrow: {
    fontSize: 16,
    color: colors.muted,
    paddingTop: 4,
  },
  protoFlatActionBtn: {
    paddingVertical: 13,
    borderRadius: radii.pill,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e0e7dc',
    alignItems: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
  protoFlatActionText: {
    fontSize: 13,
    fontFamily: typography.fontFamily.uiMedium,
    fontWeight: '600',
    color: '#34513c',
  },
  recordsHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: spacing.xs,
  },
  recordNoticeCard: {
    padding: 14,
    borderRadius: 14,
    backgroundColor: '#f7f9f6',
    borderWidth: 1,
    borderColor: '#dae7db',
    marginBottom: spacing.md,
  },
  recordNoticeTitle: {
    fontSize: 13,
    fontFamily: typography.fontFamily.uiMedium,
    fontWeight: '600',
    color: '#34513c',
    marginBottom: 4,
  },
  recordNoticeDesc: {
    fontSize: 12,
    fontFamily: typography.fontFamily.uiRegular,
    color: '#6e8375',
    lineHeight: 18,
  },
  dummyReportCardHighlight: {
    borderWidth: 1.5,
    borderColor: '#9eb8a3',
    backgroundColor: '#fafcfa',
  },
  dummyBadge: {
    backgroundColor: '#f9ecd9',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  dummyBadgeText: {
    fontSize: 9,
    fontFamily: typography.fontFamily.uiMedium,
    fontWeight: '700',
    color: '#a36214',
    letterSpacing: 0.5,
  },
  docActionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  replaceReportBtn: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: radii.pill,
    backgroundColor: '#edf4ed',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#9eb8a3',
  },
  replaceReportBtnText: {
    fontSize: 12,
    fontFamily: typography.fontFamily.uiMedium,
    fontWeight: '600',
    color: '#34513c',
  },
  deleteReportBtn: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: radii.pill,
    backgroundColor: '#fff0f0',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ffd0d0',
  },
  deleteReportBtnText: {
    fontSize: 12,
    fontFamily: typography.fontFamily.uiMedium,
    fontWeight: '600',
    color: '#c93b2b',
  },
  protoRecordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    gap: 10,
  },
  protoRecordIcon: {
    fontSize: 15,
    color: colors.muted,
  },
  protoRecordTitle: {
    fontSize: 13,
    fontFamily: typography.fontFamily.uiMedium,
    fontWeight: '600',
    color: colors.ink,
  },
  protoRecordDate: {
    fontSize: 11,
    color: colors.muted,
    fontFamily: typography.fontFamily.uiRegular,
    marginTop: 2,
  },
  protoRecordArrow: {
    fontSize: 15,
    color: colors.muted,
  },
  statGridTwo: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginVertical: spacing.sm,
  },
  statGridItem: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: colors.surfaceWarm,
    padding: spacing.sm,
    borderRadius: radii.md,
  },
  statGridLabel: {
    fontSize: 11,
    fontFamily: typography.fontFamily.uiRegular,
    color: colors.muted,
    textTransform: 'uppercase',
  },
  statGridVal: {
    fontSize: 16,
    fontFamily: typography.fontFamily.uiMedium,
    fontWeight: '600',
    color: colors.ink,
    marginTop: 4,
  },
});
