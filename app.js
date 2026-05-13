// ==================== PET-CF Annealing Oven Controller - Complete app.js ====================
let isConnected = false;
let currentTemp = 28.0;
let currentMode = "IDLE";
let tempInterval = null;
let bleServer = null;
let tempChar = null;
const logEl = document.getElementById('log');

function log(msg, type = 'info') {
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    logEl.textContent += `[${time}] ${msg}\n`;
    logEl.scrollTop = logEl.scrollHeight;
}

function startSimulation() {
    if (tempInterval) clearInterval(tempInterval);
    tempInterval = setInterval(() => {
        document.getElementById('current-temp').textContent = currentTemp.toFixed(1);
    }, 500);
}

// ==================== CONNECT + NOTIFICATIONS ====================
document.getElementById('connect-btn').addEventListener('click', async () => {
    const statusEl = document.getElementById('connection-status');
    statusEl.textContent = "Connecting...";
    statusEl.classList.remove('connected');
    log("🔍 Scanning for PET-CF-Oven...");

    try {
        const device = await navigator.bluetooth.requestDevice({
            filters: [{ namePrefix: "PET-CF" }],
            optionalServices: ["4fafc201-1fb5-459e-8fcc-c5c9c331914b"]
        });

        log(`Device found: ${device.name}`);
        bleServer = await device.gatt.connect();
        log("GATT connected");

        const service = await bleServer.getPrimaryService("4fafc201-1fb5-459e-8fcc-c5c9c331914b");
        log("Service discovered");

        // Temperature notification characteristic
        tempChar = await service.getCharacteristic("a3c1e8f2-5b2a-4c8e-9f1d-2e3b4c5d6e7f");
        await tempChar.startNotifications();
        tempChar.addEventListener('characteristicvaluechanged', (event) => {
            const value = new TextDecoder().decode(event.target.value);
            currentTemp = parseFloat(value);
            document.getElementById('current-temp').textContent = currentTemp.toFixed(1);
            log(`🌡️ Temperature updated: ${currentTemp}°C`);
        });
        log("Temperature notifications started");

        isConnected = true;
        statusEl.textContent = `Connected to ${device.name}`;
        statusEl.classList.add('connected');
        startSimulation();
        log("✅ Fully connected - receiving live updates");

    } catch (error) {
        console.error(error);
        statusEl.textContent = "Connection failed";
        log(`❌ Error: ${error.message || error}`);
    }
});

// ==================== SEND COMMANDS ====================
async function sendCommand(cmdObj) {
    if (!isConnected || !bleServer) {
        log("❌ Not connected");
        return;
    }
    try {
        const service = await bleServer.getPrimaryService("4fafc201-1fb5-459e-8fcc-c5c9c331914b");
        const cmdChar = await service.getCharacteristic("c1d2e3f4-5a6b-7c8d-9e0f-1a2b3c4d5e6f");

        const jsonString = JSON.stringify(cmdObj);
        const encoder = new TextEncoder();
        await cmdChar.writeValue(encoder.encode(jsonString));
        log(`📤 Sent: ${jsonString}`);
    } catch (error) {
        log(`❌ Command failed: ${error.message || error}`);
    }
}

document.getElementById('full-power-btn').addEventListener('click', () => {
    log("🔥 Full Power Test button pressed");
    sendCommand({ cmd: "fullpower" });
});

document.getElementById('emergency-stop').addEventListener('click', () => {
    log("⛔ Emergency Stop button pressed");
    sendCommand({ cmd: "emergency" });
});

log("🚀 PET-CF Oven Controller ready. Connect to begin testing.");
