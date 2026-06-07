let scoreA = 0;
let scoreB = 0;

// TIMER
let remainingSeconds = 0;
let interval = null;
let running = false;

// WAKE LOCK
let wakeLock = null;

// 🔊 HOKEJOVÁ SIRÉNA
function playSiren() {
  const ctx = new (window.AudioContext || window.webkitAudioContext)();
  const startTime = ctx.currentTime;
  const duration = 2.5; // Jak dlouho bude siréna houkat (v sekundách)

  // Hlavní zesilovač pro celou sirénu
  const mainGain = ctx.createGain();
  mainGain.gain.setValueAtTime(0, startTime);
  
  // Náběh sirény (roztáčení kompresoru)
  mainGain.gain.linearRampToValueAtTime(0.6, startTime + 0.3);
  
  // Pozvolný dojezd sirény na konci
  mainGain.gain.setValueAtTime(0.6, startTime + duration - 0.5);
  mainGain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

  mainGain.connect(ctx.destination);

  // Základní frekvence opravdové hokejové sirény (nízký, hutný tón)
  const baseFreq = 120; 

  // Vytvoříme masivní zvuk smícháním 5 oscilátorů naráz
  for (let i = 0; i < 5; i++) {
    const osc = ctx.createOscillator();
    
    // Pilový průběh (sawtooth) má hodně ostrých harmonických frekvencí
    osc.type = "sawtooth";
    
    // Každý oscilátor bude násobkem základní frekvence (harmonické tóny)
    // Tím vznikne plný, sirénový akord
    const multiplier = (i + 1);
    
    osc.frequency.setValueAtTime(baseFreq * multiplier, startTime);
    
    // Mírný skluz frekvence dolů na konci simuluje dotáčení motoru sirény
    osc.frequency.setValueAtTime(baseFreq * multiplier, startTime + duration - 0.5);
    osc.frequency.linearRampToValueAtTime((baseFreq - 15) * multiplier, startTime + duration);

    // Každému oscilátoru dáme mírně odlišné rozladění (detune), aby zvuk "vibroval"
    osc.detune.setValueAtTime((i * 8) - 16, startTime);

    osc.connect(mainGain);
    osc.start(startTime);
    osc.stop(startTime + duration);
  }
}

// WAKE LOCK
async function enableWakeLock() {

  try {

    wakeLock =
      await navigator.wakeLock.request("screen");

    console.log("Wake Lock aktivní");

    wakeLock.addEventListener("release", () => {
      console.log("Wake Lock uvolněn");
    });

  } catch (err) {

    console.log("Wake Lock chyba:", err);
  }
}

// SKÓRE
function changeScore(team, val) {
  // Pokud se skóre zvyšuje, přehraj zvuk ťuknutí
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

  updateResult();
}

function updateResult() {

  const teamA =
    document.getElementById("teamAName").value;

  const teamB =
    document.getElementById("teamBName").value;

  document.getElementById("result").innerText =
    `${teamA} ${scoreA} : ${scoreB} ${teamB}`;
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

    document.getElementById("timeDisplay").innerText =
      format(remainingSeconds);

  } else {

    pauseTimer();

    playSiren();
  }
}

function startTimer() {

  if (!running) {

    enableWakeLock();

    // fullscreen po prvním spuštění
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    }

    if (remainingSeconds === 0) {

      let min = parseInt(
        document.getElementById("minutesInput").value
      );

      // POJISTKA: Pokud minuty nejsou zadané, nebo jsou menší než 1, nespouštěj se
      if (!min || min < 1) {
        alert("Zadej platný počet minut (minimálně 1)!");
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

  document.getElementById("timeDisplay").innerText =
    "00:00";

  document.getElementById("minutesInput").value = "";

  updateResult();
}

// FULLSCREEN
function toggleFullscreen() {

  if (!document.fullscreenElement) {

    document.documentElement.requestFullscreen();

  } else {

    document.exitFullscreen();
  }
}

// PWA / SERVICE WORKER
if ("serviceWorker" in navigator) {

  navigator.serviceWorker.register("sw.js");
}

// 🔊 ZVUK ŤUKNUTÍ (při přičtení bodu)
function playClickSound() {
  const ctx = new (window.AudioContext || window.webkitAudioContext)();
  let time = ctx.currentTime;
  
  let osc = ctx.createOscillator();
  let gain = ctx.createGain();
  
  osc.type = "sine";
  // Rychlý pokles frekvence vytvoří perkusivní "ťuknutí"
  osc.frequency.setValueAtTime(400, time);
  osc.frequency.exponentialRampToValueAtTime(80, time + 0.05);
  
  gain.gain.setValueAtTime(0.4, time);
  gain.gain.exponentialRampToValueAtTime(0.01, time + 0.05);
  
  osc.connect(gain);
  gain.connect(ctx.destination);
  
  osc.start(time);
  osc.stop(time + 0.05);
}

// INIT
updateResult();