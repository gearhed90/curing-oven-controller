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

// ==================== REAL BLE CONNECT ====================
document.getElementById('connect-btn').addEventListener('click', async () => {
    const statusEl = document.getElementById('connection-status');
    statusEl.textContent = "Scanning for PET-CF-Oven...";
    statusEl.classList.remove('connected');
    log("🔍 Requesting Bluetooth device...", "info");

    try {
        const device = await navigator.bluetooth.requestDevice({
            filters: [{ namePrefix: "PET-CF" }],
            optionalServices: ["4fafc201-1fb5-459e-8fcc-c5c9c331914b"]
        });

        log(`✅ Device selected: ${device.name}`, "success");
        statusEl.textContent = `Connected to ${device.name}`;
        statusEl.classList.add('connected');

        isConnected = true;
        startSimulation();

        // TODO: Later we will add gatt.connect() and characteristic handling here

    } catch (error) {
        console.error("BLE Error:", error);
        log(`❌ Connection failed: ${error.message}`, "danger");
        statusEl.textContent = "Connection Failed";
        
        if (error.message.includes("NotFound") || error.message.includes("No device")) {
            log("   Make sure the ESP32 is powered on and advertising.", "warning");
        } else if (error.message.includes("User cancelled")) {
            log("   Scan was cancelled.", "info");
        }
    }
});

// Full Power Test
document.getElementById('full-power-btn').addEventListener('click', () => {
    if (!isConnected) return log("❌ Connect to oven first", "warning");
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

log("🚀 PET-CF Oven Controller ready. Tap Connect to begin testing.");
