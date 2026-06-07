let scoreA = 0;
let scoreB = 0;

// TIMER
let remainingSeconds = 0;
let interval = null;
let running = false;

// WAKE LOCK
let wakeLock = null;

// Globální audio
let audioCtx = null;

function getAudioContext() {
  try {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    return audioCtx;
  } catch (e) {
    console.log("AudioContext nedostupný:", e);
    return null;
  }
}

// 🔊 HOKEJOVÁ SIRÉNA
function playSiren() {
  const ctx = getAudioContext();
  if (!ctx) return;

  const startTime = ctx.currentTime;
  const duration = 2.5; 

  const mainGain = ctx.createGain();
  mainGain.gain.setValueAtTime(0, startTime);
  mainGain.gain.linearRampToValueAtTime(0.6, startTime + 0.3);
  mainGain.gain.setValueAtTime(0.6, startTime + duration - 0.5);
  mainGain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
  mainGain.connect(ctx.destination);

  const baseFreq = 120; 

  for (let i = 0; i < 5; i++) {
    const osc = ctx.createOscillator();
    osc.type = "sawtooth";
    const multiplier = (i + 1);
    
    osc.frequency.setValueAtTime(baseFreq * multiplier, startTime);
    osc.frequency.setValueAtTime(baseFreq * multiplier, startTime + duration - 0.5);
    osc.frequency.linearRampToValueAtTime((baseFreq - 15) * multiplier, startTime + duration);
    osc.detune.setValueAtTime((i * 8) - 16, startTime);

    osc.connect(mainGain);
    osc.start(startTime);
    osc.stop(startTime + duration);
  }
}

// 🔊 ZVUK ŤUKNUTÍ
function playClickSound() {
  const ctx = getAudioContext();
  if (!ctx) return;

  let time = ctx.currentTime;
  let osc = ctx.createOscillator();
  let gain = ctx.createGain();
  
  osc.type = "sine";
  osc.frequency.setValueAtTime(400, time);
  osc.frequency.exponentialRampToValueAtTime(80, time + 0.05);
  
  gain.gain.setValueAtTime(0.4, time);
  gain.gain.exponentialRampToValueAtTime(0.01, time + 0.05);
  
  osc.connect(gain);
  gain.connect(ctx.destination);
  
  osc.start(time);
  osc.stop(time + 0.05);
}

// WAKE LOCK
async function enableWakeLock() {
  if (!('wakeLock' in navigator)) return;
  try {
    wakeLock = await navigator.wakeLock.request("screen");
  } catch (err) {
    console.log("Wake Lock chyba:", err);
  }
}

// SKÓRE
function changeScore(team, val) {
  if (val > 0) {
    playClickSound();
  }

  if (team === "A") {
    scoreA = Math.max(0, scoreA + val);
    document.getElementById("scoreA").innerText = scoreA;
  } else {
    scoreB = Math.max(0, scoreB + val);
    document.getElementById("scoreB").innerText = scoreB;
  }
}

// ČAS
function format(sec) {
  let m = Math.floor(sec / 60);
  let s = sec % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function tick() {
  if (remainingSeconds > 0) {
    remainingSeconds--;
    document.getElementById("timeDisplay").innerText = format(remainingSeconds);
  } else {
    pauseTimer();
    playSiren();
  }
}

function startTimer() {
  if (!running) {
    enableWakeLock();

    // Sjednocené volání celoobrazovkového režimu
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen({ navigationUI: "hide" }).catch(err => {});
    }

    if (remainingSeconds === 0) {
      let min = parseInt(document.getElementById("minutesInput").value);
      if (!min || min < 1) {
        alert("Zadej platný počet minut!");
        return;
      }
      remainingSeconds = min * 60;
    }

    running = true;
    interval = setInterval(tick, 1000);
  }
}

function pauseTimer() {
  running = false;
  clearInterval(interval);
}

function resetAll() {
  scoreA = 0;
  scoreB = 0;
  document.getElementById("scoreA").innerText = 0;
  document.getElementById("scoreB").innerText = 0;
  pauseTimer();
  remainingSeconds = 0;
  document.getElementById("timeDisplay").innerText = "00:00";
  document.getElementById("minutesInput").value = "";
}

// FULLSCREEN - Opraveno pro skrytí navigační lišty
function toggleFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen({ navigationUI: "hide" }).catch(err => {});
  } else {
    document.exitFullscreen();
  }
}

// PWA SERVICE WORKER
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("sw.js").catch(err => {});
}