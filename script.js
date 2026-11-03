(() => {
  "use strict";
  const DEFAULTS = { signalType: "car", intervalSeconds: 60, activeColor: "red" };
  const STORAGE_KEY = "ampel-uhr-settings-v1";
  const PHASES = ["red", "yellow", "green"];
  const COLORS = { red: "ROT", yellow: "GELB", green: "GRÜN" };
  const LABELS = { car: "Autoampel", pedestrian: "Fußgängerampel", bicycle: "Fahrradampel" };
  const $ = id => document.getElementById(id);
  const clock = $("clock"), date = $("date"), light = $("trafficLight");
  const status = $("statusPill"), countdown = $("countdown"), intervalLabel = $("intervalLabel");
  const dialog = $("settingsDialog"), form = $("settingsForm"), typeInput = $("signalType");
  const intervalInput = $("intervalSeconds"), error = $("settingsError");

  function loadSettings() {
    try {
      const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
      if (!value || typeof value !== "object") return { ...DEFAULTS };
      const seconds = Number(value.intervalSeconds);
      return {
        signalType: LABELS[value.signalType] ? value.signalType : DEFAULTS.signalType,
        intervalSeconds: Number.isInteger(seconds) && seconds >= 1 && seconds <= 86400 ? seconds : 60,
        activeColor: PHASES.includes(value.activeColor) ? value.activeColor : "red"
      };
    } catch { return { ...DEFAULTS }; }
  }
  let settings = loadSettings();
  let activeColor = settings.activeColor;
  let nextSwitchAt = Date.now() + settings.intervalSeconds * 1000;
  function save() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...settings, activeColor })); } catch {}
  }
  function formatDuration(seconds) {
    if (seconds < 60) return seconds + (seconds === 1 ? " Sekunde" : " Sekunden");
    if (seconds % 60 === 0 && seconds < 3600) return (seconds / 60) + ((seconds / 60) === 1 ? " Minute" : " Minuten");
    if (seconds % 3600 === 0) return (seconds / 3600) + ((seconds / 3600) === 1 ? " Stunde" : " Stunden");
    return seconds + " Sekunden";
  }
  function updateClock() {
    const now = new Date();
    clock.textContent = new Intl.DateTimeFormat("de-DE", { hour:"2-digit", minute:"2-digit", second:"2-digit", hour12:false }).format(now);
    date.textContent = new Intl.DateTimeFormat("de-DE", { weekday:"long", day:"2-digit", month:"long", year:"numeric" }).format(now);
  }
  function render() {
    light.dataset.active = activeColor;
    light.setAttribute("aria-label", "Ampel: " + COLORS[activeColor]);
    status.className = "status-pill " + activeColor;
    status.textContent = COLORS[activeColor] + " AKTIV";
    $("signalTitle").textContent = LABELS[settings.signalType];
    intervalLabel.textContent = formatDuration(settings.intervalSeconds);
    document.title = COLORS[activeColor][0] + COLORS[activeColor].slice(1).toLowerCase() + " · Ampel-Uhr";
  }
  function nextPhase() {
    activeColor = PHASES[(PHASES.indexOf(activeColor) + 1) % PHASES.length];
  }
  function updateCountdown() {
    let remaining = nextSwitchAt - Date.now();
    if (remaining <= 0) {
      const intervalMs = settings.intervalSeconds * 1000;
      const missed = Math.floor((Date.now() - nextSwitchAt) / intervalMs) + 1;
      for (let i = 0; i < missed % PHASES.length; i++) nextPhase();
      nextSwitchAt += missed * intervalMs;
      save(); render();
      remaining = nextSwitchAt - Date.now();
    }
    countdown.textContent = Math.ceil(Math.max(0, remaining) / 1000) + " s";
  }
  $("settingsButton").addEventListener("click", () => {
    typeInput.value = settings.signalType;
    intervalInput.value = String(settings.intervalSeconds);
    error.textContent = "";
    dialog.showModal();
  });
  $("closeSettings").addEventListener("click", () => dialog.close());
  dialog.addEventListener("click", event => { if (event.target === dialog) dialog.close(); });
  form.addEventListener("submit", event => {
    event.preventDefault();
    const seconds = Number(intervalInput.value);
    if (!Number.isInteger(seconds) || seconds < 1 || seconds > 86400) {
      error.textContent = "Bitte gib eine ganze Zahl zwischen 1 und 86.400 Sekunden ein.";
      return;
    }
    settings.signalType = LABELS[typeInput.value] ? typeInput.value : "car";
    settings.intervalSeconds = seconds;
    nextSwitchAt = Date.now() + seconds * 1000;
    save(); render(); updateCountdown(); dialog.close();
  });
  $("resetSettings").addEventListener("click", () => {
    settings = { ...DEFAULTS }; activeColor = "red";
    typeInput.value = settings.signalType; intervalInput.value = "60";
    nextSwitchAt = Date.now() + 60000; error.textContent = "";
    save(); render(); updateCountdown();
  });
  $("toggleButton").addEventListener("click", () => {
    nextPhase(); nextSwitchAt = Date.now() + settings.intervalSeconds * 1000;
    save(); render(); updateCountdown();
  });
  updateClock(); render(); updateCountdown();
  setInterval(updateClock, 250); setInterval(updateCountdown, 200);
})();