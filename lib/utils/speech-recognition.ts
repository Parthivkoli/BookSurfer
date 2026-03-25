// Speech Recognition API wrapper with error handling
type SpeechRecognitionErrorEvent = Event & { error: string };

export interface SpeechRecognitionOptions {
  language?: string;
  continuous?: boolean;
  interimResults?: boolean;
  maxAlternatives?: number;
  onStart?: () => void;
  onResult?: (transcript: string, isFinal: boolean) => void;
  onError?: (error: string) => void;
  onEnd?: () => void;
}

export class SpeechRecognitionHandler {
  private recognition: any;
  private isListening = false;
  private transcript = '';

  constructor() {
    // Support both standard and webkit prefix
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
    }
  }

  isSupported(): boolean {
    return !!this.recognition;
  }

  public start(options: SpeechRecognitionOptions = {}) {
    if (!this.isSupported()) {
      options.onError?.('Speech Recognition is not supported in your browser');
      return;
    }

    if (this.isListening) return;

    try {
      this.transcript = '';
      this.recognition.continuous = options.continuous ?? false;
      this.recognition.interimResults = options.interimResults ?? true;
      this.recognition.maxAlternatives = options.maxAlternatives ?? 1;
      this.recognition.lang = options.language ?? 'en-US';

      this.recognition.onstart = () => {
        this.isListening = true;
        options.onStart?.();
      };

      this.recognition.onresult = (event: any) => {
        this.transcript = '';
        let isFinal = false;

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          
          if (event.results[i].isFinal) {
            isFinal = true;
            this.transcript += transcript + ' ';
          } else {
            this.transcript += transcript;
          }
        }

        options.onResult?.(this.transcript.trim(), isFinal);
      };

      this.recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        const errorMap: { [key: string]: string } = {
          'no-speech': 'No speech was detected. Please try again.',
          'audio-capture': 'No audio input device found.',
          'not-allowed': 'Microphone access was denied. Check browser permissions.',
          'network': 'Network error occurred.',
          'service-not-allowed': 'Speech Recognition service is not allowed.',
          'bad-grammar': 'Grammar error in speech recognition.',
          'aborted': 'Speech recognition was aborted.',
          'service-unavailable': 'Service is unavailable.',
        };
        
        const errorMessage = errorMap[event.error] || `Speech Recognition error: ${event.error}`;
        console.error('Speech Recognition Error:', event.error, errorMessage);
        options.onError?.(errorMessage);
      };

      this.recognition.onend = () => {
        this.isListening = false;
        options.onEnd?.();
      };

      this.recognition.start();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error('Failed to start speech recognition:', message);
      options.onError?.(`Failed to start: ${message}`);
    }
  }

  public stop() {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
      this.isListening = false;
    }
  }

  public abort() {
    if (this.recognition) {
      this.recognition.abort();
      this.isListening = false;
      this.transcript = '';
    }
  }

  public getTranscript(): string {
    return this.transcript;
  }

  public isActive(): boolean {
    return this.isListening;
  }
}

// Export singleton instance
export const speechRecognition = new SpeechRecognitionHandler();
