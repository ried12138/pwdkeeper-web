/**
 * 农场游戏音频：用 Web Audio 合成 BGM 与音效，无需外部音频素材。
 * 注意：浏览器要求用户手势后才能出声，因此需在页面首次点击时调用 ensure()/startBgm()。
 */

let ctx = null;
let bgmTimer = null;
let bgmStep = 0;
let muted = false;

const ensureCtx = () => {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
};

// 单音：freq 频率, dur 时长, type 波形, gain 音量, when 相对当前时间的延迟(秒)
const tone = (freq, dur, type = 'sine', gain = 0.2, when = 0) => {
  const c = ensureCtx();
  if (!c || muted) return;
  const t0 = c.currentTime + when;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  g.gain.setValueAtTime(0, t0);
  g.gain.linearRampToValueAtTime(gain, t0 + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g).connect(c.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
};

// 滑音：从 f1 滑到 f2
const sweep = (f1, f2, dur, type = 'sine', gain = 0.2) => {
  const c = ensureCtx();
  if (!c || muted) return;
  const t0 = c.currentTime;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(f1, t0);
  osc.frequency.exponentialRampToValueAtTime(Math.max(f2, 1), t0 + dur);
  g.gain.setValueAtTime(gain, t0);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g).connect(c.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
};

// ===== BGM：一段循环的轻快五声音阶旋律 =====
// 音符频率（C 大调五声）
const N = { C5: 523.25, D5: 587.33, E5: 659.25, G5: 783.99, A5: 880.0, C6: 1046.5, E4: 329.63, G4: 392.0 };
const MELODY = [
  N.E5, N.G5, N.A5, N.G5, N.E5, N.D5, N.C5, N.D5,
  N.E5, N.G5, N.C6, N.A5, N.G5, N.E5, N.D5, N.C5,
];
const STEP_DUR = 0.28; // 每拍秒数

const scheduleStep = () => {
  const note = MELODY[bgmStep % MELODY.length];
  tone(note, STEP_DUR * 0.9, 'triangle', 0.06);
  // 低音伴奏（每两拍一次）
  if (bgmStep % 2 === 0) {
    tone(bgmStep % 4 === 0 ? N.C5 / 4 : N.G4 / 2, STEP_DUR * 1.6, 'sine', 0.05);
  }
  bgmStep += 1;
};

export const farmAudio = {
  // 页面首次用户手势时调用，解锁音频
  ensure() {
    ensureCtx();
  },
  startBgm() {
    const c = ensureCtx();
    if (!c || bgmTimer || muted) return;
    bgmStep = 0;
    scheduleStep();
    bgmTimer = setInterval(scheduleStep, STEP_DUR * 1000);
  },
  stopBgm() {
    if (bgmTimer) {
      clearInterval(bgmTimer);
      bgmTimer = null;
    }
  },
  setMuted(val) {
    muted = val;
    if (muted) farmAudio.stopBgm();
    else farmAudio.startBgm();
  },
  isMuted() {
    return muted;
  },
  // 音效
  playSfx(name) {
    if (muted) return;
    ensureCtx();
    switch (name) {
      case 'click':
        tone(660, 0.08, 'square', 0.08);
        break;
      case 'till':
        sweep(180, 80, 0.18, 'sawtooth', 0.12);
        break;
      case 'plant':
        tone(440, 0.1, 'sine', 0.15);
        tone(660, 0.12, 'sine', 0.12, 0.06);
        break;
      case 'water':
        sweep(900, 300, 0.25, 'sine', 0.12);
        break;
      case 'harvest':
        tone(523, 0.1, 'triangle', 0.15);
        tone(659, 0.1, 'triangle', 0.15, 0.08);
        tone(784, 0.16, 'triangle', 0.15, 0.16);
        break;
      case 'coin':
        tone(988, 0.08, 'square', 0.1);
        tone(1319, 0.18, 'square', 0.1, 0.07);
        break;
      case 'sleep':
        sweep(600, 200, 0.5, 'sine', 0.12);
        break;
      case 'error':
        tone(160, 0.2, 'sawtooth', 0.12);
        break;
      default:
        tone(500, 0.08, 'sine', 0.1);
    }
  },
};

export default farmAudio;
