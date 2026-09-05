# Curing Oven Controller

BLE web app for a converted Masterbuilt electric smoker used as a Cerakote / PET-CF annealing oven.

Live UI: [gearhed90.github.io/curing-oven-controller](https://gearhed90.github.io/curing-oven-controller/)

This repository is the **PWA frontend**. ESP32 firmware lives on the board (Arduino sketch); pinout and hardware notes are documented here so they stay with the project.

## Hardware snapshot (Sep 2026)

- Cabinet: 30-inch Masterbuilt digital electric smoker (legs installed)
- Cabinet size without legs: ~20.5 in W × 19.9 in D × 33.3 in H
- Control electronics: classic **ESP32 DevKit (WROOM-32, 30-pin)** in a repurposed PC case under the smoker
- Heat: stock element replaced with stronger coils (TonGass 1440 W dual-element plan / installed coils)
- Sensors: three **MAX6675 + K-type** thermocouples (low / mid / high)
- Recirculation fan installed; duct still pending
- Insulation present on sides / top / door; **back panel insulation discarded** and needs replacement (~20.5 in × 33.3 in, buy oversized and trim)

## ESP32 pinout (confirmed)

Board: ESP32-WROOM-32 DevKit V1 style (green terminal blocks, labeled **5V** next to **GND**, no `VIN` silk). Not S2 / S3 / C3.

| Function | GPIO |
|---|---|
| MAX6675 SCK (shared clock) | 18 |
| MAX6675 SO / DO (shared data) | 19 |
| MAX6675 CS — probe 1 (original / mid location) | 17 |
| Heater SSR | 5 |
| Fan SSR / relay | 33 |
| Board 5V | 5V pin or USB |
| Ground | GND |

Mid and high probe **CS pins are not locked yet**. Extra modules share SCK 18 and SO 19; each needs its own CS. Prefer unused outputs such as 16, 21, 22, 23, 25, 26, 27, or 32. Avoid strapping pins 0, 2, 12, and 15 when possible.

MAX6675 VCC → 3.3 V or 5 V (module dependent). Common GND with the ESP32.

See [docs/HARDWARE.md](docs/HARDWARE.md) for mounting, power, and element notes.

## BLE interface

Device name prefix: `Curing`

| Role | UUID |
|---|---|
| Service | `4fafc201-1fb5-459e-8fcc-c5c9c331914b` |
| Temperature notify | `a3c1e8f2-5b2a-4c8e-9f1d-2e3b4c5d6e7f` |
| Command write (JSON) | `c1d2e3f4-5a6b-7c8d-9e0f-1a2b3c4d5e6f` |
| Status read | `d4e5f6a7-8b9c-0d1e-2f3a-4b5c6d7e8f90` |

Commands sent as UTF-8 JSON:

```json
{ "cmd": "fullpower" }
{ "cmd": "emergency" }
{ "cmd": "start", "target": 95, "ramp": 5, "hold": 30, "cool": 3 }
```

Default UI cycle: **95 °C** target, **5 °C/min** ramp, **30 min** hold, **3 °C/min** cool.

Status characteristic format: `MODE|HEATER|FAN` (pipe-separated).

## PWA files

| File | Purpose |
|---|---|
| `index.html` | UI shell |
| `app.js` | BLE connect, commands, Chart.js graph |
| `styles.css` | Layout |
| `manifest.json` | Installable PWA |
| `sw.js` | Service worker |

Open the Pages URL on a phone or laptop that supports Web Bluetooth (Chrome / Edge). Connect to a device whose advertised name starts with `Curing`.

## Open items

- Confirm CS GPIOs for the second and third MAX6675 modules and update this README
- Install recirculation duct
- Replace discarded back-panel ceramic insulation
- Publish ESP32 firmware into this repo (or a sibling repo) so pin `#define`s stay in sync with the docs
