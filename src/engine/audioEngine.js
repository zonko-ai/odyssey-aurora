// ─── Odyssey to the Stars v2 — Audio Engine ─────────────────────────────────
// Procedural synthesis engine using Web Audio API. All sounds are generated
// programmatically — no audio files needed.

/**
 * Audio engine singleton. Provides ambient soundscapes and SFX via
 * Web Audio API procedural synthesis.
 * @exports {Object} audioEngine
 */
const audioEngine = (() => {
  let ctx = null;
  let masterGain = null;
  let currentAmbient = null; // { type, nodes: AudioNode[], gains: GainNode[] }

  // ─── Helpers ─────────────────────────────────────────────────────────────────

  /** Resume AudioContext if suspended (browsers require user gesture). */
  function ensureRunning() {
    if (ctx && ctx.state === 'suspended') ctx.resume();
  }

  /**
   * Create a buffer of noise samples.
   * @param {'white'|'pink'|'brown'} type
   * @param {number} [duration=2] seconds
   * @returns {AudioBufferSourceNode}
   */
  function createNoise(type, duration = 2) {
    const sampleRate = ctx.sampleRate;
    const length = sampleRate * duration;
    const buffer = ctx.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);

    if (type === 'white') {
      for (let i = 0; i < length; i++) {
        data[i] = Math.random() * 2 - 1;
      }
    } else if (type === 'pink') {
      // Paul Kellet's refined method
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
      for (let i = 0; i < length; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
        b6 = white * 0.115926;
      }
    } else if (type === 'brown') {
      let last = 0;
      for (let i = 0; i < length; i++) {
        const white = Math.random() * 2 - 1;
        data[i] = (last + 0.02 * white) / 1.02;
        last = data[i];
        data[i] *= 3.5; // compensate for volume loss
      }
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    return source;
  }

  /**
   * Create an oscillator.
   * @param {'sine'|'triangle'|'sawtooth'|'square'} type
   * @param {number} freq Hz
   * @returns {OscillatorNode}
   */
  function createOsc(type, freq) {
    const osc = ctx.createOscillator();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    return osc;
  }

  /**
   * Create a gain node with an ADSR-like envelope (attack + decay to sustain).
   * @param {number} attackTime seconds
   * @param {number} decayTime seconds
   * @param {number} sustainLevel 0-1
   * @returns {GainNode}
   */
  function createGainEnvelope(attackTime, decayTime, sustainLevel) {
    const gain = ctx.createGain();
    const now = ctx.currentTime;
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(1, now + attackTime);
    gain.gain.linearRampToValueAtTime(sustainLevel, now + attackTime + decayTime);
    return gain;
  }

  /**
   * Schedule a recurring ping sound.
   * @param {number} freq Hz
   * @param {number} minInterval seconds (min time between pings)
   * @param {number} maxInterval seconds (max time between pings)
   * @param {number} pingDuration seconds
   * @param {number} volume 0-1
   * @returns {{ nodes: AudioNode[], intervalId: number }}
   */
  function createRecurringPing(freq, minInterval, maxInterval, pingDuration, volume) {
    const nodes = [];
    let intervalId = null;

    function ping() {
      if (!ctx || ctx.state === 'closed') {
        clearTimeout(intervalId);
        return;
      }
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      const gain = ctx.createGain();
      const now = ctx.currentTime;
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(volume, now + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, now + pingDuration);
      osc.connect(gain).connect(masterGain);
      osc.start(now);
      osc.stop(now + pingDuration + 0.05);

      const delay = minInterval + Math.random() * (maxInterval - minInterval);
      intervalId = setTimeout(ping, delay * 1000);
    }

    const initialDelay = minInterval + Math.random() * (maxInterval - minInterval);
    intervalId = setTimeout(ping, initialDelay * 1000);

    return {
      nodes,
      stop() {
        clearTimeout(intervalId);
      },
    };
  }

  /**
   * Stop and disconnect all nodes for an ambient, with optional fade.
   * @param {{ type: string, nodes: AudioNode[], gains: GainNode[], pings: Object[], timeouts: number[] }} ambient
   * @param {number} [fadeTime=0]
   */
  function cleanupAmbient(ambient, fadeTime = 0) {
    if (!ambient) return;

    // Stop all recurring pings
    if (ambient.pings) {
      for (const p of ambient.pings) p.stop();
    }
    // Clear timeouts
    if (ambient.timeouts) {
      for (const t of ambient.timeouts) clearTimeout(t);
    }

    if (fadeTime > 0 && ambient.gains.length > 0) {
      const now = ctx.currentTime;
      for (const g of ambient.gains) {
        g.gain.cancelScheduledValues(now);
        g.gain.setValueAtTime(g.gain.value, now);
        g.gain.linearRampToValueAtTime(0, now + fadeTime);
      }
      // Disconnect after fade completes
      setTimeout(() => {
        for (const n of ambient.nodes) {
          try { n.stop?.(); } catch (_) { /* already stopped */ }
          try { n.disconnect(); } catch (_) { /* ok */ }
        }
      }, fadeTime * 1000 + 100);
    } else {
      for (const n of ambient.nodes) {
        try { n.stop?.(); } catch (_) { /* already stopped */ }
        try { n.disconnect(); } catch (_) { /* ok */ }
      }
    }
  }

  // ─── Ambient Builders ────────────────────────────────────────────────────────

  const ambientBuilders = {
    /** Low drone, subtle shimmer, occasional beep. */
    bridge() {
      const nodes = [];
      const gains = [];
      const pings = [];

      // Low drone: 40Hz + 60Hz sine
      const drone1 = createOsc('sine', 40);
      const drone1Gain = ctx.createGain();
      drone1Gain.gain.setValueAtTime(0.06, ctx.currentTime);
      drone1.connect(drone1Gain).connect(masterGain);
      drone1.start();
      nodes.push(drone1, drone1Gain);
      gains.push(drone1Gain);

      const drone2 = createOsc('sine', 60);
      const drone2Gain = ctx.createGain();
      drone2Gain.gain.setValueAtTime(0.04, ctx.currentTime);
      drone2.connect(drone2Gain).connect(masterGain);
      drone2.start();
      nodes.push(drone2, drone2Gain);
      gains.push(drone2Gain);

      // Shimmer: white noise through 8kHz bandpass
      const noise = createNoise('white');
      const bp = ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.setValueAtTime(8000, ctx.currentTime);
      bp.Q.setValueAtTime(2, ctx.currentTime);
      const shimmerGain = ctx.createGain();
      shimmerGain.gain.setValueAtTime(0.008, ctx.currentTime);
      noise.connect(bp).connect(shimmerGain).connect(masterGain);
      noise.start();
      nodes.push(noise, bp, shimmerGain);
      gains.push(shimmerGain);

      // Occasional beep: 880Hz sine every 4-8s
      const beep = createRecurringPing(880, 4, 8, 0.15, 0.04);
      pings.push(beep);

      return { type: 'bridge', nodes, gains, pings, timeouts: [] };
    },

    /** Deep rumble, engine whine, increasing intensity. */
    launch() {
      const nodes = [];
      const gains = [];

      // Deep rumble: brown noise through 200Hz lowpass
      const rumble = createNoise('brown');
      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.setValueAtTime(200, ctx.currentTime);
      const rumbleGain = ctx.createGain();
      rumbleGain.gain.setValueAtTime(0.15, ctx.currentTime);
      // Increasing intensity over 30s
      rumbleGain.gain.linearRampToValueAtTime(0.35, ctx.currentTime + 30);
      rumble.connect(lp).connect(rumbleGain).connect(masterGain);
      rumble.start();
      nodes.push(rumble, lp, rumbleGain);
      gains.push(rumbleGain);

      // Engine whine: sawtooth 150Hz with slow LFO on frequency
      const whine = createOsc('sawtooth', 150);
      const lfo = createOsc('sine', 0.3);
      const lfoGain = ctx.createGain();
      lfoGain.gain.setValueAtTime(10, ctx.currentTime); // +/-10Hz wobble
      lfo.connect(lfoGain).connect(whine.frequency);
      lfo.start();
      const whineGain = ctx.createGain();
      whineGain.gain.setValueAtTime(0.06, ctx.currentTime);
      whineGain.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 30);
      whine.connect(whineGain).connect(masterGain);
      whine.start();
      nodes.push(whine, lfo, lfoGain, whineGain);
      gains.push(whineGain);

      return { type: 'launch', nodes, gains, pings: [], timeouts: [] };
    },

    /** Near silence with cosmic hum, crystalline pings, gentle noise floor. */
    space() {
      const nodes = [];
      const gains = [];
      const pings = [];

      // Cosmic hum: barely audible 55Hz sine
      const hum = createOsc('sine', 55);
      const humGain = ctx.createGain();
      humGain.gain.setValueAtTime(0.02, ctx.currentTime);
      hum.connect(humGain).connect(masterGain);
      hum.start();
      nodes.push(hum, humGain);
      gains.push(humGain);

      // Gentle noise floor: white noise through highpass at 6kHz
      const noise = createNoise('white');
      const hp = ctx.createBiquadFilter();
      hp.type = 'highpass';
      hp.frequency.setValueAtTime(6000, ctx.currentTime);
      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.004, ctx.currentTime);
      noise.connect(hp).connect(noiseGain).connect(masterGain);
      noise.start();
      nodes.push(noise, hp, noiseGain);
      gains.push(noiseGain);

      // Crystalline pings: random 2000-4000Hz, every 5-10s
      const ping = createRecurringPing(
        2000 + Math.random() * 2000, 5, 10, 0.4, 0.03
      );
      pings.push(ping);

      return { type: 'space', nodes, gains, pings, timeouts: [] };
    },

    /** Tension drone, proximity alert pulse, impact sounds. */
    asteroid() {
      const nodes = [];
      const gains = [];
      const pings = [];
      const timeouts = [];

      // Tension drone: detuned sines at 80Hz and 83Hz (beating)
      const droneA = createOsc('sine', 80);
      const droneB = createOsc('sine', 83);
      const droneGain = ctx.createGain();
      droneGain.gain.setValueAtTime(0.08, ctx.currentTime);
      droneA.connect(droneGain);
      droneB.connect(droneGain);
      droneGain.connect(masterGain);
      droneA.start();
      droneB.start();
      nodes.push(droneA, droneB, droneGain);
      gains.push(droneGain);

      // Proximity alert pulse: 440Hz triangle, pulsing on/off every 2s
      const alert = createOsc('triangle', 440);
      const alertGain = ctx.createGain();
      alertGain.gain.setValueAtTime(0, ctx.currentTime);
      alert.connect(alertGain).connect(masterGain);
      alert.start();
      nodes.push(alert, alertGain);
      gains.push(alertGain);

      // Schedule pulse on/off
      const now = ctx.currentTime;
      for (let t = 0; t < 120; t += 2) {
        alertGain.gain.setValueAtTime(0.05, now + t);
        alertGain.gain.setValueAtTime(0, now + t + 0.3);
      }

      // Impact noise bursts at random intervals
      function scheduleImpact() {
        if (!ctx || ctx.state === 'closed') return;
        const impNoise = createNoise('white', 0.1);
        const bp = ctx.createBiquadFilter();
        bp.type = 'bandpass';
        bp.frequency.setValueAtTime(600 + Math.random() * 800, ctx.currentTime);
        bp.Q.setValueAtTime(3, ctx.currentTime);
        const impGain = ctx.createGain();
        const n = ctx.currentTime;
        impGain.gain.setValueAtTime(0.12, n);
        impGain.gain.exponentialRampToValueAtTime(0.001, n + 0.15);
        impNoise.connect(bp).connect(impGain).connect(masterGain);
        impNoise.start();
        impNoise.stop(n + 0.2);

        const nextDelay = 3000 + Math.random() * 5000;
        timeouts.push(setTimeout(scheduleImpact, nextDelay));
      }
      timeouts.push(setTimeout(scheduleImpact, 2000 + Math.random() * 3000));

      return { type: 'asteroid', nodes, gains, pings, timeouts };
    },

    /** Neutral ambient, soft data chatter. */
    hub() {
      const nodes = [];
      const gains = [];
      const timeouts = [];

      // Gentle sine pad: 220Hz + 330Hz
      const pad1 = createOsc('sine', 220);
      const pad2 = createOsc('sine', 330);
      const padGain = ctx.createGain();
      padGain.gain.setValueAtTime(0.04, ctx.currentTime);
      pad1.connect(padGain);
      pad2.connect(padGain);
      padGain.connect(masterGain);
      pad1.start();
      pad2.start();
      nodes.push(pad1, pad2, padGain);
      gains.push(padGain);

      // Soft data chatter: rapid quiet clicks (very short noise bursts)
      function scheduleClick() {
        if (!ctx || ctx.state === 'closed') return;
        const clickNoise = createNoise('white', 0.01);
        const clickGain = ctx.createGain();
        const n = ctx.currentTime;
        clickGain.gain.setValueAtTime(0.015, n);
        clickGain.gain.exponentialRampToValueAtTime(0.001, n + 0.02);
        clickNoise.connect(clickGain).connect(masterGain);
        clickNoise.start();
        clickNoise.stop(n + 0.03);

        const nextDelay = 100 + Math.random() * 400;
        timeouts.push(setTimeout(scheduleClick, nextDelay));
      }
      timeouts.push(setTimeout(scheduleClick, 200));

      return { type: 'hub', nodes, gains, pings: [], timeouts };
    },

    /** Ethereal pad, echo pings, pressurized hiss. */
    lunar() {
      const nodes = [];
      const gains = [];
      const pings = [];

      // Ethereal pad: 330Hz + 440Hz + 550Hz with slow tremolo
      const padFreqs = [330, 440, 550];
      const tremoloLfo = createOsc('sine', 0.5);
      const tremoloGain = ctx.createGain();
      tremoloGain.gain.setValueAtTime(0.015, ctx.currentTime);
      tremoloLfo.connect(tremoloGain);
      tremoloLfo.start();
      nodes.push(tremoloLfo);

      const padMaster = ctx.createGain();
      padMaster.gain.setValueAtTime(0.05, ctx.currentTime);
      tremoloGain.connect(padMaster.gain); // modulate pad volume
      padMaster.connect(masterGain);
      nodes.push(padMaster, tremoloGain);
      gains.push(padMaster);

      for (const freq of padFreqs) {
        const osc = createOsc('sine', freq);
        osc.connect(padMaster);
        osc.start();
        nodes.push(osc);
      }

      // Echo pings via DelayNode
      const pingOsc = createRecurringPing(1800, 4, 8, 0.2, 0.03);
      pings.push(pingOsc);

      // Pressurized hiss: filtered white noise, very quiet
      const hiss = createNoise('white');
      const hissHp = ctx.createBiquadFilter();
      hissHp.type = 'highpass';
      hissHp.frequency.setValueAtTime(4000, ctx.currentTime);
      const hissGain = ctx.createGain();
      hissGain.gain.setValueAtTime(0.005, ctx.currentTime);
      hiss.connect(hissHp).connect(hissGain).connect(masterGain);
      hiss.start();
      nodes.push(hiss, hissHp, hissGain);
      gains.push(hissGain);

      return { type: 'lunar', nodes, gains, pings, timeouts: [] };
    },

    /** Wind, low rumble, dust particles. */
    mars() {
      const nodes = [];
      const gains = [];
      const timeouts = [];

      // Wind: filtered noise sweeping 200-800Hz with LFO
      const wind = createNoise('white', 4);
      const windBp = ctx.createBiquadFilter();
      windBp.type = 'bandpass';
      windBp.frequency.setValueAtTime(500, ctx.currentTime);
      windBp.Q.setValueAtTime(1.5, ctx.currentTime);
      // LFO on filter frequency for sweeping
      const windLfo = createOsc('sine', 0.15);
      const windLfoGain = ctx.createGain();
      windLfoGain.gain.setValueAtTime(300, ctx.currentTime); // sweep 200-800
      windLfo.connect(windLfoGain).connect(windBp.frequency);
      windLfo.start();
      const windGain = ctx.createGain();
      windGain.gain.setValueAtTime(0.08, ctx.currentTime);
      wind.connect(windBp).connect(windGain).connect(masterGain);
      wind.start();
      nodes.push(wind, windBp, windLfo, windLfoGain, windGain);
      gains.push(windGain);

      // Low rumble: 50Hz sine
      const rumble = createOsc('sine', 50);
      const rumbleGain = ctx.createGain();
      rumbleGain.gain.setValueAtTime(0.05, ctx.currentTime);
      rumble.connect(rumbleGain).connect(masterGain);
      rumble.start();
      nodes.push(rumble, rumbleGain);
      gains.push(rumbleGain);

      // Dust particles: random short noise bursts (crackling)
      function scheduleDust() {
        if (!ctx || ctx.state === 'closed') return;
        const dustNoise = createNoise('white', 0.01);
        const dustGain = ctx.createGain();
        const n = ctx.currentTime;
        dustGain.gain.setValueAtTime(0.008, n);
        dustGain.gain.exponentialRampToValueAtTime(0.001, n + 0.015);
        dustNoise.connect(dustGain).connect(masterGain);
        dustNoise.start();
        dustNoise.stop(n + 0.025);

        const nextDelay = 50 + Math.random() * 300;
        timeouts.push(setTimeout(scheduleDust, nextDelay));
      }
      timeouts.push(setTimeout(scheduleDust, 100));

      return { type: 'mars', nodes, gains, pings: [], timeouts };
    },

    /** Industrial sawtooth, metallic resonance, rhythmic pulse. */
    mining() {
      const nodes = [];
      const gains = [];

      // Industrial: sawtooth 60Hz with harmonics
      const saw = createOsc('sawtooth', 60);
      const sawGain = ctx.createGain();
      sawGain.gain.setValueAtTime(0.06, ctx.currentTime);
      saw.connect(sawGain).connect(masterGain);
      saw.start();
      nodes.push(saw, sawGain);
      gains.push(sawGain);

      // Metallic resonance: bandpass filtered noise at 1200Hz with high Q
      const metalNoise = createNoise('white');
      const metalBp = ctx.createBiquadFilter();
      metalBp.type = 'bandpass';
      metalBp.frequency.setValueAtTime(1200, ctx.currentTime);
      metalBp.Q.setValueAtTime(15, ctx.currentTime);
      const metalGain = ctx.createGain();
      metalGain.gain.setValueAtTime(0.03, ctx.currentTime);
      metalNoise.connect(metalBp).connect(metalGain).connect(masterGain);
      metalNoise.start();
      nodes.push(metalNoise, metalBp, metalGain);
      gains.push(metalGain);

      // Rhythmic pulse: low sine pulsing every 1.5s
      const pulse = createOsc('sine', 55);
      const pulseGain = ctx.createGain();
      pulseGain.gain.setValueAtTime(0, ctx.currentTime);
      pulse.connect(pulseGain).connect(masterGain);
      pulse.start();
      nodes.push(pulse, pulseGain);
      gains.push(pulseGain);

      // Schedule rhythmic pulsing
      const now = ctx.currentTime;
      for (let t = 0; t < 120; t += 1.5) {
        pulseGain.gain.setValueAtTime(0.1, now + t);
        pulseGain.gain.exponentialRampToValueAtTime(0.001, now + t + 0.6);
      }

      return { type: 'mining', nodes, gains, pings: [], timeouts: [] };
    },

    /** Massive deep bass, radiation static, overwhelming scale. */
    jupiter() {
      const nodes = [];
      const gains = [];
      const timeouts = [];

      // Massive deep bass: 30Hz + 45Hz sine
      const bass1 = createOsc('sine', 30);
      const bass2 = createOsc('sine', 45);
      const bassGain = ctx.createGain();
      bassGain.gain.setValueAtTime(0.12, ctx.currentTime);
      bass1.connect(bassGain);
      bass2.connect(bassGain);
      bassGain.connect(masterGain);
      bass1.start();
      bass2.start();
      nodes.push(bass1, bass2, bassGain);
      gains.push(bassGain);

      // Radiation static: pink noise bursts at random intervals
      let stopped = false;
      function scheduleStatic() {
        if (!ctx || ctx.state === 'closed' || stopped) return;
        const burst = createNoise('pink', 0.3);
        const burstGain = ctx.createGain();
        const n = ctx.currentTime;
        burstGain.gain.setValueAtTime(0.06, n);
        burstGain.gain.exponentialRampToValueAtTime(0.001, n + 0.25);
        burst.connect(burstGain).connect(masterGain);
        burst.start();
        burst.stop(n + 0.35);

        const nextDelay = 2000 + Math.random() * 6000;
        timeouts.push(setTimeout(scheduleStatic, nextDelay));
      }
      timeouts.push(setTimeout(scheduleStatic, 1000 + Math.random() * 3000));

      // Overwhelming scale: slow filter sweep on pad 100-400Hz
      const pad = createNoise('brown', 4);
      const sweepFilter = ctx.createBiquadFilter();
      sweepFilter.type = 'bandpass';
      sweepFilter.Q.setValueAtTime(2, ctx.currentTime);
      // Sweep back and forth with LFO
      const sweepLfo = createOsc('sine', 0.05); // very slow
      const sweepLfoGain = ctx.createGain();
      sweepLfoGain.gain.setValueAtTime(150, ctx.currentTime); // sweep range
      sweepFilter.frequency.setValueAtTime(250, ctx.currentTime); // center
      sweepLfo.connect(sweepLfoGain).connect(sweepFilter.frequency);
      sweepLfo.start();
      const padGain = ctx.createGain();
      padGain.gain.setValueAtTime(0.07, ctx.currentTime);
      pad.connect(sweepFilter).connect(padGain).connect(masterGain);
      pad.start();
      nodes.push(pad, sweepFilter, sweepLfo, sweepLfoGain, padGain);
      gains.push(padGain);

      return { type: 'jupiter', nodes, gains, pings: [{ stop() { stopped = true; } }], timeouts };
    },

    /** Ethereal major chord pad, ring particle pings, harmonic tones. */
    saturn() {
      const nodes = [];
      const gains = [];
      const pings = [];

      // Major chord pad: C4 (261), E4 (329), G4 (392)
      const chordFreqs = [261, 329, 392];
      const padGain = ctx.createGain();
      padGain.gain.setValueAtTime(0.04, ctx.currentTime);
      padGain.connect(masterGain);
      nodes.push(padGain);
      gains.push(padGain);

      for (const freq of chordFreqs) {
        const osc = createOsc('sine', freq);
        // Slow detune LFO for each voice
        const detuneLfo = createOsc('sine', 0.2 + Math.random() * 0.3);
        const detuneGain = ctx.createGain();
        detuneGain.gain.setValueAtTime(3, ctx.currentTime); // subtle detune
        detuneLfo.connect(detuneGain).connect(osc.frequency);
        detuneLfo.start();
        osc.connect(padGain);
        osc.start();
        nodes.push(osc, detuneLfo, detuneGain);
      }

      // Ring particles: high crystalline random pings 3000-6000Hz
      const ringPing = {
        _id: null,
        _stopped: false,
        stop() {
          this._stopped = true;
          clearInterval(this._id);
        },
      };

      function schedulePing() {
        if (!ctx || ctx.state === 'closed' || ringPing._stopped) return;
        const freq = 3000 + Math.random() * 3000;
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        const g = ctx.createGain();
        const n = ctx.currentTime;
        g.gain.setValueAtTime(0, n);
        g.gain.linearRampToValueAtTime(0.02, n + 0.01);
        g.gain.exponentialRampToValueAtTime(0.001, n + 0.5);
        osc.connect(g).connect(masterGain);
        osc.start(n);
        osc.stop(n + 0.6);
      }

      ringPing._id = setInterval(() => {
        schedulePing();
      }, 800 + Math.random() * 1200);
      pings.push(ringPing);

      return { type: 'saturn', nodes, gains, pings, timeouts: [] };
    },

    /** Emotional swell building over time, major chord resolution, warm noise. */
    ending() {
      const nodes = [];
      const gains = [];

      // Emotional swell: sine pad at 220Hz building with harmonics
      const baseFreqs = [220, 330, 440, 550];
      const swellGain = ctx.createGain();
      swellGain.gain.setValueAtTime(0.02, ctx.currentTime);
      swellGain.gain.linearRampToValueAtTime(0.08, ctx.currentTime + 20);
      swellGain.connect(masterGain);
      nodes.push(swellGain);
      gains.push(swellGain);

      for (let i = 0; i < baseFreqs.length; i++) {
        const osc = createOsc('sine', baseFreqs[i]);
        const oscGain = ctx.createGain();
        // Stagger harmonic entry: each voice fades in later
        const delay = i * 5;
        oscGain.gain.setValueAtTime(0, ctx.currentTime);
        oscGain.gain.linearRampToValueAtTime(0, ctx.currentTime + delay);
        oscGain.gain.linearRampToValueAtTime(1, ctx.currentTime + delay + 4);
        osc.connect(oscGain).connect(swellGain);
        osc.start();
        nodes.push(osc, oscGain);
        gains.push(oscGain);
      }

      // Resolution: major chord (C major: 261, 329, 392)
      const resolutionGain = ctx.createGain();
      resolutionGain.gain.setValueAtTime(0, ctx.currentTime);
      resolutionGain.gain.linearRampToValueAtTime(0, ctx.currentTime + 15);
      resolutionGain.gain.linearRampToValueAtTime(0.05, ctx.currentTime + 20);
      resolutionGain.connect(masterGain);
      nodes.push(resolutionGain);
      gains.push(resolutionGain);

      for (const freq of [261, 329, 392]) {
        const osc = createOsc('sine', freq);
        osc.connect(resolutionGain);
        osc.start();
        nodes.push(osc);
      }

      // Warmth: filtered noise with slow envelope
      const warmNoise = createNoise('pink', 4);
      const warmLp = ctx.createBiquadFilter();
      warmLp.type = 'lowpass';
      warmLp.frequency.setValueAtTime(800, ctx.currentTime);
      const warmGain = ctx.createGain();
      warmGain.gain.setValueAtTime(0.005, ctx.currentTime);
      warmGain.gain.linearRampToValueAtTime(0.02, ctx.currentTime + 15);
      warmNoise.connect(warmLp).connect(warmGain).connect(masterGain);
      warmNoise.start();
      nodes.push(warmNoise, warmLp, warmGain);
      gains.push(warmGain);

      return { type: 'ending', nodes, gains, pings: [], timeouts: [] };
    },
  };

  // ─── SFX Library ─────────────────────────────────────────────────────────────

  const sfxBuilders = {
    /** Short 1000Hz sine, 50ms decay. */
    click() {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1000, ctx.currentTime);
      const g = ctx.createGain();
      const n = ctx.currentTime;
      g.gain.setValueAtTime(0.15, n);
      g.gain.exponentialRampToValueAtTime(0.001, n + 0.05);
      osc.connect(g).connect(masterGain);
      osc.start(n);
      osc.stop(n + 0.06);
    },

    /** Downward sweep: 800Hz to 200Hz over 0.5s, sine. */
    transition() {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      const n = ctx.currentTime;
      osc.frequency.setValueAtTime(800, n);
      osc.frequency.exponentialRampToValueAtTime(200, n + 0.5);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.12, n);
      g.gain.linearRampToValueAtTime(0, n + 0.5);
      osc.connect(g).connect(masterGain);
      osc.start(n);
      osc.stop(n + 0.55);
    },

    /** Two quick 660Hz beeps, 100ms each. */
    alert() {
      const n = ctx.currentTime;
      for (let i = 0; i < 2; i++) {
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(660, n);
        const g = ctx.createGain();
        const start = n + i * 0.15;
        g.gain.setValueAtTime(0, n);
        g.gain.setValueAtTime(0.15, start);
        g.gain.setValueAtTime(0, start + 0.1);
        osc.connect(g).connect(masterGain);
        osc.start(n);
        osc.stop(start + 0.12);
      }
    },

    /** Upward sweep: 400Hz to 800Hz, 0.2s, sine. */
    'chat-open'() {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      const n = ctx.currentTime;
      osc.frequency.setValueAtTime(400, n);
      osc.frequency.exponentialRampToValueAtTime(800, n + 0.2);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.1, n);
      g.gain.linearRampToValueAtTime(0, n + 0.25);
      osc.connect(g).connect(masterGain);
      osc.start(n);
      osc.stop(n + 0.3);
    },

    /** Downward sweep: 800Hz to 400Hz, 0.2s, sine. */
    'chat-close'() {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      const n = ctx.currentTime;
      osc.frequency.setValueAtTime(800, n);
      osc.frequency.exponentialRampToValueAtTime(400, n + 0.2);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.1, n);
      g.gain.linearRampToValueAtTime(0, n + 0.25);
      osc.connect(g).connect(masterGain);
      osc.start(n);
      osc.stop(n + 0.3);
    },

    /** Soft 1200Hz ping, 100ms, very quiet. */
    'choice-hover'() {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1200, ctx.currentTime);
      const g = ctx.createGain();
      const n = ctx.currentTime;
      g.gain.setValueAtTime(0.04, n);
      g.gain.exponentialRampToValueAtTime(0.001, n + 0.1);
      osc.connect(g).connect(masterGain);
      osc.start(n);
      osc.stop(n + 0.12);
    },
  };

  // ─── Public API ──────────────────────────────────────────────────────────────

  /** Create AudioContext and master gain. Call on first user interaction. */
  function init() {
    if (ctx) return;
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.7, ctx.currentTime);
    masterGain.connect(ctx.destination);
  }

  /**
   * Start ambient sound for the given type. Stops any current ambient first.
   * @param {string} type — one of: bridge, launch, space, asteroid, hub, lunar, mars, mining, jupiter, saturn, ending
   */
  function playAmbient(type) {
    if (!ctx) return;
    ensureRunning();

    if (currentAmbient) {
      cleanupAmbient(currentAmbient);
      currentAmbient = null;
    }

    const builder = ambientBuilders[type];
    if (!builder) {
      console.warn(`[audioEngine] Unknown ambient type: "${type}"`);
      return;
    }

    currentAmbient = builder();
  }

  /**
   * Crossfade from current ambient to a new type.
   * @param {string} type — target ambient type
   * @param {number} [duration=2] — crossfade duration in seconds
   */
  function crossfadeTo(type, duration = 2) {
    if (!ctx) return;
    ensureRunning();

    const old = currentAmbient;

    // Build new ambient
    const builder = ambientBuilders[type];
    if (!builder) {
      console.warn(`[audioEngine] Unknown ambient type: "${type}"`);
      return;
    }

    // Start new ambient with zero volume, ramp up
    currentAmbient = builder();
    const now = ctx.currentTime;
    for (const g of currentAmbient.gains) {
      const target = g.gain.value;
      g.gain.cancelScheduledValues(now);
      g.gain.setValueAtTime(0, now);
      g.gain.linearRampToValueAtTime(target, now + duration);
    }

    // Fade out old ambient
    if (old) {
      cleanupAmbient(old, duration);
    }
  }

  /**
   * Play a one-shot sound effect. Fire and forget.
   * @param {string} name — one of: click, transition, alert, chat-open, chat-close, choice-hover
   */
  function playSfx(name) {
    if (!ctx) return;
    ensureRunning();

    const builder = sfxBuilders[name];
    if (!builder) {
      console.warn(`[audioEngine] Unknown SFX: "${name}"`);
      return;
    }
    builder();
  }

  /**
   * Set master volume.
   * @param {number} level — 0 to 1
   */
  function setVolume(level) {
    if (!ctx || !masterGain) return;
    const clamped = Math.max(0, Math.min(1, level));
    masterGain.gain.setValueAtTime(clamped, ctx.currentTime);
  }

  /** Get current master volume level. */
  function getVolume() {
    if (!masterGain) return 0.7;
    return masterGain.gain.value;
  }

  /** Stop all sounds, fade out over 0.5s. */
  function stop() {
    if (!ctx) return;

    if (currentAmbient) {
      cleanupAmbient(currentAmbient, 0.5);
      currentAmbient = null;
    }

    // Fade master to 0 then restore
    const vol = masterGain.gain.value;
    const now = ctx.currentTime;
    masterGain.gain.setValueAtTime(vol, now);
    masterGain.gain.linearRampToValueAtTime(0, now + 0.5);
    // Restore volume after fade so future sounds are audible
    setTimeout(() => {
      if (masterGain) {
        masterGain.gain.setValueAtTime(vol, ctx.currentTime);
      }
    }, 600);
  }

  return { init, playAmbient, crossfadeTo, playSfx, setVolume, stop, getVolume };
})();

export default audioEngine;
