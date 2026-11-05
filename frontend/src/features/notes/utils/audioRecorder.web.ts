export interface AudioRecordResult {
  audioBase64?: string;
  rawTranscript?: string;
  mimeType: string;
}

class WebAudioRecorder {
  private webMediaRecorder: any = null;
  private webAudioChunks: Blob[] = [];
  private webStream: MediaStream | null = null;
  private recognition: any = null;
  private transcriptText: string = '';

  async start(lang: string = 'mr-IN'): Promise<boolean> {
    try {
      this.transcriptText = '';

      // 1. Audio MediaRecorder stream
      if (typeof navigator !== 'undefined' && navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        this.webStream = stream;
        this.webAudioChunks = [];

        const mediaRecorder = new (window as any).MediaRecorder(stream);
        mediaRecorder.ondataavailable = (event: any) => {
          if (event.data && event.data.size > 0) {
            this.webAudioChunks.push(event.data);
          }
        };
        mediaRecorder.start(250);
        this.webMediaRecorder = mediaRecorder;
      }

      // 2. Real-time Speech-to-Text via Chrome / Edge Speech API
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (SpeechRecognition) {
        try {
          const rec = new SpeechRecognition();
          rec.continuous = true;
          rec.interimResults = true;
          rec.lang = lang || 'mr-IN';

          rec.onresult = (event: any) => {
            let full = '';
            for (let i = 0; i < event.results.length; ++i) {
              full += event.results[i][0].transcript + ' ';
            }
            this.transcriptText = full.trim();
          };

          rec.onerror = (e: any) => {
            console.warn('[SpeechRecognition]:', e?.error);
          };

          rec.start();
          this.recognition = rec;
        } catch (recErr) {
          console.warn('[SpeechRecognition start error]:', recErr);
        }
      }

      return true;
    } catch (err) {
      console.error('Failed to start web audio recording:', err);
      return false;
    }
  }

  async stop(): Promise<AudioRecordResult> {
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch (e) {}
      this.recognition = null;
    }

    const liveTranscript = this.transcriptText;

    return new Promise((resolve) => {
      if (!this.webMediaRecorder || this.webMediaRecorder.state === 'inactive') {
        this.cleanup();
        return resolve({ rawTranscript: liveTranscript, mimeType: 'audio/webm' });
      }

      this.webMediaRecorder.onstop = () => {
        try {
          const audioBlob = new Blob(this.webAudioChunks, { type: 'audio/webm' });
          const reader = new FileReader();
          reader.readAsDataURL(audioBlob);
          reader.onloadend = () => {
            const base64Audio = reader.result as string;
            this.cleanup();
            resolve({
              audioBase64: base64Audio,
              rawTranscript: liveTranscript,
              mimeType: 'audio/webm',
            });
          };
        } catch (e) {
          this.cleanup();
          resolve({ rawTranscript: liveTranscript, mimeType: 'audio/webm' });
        }
      };

      this.webMediaRecorder.stop();
    });
  }

  cancel() {
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch (e) {}
      this.recognition = null;
    }
    this.cleanup();
  }

  private cleanup() {
    if (this.webStream) {
      this.webStream.getTracks().forEach((track) => track.stop());
      this.webStream = null;
    }
    if (this.webMediaRecorder && this.webMediaRecorder.state !== 'inactive') {
      try {
        this.webMediaRecorder.stop();
      } catch (e) {}
    }
    this.webMediaRecorder = null;
    this.webAudioChunks = [];
  }
}

export const audioRecorder = new WebAudioRecorder();
