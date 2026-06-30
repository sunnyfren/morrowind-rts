export class AudioSystem {
  private ctx: AudioContext | null = null;
  private isPlayingTheme = false;
  private isPlayingAmbient = false;
  private isPlayingCombat = false;
  private combatTimeoutId: any = null;

  init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (this.ctx.state === 'suspended') {
        this.ctx.resume();
    }
    this.playTheme();
  }

  playAttack() {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(300, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(50, this.ctx.currentTime + 0.1);
    
    gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.1);
    
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.1);
  }

  playMove() {
    if (!this.ctx || Math.random() > 0.3) return; // Throttled footstep
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(100, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(40, this.ctx.currentTime + 0.05);
    
    gain.gain.setValueAtTime(0.05, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.05);
    
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.05);
  }

  playTheme() {
    if (!this.ctx) return;
    if (this.isPlayingTheme) return;
    this.isPlayingTheme = true;

    // Frequencies for a simplified "Nerevar Rising" theme in C minor
    const C4 = 261.63, D4 = 293.66, Eb4 = 311.13, F4 = 349.23;
    const G4 = 392.00, Ab4 = 415.30, Bb4 = 466.16, C5 = 523.25;

    // Melody sequence: [Frequency, Start Time (seconds), Duration (seconds)]
    const melody = [
      [C4, 0.0, 1.0],
      [D4, 1.0, 1.0],
      [Eb4, 2.0, 1.5],
      [F4, 3.5, 0.5],
      [G4, 4.0, 2.0],
      [C4, 6.0, 1.0],
      [D4, 7.0, 1.0],
      [Eb4, 8.0, 1.5],
      [F4, 9.5, 0.5],
      [G4, 10.0, 2.0],
      [Ab4, 12.0, 1.5],
      [Bb4, 13.5, 0.5],
      [C5, 14.0, 2.0],
    ];

    const tempoMultiplier = 1.2; // Adjust speed
    const baseTime = this.ctx.currentTime + 0.5;

    melody.forEach(([freq, time, duration]) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      // 'triangle' or 'sine' works best for a mellow, horn-like synth pad
      osc.type = 'triangle'; 
      osc.frequency.value = freq;

      const startTime = baseTime + (time * tempoMultiplier);
      const noteDuration = duration * tempoMultiplier;

      // ADSR Envelope (Attack, Decay, Sustain, Release) to make it sound musical
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.15, startTime + 0.2); // Attack
      gain.gain.exponentialRampToValueAtTime(0.1, startTime + noteDuration - 0.2); // Decay/Sustain
      gain.gain.linearRampToValueAtTime(0, startTime + noteDuration); // Release

      osc.connect(gain);
      gain.connect(this.ctx!.destination);

      osc.start(startTime);
      osc.stop(startTime + noteDuration);
    });
    
    // Optional: Loop the sequence by calling it again after it finishes
    setTimeout(() => {
      this.isPlayingTheme = false;
      this.playShedYourTravailsSynth();
    }, 16.0 * tempoMultiplier * 1000); 
  }

  playShedYourTravailsSynth() {
    if (!this.ctx) return;
    if (this.isPlayingAmbient) return;
    this.isPlayingAmbient = true;

    // A soothing, slow-moving chord progression (e.g., C Major 7 to A minor)
    const chords = [
      [261.63, 329.63, 392.00, 493.88], // C Maj 7
      [220.00, 261.63, 329.63, 440.00], // A Min
      [174.61, 261.63, 349.23, 440.00], // F Maj
      [196.00, 246.94, 293.66, 392.00], // G Maj
    ];

    let chordIndex = 0;
    const playNextChord = () => {
      if (!this.isPlayingAmbient) return;

      const chord = chords[chordIndex];
      const duration = 8.0; // Slow, 8-second long sweeping chords
      const baseTime = this.ctx!.currentTime;

      chord.forEach((freq) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();

        // 'sine' wave is essential here for that soft, atmospheric pad sound
        osc.type = 'sine';
        osc.frequency.value = freq;

        // Long Attack and Release for a sweeping, ethereal swell
        gain.gain.setValueAtTime(0, baseTime);
        gain.gain.linearRampToValueAtTime(0.08, baseTime + 3.0); // Slow fade in
        gain.gain.linearRampToValueAtTime(0.05, baseTime + duration - 3.0); 
        gain.gain.linearRampToValueAtTime(0, baseTime + duration); // Slow fade out

        osc.connect(gain);
        gain.connect(this.ctx!.destination);

        osc.start(baseTime);
        osc.stop(baseTime + duration);
      });

      chordIndex++;
      
      if (chordIndex < chords.length) {
        // Schedule the next chord slightly before this one ends to crossfade
        setTimeout(playNextChord, (duration - 1.5) * 1000);
      } else {
        // Switch back to the main theme after the progression ends
        setTimeout(() => {
          this.isPlayingAmbient = false;
          this.playTheme();
        }, (duration - 1.5) * 1000);
      }
    };

    playNextChord();
  }
  
  stopAmbient() {
    this.isPlayingAmbient = false;
  }

  playCombatMusic() {
    if (!this.ctx) return;
    if (this.isPlayingCombat) return;
    this.isPlayingCombat = true;

    // Fast, tense minor arpeggios
    const C4 = 261.63, Eb4 = 311.13, G4 = 392.00, C5 = 523.25;
    const D4 = 293.66, F4 = 349.23, Ab4 = 415.30, D5 = 587.33;

    // Two chords alternating: C minor and D diminished
    const arpeggio1 = [C4, Eb4, G4, C5];
    const arpeggio2 = [D4, F4, Ab4, D5];

    let tick = 0;
    const tempoMultiplier = 0.15; // Fast arpeggios (150ms per note)

    const playNextNote = () => {
      if (!this.isPlayingCombat) return;

      const currentArpeggio = (Math.floor(tick / 4) % 2 === 0) ? arpeggio1 : arpeggio2;
      const freq = currentArpeggio[tick % 4];

      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'sawtooth';
      osc.frequency.value = freq;

      const baseTime = this.ctx!.currentTime;
      const noteDuration = tempoMultiplier;

      // Staccato notes for tension
      gain.gain.setValueAtTime(0, baseTime);
      gain.gain.linearRampToValueAtTime(0.08, baseTime + 0.02); // Fast attack
      gain.gain.exponentialRampToValueAtTime(0.01, baseTime + noteDuration - 0.02); // Quick decay
      gain.gain.linearRampToValueAtTime(0, baseTime + noteDuration); // Fast release

      osc.connect(gain);
      gain.connect(this.ctx!.destination);

      osc.start(baseTime);
      osc.stop(baseTime + noteDuration);

      tick++;
      this.combatTimeoutId = setTimeout(playNextNote, noteDuration * 1000);
    };

    playNextNote();
  }

  stopCombatMusic() {
    this.isPlayingCombat = false;
    if (this.combatTimeoutId) {
      clearTimeout(this.combatTimeoutId);
      this.combatTimeoutId = null;
    }
  }
}
