// ==================== PET-CF Annealing Oven Controller - Complete app.js ====================
let isConnected = false;
let currentTemp = 28.0;
let currentMode = "IDLE";
let tempInterval = null;
let bleDevice = null;
let bleServer = null;
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

// ==================== CONNECT ====================
document.getElementById('connect-btn').addEventListener('click', async () => {
    const statusEl = document.getElementById('connection-status');
    statusEl.textContent = "Connecting...";
    statusEl.classList.remove('connected');
    log("🔍 Scanning for PET-CF-Oven...");

    try {
        bleDevice = await navigator.bluetooth.requestDevice({
            filters: [{ namePrefix: "PET-CF" }],
            optionalServices: ["4fafc201-1fb5-459e-8fcc-c5c9c331914b"]
        });

        log(`Device found: ${bleDevice.name}`);
        bleServer = await bleDevice.gatt.connect();
        log("GATT connected");

        const service = await bleServer.getPrimaryService("4fafc201-1fb5-459e-8fcc-c5c9c331914b");
        log("Service discovered");

        const confirmChar = await service.getCharacteristic("beb5483e-36e1-4688-b7f5-ea07361b26a8");
        await confirmChar.readValue();
        log("✅ Connection confirmed");

        isConnected = true;
        statusEl.textContent = `Connected to ${bleDevice.name}`;
        statusEl.classList.add('connected');
        startSimulation();

    } catch (error) {
        console.error(error);
        statusEl.textContent = "Connection failed";
        log(`❌ Error: ${error.message}`);
    }
});

// ==================== SEND COMMAND ====================
async function sendCommand(cmdObj) {
    if (!isConnected || !bleServer) {
        log("❌ Not connected - please connect first");
        return;
    }

    try {
        const service = await bleServer.getPrimaryService("4fafc201-1fb5-459e-8fcc-c5c9c331914b");
        const cmdChar = await service.getCharacteristic("c1d2e3f4-5a6b-7c8d-9e0f-1a2b3c4d5e6f");

        const jsonString = JSON.stringify(cmdObj);
        const encoder = new TextEncoder();
        await cmdChar.writeValue(encoder.encode(jsonString));

        log(`📤 Command sent: ${jsonString}`);
    } catch (error) {
        console.error(error);
        log(`❌ Command failed: ${error.message}`);
    }
}

// Button handlers
document.getElementById('full-power-btn').addEventListener('click', () => {
    log("🔥 Full Power Test button pressed");
    sendCommand({ cmd: "fullpower" });
});

document.getElementById('emergency-stop').addEventListener('click', () => {
    log("⛔ Emergency Stop button pressed");
    sendCommand({ cmd: "emergency" });
});

log("🚀 PET-CF Oven Controller ready. Connect to begin testing.");
