// PET-CF Annealing Oven Controller - app.js
let isConnected = false;
let currentTemp = 28.0;
let currentMode = "IDLE";
let tempInterval = null;

const logEl = document.getElementById('log');

function log(msg, type = 'info') {
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    logEl.textContent += `[${time}] ${msg}\n`;
    logEl.scrollTop = logEl.scrollHeight;
}

function startSimulation() {
    if (tempInterval) clearInterval(tempInterval);
    tempInterval = setInterval(() => {
        if (currentMode === "RAMPING") currentTemp += 1.8;
        else if (currentMode === "HOLDING") currentTemp += (Math.random() * 0.6 - 0.3);
        else if (currentMode === "COOLING") currentTemp -= 1.5;

        if (currentTemp < 25) currentTemp = 25;
        if (currentTemp > 250) currentTemp = 250;

        document.getElementById('current-temp').textContent = currentTemp.toFixed(1);
    }, 1100);
}

// Connect
document.getElementById('connect-btn').addEventListener('click', () => {
    isConnected = true;
    document.getElementById('connection-status').textContent = "Connected";
    document.getElementById('connection-status').classList.add('connected');
    log("✅ Connected to ESP32 via BLE", "success");
    startSimulation();
});

// Full Power Test
document.getElementById('full-power-btn').addEventListener('click', () => {
    if (!isConnected) return log("❌ Connect to oven first");
    log("🔥 Full Power Test Activated (100% Heat + Fan)", "warning");
    currentMode = "FULL POWER";
    document.getElementById('current-mode').textContent = "FULL POWER";
});

// Emergency Stop
document.getElementById('emergency-stop').addEventListener('click', () => {
    currentMode = "IDLE";
    document.getElementById('current-mode').textContent = "IDLE";
    log("⛔ EMERGENCY STOP — All systems off", "danger");
});

log("🚀 PET-CF Oven Controller ready. Connect to begin testing.");
