// Web Audio API Synthesizer for Peblo TV Kids Experience
// Pure browser synthesis: zero external audio assets required, instant playback!

class KidsAudioManager {
  private ctx: AudioContext | null = null;
  private muted: boolean = false;

  constructor() {
    // Read saved mute preference if available
    try {
      const saved = localStorage.getItem('peblo_kids_sound_muted');
      if (saved !== null) {
        this.muted = saved === 'true';
      }
    } catch {
      this.muted = false;
    }
  }

  private initContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public isMuted(): boolean {
    return this.muted;
  }

  public toggleMute(): boolean {
    this.muted = !this.muted;
    try {
      localStorage.setItem('peblo_kids_sound_muted', String(this.muted));
    } catch {}
    if (!this.muted) {
      this.playPop();
    }
    return this.muted;
  }

  // 1. Playful Bubble Pop (for button clicks & category chips)
  public playPop() {
    if (this.muted) return;
    const ctx = this.initContext();
    if (!ctx) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      const now = ctx.currentTime;
      osc.frequency.setValueAtTime(520, now);
      osc.frequency.exponentialRampToValueAtTime(140, now + 0.08);

      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.09);
    } catch {}
  }

  // 2. Magical Chime / Sparkle (for character reveals and modal opens)
  public playChime() {
    if (this.muted) return;
    const ctx = this.initContext();
    if (!ctx) return;

    try {
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      const now = ctx.currentTime;

      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.05);

        gain.gain.setValueAtTime(0.18, now + idx * 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.05 + 0.25);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + idx * 0.05);
        osc.stop(now + idx * 0.05 + 0.26);
      });
    } catch {}
  }

  // 3. Mini Victory Fanfare (for quiz completion or Play button)
  public playFanfare() {
    if (this.muted) return;
    const ctx = this.initContext();
    if (!ctx) return;

    try {
      const notes = [
        { f: 440.0, d: 0.1, t: 0 },       // A4
        { f: 554.37, d: 0.1, t: 0.1 },    // C#5
        { f: 659.25, d: 0.1, t: 0.2 },    // E5
        { f: 880.0, d: 0.35, t: 0.32 }    // A5
      ];
      const now = ctx.currentTime;

      notes.forEach((item) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(item.f, now + item.t);

        gain.gain.setValueAtTime(0.22, now + item.t);
        gain.gain.exponentialRampToValueAtTime(0.001, now + item.t + item.d);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + item.t);
        osc.stop(now + item.t + item.d + 0.02);
      });
    } catch {}
  }

  // 4. Character Voice Greetings (Synthesized character signatures)
  public playCharacterVoice(charId: string) {
    if (this.muted) return;
    const ctx = this.initContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;

      if (charId === 'moti') {
        // Moti the Dog: Playful double-yip bark chime!
        const yips = [
          { f1: 340, f2: 680, t: 0, d: 0.09 },
          { f1: 420, f2: 820, t: 0.11, d: 0.12 }
        ];
        yips.forEach((y) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(y.f1, now + y.t);
          osc.frequency.linearRampToValueAtTime(y.f2, now + y.t + y.d * 0.5);
          osc.frequency.linearRampToValueAtTime(y.f1 * 0.8, now + y.t + y.d);

          gain.gain.setValueAtTime(0.28, now + y.t);
          gain.gain.exponentialRampToValueAtTime(0.001, now + y.t + y.d);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(now + y.t);
          osc.stop(now + y.t + y.d + 0.01);
        });
      } else if (charId === 'barnaby') {
        // Barnaby Bear: Warm forest flute hum
        const notes = [220, 277.18, 329.63, 440];
        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, now + idx * 0.08);

          gain.gain.setValueAtTime(0.2, now + idx * 0.08);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.2);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(now + idx * 0.08);
          osc.stop(now + idx * 0.08 + 0.22);
        });
      } else if (charId === 'banyan-dadi') {
        // Banyan Dadi: Magical harp twinkle
        const harp = [392, 523.25, 659.25, 783.99, 1046.5, 1318.5];
        harp.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + idx * 0.06);

          gain.gain.setValueAtTime(0.18, now + idx * 0.06);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.35);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(now + idx * 0.06);
          osc.stop(now + idx * 0.06 + 0.36);
        });
      } else if (charId === 'pip-robin') {
        // Pip & Sunny: Cheerful high bird tweet!
        const chirps = [
          { f: 1200, t: 0 },
          { f: 1600, t: 0.05 },
          { f: 1400, t: 0.1 },
          { f: 1900, t: 0.15 }
        ];
        chirps.forEach((c) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(c.f, now + c.t);
          osc.frequency.exponentialRampToValueAtTime(c.f * 1.3, now + c.t + 0.04);

          gain.gain.setValueAtTime(0.2, now + c.t);
          gain.gain.exponentialRampToValueAtTime(0.001, now + c.t + 0.04);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(now + c.t);
          osc.stop(now + c.t + 0.05);
        });
      } else if (charId === 'ranger-rusty') {
        // Ranger Rusty Fox: Superhero laser hero motif!
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.exponentialRampToValueAtTime(900, now + 0.12);

        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.2);
      } else {
        // Tusker / Default: Funky rhythm drum pop
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(180, now);
        osc.frequency.exponentialRampToValueAtTime(45, now + 0.15);

        gain.gain.setValueAtTime(0.35, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.2);
      }
    } catch {}
  }
}

export const kidsAudio = new KidsAudioManager();
