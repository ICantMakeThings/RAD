#include <Arduino.h>
#include <ArduinoJson.h>
#include <ArduinoOTA.h>
#include <ESP8266HTTPClient.h>
#include <ESP8266WiFi.h>
#include <cstdint>
#include <time.h>

constexpr const char *WIFI_SSID = "yes";     // wifi name
constexpr const char *WIFI_4PASSWORD = "no"; // wifi pass
constexpr const char *API_URL =
    "https://rad.changeme.workers.dev/ingest"; // <-- change changeme
constexpr const char *DEVICE_TOKEN = "xxx";    // secret

constexpr uint8_t GEIGER_PIN = D5;
constexpr unsigned long SEND_INTERVAL_MS = 300000;
constexpr unsigned long WIFI_TIMEOUT_MS = 300;
constexpr unsigned long LOOP_DELAY_MS = 5;
constexpr unsigned long SERIAL_BAUD = 115200;

volatile unsigned long counts = 0;

void IRAM_ATTR countPulse() { counts++; }

bool sendData(unsigned long cpm);

void setup() {
  Serial.begin(SERIAL_BAUD);
  pinMode(BUILTIN_LED, OUTPUT);
  pinMode(GEIGER_PIN, INPUT_PULLUP);
  attachInterrupt(digitalPinToInterrupt(GEIGER_PIN), countPulse, FALLING);

  WiFi.mode(WIFI_STA);
  WiFi.setAutoReconnect(true);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print("WiFi...");
  while (WiFi.status() != WL_CONNECTED) {
    delay(WIFI_TIMEOUT_MS);
    Serial.print(".");
  }
  Serial.println("Connected!");
  configTime(0, 0, "pool.ntp.org");
  Serial.println("time set");
  ArduinoOTA.setHostname("RADdevice");
  ArduinoOTA.setPassword("OTAupdate");

  ArduinoOTA.onStart([]() { Serial.println("Start updating..."); });
  ArduinoOTA.onEnd([]() { Serial.println("\nUpdate complete!"); });
  ArduinoOTA.onProgress([](unsigned int progress, unsigned int total) {
    Serial.printf("Progress: %u%%\r", (progress / (total / 100)));
  });
  ArduinoOTA.onError([](ota_error_t error) {
    Serial.printf("Error[%u]: ", error);
    if (error == OTA_AUTH_ERROR)
      Serial.println("Auth Failed");
    else if (error == OTA_BEGIN_ERROR)
      Serial.println("Begin Failed");
    else if (error == OTA_CONNECT_ERROR)
      Serial.println("Connect Failed");
    else if (error == OTA_RECEIVE_ERROR)
      Serial.println("Receive Failed");
    else if (error == OTA_END_ERROR)
      Serial.println("End Failed");
  });

  ArduinoOTA.begin();
  Serial.println("Starting Loop");
}

void loop() {

  ArduinoOTA.handle();
  static unsigned long lastSend = 0;
  unsigned long now = millis();

  if (now - lastSend >= SEND_INTERVAL_MS) {
    lastSend = now;

    noInterrupts();
    unsigned long pulseCount = counts;
    counts = 0;
    interrupts();

    if (!sendData(pulseCount)) {
      noInterrupts();
      counts += pulseCount; // Restore data if posting failed
      interrupts();
    }
  }

  delay(LOOP_DELAY_MS);
}

bool sendData(unsigned long pulseCount) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi not connected");
    digitalWrite(BUILTIN_LED, HIGH);
    return false;
  }

  WiFiClientSecure client;
  client.setInsecure();
  HTTPClient http;

  if (!http.begin(client, API_URL)) {
    Serial.println("HTTP begin failed");
    return false;
  }

  http.addHeader("Content-Type", "application/json");
  http.addHeader("Authorization", String("Bearer ") + DEVICE_TOKEN);

  JsonDocument doc;
  doc["clicks"] = pulseCount;
  doc["ts"] = (unsigned long long)(time(nullptr)) * 1000;

  String json;
  serializeJson(doc, json);

  Serial.printf("Sending %lu clicks\n", pulseCount);

  bool success = false;
  int httpCode = http.POST(json);
  if (httpCode > 0) {
    Serial.printf("POST -> %d\n", httpCode);
    if (httpCode == 200 || httpCode == 201) {
      success = true;
    }
  } else {
    Serial.printf("POST failed: %s\n", http.errorToString(httpCode).c_str());
    digitalWrite(BUILTIN_LED, HIGH);
  }

  http.end();

  if (success) {
    digitalWrite(BUILTIN_LED, LOW);
    delay(50);
    digitalWrite(BUILTIN_LED, HIGH);
  }
  return success;
}
