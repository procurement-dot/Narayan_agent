import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';

interface AudioRecordResult {
  audioBase64?: string;
  mimeType: string;
}

class NativeAudioRecorder {
  private recording: Audio.Recording | null = null;

  async start(): Promise<boolean> {
    try {
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
    try {
      if (!this.recording) {
        return { mimeType: 'audio/m4a' };
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
          mimeType: 'audio/m4a',
        };
      }

      return { mimeType: 'audio/m4a' };
    } catch (err) {
      console.error('Error stopping native audio recording:', err);
      this.cleanup();
      return { mimeType: 'audio/m4a' };
    }
  }

  cancel() {
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
