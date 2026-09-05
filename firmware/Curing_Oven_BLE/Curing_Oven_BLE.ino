/**
 * Curing Oven BLE firmware
 * Board: ESP32-WROOM-32 30-pin DevKit
 * Pins and UUIDs: see firmware/README.md and docs/HARDWARE.md
 */

#include <NimBLEDevice.h>
#include <ArduinoJson.h>
#include <max6675.h>

#define HEATER_PIN 5
#define FAN_PIN    33
#define MAX_SCK    18
#define MAX_CS     17
#define MAX_SO     19

#define BLE_NAME        "Curing-Oven"
#define SERVICE_UUID    "4fafc201-1fb5-459e-8fcc-c5c9c331914b"
#define TEMP_UUID       "a3c1e8f2-5b2a-4c8e-9f1d-2e3b4c5d6e7f"
#define CMD_UUID        "c1d2e3f4-5a6b-7c8d-9e0f-1a2b3c4d5e6f"
#define STATUS_UUID     "d4e5f6a7-8b9c-0d1e-2f3a-4b5c6d7e8f90"

MAX6675 thermocouple(MAX_SCK, MAX_CS, MAX_SO);

NimBLEServer* pServer = nullptr;
NimBLECharacteristic* pTempChar = nullptr;
NimBLECharacteristic* pStatusChar = nullptr;

float currentTemp = 25.0;
String currentMode = "IDLE";
bool heaterOn = false;
bool fanOn = false;

float programTarget = 95.0;
float programRamp = 5.0;
float programHold = 30.0;
float programCool = 3.0;

void updateStatus() {
  String status = currentMode + "|" + (heaterOn ? "ON" : "OFF") + "|" + (fanOn ? "ON" : "OFF");
  if (pStatusChar) {
    pStatusChar->setValue(status.c_str());
  }
}

void setOutputs() {
  digitalWrite(HEATER_PIN, heaterOn ? HIGH : LOW);
  digitalWrite(FAN_PIN, fanOn ? HIGH : LOW);
}

void allOff() {
  currentMode = "IDLE";
  heaterOn = false;
  fanOn = false;
  setOutputs();
  updateStatus();
}

class ServerCallbacks : public NimBLEServerCallbacks {
  void onConnect(NimBLEServer* pServer, NimBLEConnInfo& connInfo) override {
    Serial.println("CLIENT CONNECTED");
  }

  void onDisconnect(NimBLEServer* pServer, NimBLEConnInfo& connInfo, int reason) override {
    Serial.println("CLIENT DISCONNECTED");
    allOff();
    NimBLEDevice::startAdvertising();
  }
};

class CommandCallbacks : public NimBLECharacteristicCallbacks {
  void onWrite(NimBLECharacteristic* pCharacteristic, NimBLEConnInfo& connInfo) override {
    std::string raw = pCharacteristic->getValue();
    Serial.print("CMD: ");
    Serial.println(raw.c_str());

    JsonDocument doc;
    if (deserializeJson(doc, raw)) {
      Serial.println("JSON parse failed");
      return;
    }

    const char* cmd = doc["cmd"] | "";

    if (strcmp(cmd, "fullpower") == 0) {
      currentMode = "FULL POWER";
      heaterOn = true;
      fanOn = true;
    } else if (strcmp(cmd, "emergency") == 0) {
      currentMode = "IDLE";
      heaterOn = false;
      fanOn = false;
    } else if (strcmp(cmd, "start") == 0) {
      programTarget = doc["target"] | programTarget;
      programRamp = doc["ramp"] | programRamp;
      programHold = doc["hold"] | programHold;
      programCool = doc["cool"] | programCool;
      currentMode = "RAMPING";
      heaterOn = true;
      fanOn = true;
      Serial.printf("Program target=%.1f ramp=%.1f hold=%.1f cool=%.1f\n",
                    programTarget, programRamp, programHold, programCool);
    }

    setOutputs();
    updateStatus();
    Serial.printf("Mode=%s Heater=%s Fan=%s\n",
                  currentMode.c_str(),
                  heaterOn ? "ON" : "OFF",
                  fanOn ? "ON" : "OFF");
  }
};

void setup() {
  Serial.begin(115200);
  delay(1500);

  pinMode(HEATER_PIN, OUTPUT);
  pinMode(FAN_PIN, OUTPUT);
  allOff();

  Serial.println();
  Serial.println("=== Curing Oven BLE ===");
  Serial.println("Heater GPIO 5 | Fan GPIO 33 | MAX6675 18/17/19");

  NimBLEDevice::init(BLE_NAME);
  pServer = NimBLEDevice::createServer();
  pServer->setCallbacks(new ServerCallbacks());

  NimBLEService* pService = pServer->createService(SERVICE_UUID);

  pTempChar = pService->createCharacteristic(
      TEMP_UUID,
      NIMBLE_PROPERTY::NOTIFY | NIMBLE_PROPERTY::READ);
  pTempChar->setValue("25.0");

  pStatusChar = pService->createCharacteristic(
      STATUS_UUID,
      NIMBLE_PROPERTY::READ);
  updateStatus();

  NimBLECharacteristic* pCmdChar = pService->createCharacteristic(
      CMD_UUID,
      NIMBLE_PROPERTY::WRITE | NIMBLE_PROPERTY::WRITE_NR);
  pCmdChar->setCallbacks(new CommandCallbacks());

  pService->start();
  pServer->start();

  NimBLEAdvertising* pAdvertising = NimBLEDevice::getAdvertising();
  pAdvertising->addServiceUUID(SERVICE_UUID);
  pAdvertising->enableScanResponse(true);
  pAdvertising->setMinInterval(0x20);
  pAdvertising->setMaxInterval(0x40);
  pAdvertising->setName(BLE_NAME);
  pAdvertising->start();

  Serial.println("Advertising STARTED as Curing-Oven");
}

void loop() {
  float reading = thermocouple.readCelsius();
  if (reading > 0 && reading < 1000) {
    currentTemp = reading;
  }

  static unsigned long lastNotify = 0;
  if (millis() - lastNotify > 1000 && pTempChar != nullptr) {
    char tempStr[8];
    dtostrf(currentTemp, 4, 1, tempStr);
    pTempChar->setValue(tempStr);
    pTempChar->notify();
    lastNotify = millis();
  }

  static unsigned long lastPrint = 0;
  if (millis() - lastPrint > 3000) {
    Serial.printf("Mode=%s Temp=%.1f C Heater=%s Fan=%s\n",
                  currentMode.c_str(), currentTemp,
                  heaterOn ? "ON" : "OFF",
                  fanOn ? "ON" : "OFF");
    lastPrint = millis();
  }

  delay(50);
}
