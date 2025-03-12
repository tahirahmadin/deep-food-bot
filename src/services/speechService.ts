// src/services/speechService.ts

export interface SpeechRecognitionResult {
    transcript: string;
    isFinal: boolean;
  }
  
  type SpeechRecognitionCallback = (result: SpeechRecognitionResult) => void;
  type ErrorCallback = (error: string) => void;
  
  export class SpeechService {
    private recognition: SpeechRecognition | null = null;
    private isListening: boolean = false;
    private interimTranscriptBuffer: string = '';
  
    constructor() {
      this.initializeSpeechRecognition();
    }
  
    public isSupported(): boolean {
      return 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;
    }
  
    private initializeSpeechRecognition(): void {
      // Only initialize if supported
      if (!this.isSupported()) {
        return;
      }
  
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  
      try {
        this.recognition = new SpeechRecognition();
        this.recognition.continuous = false;
        this.recognition.interimResults = true;
        this.recognition.lang = "en-US";
      } catch (error) {
        console.error("Error initializing speech recognition:", error);
        this.recognition = null;
      }
    }
  
    public startListening(
      onResult: SpeechRecognitionCallback,
      onError: ErrorCallback
    ): void {
      // Check support before starting
      if (!this.isSupported()) {
        onError("Speech recognition is not supported in this browser");
        return;
      }
  
      // Check if recognition was initialized successfully
      if (!this.recognition) {
        onError("Speech recognition failed to initialize");
        return;
      }
  
      if (this.isListening) {
        return;
      }
  
      this.isListening = true;
      this.interimTranscriptBuffer = '';
  
      this.recognition.onresult = (event: SpeechRecognitionEvent) => {
        const lastResult = event.results[event.results.length - 1];
        const transcript = lastResult[0].transcript;
  
        if (lastResult.isFinal) {
          onResult({
            transcript: transcript.trim(),
            isFinal: true,
          });
          
          // Stop listening after final result
          this.stopListening();
        } else {
          onResult({
            transcript: transcript.trim(),
            isFinal: false,
          });
        }
      };
  
      this.recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        this.isListening = false;
        
        let errorMessage = "";
        switch (event.error) {
          case "network":
            errorMessage = "Network error occurred. Please check your connection.";
            break;
          case "not-allowed":
          case "service-not-allowed":
            errorMessage = "Microphone access is blocked. Please allow it.";
            break;
          case "no-speech":
            errorMessage = "No speech was detected. Please try again.";
            break;
          case "audio-capture":
            errorMessage = "No microphone was found. Please ensure it's connected.";
            break;
          default:
            errorMessage = "Speech recognition error occurred.";
        }
        onError(errorMessage);
      };
  
      this.recognition.onend = () => {
        // Only handle if we haven't manually stopped
        if (this.isListening) {
          this.isListening = false;
        }
      };
  
      try {
        this.recognition.start();
      } catch (error) {
        this.isListening = false;
        onError("Failed to start speech recognition");
      }
    }
  
    public stopListening(): void {
      if (this.recognition && this.isListening) {
        try {
          this.isListening = false;
          this.recognition.stop();
        } catch (error) {
          console.error("Error stopping recognition:", error);
        }
      }
    }
  }