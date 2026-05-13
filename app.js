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

// ==================== RELIABLE BLE CONNECT (Bluefy + nRF) ====================
document.getElementById('connect-btn').addEventListener('click', async () => {
    const statusEl = document.getElementById('connection-status');
    const logEl = document.getElementById('log'); // assume you have a log element

    statusEl.textContent = "Connecting...";
    statusEl.classList.remove('connected');
    log("🔍 Scanning for PET-CF-Oven...");

    try {
        const device = await navigator.bluetooth.requestDevice({
            filters: [{ namePrefix: "PET-CF" }],
            optionalServices: ["4fafc201-1fb5-459e-8fcc-c5c9c331914b"]
        });

        log(`Device found: ${device.name}`);

        const server = await device.gatt.connect();
        log("GATT connected");

        const service = await server.getPrimaryService("4fafc201-1fb5-459e-8fcc-c5c9c331914b");
        log("Service discovered");

        // Read the confirmation characteristic (add this characteristic on ESP32 side if desired)
        const char = await service.getCharacteristic("beb5483e-36e1-4688-b7f5-ea07361b26a8");
        const value = await char.readValue();
        log("Characteristic read successful");

        // Success!
        isConnected = true;
        statusEl.textContent = `Connected to ${device.name}`;
        statusEl.classList.add('connected');
        log("✅ Bluefy connection confirmed");

        startSimulation();

    } catch (error) {
        console.error(error);
        statusEl.textContent = "Connection failed";
        log(`❌ Error: ${error.message}`);
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

// ==================== SEND COMMANDS TO ESP32 ====================
async function sendCommand(cmdObj) {
    if (!isConnected) {
        log("❌ Not connected");
        return;
    }

    try {
        const service = await device.gatt.getPrimaryService("4fafc201-1fb5-459e-8fcc-c5c9c331914b");
        const cmdChar = await service.getCharacteristic("c1d2e3f4-5a6b-7c8d-9e0f-1a2b3c4d5e6f");

        const jsonString = JSON.stringify(cmdObj);
        const encoder = new TextEncoder();
        await cmdChar.writeValue(encoder.encode(jsonString));

        log(`📤 Sent: ${jsonString}`);
    } catch (error) {
        console.error(error);
        log(`❌ Command failed: ${error.message}`);
    }
}

// Full Power Test button
document.getElementById('full-power-btn').addEventListener('click', () => {
    sendCommand({ cmd: "fullpower" });
});

// Emergency Stop button
document.getElementById('emergency-stop').addEventListener('click', () => {
    sendCommand({ cmd: "emergency" });
});

// Example: Start Annealing Program (you can expand this later)
function startAnnealingProgram(targetTemp, rampRate, holdTime, coolRate) {
    sendCommand({
        cmd: "start",
        target: targetTemp,
        ramp: rampRate,
        hold: holdTime,
        cool: coolRate
    });
}
