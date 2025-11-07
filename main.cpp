#include <Arduino.h>
#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>
#include <ArduinoJson.h>

const char* WIFI_SSID     = "yes"; // wifi name
const char* WIFI_PASSWORD = "no"; // wifi pass
const char* API_URL       = "https://rad.changeme.workers.dev/ingest";  // <-- change changeme
const char* DEVICE_TOKEN  = "xxx";  // secret

#define GEIGER_PIN D5

volatile unsigned long counts = 0;

void IRAM_ATTR countPulse() {
  counts++;
}

void sendData(unsigned long cpm);

void setup() {
  Serial.begin(115200);
  pinMode(BUILTIN_LED, OUTPUT);
  pinMode(GEIGER_PIN, INPUT_PULLUP);
  attachInterrupt(digitalPinToInterrupt(GEIGER_PIN), countPulse, FALLING);

  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print("WiFi...");
  while (WiFi.status() != WL_CONNECTED) {
    delay(300);
    Serial.print(".");
  }
  Serial.println("Connected!");
}

void loop() {
  static unsigned long lastSend = 0;
  unsigned long now = millis();

  if (now - lastSend >= 60000) {
    lastSend = now;

    noInterrupts();
    unsigned long pulseCount = counts;
    counts = 0;
    interrupts();

    sendData(pulseCount);
  }

  delay(5);
}

void sendData(unsigned long pulseCount) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi not connected");
    digitalWrite(BUILTIN_LED, HIGH);
    return;
  }

  WiFiClientSecure client;
  client.setInsecure();
  HTTPClient http;

  if (!http.begin(client, API_URL)) {
    Serial.println("HTTP begin failed");
    return;
  }

  http.addHeader("Content-Type", "application/json");
  http.addHeader("Authorization", String("Bearer ") + DEVICE_TOKEN);

  JsonDocument doc;
  doc["clicks"] = pulseCount;
  doc["ts"] = millis();

  String json;
  serializeJson(doc, json);

  Serial.printf("Sending %lu clicks\n", pulseCount);

  int httpCode = http.POST(json);
  if (httpCode > 0) {
    Serial.printf("POST -> %d\n", httpCode);
  } else {
    Serial.printf("POST failed: %s\n", http.errorToString(httpCode).c_str());
    digitalWrite(BUILTIN_LED, HIGH);
  }

  http.end();

  digitalWrite(BUILTIN_LED, LOW);
  delay(50);
  digitalWrite(BUILTIN_LED, HIGH);
}
