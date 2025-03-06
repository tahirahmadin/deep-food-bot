export interface SpeechRecognitionResult {
  transcript: string;
}

export interface SpeechServiceCallbacks {
  onResult: (result: SpeechRecognitionResult) => void;
  onError: (error: any) => void;
  onEnd: () => void;
}

export class SpeechService {
  recognition: SpeechRecognition | null;

  constructor() {
    const SpeechRecognition =
      window.SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = false;
      this.recognition.interimResults = true;
      this.recognition.lang = "en-US";
    } else {
      this.recognition = null;
    }
  }

  isSupported() {
    return !!this.recognition;
  }

  start(callbacks: SpeechServiceCallbacks) {
    if (!this.recognition) return;
    this.recognition.onresult = (event: SpeechRecognitionEvent) => {
      let transcript = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      callbacks.onResult({ transcript });
    };
    this.recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error("Speech recognition error:", event.error);
      callbacks.onError(event.error);
    };
    this.recognition.onend = () => {
      callbacks.onEnd();
    };
    this.recognition.start();
  }

  stop() {
    if (!this.recognition) return;
    this.recognition.stop();
  }
}
