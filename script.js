(() => {
  "use strict";

  const phases = ["red", "yellow", "green", "yellow"];
  const trafficLight = document.getElementById("trafficLight");

  function updateTrafficLight() {
    // Jede Phase dauert 60 Sekunden. Die Gerätezeit bestimmt den Startpunkt
    // und sorgt dafür, dass die Ampel auch nach einem Neuladen richtig weiterläuft.
    const minute = Math.floor(Date.now() / 60000);
    const phaseIndex = minute % phases.length;
    const color = phases[phaseIndex];

    trafficLight.dataset.active = color;
    trafficLight.setAttribute("aria-label", "Ampel: " + color);
  }

  updateTrafficLight();
  setInterval(updateTrafficLight, 200);
})();