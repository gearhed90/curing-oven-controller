// ==================== Curing Oven Controller - Complete ====================
let isConnected = false;
let bleServer = null;
let chart = null;
let currentCycleData = [];
const logEl = document.getElementById('log');

function log(msg) {
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    logEl.textContent += `[${time}] ${msg}\n`;
    logEl.scrollTop = logEl.scrollHeight;
}

// ==================== CONNECT ====================
document.getElementById('connect-btn').addEventListener('click', async () => {
    const statusEl = document.getElementById('connection-status');
    statusEl.textContent = "Connecting...";
    statusEl.classList.remove('connected');
    log("🔍 Scanning for Curing-Oven...");

    try {
        const device = await navigator.bluetooth.requestDevice({
            filters: [{ namePrefix: "Curing" }],
            optionalServices: ["4fafc201-1fb5-459e-8fcc-c5c9c331914b"]
        });

        log(`Device found: ${device.name}`);
        bleServer = await device.gatt.connect();
        log("GATT connected");

        const service = await bleServer.getPrimaryService("4fafc201-1fb5-459e-8fcc-c5c9c331914b");
        log("Service discovered");

        const tempChar = await service.getCharacteristic("a3c1e8f2-5b2a-4c8e-9f1d-2e3b4c5d6e7f");
        await tempChar.startNotifications();
        tempChar.addEventListener('characteristicvaluechanged', (event) => {
            const value = new TextDecoder().decode(event.target.value);
            const temp = parseFloat(value);
            document.getElementById('current-temp').textContent = temp.toFixed(1);
        });

        isConnected = true;
        statusEl.textContent = `Connected to ${device.name}`;
        statusEl.classList.add('connected');
        log("✅ Connected");

        // Initialize graph and start temperature loop
        initGraph();
        startTemperatureLoop();
        setTimeout(readStatus, 800);

    } catch (error) {
        statusEl.textContent = "Connection failed";
        log(`❌ Connection error: ${error.message || error}`);
    }
});

// ==================== READ STATUS ====================
async function readStatus() {
    if (!bleServer) return;
    try {
        const service = await bleServer.getPrimaryService("4fafc201-1fb5-459e-8fcc-c5c9c331914b");
        const statusChar = await service.getCharacteristic("d4e5f6a7-8b9c-0d1e-2f3a-4b5c6d7e8f90");
        const value = await statusChar.readValue();
        const status = new TextDecoder().decode(value);
        const parts = status.split("|");

        if (parts.length >= 3) {
            document.getElementById('current-mode').textContent = parts[0];
            document.getElementById('heater-status').textContent = `Heater: ${parts[1]}`;
            document.getElementById('fan-status').textContent = `Fan: ${parts[2]}`;
        }
    } catch (error) {
        log(`Status read error: ${error.message || error}`);
    }
}

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

        setTimeout(readStatus, 500);
    } catch (error) {
        log(`❌ Command failed: ${error.message || error}`);
    }
}

// ==================== GRAPH FUNCTIONS ====================
function initGraph() {
    const ctx = document.getElementById('temp-graph').getContext('2d');
    
    if (chart) chart.destroy();

    chart = new Chart(ctx, {
        type: 'line',
        data: {
            datasets: [
                {
                    label: 'Actual Temperature',
                    borderColor: '#3b82f6',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    borderWidth: 2,
                    fill: false,
                    tension: 0.1,
                    data: []
                },
                {
                    label: 'Target Temperature',
                    borderColor: '#ef4444',
                    borderDash: [5, 5],
                    borderWidth: 2,
                    fill: false,
                    tension: 0.1,
                    data: []
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    type: 'linear',
                    title: { display: true, text: 'Time (seconds)' }
                },
                y: {
                    title: { display: true, text: 'Temperature (°C)' },
                    min: 0
                }
            },
            animation: {
                duration: 0
            }
        }
    });
}

function updateGraph() {
    if (!chart || currentCycleData.length === 0) return;

    const startTime = currentCycleData[0].time;

    const actualData = currentCycleData.map(point => ({
        x: (point.time - startTime) / 1000,
        y: point.actual
    }));

    chart.data.datasets[0].data = actualData;
    chart.update('none');
}

// ==================== TEMPERATURE LOOP ====================
function startTemperatureLoop() {
    setInterval(() => {
        if (!isConnected) return;

        currentTemp = thermocouple.readCelsius();
        if (currentTemp < 0 || currentTemp > 1000) currentTemp = 28.0;

        document.getElementById('current-temp').textContent = currentTemp.toFixed(1);

        if (currentCycleData.length > 0) {
            currentCycleData.push({ time: Date.now(), actual: currentTemp });
            updateGraph();
        }
    }, 1000);
}

// ==================== BUTTONS ====================
document.getElementById('full-power-btn').addEventListener('click', () => {
    log("🔥 Full Power Test pressed");
    sendCommand({ cmd: "fullpower" });
});

document.getElementById('emergency-stop').addEventListener('click', () => {
    log("⛔ Emergency Stop pressed");
    sendCommand({ cmd: "emergency" });
    currentCycleData = [];
    if (chart) chart.data.datasets[0].data = [];
});

document.getElementById('start-program').addEventListener('click', () => {
    const target = parseFloat(document.getElementById('target-temp').value);
    const ramp   = parseFloat(document.getElementById('ramp-rate').value);
    const hold   = parseFloat(document.getElementById('hold-time').value);
    const cool   = parseFloat(document.getElementById('cool-rate').value);

    const cmd = {
        cmd: "start",
        target: target,
        ramp: ramp,
        hold: hold,
        cool: cool
    };

    log(`▶ Starting annealing: Target ${target}°C, Ramp ${ramp}°C/min, Hold ${hold} min, Cool ${cool}°C/min`);
    sendCommand(cmd);
    
    currentCycleData = [];
    if (chart) chart.data.datasets[0].data = [];
});

document.getElementById('view-history').addEventListener('click', () => {
    const history = JSON.parse(localStorage.getItem('curingCycles') || '[]');
    if (history.length === 0) {
        alert("No past cycles saved yet.");
        return;
    }
    
    let message = "Past Cycles:\n\n";
    history.forEach((cycle, index) => {
        message += `${index + 1}. ${new Date(cycle.date).toLocaleString()} - Target: ${cycle.target}°C\n`;
    });
    alert(message);
});

log("🚀 Curing Oven Controller ready.");
