# Hardware notes

Converted 30-inch Masterbuilt digital electric smoker → Cerakote / PET-CF annealing oven.

## Controller

- MCU: **ESP32-WROOM-32** on a 30-pin DevKit (DOIT / DevKit V1 style)
- Mounted in a repurposed PC case under the smoker, between the legs
- Power: USB for development; oven 5 V rail was tried and was not stable enough
- Board markings: **5V** next to **GND**; no `VIN` label

## Confirmed GPIO map

From the working firmware used on this build (original toaster-oven sketch carried forward):

```
THERMO_CLK      GPIO 18     MAX6675 SCK (shared)
THERMO_DO       GPIO 19     MAX6675 SO  (shared)
THERMO_CS       GPIO 17     MAX6675 CS  (probe 1)
SSR_ELEMENTS    GPIO 5      Heater SSR control
SSR_FAN         GPIO 33     Fan SSR / relay
```

Three MAX6675 + K-type probes are planned/installed at low, mid, and high rack heights. Probe 1 CS is GPIO 17. CS for probes 2 and 3 is **not assigned in firmware docs yet** — share CLK/SO, give each module its own CS.

Suggested unused CS candidates: GPIO 16, 21, 22, 23, 25, 26, 27, 32.
Avoid strapping pins GPIO 0, 2, 12, 15 if you can.

## Heat

- Stock element removed; stronger coils installed
- Dual TonGass 1440 W RV elements were the cost-effective upgrade path (1 in NPT bulkhead fittings)
- Plan: software duty-cycle cap (~80%) plus optional sheath probes because those elements are water-rated
- Element terminals are **outside** the chamber via bulkheads; seal the fittings, use a short run of 200 °C silicone wire from the terminals, then standard 14 AWG to the SSRs
- Two SSRs with heatsinks (one new, one existing)

Recommended element height when drilling: **1.75–2 in (44–50 mm)** above the floor, ≥1 in clearance under the deflector.

## Airflow

- Recirculation fan added (toaster-oven blower / custom impeller work)
- Duct from top intake toward bottom discharge is **not installed yet**
- Fan is expected to create a low-pressure zone on the intake side and pull air up through the duct once it exists

## Insulation / cabinet

- Sides, top, and door insulation still in place
- Back panel insulation was removed for the element install and discarded
- Replacement sheet: start ~20.5 in × 33.3 in, buy oversized and trim

## BLE name and service

Firmware should advertise a name starting with `Curing` and expose service `4fafc201-1fb5-459e-8fcc-c5c9c331914b` so the PWA can connect.
