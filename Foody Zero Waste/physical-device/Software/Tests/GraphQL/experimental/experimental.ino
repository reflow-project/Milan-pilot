// Check if a file called settings.h exists to pass default values of the following variables
#if __has_include("settings.h")
#include "settings.h"
#else
String ssid;
String pass;
#endif

#include "WiFi.h"
#include "graphql-esp.h"
GraphqlEsp gq; // GraphQL Websocket handler

bool shouldSetOnline = false;  // Global to notify loop() to mutate online=true
const char *mySerial = "123456"; // Id of this device (better would be to read from ESP.getChipId())

/*
// Mutate my entry (serial:"123456") in 'devices' to set online to true
void sendSetOnline() {
    char buf[128];
    sprintf_P(buf, PSTR("update_devices(where:{serial:{_eq:\\\"%s\\\"}},_set:{online:true}){affected_rows}"), mySerial);
    gq.mutation(buf);
}
*/

void graphqlConnect() {
  auto cb = [&](GQEvent type, char* payload) {
    switch (type) {
      case GQEvent::error:
        Serial.printf_P(PSTR("GQ: error:%s\n"), payload);
      break;
      case GQEvent::disconnected:
        Serial.printf_P(PSTR("GQ disconnected\n"));
      break;
      case GQEvent::connected: {          
        Serial.printf_P(PSTR("GQ connected\n"));
        /*
        char buf[128];
        // Just for demo's sake:  Lets query something (that we do not confuse for our own data)
        gq.query("devices(where:{serial:{_eq:\\\"234567\\\"}}){name updated_at}");
        // Subscribe to changes in my entry (serial:"123456"). Get fields "serial", "online" and "light"
        sprintf_P(buf, PSTR("devices(where:{serial:{_eq:\\\"%s\\\"}}){serial online light}"), mySerial);
        gq.subscription(buf);
        */
      } break;
      case GQEvent::data:
        Serial.printf_P(PSTR("< From GQ Websocket: %s\n"), payload);
        if (parseText(payload, "serial")) { // "data"-message contains device
          bool light = parseBool((char *)payload, "light");
          Serial.printf_P(PSTR("Light %s\n"), light ? "On":"Off");
          //turnLightOn(light);
          if (parseBool((char *)payload, "online") == false) {
            // Someone (UI) has changed my online status...
            shouldSetOnline = true;
          }
        }
      break;
      default:
        Serial.printf_P(PSTR("GQEvent Got unimplemented event type\n"));
      break;
    }
  };

  gq.setCallback(cb);
  gq.setExtraHeader("Hello: World"); // Use this for e.g. Authorization
  gq.connect(graphqlHost, graphqlPort, graphqlPath);
}

void WiFiSetup() {
  WiFi.mode(WIFI_STA);

  if (ssid == "") {
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
    ssid = WiFi.SSID(c-1);
    Serial.print('\n');
    Serial.println(ssid);
    Serial.print('\n');
    if (pass.length() == 0) {
      // Ask for password
      Serial.print("Type the password: ");
      bool endChar = false;
      while (!endChar) {
        if (Serial.available()) {
          if (Serial.peek() == 13) {
            endChar = true;
            Serial.println();
          } else {
            pass += static_cast<char>(Serial.read());
            Serial.print('*');
          }
        }
      }
    }
  }
  Serial.print('\n');
  Serial.println("Connecting...");
  WiFi.begin(&ssid[0], &pass[0]);
  while (WiFi.status() != WL_CONNECTED) { delay(500); }
  Serial.println("WLAN Connected");
  Serial.print("IP address: ");
  Serial.println(WiFi.localIP());
  delay(1000);
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

  // GraphQL init
  Serial.printf_P(PSTR("Connecting to GraphQL server\n"));
  graphqlConnect();
  Serial.println("GraphQL Connected");
}

void loop() {
/*
  gq.loop(); // GraphQL websocket polling
  if (shouldSetOnline) {
    shouldSetOnline = false;
    Serial.printf_P(PSTR("Setting online to true\n"));
    sendSetOnline();
  }
*/
}
