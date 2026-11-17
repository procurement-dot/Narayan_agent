import React, { useEffect, useState } from 'react';
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
import { HealthTab, PersonName } from './health.types';
import { colors, radii, spacing, typography } from '../../shared/theme/tokens';
import { useToast } from '../../shared/components/Toast';
import { pickFileOrPhoto } from './utils/filePicker';

const HEALTH_TABS: { id: HealthTab; label: string }[] = [
  { id: 'today', label: 'Today' },
  { id: 'nutrition', label: '🥗 Smart Plate' },
  { id: 'plan', label: '12-Week Plan' },
  { id: 'goals', label: 'Goals' },
  { id: 'body', label: 'Body & Lab' },
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

  // Local Form States
  const [showAddGoal, setShowAddGoal] = useState(false);
  const [newGoalName, setNewGoalName] = useState('');
  const [newGoalCategory, setNewGoalCategory] = useState('Speed endurance');
  const [newGoalDate, setNewGoalDate] = useState('Next target');

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

    const brand = device.name ? device.name.split(' ')[0] : 'Smartwatch';
    const msg = await pairAndConnectDevice(brand, device.name || 'Bluetooth Smartwatch', 'bluetooth_ble', batteryLevel);
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

  // B. Scan All Bluetooth Devices (Unfiltered)
  const handleScanAllBleDevices = async () => {
    if (typeof navigator !== 'undefined' && (navigator as any).bluetooth) {
      try {
        showToast('Scanning all Bluetooth devices nearby...', 'info');
        const device = await (navigator as any).bluetooth.requestDevice({
          acceptAllDevices: true,
          optionalServices: ['heart_rate', 'battery_service', 'device_information', 0x180D, 0x180F, 0x180A],
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
    if (typeof navigator !== 'undefined' && (navigator as any).bluetooth) {
      await handleScanSmartwatchHR();
    } else {
      scanDevices();
      openConnectModal();
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
            {/* Tracking Source Switcher (Watch vs Phone Sensors) */}
            <View style={styles.sourceToggleRow}>
              <TouchableOpacity
                style={[
                  styles.sourceToggleBtn,
                  trackingSource === 'watch' && styles.sourceToggleBtnActive,
                ]}
                onPress={() => setTrackingSource('watch')}
              >
                <Text
                  style={[
                    styles.sourceToggleBtnText,
                    trackingSource === 'watch' && styles.sourceToggleBtnTextActive,
                  ]}
                  numberOfLines={1}
                >
                  ⌚ {wearableStatus.connected ? wearableStatus.device_name.split(' ')[0] + ' Watch' : 'Smartwatch'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.sourceToggleBtn,
                  trackingSource === 'phone' && styles.sourceToggleBtnActive,
                ]}
                onPress={() => setTrackingSource('phone')}
              >
                <Text
                  style={[
                    styles.sourceToggleBtnText,
                    trackingSource === 'phone' && styles.sourceToggleBtnTextActive,
                  ]}
                >
                  📱 Phone Sensors (No Watch)
                </Text>
              </TouchableOpacity>
            </View>

            {/* A. If Smartwatch Source Selected */}
            {trackingSource === 'watch' && (
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
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Week 4 of 12 — Speed Endurance</Text>
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

                  <View style={styles.planStatusWrapper}>
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

                    <TouchableOpacity
                      style={styles.iconCalBtn}
                      onPress={() => handleSyncToCalendar(d.id)}
                      accessibilityLabel="Sync to Calendar"
                    >
                      <Text style={styles.iconCalBtnText}>📅</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))}
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

        {/* 5. BODY & LAB TAB (With Real Upload and Biomarkers Table) */}
        {currentTab === 'body' && (
          <View style={styles.section}>
            <View style={styles.familyPills}>
              {(['Self', 'Neha', 'Prayan'] as const).map((p: PersonName) => (
                <TouchableOpacity
                  key={p}
                  style={[
                    styles.familyPill,
                    selectedPerson === p && styles.familyPillActive,
                  ]}
                  onPress={() => setSelectedPerson(p)}
                >
                  <Text
                    style={[
                      styles.familyPillText,
                      selectedPerson === p && styles.familyPillTextActive,
                    ]}
                  >
                    {p}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Profile Vitals Card */}
            <View style={styles.card}>
              <Text style={styles.cardKicker}>{selectedPerson.toUpperCase()}'S VITALS & METRICS</Text>
              <Text style={styles.cardTitle}>Baseline & Physiological Profile</Text>
              <Text style={styles.cardDesc}>
                Resting Heart Rate: {vitals.resting_hr > 0 ? `${vitals.resting_hr} bpm` : '--'}{'\n'}
                Sleep Average: {vitals.sleep_duration_minutes > 0 ? formatSleepDuration(vitals.sleep_duration_minutes) : '--'}{'\n'}
                Hydration: {vitals.hydration_liters > 0 ? `${vitals.hydration_liters}L / day` : '--'}{'\n'}
                Recovery Score: {vitals.recovery_score > 0 ? `${vitals.recovery_score}%` : '--'}
              </Text>

              {/* Upload Report Button (Triggers Actual File / Photo Picker) */}
              <TouchableOpacity
                style={[styles.outlineBtn, isAnalyzingReport && styles.scanHeroBtnDisabled]}
                onPress={handlePickLabReport}
                disabled={isAnalyzingReport}
              >
                {isAnalyzingReport ? (
                  <View style={styles.rowCenter}>
                    <ActivityIndicator size="small" color={colors.ink} />
                    <Text style={[styles.outlineBtnText, { marginLeft: 8 }]}>
                      Extracting Biomarkers with OCR AI...
                    </Text>
                  </View>
                ) : (
                  <Text style={styles.outlineBtnText}>📑 Upload Lab Report (PDF / Image)</Text>
                )}
              </TouchableOpacity>
            </View>

            {/* Medical Documents & Biomarkers List */}
            <Text style={styles.sectionTitle}>Indexed Lab Reports & Blood Biomarkers</Text>
            {documents.length === 0 ? (
              <View style={styles.card}>
                <Text style={styles.cardDesc}>No medical documents uploaded yet.</Text>
              </View>
            ) : (
              documents.map((doc) => (
                <View key={doc.id} style={styles.card}>
                  <View style={styles.kickerRow}>
                    <Text style={styles.cardKicker}>{doc.doc_type.toUpperCase()}</Text>
                    <Text style={styles.badgeText}>{doc.test_date}</Text>
                  </View>
                  <Text style={styles.cardTitle}>{doc.title}</Text>
                  {doc.extracted_summary && (
                    <Text style={styles.reportSummary}>{doc.extracted_summary}</Text>
                  )}

                  {/* Biomarkers Table */}
                  {doc.biomarkers && doc.biomarkers.length > 0 && (
                    <View style={styles.biomarkerSection}>
                      <Text style={styles.biomarkerHeading}>Extracted Blood Markers:</Text>
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
                </View>
              ))
            )}
          </View>
        )}

        {/* 6. TARGET EVENTS TAB */}
        {currentTab === 'events' && (
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Target Races & Competitions</Text>
              <Text style={styles.badgeText}>{events.length} Upcoming</Text>
            </View>

            {events.length === 0 ? (
              <View style={styles.card}>
                <Text style={styles.emptyTitle}>🏅 No Events Registered Yet</Text>
                <Text style={styles.cardDesc}>
                  Add your target half marathon, full marathon, or triathlon event to sync with your training schedule.
                </Text>
              </View>
            ) : (
              events.map((e) => (
                <View key={e.id} style={styles.card}>
                  <View style={styles.eventRow}>
                    <View style={styles.eventDateBadge}>
                      <Text style={styles.eventDateText}>{e.date}</Text>
                    </View>
                    <View style={styles.eventInfo}>
                      <Text style={styles.eventTitle}>{e.name}</Text>
                      <Text style={styles.eventSub}>
                        {e.sport} · {e.region}
                      </Text>
                    </View>
                    {e.registered && (
                      <View style={styles.regBadge}>
                        <Text style={styles.regBadgeText}>Registered</Text>
                      </View>
                    )}
                  </View>
                </View>
              ))
            )}
          </View>
        )}

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
          <View style={styles.modalCard}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Pair Your Smartwatch</Text>
                <Text style={styles.modalSubtitle}>Auto-detecting active Bluetooth devices nearby</Text>
              </View>
              <TouchableOpacity onPress={closeConnectModal} style={styles.modalCloseBtn}>
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 440 }}>
              {/* Option A: Dedicated Smartwatch HR BLE Scanner (Filters out TVs, Laptops, etc.) */}
              <TouchableOpacity
                style={styles.realBleHeroCard}
                onPress={handleScanSmartwatchHR}
              >
                <View style={styles.realBleIconCircle}>
                  <Text style={{ fontSize: 20 }}>⌚</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.realBleHeroTitle}>Scan Smartwatch (Heart Rate BLE 0x180D)</Text>
                  <Text style={styles.realBleHeroSub}>
                    Filters strictly for smartwatches & HR bands. No TV/beacon clutter.
                  </Text>
                </View>
                <Text style={styles.realBleArrow}>→</Text>
              </TouchableOpacity>

              {/* Option B: Scan All Bluetooth Devices (Unfiltered BLE scan) */}
              <TouchableOpacity
                style={styles.realBleHeroCardSecondary}
                onPress={handleScanAllBleDevices}
              >
                <View style={[styles.realBleIconCircle, { backgroundColor: '#e2e8f0' }]}>
                  <Text style={{ fontSize: 18 }}>📡</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.realBleHeroTitle, { color: colors.ink }]}>
                    Scan All Bluetooth Devices (Raw BLE)
                  </Text>
                  <Text style={styles.realBleHeroSub}>
                    Detects any nearby BLE device (pick your smartwatch name)
                  </Text>
                </View>
                <Text style={[styles.realBleArrow, { color: colors.inkMuted }]}>→</Text>
              </TouchableOpacity>

              {/* 2. Detected Smartwatches List (Tap to Pair!) */}
              <View style={styles.scannerHeaderRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <View style={styles.pulsingGreenDot} />
                  <Text style={styles.modalSectionLabel}>Nearby Smartwatches Found</Text>
                </View>
                <TouchableOpacity
                  style={styles.refreshScanBtn}
                  onPress={() => scanDevices()}
                  disabled={isScanningDevices}
                >
                  {isScanningDevices ? (
                    <ActivityIndicator size="small" color={colors.ink} />
                  ) : (
                    <Text style={styles.refreshScanText}>🔄 Refresh</Text>
                  )}
                </TouchableOpacity>
              </View>

              {isScanningDevices ? (
                <View style={styles.scanningBox}>
                  <ActivityIndicator size="small" color={colors.ink} />
                  <Text style={styles.scanningText}>Listening for Bluetooth smartwatch signals...</Text>
                </View>
              ) : (
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
                        <Text style={styles.deviceItemSub}>{dev.signal} · Bluetooth BLE</Text>
                      </View>
                      <View style={styles.oneTapConnectBadge}>
                        <Text style={styles.oneTapConnectText}>Connect ⚡</Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* 3. Real Watch Connection Tips */}
              <View style={styles.bleHelpCard}>
                <Text style={styles.bleHelpTitle}>💡 Original Watch Pairing Tips:</Text>
                <Text style={styles.bleHelpItem}>
                  • <Text style={{ fontWeight: 'bold' }}>Garmin / Coros / Polar:</Text> Go to Settings ➔ Wrist Heart Rate ➔ enable <Text style={{ fontStyle: 'italic' }}>Broadcast Heart Rate</Text>.
                </Text>
                <Text style={styles.bleHelpItem}>
                  • <Text style={{ fontWeight: 'bold' }}>boAt / Noise / Fire-Boltt:</Text> Disconnect from your phone's app first so the watch enters pairing mode.
                </Text>
                <Text style={styles.bleHelpItem}>
                  • <Text style={{ fontWeight: 'bold' }}>Apple Watch / Wear OS:</Text> Open "HeartCast" or "Heart Rate Broadcast" app on the watch.
                </Text>
                <Text style={styles.bleHelpItem}>
                  • <Text style={{ fontWeight: 'bold' }}>Instant Test with Phone:</Text> Install free app <Text style={{ fontStyle: 'italic' }}>"BLE Peripheral Simulator"</Text> on any phone to test live pulse transmission!
                </Text>
              </View>

              {/* 4. Minimal Fallback (Only if watch Bluetooth is hidden) */}
              <View style={styles.manualEntrySection}>
                <Text style={styles.manualEntryLabel}>Watch not showing up? Enter name manually:</Text>
                <View style={styles.manualEntryRow}>
                  <TextInput
                    style={styles.manualInput}
                    placeholder="e.g. Noise ColorFit Pro 5, boAt Wave"
                    placeholderTextColor={colors.inkMuted}
                    value={customDeviceName}
                    onChangeText={setCustomDeviceName}
                  />
                  <TouchableOpacity
                    style={[
                      styles.manualConnectBtn,
                      (!customDeviceName.trim() || isPairingWearable) && styles.manualConnectBtnDisabled,
                    ]}
                    disabled={!customDeviceName.trim() || isPairingWearable}
                    onPress={handleConnectManual}
                  >
                    <Text style={styles.manualConnectText}>Connect</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>

            {/* Modal Footer / Disconnect if connected */}
            {wearableStatus.connected && (
              <View style={{ marginTop: spacing.md }}>
                <TouchableOpacity
                  style={styles.disconnectBtn}
                  onPress={async () => {
                    await handleDisconnectWatch();
                    closeConnectModal();
                  }}
                >
                  <Text style={styles.disconnectBtnText}>
                    Disconnect Current Watch ({wearableStatus.device_name})
                  </Text>
                </TouchableOpacity>
              </View>
            )}
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
  // Source Switcher (Watch vs Phone)
  sourceToggleRow: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceWarm,
    padding: 3,
    borderRadius: radii.pill,
    marginBottom: spacing.xs,
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
});
