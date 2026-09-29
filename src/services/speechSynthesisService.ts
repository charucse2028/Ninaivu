/**
 * Speech Synthesis Service for Ninaivu AI Assistant
 * Provides text-to-speech capabilities in English (en-US) and Tamil (ta-IN).
 * Handles voice selection, stopping previous utterances, and speech state management.
 */

class SpeechSynthesisService {
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private voices: SpeechSynthesisVoice[] = [];
  private isSupported: boolean = false;
  private activeStateListeners: Set<(isSpeaking: boolean) => void> = new Set();
  private _isSpeaking: boolean = false;

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.isSupported = true;
      this.initVoices();
    }
  }

  private initVoices() {
    if (!this.isSupported) return;

    const updateVoices = () => {
      try {
        this.voices = window.speechSynthesis.getVoices() || [];
      } catch (e) {
        console.warn('Failed to load speech synthesis voices:', e);
      }
    };

    updateVoices();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = updateVoices;
    }
  }

  public getSupported(): boolean {
    return this.isSupported;
  }

  public isSpeaking(): boolean {
    return this._isSpeaking || (typeof window !== 'undefined' && !!window.speechSynthesis?.speaking);
  }

  public addListener(listener: (isSpeaking: boolean) => void) {
    this.activeStateListeners.add(listener);
    return () => this.activeStateListeners.delete(listener);
  }

  private notify(speaking: boolean) {
    this._isSpeaking = speaking;
    this.activeStateListeners.forEach(fn => {
      try {
        fn(speaking);
      } catch {
        // ignore
      }
    });
  }

  /**
   * Stop any current speech playback immediately
   */
  public stop() {
    if (!this.isSupported) return;
    try {
      window.speechSynthesis.cancel();
    } catch {
      // ignore
    }
    this.currentUtterance = null;
    this.notify(false);
  }

  /**
   * Speak a given text response in English (en-US) or Tamil (ta-IN).
   * Automatically stops any previous speech.
   */
  public speak(
    text: string,
    lang: 'en-US' | 'ta-IN',
    options?: {
      onStart?: () => void;
      onEnd?: () => void;
      onError?: (error: any) => void;
    }
  ): void {
    if (!this.isSupported || !text.trim()) {
      return;
    }

    // Always stop previous speech before starting a new response
    this.stop();

    try {
      // Ensure voices are populated
      if (this.voices.length === 0) {
        this.voices = window.speechSynthesis.getVoices() || [];
      }

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang;
      utterance.rate = 0.95; // slightly relaxed natural pace for clarity
      utterance.pitch = 1.0;

      // Select optimal voice for language
      const targetPrefix = lang === 'ta-IN' ? 'ta' : 'en';
      const matchedVoice = this.voices.find(v => v.lang.toLowerCase().startsWith(targetPrefix))
        || (lang === 'en-US' ? this.voices.find(v => v.lang.toLowerCase().startsWith('en-us')) : undefined);

      if (matchedVoice) {
        utterance.voice = matchedVoice;
      }

      utterance.onstart = () => {
        this.notify(true);
        options?.onStart?.();
      };

      utterance.onend = () => {
        this.currentUtterance = null;
        this.notify(false);
        options?.onEnd?.();
      };

      utterance.onerror = (event) => {
        // 'canceled' or 'interrupted' is normal when user switches answers or presses stop
        if (event.error !== 'canceled' && event.error !== 'interrupted') {
          console.warn('Speech synthesis error:', event);
          options?.onError?.(event);
        }
        this.currentUtterance = null;
        this.notify(false);
      };

      this.currentUtterance = utterance;

      // Ensure any pending speech is fully cancelled before speaking
      window.speechSynthesis.cancel();

      // Chrome bug workaround: speech synthesis can freeze on long texts if not unpaused
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }

      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.warn('Speech synthesis execution failed:', err);
      this.notify(false);
      options?.onError?.(err);
    }
  }
}

export const speechSynthesisService = new SpeechSynthesisService();
