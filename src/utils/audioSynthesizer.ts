class SynthEngine {
  private ctx: AudioContext | null = null;
  private oscs: OscillatorNode[] = [];
  private gain: GainNode | null = null;

  public init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public getContext(): AudioContext | null {
    this.init();
    return this.ctx;
  }

  public playClipTone(frequency = 440, type: OscillatorType = 'sine', volume = 0.2) {
    this.init();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(frequency, this.ctx.currentTime);

    g.gain.setValueAtTime(volume, this.ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 1.2);

    osc.connect(g);
    g.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 1.2);
  }

  public createClipAudioNode(sampleType: string): { destination: MediaStreamAudioDestinationNode; stop: () => void } | null {
    this.init();
    if (!this.ctx) return null;

    const dest = this.ctx.createMediaStreamDestination();
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    let root = 220;
    if (sampleType === 'sample-sunset') root = 196; // G
    if (sampleType === 'sample-neon') root = 146.8; // D
    if (sampleType === 'sample-ocean') root = 174.6; // F
    if (sampleType === 'sample-stage') root = 130.8; // C

    osc1.type = 'triangle';
    osc1.frequency.setValueAtTime(root, this.ctx.currentTime);
    osc2.type = 'sawtooth';
    osc2.frequency.setValueAtTime(root * 1.5, this.ctx.currentTime); // fifth

    gain.gain.setValueAtTime(0.15, this.ctx.currentTime);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(dest);
    gain.connect(this.ctx.destination);

    osc1.start();
    osc2.start();

    return {
      destination: dest,
      stop: () => {
        try {
          osc1.stop();
          osc2.stop();
          osc1.disconnect();
          osc2.disconnect();
          gain.disconnect();
        } catch (_) {}
      }
    };
  }
}

export const synth = new SynthEngine();
