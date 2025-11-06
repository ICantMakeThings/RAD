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
void IRAM_ATTR countPulse() { counts++; }

void sendData();

void setup() {
  Serial.begin(115200);
  pinMode(BUILTIN_LED, OUTPUT);
  pinMode(GEIGER_PIN, INPUT_PULLUP);
  attachInterrupt(digitalPinToInterrupt(GEIGER_PIN), countPulse, FALLING);

  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print("loading wifi matrix gm tube index delay");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\boom!");
}

void loop() {
  static unsigned long lastSend = 0;
  unsigned long now = millis();

  if (now - lastSend >= 10000) {
    lastSend = now;
    sendData();
    counts = 0;
  }
}

void sendData() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi too bad, im not connecting!");
    return;
  }

  WiFiClientSecure client;
  client.setInsecure();
  HTTPClient http;

  if (http.begin(client, API_URL)) {
    http.addHeader("Content-Type", "application/json");
    http.addHeader("Authorization", String("Bearer ") + DEVICE_TOKEN);

    JsonDocument doc;
    doc["clicks"] = counts;
    doc["ts"] = millis();

    String json;
    serializeJson(doc, json);

    int httpCode = http.POST(json);
    Serial.print("POST => ");
    Serial.println(httpCode);
    digitalWrite(BUILTIN_LED, LOW);
    delay(50);
    digitalWrite(BUILTIN_LED, HIGH);

    if (httpCode > 0) {
      Serial.println(http.getString());
    } else {
      Serial.println("Sumthin wrong my guy");
      digitalWrite(BUILTIN_LED, HIGH);
    }

    http.end();
  } else {
    Serial.println("HTTP went crack");
  }
}
