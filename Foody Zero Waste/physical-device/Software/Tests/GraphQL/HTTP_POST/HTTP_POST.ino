// Check if a file called settings.h exists to pass default values of the following variables
#if __has_include("settings.h")
#include "settings.h"
#else
String wifiSSID;
String wifiPass;
String graphqlServer;
String graphqlUser;
String graphqlPass;
#endif

#include "WiFi.h"
#include <HTTPClient.h>
#include <Arduino_JSON.h>

HTTPClient http;
int httpResponseCode;
String token;

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

void graphqlSetup() {
  // Check Host
  if (graphqlServer.length() == 0) {
    Serial.print("Type the GraphQL server URL: ");
    bool endChar = false;
    while (!endChar) {
      if (Serial.available()) {
        if (Serial.peek() == 13) {
          endChar = true;
          Serial.println();
        } else {
          Serial.print(Serial.peek());
          graphqlServer += static_cast<char>(Serial.read());
        }
      }
    }
  }

  // Check User
  if (graphqlUser.length() == 0) {
    Serial.print("Type the ReflowOS user: ");
    bool endChar = false;
    while (!endChar) {
      if (Serial.available()) {
        if (Serial.peek() == 13) {
          endChar = true;
          Serial.println();
        } else {
          Serial.print(Serial.peek());
          graphqlUser += static_cast<char>(Serial.read());
        }
      }
    }
  }

  // Check password
  if (graphqlPass.length() == 0) {
    Serial.print("Type the Password: ");
    bool endChar = false;
    while (!endChar) {
      if (Serial.available()) {
        if (Serial.peek() == 13) {
          endChar = true;
          Serial.println();
        } else {
          graphqlPass += static_cast<char>(Serial.read());
          Serial.print('*');
        }
      }
    }
  }

  // Login mutation
  Serial.println("Logging into GraphQL server");
  http.begin(graphqlServer);
  http.addHeader("Content-Type", "application/json");
  String query = "{\"query\":\"mutation {\\n  login(\\n    emailOrUsername: \\\"" + graphqlUser + "\\\",\\n    password: \\\"" + graphqlPass + "\\\"\\n  ) {\\n    token\\n  }\\n}\",\"variables\":{}}";
  httpResponseCode = http.POST(query);
  if (httpResponseCode > 0) {
    if (httpResponseCode = 200) {
      Serial.println("\nLogged in\n");
      String response = http.getString();
      Serial.println(response);
      JSONVar responseObject = JSON.parse(response);
      token = responseObject["data"]["login"]["token"];
      Serial.println(token);
    } else {
      Serial.println("HTTP Error: " + httpResponseCode);
      Serial.println(http.getString());
      // error handling?
    }
  } else {
    Serial.println("No connection");
  }
  http.end();
}

String idOffer;
String quantityOffer;

void sendDonation() {
  http.begin(graphqlServer);
  http.addHeader("Authorization", "Bearer " + token);
  http.addHeader("Content-Type", "application/json");
  quantityOffer = "30";
  String query = "{\"query\":\"mutation {\\n createOffer(intent: {\\n      action: \\\"transfer\\\",\\n      name: \\\"Donazione\\\",\\n      receiver:\\\"01FKNV3D8T0CBC8SYASJASRSS6\\\",\\n      resourceConformsTo: \\\"01FKQPHEY0YWK83MKCM8T5RE7Q\\\",\\n      availableQuantity: {hasUnit: \\\"01FKNWF5Q3013GYDC4A9CCY65R\\\", hasNumericalValue: " + quantityOffer + "},\\n      note: \\\"messo bene\\\"\\n}){\\n  intent{\\n    id\\n  }\\n}\\n}\",\"variables\":{}}";
  Serial.println("Attempting mutation");
  httpResponseCode = http.POST(query);
  if (httpResponseCode > 0) {
    String response = http.getString();    
    JSONVar responseObject = JSON.parse(response);
    idOffer = responseObject["data"]["createOffer"]["intent"]["id"];
    Serial.println(idOffer);
  } else {
    Serial.println("Qualcosa è andato storto");
  }
}

void checkSatisfactions() {
  Serial.println("Attempting query");
  String query = "{\"query\":\"query{\\n  intent(id:\\\"" + idOffer + "\\\"){\\n    satisfiedBy{\\n      resourceQuantity{\\n        hasNumericalValue\\n      }\\n    }\\n  }\\n}\",\"variables\":{}}";
  http.begin(graphqlServer);
  http.addHeader("Authorization", "Bearer " + token);
  http.addHeader("Content-Type", "application/json");
  httpResponseCode = http.POST(query);
  if (httpResponseCode > 0) {
    String response = http.getString();
    Serial.println();
    Serial.println(response);
    Serial.println();
    JSONVar responseObject = JSON.parse(response);
    responseObject = responseObject["data"]["intent"]["satisfiedBy"];
    if (responseObject.length() != 0) {
      double n = (double)responseObject[0]["resourceQuantity"]["hasNumericalValue"];
      if (n != 0.0) {
        Serial.println("Created satisfaction");  
      } else {
        Serial.println("Donation refused");  
      }
    } else {
      Serial.println("No commitment yet");
    }
  }
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

  graphqlSetup();

  //test
  sendDonation();
}

void loop() {
  // test  
  checkSatisfactions();
  delay(5000);
}