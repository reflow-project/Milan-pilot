// Check if a file called settings.h exists to pass default values of the following variables
#if __has_include("settings.h")
#include "settings.h"
#else
String wifiSSID;
String wifiPass;
#endif

#include "WiFi.h"

void WiFiSetup() {
  WiFi.mode(WIFI_STA);

  if (wifiSSID == "") {
    // Scan wifi networks
    Serial.println("Looking for networks\n");
    int n = WiFi.scanNetworks();
    if (n == 0) {
      Serial.println("No networks found");
      return;
    }
    Serial.print(n);
    Serial.println(" networks found:\n");
    for (int i = 0; i < n; ++i) {
      Serial.print(i + 1);
      Serial.print(": ");
      Serial.println(WiFi.SSID(i));
    }

    // Choose SSID by number
    Serial.print("\n\nChoose the network by typing its number: ");
    while (!Serial.available());
    int c = Serial.read() - 48; // this doesn't work with numbers bigger that 9!
    Serial.println(c);
    wifiSSID = WiFi.SSID(c-1);
    Serial.print('\n');
    Serial.println(wifiSSID);
    Serial.print('\n');
    if (wifiPass.length() == 0) {
      // Ask for password
      Serial.print("Type the password: ");
      bool endChar = false;
      while (!endChar) {
        if (Serial.available()) {
          if (Serial.peek() == 13) {
            endChar = true;
            Serial.println();
          } else {
            wifiPass += static_cast<char>(Serial.read());
            Serial.print('*');
          }
        }
      }
    }
  }
  Serial.print('\n');
  Serial.println("Connecting...");
  WiFi.begin(&wifiSSID[0], &wifiPass[0]);
  while (WiFi.status() != WL_CONNECTED) {
    delay(1000);
    Serial.println("... nothing yet ...");
  }
  Serial.println("WLAN Connected");
  Serial.print("IP address: ");
  Serial.println(WiFi.localIP());
}

void setup() {
  Serial.begin(115200);
  Serial.println("Program start");

  // MCU info
  uint32_t id = 0;
  for(int i=0; i<17; i=i+8) {
    id |= ((ESP.getEfuseMac() >> (40 - i)) & 0xff) << i;
  }
  Serial.print("Chip id: ");
  Serial.println(id);

  // Wi-fi connection will get stuck if credentials are wrong
  WiFiSetup();
}

void loop() {  
  delay(5000);
}