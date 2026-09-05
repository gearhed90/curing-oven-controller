# Curing Oven Controller

BLE web app + ESP32 firmware for a converted Masterbuilt electric smoker used as a Cerakote / PET-CF annealing oven.

Live UI: [gearhed90.github.io/curing-oven-controller](https://gearhed90.github.io/curing-oven-controller/)

## Repo layout

| Path | What it is |
|---|---|
| `index.html`, `app.js`, `styles.css`, `manifest.json`, `sw.js` | PWA (GitHub Pages serves these from the repo root) |
| [`firmware/`](firmware/) | ESP32 Arduino sketch + flash notes |
| [`docs/HARDWARE.md`](docs/HARDWARE.md) | Cabinet, PSU, SSRs, pins |

Keep PWA files at the **root** so Pages keeps working. Do not move them under `docs/`.

## Hardware snapshot (Sep 2026)

- Cabinet: 30-inch Masterbuilt digital electric smoker (legs installed)
- Cabinet size without legs: ~20.5 in W × 19.9 in D × 33.3 in H
- Control electronics: classic **ESP32 DevKit (WROOM-32, 30-pin)** in a repurposed PC case under the smoker
- Power: Dell **AC260EBM-00** 12 V PSU; XL4015-style buck 12 V → 5 V for logic
- Heat: two TonGass 1440 W / 120 V RV elements
- Sensors: three **MAX6675 + K-type** thermocouples (low / mid / high)
- Recirculation fan installed; duct still pending
- Insulation present on sides / top / door; **back panel insulation discarded** (~20.5 in × 33.3 in replacement needed)

## ESP32 pinout (confirmed)

Matches [`firmware/Curing_Oven_BLE/Curing_Oven_BLE.ino`](firmware/Curing_Oven_BLE/Curing_Oven_BLE.ino).

| Function | GPIO |
|---|---|
| MAX6675 SCK (shared clock) | 18 |
| MAX6675 SO / DO (shared data) | 19 |
| MAX6675 CS — probe 1 | 17 |
| Heater SSR | 5 |
| Fan SSR / relay | 33 |
| Board 5V | 5V pin or USB |
| Ground | GND |

Mid and high probe CS pins are **not locked**. Extra modules share SCK 18 and SO 19. Prefer 16, 21, 22, 23, 25, 26, 27, or 32. Avoid strapping pins 0, 2, 12, and 15.

See [docs/HARDWARE.md](docs/HARDWARE.md) for PSU enable wiring and element notes.

## BLE interface

Device name prefix: `Curing` (firmware advertises `Curing-Oven`).

| Role | UUID |
|---|---|
| Service | `4fafc201-1fb5-459e-8fcc-c5c9c331914b` |
| Temperature notify | `a3c1e8f2-5b2a-4c8e-9f1d-2e3b4c5d6e7f` |
| Command write (JSON) | `c1d2e3f4-5a6b-7c8d-9e0f-1a2b3c4d5e6f` |
| Status read | `d4e5f6a7-8b9c-0d1e-2f3a-4b5c6d7e8f90` |

```json
{ "cmd": "fullpower" }
{ "cmd": "emergency" }
{ "cmd": "start", "target": 95, "ramp": 5, "hold": 30, "cool": 3 }
```

`fullpower` and `start` drive the SSRs **fully on**. There is no PID and no automatic shutoff. Emergency stop (or BLE disconnect) is the off path until closed-loop control is added.

Default UI cycle: **95 °C**, **5 °C/min** ramp, **30 min** hold, **3 °C/min** cool.

Status format: `MODE|HEATER|FAN`.

## Flash the board

1. Arduino IDE → open folder `firmware/Curing_Oven_BLE`
2. Libraries: NimBLE-Arduino 2.5.0, ArduinoJson 7.x, MAX6675 1.1.x
3. Board: ESP32 Dev Module
4. Upload, then confirm serial shows `Advertising STARTED as Curing-Oven`

Details: [firmware/README.md](firmware/README.md).

## Open items

- Confirm CS GPIOs for the second and third MAX6675 modules
- Install recirculation duct
- Replace discarded back-panel ceramic insulation
- Add closed-loop heat control
- Investigate ~60 °C stall during full-power tests
- Finish mounting ESP32, MAX6675 boards, and fan SSR in the PC case
