# Hardware notes

Converted 30-inch Masterbuilt digital electric smoker → Cerakote / PET-CF annealing oven.

Firmware that matches this pinout: [`firmware/Curing_Oven_BLE/Curing_Oven_BLE.ino`](../firmware/Curing_Oven_BLE/Curing_Oven_BLE.ino).

## Controller

- MCU: **ESP32-WROOM-32** on a 30-pin DevKit (DOIT / DevKit V1 style)
- Mounted in a repurposed PC case under the smoker, between the legs
- Board markings: **5V** next to **GND**; no `VIN` label
- Logic rail: XL4015-style buck converter, 12 V in → **5.0 V** out (display button toggles input vs output voltage)

## Confirmed GPIO map

```
THERMO_CLK      GPIO 18     MAX6675 SCK (shared)
THERMO_DO       GPIO 19     MAX6675 SO  (shared)
THERMO_CS       GPIO 17     MAX6675 CS  (probe 1)
SSR_ELEMENTS    GPIO 5      Heater SSR control (both elements may share this DC input)
SSR_FAN         GPIO 33     Fan SSR / relay
```

Three MAX6675 + K-type probes are planned/installed at low, mid, and high rack heights. Probe 1 CS is GPIO 17. CS for probes 2 and 3 is **not assigned yet** — share CLK/SO, give each module its own CS.

Suggested unused CS candidates: GPIO 16, 21, 22, 23, 25, 26, 27, 32.
Avoid strapping pins GPIO 0, 2, 12, 15 if you can.

## Power — Dell AC260EBM-00

Donated 12 V switching PSU (label: DELL MODEL AC260EBM-00, API P/N PCH004, 100–240 VAC in).

Enable wiring that actually produced +12 V on the yellow rails:

| Wire | Function | Action |
|---|---|---|
| Green (pin 1) | PS_ON# | Tie to COM / chassis ground |
| Gray (pin 6) | PWR_OK | Also tie to COM / chassis ground |
| Black | COM | Ground |
| Yellow | +12 V main | Load / heater-side 12 V accessories and buck IN+ |
| Purple | +12 VSB | Standby; leave unused unless needed |

Green alone lights the PSU LED but does **not** enable the main 12 V rail on this unit. Do **not** ground the white sense wires — that caused arcing.

PSU cooling fan on this donor unit is 4-wire. Working combination: **yellow + red to +12 V**, **black to ground**. Blue PWM left open.

AC inlet splice to the oven cord (IEC colors → US cabinet colors):

- Brown → black (hot)
- Blue → white (neutral)
- Green/yellow stripe → green (earth)

## Heat

- Stock element removed; stronger coils installed
- Dual TonGass 1440 W RV elements (1 in NPT bulkhead fittings, 304 SS, 120 V)
- Three SSR-25DA units in use: one per 1440 W element, one for the 120 V recirc fan
- Heater SSR mounted on the PC case **with heatsink and a cooling fan**
- Element terminals are **outside** the chamber via bulkheads; seal the fittings, use a short run of 200 °C silicone wire from the terminals, then standard 14 AWG to the SSRs

Firmware control today is **open loop**: `fullpower` / `start` set GPIO 5 and GPIO 33 HIGH. There is no code that stops climbing at 60 °C or any other setpoint. A stall around 60 °C during full-power tests is treated as a **hardware** problem (SSR not fully on, PSU sag, or element), not a firmware cap.

Recommended element height when drilling: **1.75–2 in (44–50 mm)** above the floor, ≥1 in clearance under the deflector.

## Airflow

- Recirculation fan added (toaster-oven blower / custom impeller work)
- Duct from top intake toward bottom discharge is **not installed yet**
- Fan is expected to create a low-pressure zone on the intake side and pull air up through the duct once it exists

## Insulation / cabinet

- Sides, top, and door insulation still in place
- Back panel insulation was removed for the element install and discarded
- Replacement sheet: start ~20.5 in × 33.3 in, buy oversized and trim

## Enclosure / remaining install

- Electronics live in the donor PC case bolted under the smoker
- Still to finish: mount ESP32, MAX6675 board(s), and the fan SSR; complete remaining signal wiring
- Fusion mounting plate work exists for the ESP32 development board + buck converter

## BLE name and service

Firmware advertises `Curing-Oven` and service `4fafc201-1fb5-459e-8fcc-c5c9c331914b` so the PWA can connect.
