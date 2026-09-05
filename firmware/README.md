# Firmware

Arduino sketch for the oven ESP32. The PWA at the repo root talks to this board over BLE.

## Sketch

| Path | Board |
|---|---|
| [`Curing_Oven_BLE/Curing_Oven_BLE.ino`](Curing_Oven_BLE/Curing_Oven_BLE.ino) | ESP32-WROOM-32 DevKit (30-pin), Arduino core 3.x |

Open the **folder** `Curing_Oven_BLE` in Arduino IDE (not a loose `.ino` sitting next to other sketches).

## Libraries

Install from Library Manager:

| Library | Tested |
|---|---|
| NimBLE-Arduino | 2.5.0 |
| ArduinoJson | 7.x |
| MAX6675 library | 1.1.x |

Board: **ESP32 Dev Module**. Upload 921600, CPU 240 MHz is fine.

## Pins (must match `docs/HARDWARE.md`)

| Function | GPIO |
|---|---|
| MAX6675 SCK | 18 |
| MAX6675 SO | 19 |
| MAX6675 CS probe 1 | 17 |
| Heater SSR (both 1440 W elements can share this DC input until a second GPIO is locked) | 5 |
| Fan SSR | 33 |

## BLE

Advertised name: `Curing-Oven` (PWA filter is `namePrefix: "Curing"`).

Service `4fafc201-1fb5-459e-8fcc-c5c9c331914b`

| Char | UUID | Props |
|---|---|---|
| Temperature | `a3c1e8f2-5b2a-4c8e-9f1d-2e3b4c5d6e7f` | READ + NOTIFY |
| Command | `c1d2e3f4-5a6b-7c8d-9e0f-1a2b3c4d5e6f` | WRITE + WRITE_NR |
| Status | `d4e5f6a7-8b9c-0d1e-2f3a-4b5c6d7e8f90` | READ |

Status payload: `MODE|HEATER|FAN` e.g. `FULL POWER|ON|ON`.

Commands are UTF-8 JSON: `fullpower`, `emergency`, `start` (extra fields stored but not used for closed-loop yet).

Heat is **open loop**: heater and fan GPIOs stay HIGH until `emergency` or disconnect.
