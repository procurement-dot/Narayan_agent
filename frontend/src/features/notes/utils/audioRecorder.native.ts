import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { NativeModules, Platform } from 'react-native';

export interface AudioRecordResult {
  audioBase64?: string;
  rawTranscript?: string;
  mimeType: string;
}

class NativeAudioRecorder {
  private recording: Audio.Recording | null = null;

  async start(lang: string = 'mr-IN'): Promise<boolean> {
    try {
      // 1. Start Native Android Speech Recognition for live spoken transcript
      if (Platform.OS === 'android' && NativeModules.OAuthServer?.startSpeechRecognition) {
        try {
          await NativeModules.OAuthServer.startSpeechRecognition(lang);
        } catch (speechErr) {
          console.warn('[SpeechRecognizer] start failed:', speechErr);
        }
      }

      // 2. Request mic permission and start expo-av audio recording
      const perm = await Audio.requestPermissionsAsync();
      if (!perm.granted) {
        console.warn('Microphone permission not granted on mobile');
        return false;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const recording = new Audio.Recording();
      await recording.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      await recording.startAsync();
      this.recording = recording;
      return true;
    } catch (err) {
      console.error('Failed to start native audio recording:', err);
      return false;
    }
  }

  async stop(): Promise<AudioRecordResult> {
    let rawTranscript = '';

    // 1. Stop Speech Recognition and fetch transcribed words
    if (Platform.OS === 'android' && NativeModules.OAuthServer?.stopSpeechRecognition) {
      try {
        const text = await NativeModules.OAuthServer.stopSpeechRecognition();
        if (text && typeof text === 'string') {
          rawTranscript = text.trim();
        }
      } catch (speechErr) {
        console.warn('[SpeechRecognizer] stop failed:', speechErr);
      }
    }

    try {
      if (!this.recording) {
        return { rawTranscript, mimeType: 'audio/m4a' };
      }

      await this.recording.stopAndUnloadAsync();
      const uri = this.recording.getURI();
      this.recording = null;

      if (uri) {
        const base64Data = await FileSystem.readAsStringAsync(uri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        return {
          audioBase64: `data:audio/m4a;base64,${base64Data}`,
          rawTranscript,
          mimeType: 'audio/m4a',
        };
      }

      return { rawTranscript, mimeType: 'audio/m4a' };
    } catch (err) {
      console.error('Error stopping native audio recording:', err);
      this.cleanup();
      return { rawTranscript, mimeType: 'audio/m4a' };
    }
  }

  cancel() {
    if (Platform.OS === 'android' && NativeModules.OAuthServer?.stopSpeechRecognition) {
      NativeModules.OAuthServer.stopSpeechRecognition().catch(() => {});
    }
    this.cleanup();
  }

  private cleanup() {
    if (this.recording) {
      try {
        this.recording.stopAndUnloadAsync();
      } catch (e) {}
      this.recording = null;
    }
  }
}

export const audioRecorder = new NativeAudioRecorder();
