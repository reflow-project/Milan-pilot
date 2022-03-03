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

#include <vector>
#include "WiFi.h"
#include <HTTPClient.h>
#include <Arduino_JSON.h>
#include <LiquidCrystal.h>

////
const char* ntpServer = "pool.ntp.org";
const long gmtOffset_sec = 3600;
const int daylightOffset_sec = 3600;

#include "time.h"
////

HTTPClient http;
int httpResponseCode;
String graphqlToken;

// Value Flows variables
std::vector<String> offerIds;
std::vector<String> refusedOffers;
std::vector<String> acceptedOffers;
bool commitmentFlag;

// Environment variables
enum States { START, QUANTITY, QUALITY, SEND, RECEIVE };
States mainState;
enum Colors { BLACK, WHITE, RED, GREEN, YELLOW, SIZE_OF_COLORS };
const u_int8_t colors[SIZE_OF_COLORS][3] = {
  {0, 0, 0},
  {255, 255, 255},
  {255, 0, 0},
  {255, 255, 0},
  {0, 255, 0}
};
Colors displayColor;
Colors ledColor;
enum Qualities { PACKAGING, RUINED, SPOILED, SIZE_OF_QUALITIES };
Qualities offerQuality;

/*
struct DisplayMessage {
  short y;
  short x;
  String message;
  DisplayMessage() {
    y = 0;
    x = 0;
    message = "";
  }
  DisplayMessage(int a, int b, String m) {
    y = a;
    x = b;
    message = m;
  }
};
struct DisplayContent {
  std::vector<DisplayMessage> displayMessages;
  void add(short y, short x, String message) { displayMessages.push_back(DisplayMessage(y, x, message)); }
  void clear() { displayMessages.clear(); }
  int size() { return displayMessages.size(); }
  DisplayMessage operator[](int i) {
    if (i < 0 || i > this->size()) { return DisplayMessage(); }
    return displayMessages[i];
  }
};
DisplayContent displayContent;
*/

String displayText;
unsigned int offerQuantity;
bool incrementFlag;
bool buttonFlag;

// PWM
const int freq = 5000;
const int resolution = 8;

// LED RGB
#define LED_R 16
#define LED_G 15
#define LED_B 14
const int ledRChannel = 0;
const int ledGChannel = 1;
const int ledBChannel = 2;
u_int8_t ledBrightness = 10; // set from 0 (very dark) to 255 (very bright);

// Button
#define BUTTON 13

// Display
#define DISPLAY_LIGHT_R 20
#define DISPLAY_LIGHT_G 19
#define DISPLAY_LIGHT_B 18
const int displayRChannel = 3;
const int displayGChannel = 4;
const int displayBChannel = 5;
u_int8_t displayBrightness = 255; // set from 0 (very dark) to 255 (very bright);
//LiquidCrystal lcd(36, 35, 34, 33, 26, 21);

// Encoder
#define ENCODER_A 42 
#define ENCODER_B 41
#define ENCODER_C 3
int lastAState, currentAState;
enum EncoderState { STILL, CW, CCW };
EncoderState encoderState;

long timer;
int delta = 10000; // time for checking satisfactions

void IRAM_ATTR encoderStep();

void setup() {
  Serial.begin(115200);
  Serial.println("BOTTO - Input Device");

  // Print MCU info
  uint32_t id = 0;
  for(int i=0; i<17; i=i+8) {
    id |= ((ESP.getEfuseMac() >> (40 - i)) & 0xff) << i;
  }
  Serial.print("Chip id: ");
  Serial.println(id);

  // Wi-fi connection will get stuck if credentials are wrong
  WiFiSetup();
  graphqlSetup();

  // Encoder setup
  pinMode(ENCODER_A, INPUT_PULLUP);
  pinMode(ENCODER_B, INPUT_PULLUP);
  pinMode(ENCODER_C, INPUT_PULLDOWN);
  attachInterrupt(digitalPinToInterrupt(ENCODER_A), encoderStep, CHANGE);
	lastAState = digitalRead(ENCODER_A); 
  encoderState = EncoderState::STILL;

  // Display setup
  ledcSetup(displayRChannel, freq, resolution);
  ledcSetup(displayGChannel, freq, resolution);
  ledcSetup(displayBChannel, freq, resolution);
  ledcAttachPin(DISPLAY_LIGHT_R, displayRChannel);
  ledcAttachPin(DISPLAY_LIGHT_G, displayGChannel);
  //ledcAttachPin(DISPLAY_LIGHT_B, displayBChannel);
  // Temporary fix
  pinMode(DISPLAY_LIGHT_B, OUTPUT);
  digitalWrite(DISPLAY_LIGHT_B, LOW);
  displayColor = Colors::WHITE;
  turnDisplay(displayColor);
  // lcd.begin(20, 4);

  // Button setup
  pinMode(BUTTON, INPUT_PULLUP);
  buttonFlag = false;

  // RGB LED Setup
  ledcSetup(ledRChannel, freq, resolution);
  ledcSetup(ledGChannel, freq, resolution);
  ledcSetup(ledBChannel, freq, resolution);
  ledcAttachPin(LED_R, ledRChannel);
  ledcAttachPin(LED_G, ledGChannel);
  ledcAttachPin(LED_B, ledBChannel);
  ledColor = Colors::GREEN;
  turnLed(ledColor);

  // Environment setup
  changeState(States::START);
  offerQuantity = 1;
  offerQuality = (Qualities)0;
  commitmentFlag = false;
  timer = millis();
//  lcd.setCursor(0,0);
//  lcd.print("BOTTO!");
  //displayContent.add(8, 1, "BOTTO!");
}

void loop() {
  readInput();
  updateSystem();
  renderState();
}

void readInput() {
  switch (mainState) {
  case States::START:
    if (millis() - timer > delta) {
      checkSatisfactions();
      timer = millis();
    }
    checkButton();
    break;
  case States::QUANTITY:
    checkButton();
    break;
  case States::QUALITY:
    checkButton();
    break;
  case States::SEND:
    //
    break;
  case States::RECEIVE:
    //
    break;
  default:
    //
    break;
  }
}

void updateSystem() {
  switch (mainState) {
  case States::START:
    if (buttonOperated()) {
      changeState(States::QUANTITY);
    }
    if (commitmentFlag) {
      changeState(States::RECEIVE);
      blinkRoutine(Colors::RED, Colors::GREEN);
      delay(500);
    }
    break;
  case States::QUANTITY:
    if (encoderOperated()) {
      changeQuantity(incrementFlag);
    }
    if (buttonOperated()) {
      changeState(States::QUALITY);
    }
    break;
  case States::QUALITY:
    if (encoderOperated()) {
      changeQuality(incrementFlag);
    }
    if (buttonOperated()) {
      changeState(States::SEND);
      blinkRoutine(Colors::RED, Colors::GREEN);
      delay(2000);
    }
    break;
  case States::SEND:
    sendDonation(offerQuantity, offerQuality);
    offerQuantity = 1;
    turnLed(Colors::GREEN);
    changeState(States::START);
    break;
  case States::RECEIVE:
    listSatisfactions();
    commitmentFlag = false;
    changeState(States::START);
    turnLed(Colors::GREEN);
    break;
  default:
    //
    break;
  }
}

void renderState() {  
  //printDisplay(displayContent);
}

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
  Serial.println("Connesione alla Wi-Fi in corso...");
  WiFi.begin(&wifiSSID[0], &wifiPass[0]);
  while (WiFi.status() != WL_CONNECTED) {
    delay(1000);
    Serial.println("... non ancora ...");
  }
  Serial.println("Connesso!");
  Serial.print("Indirizzo IP: ");
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
  Serial.println("\nConnessione al server GraphQL");
  http.begin(graphqlServer);
  http.addHeader("Content-Type", "application/json");
  String query = "{\"query\":\"mutation {\\n  login(\\n    emailOrUsername: \\\"" + graphqlUser + "\\\",\\n    password: \\\"" + graphqlPass + "\\\"\\n  ) {\\n    token\\n  }\\n}\",\"variables\":{}}";
  httpResponseCode = http.POST(query);
  if (httpResponseCode > 0) {
    if (httpResponseCode = 200) {
      Serial.println("\nConnesso\n");
      String response = http.getString();
      JSONVar responseObject = JSON.parse(response);
      graphqlToken = responseObject["data"]["login"]["token"];
    } else {
      Serial.println("HTTP Error: " + httpResponseCode);
      Serial.println(http.getString());
      // error handling?
    }
  } else {
    Serial.println("Nessuna connesione");
  }
  http.end();
}

void sendDonation(int quantity, Qualities quality) {
  ////
  configTime(gmtOffset_sec, daylightOffset_sec, ntpServer);

  struct tm timeinfo;
  if(!getLocalTime(&timeinfo)){
    Serial.println("Failed to obtain time");
    return;
  }
  String tmp = (&timeinfo, "%y-%m-%dT%T");
  tmp = tmp +  ".000Z";
  Serial.println(tmp);
  ////
  http.begin(graphqlServer);
  http.addHeader("Authorization", "Bearer " + graphqlToken);
  http.addHeader("Content-Type", "application/json");
  String query = "{\"query\":\"mutation {\\n createOffer(intent: {\\n      action: \\\"transfer\\\",\\n      name: \\\"Donazione\\\",\\n      receiver:\\\"01FKNV3D8T0CBC8SYASJASRSS6\\\",\\n      resourceConformsTo: \\\"01FKQPHEY0YWK83MKCM8T5RE7Q\\\",\\n      hasPointInTime: \\\"" + tmp + "\\\",,\\n      availableQuantity: {hasUnit: \\\"01FKNWF5Q3013GYDC4A9CCY65R\\\", hasNumericalValue: " + String(quantity) + "},\\n      note: \\\"" + getEloquentQuality(quality) + "\\\"\\n}){\\n  intent{\\n    id\\n  }\\n}\\n}\",\"variables\":{}}";
  httpResponseCode = http.POST(query);
  if (httpResponseCode > 0) {
    String response = http.getString();
    JSONVar responseObject = JSON.parse(response);
    String id = JSONVar::stringify(responseObject["data"]["createOffer"]["intent"]["id"]);
    id = id.substring(1, id.length()-1);
    offerIds.push_back(id);
    Serial.print("Donazione creata con l'id #");
    Serial.println(offerIds[offerIds.size()-1]);
  } else {
    Serial.println("Qualcosa è andato veramente storto... Prova di nuovo");
  }
  http.end();
}

void checkSatisfactions() {
  for (short i = 0; i < offerIds.size(); i++) {
    bool skipFlag = false;
    short k = 0;
    // check on accepted
    while (k < acceptedOffers.size() && !skipFlag) {
      if (offerIds[i] == acceptedOffers[k]) {
        skipFlag = true;
      }
      k++;
    }
    k = 0;
    // check on resufed
    while (k < refusedOffers.size() && !skipFlag) {
      if (offerIds[i] == refusedOffers[k]) {
        skipFlag = true;
      }
      k++;
    }

    if (!skipFlag) {
      String query = "{\"query\":\"query{\\n  intent(id:\\\"" + offerIds[i] + "\\\"){\\n    satisfiedBy{\\n      resourceQuantity{\\n        hasNumericalValue\\n      }\\n    }\\n  }\\n}\",\"variables\":{}}";
      http.begin(graphqlServer);
      http.addHeader("Authorization", "Bearer " + graphqlToken);
      http.addHeader("Content-Type", "application/json");
      httpResponseCode = http.POST(query);
      if (httpResponseCode > 0) {
        String response = http.getString();
        JSONVar responseObject = JSON.parse(response);
        responseObject = responseObject["data"]["intent"]["satisfiedBy"];
        if (responseObject.length() != 0) {
          double n = (double)responseObject[0]["resourceQuantity"]["hasNumericalValue"];
          if (n != 0.0) {
            acceptedOffers.push_back(offerIds[i]);
          } else {
            refusedOffers.push_back(offerIds[i]);
          }
          commitmentFlag = true;
        }
      }
      http.end();
    }
  }
}

void listSatisfactions() {
  printDonations();
  Serial.println("\nDonazoni accettate:");
  for (short i = 0; i < acceptedOffers.size(); i++) { Serial.println(acceptedOffers[i]); }
  Serial.println("\nDonazioni rifiutate:");
  for (short i = 0; i < refusedOffers.size(); i++) { Serial.println(refusedOffers[i]); }
}

void checkButton() {
  if (!digitalRead(BUTTON)) {
    buttonFlag = true;
  }
}

void IRAM_ATTR encoderStep(void) {  
  currentAState = digitalRead(ENCODER_A);
  if (currentAState != lastAState) {
    if (digitalRead(ENCODER_B) != currentAState) {
      encoderState = EncoderState::CW;
    } else {
      encoderState = EncoderState::CCW;
    }
  }
  lastAState = currentAState;
}

bool buttonOperated() {
  if (buttonFlag) {
    if (digitalRead(BUTTON)) {
      buttonFlag = false;
      return true;
    }
  }
  return false;
}

bool encoderOperated() {
  if (encoderState != EncoderState::STILL) {
    incrementFlag = encoderState == EncoderState::CW ? true : false;
    encoderState = EncoderState::STILL;
  } else {
    return false;
  }
  return true;
}

void changeState(States newState) {
  mainState = newState;
  printState();
  delay(400); //debouncing
}

void changeQuantity(bool increment) {
  // Avoid 0 qunatities and overflows
  if (offerQuantity <= 1 && !increment) {
    return;
  }
  offerQuantity = increment ? offerQuantity + 1 : offerQuantity - 1;
  Serial.print("Quantità: ");
  Serial.println(offerQuantity);
}

void changeQuality(bool increment) {
  if (increment) {
    if (int(offerQuality) == int(Qualities::SIZE_OF_QUALITIES - 1)) {
      offerQuality = (Qualities)0;
    } else {
      offerQuality = (Qualities)((int)offerQuality + 1);
    }
  } else {
    if ((int)offerQuality == 0) {
      offerQuality = (Qualities)((int)Qualities::SIZE_OF_QUALITIES - 1);
    } else {
      offerQuality = (Qualities)((int)offerQuality - 1);
    }
  }
  Serial.print("Motivo donazione: ");
  Serial.println(getEloquentQuality(offerQuality));
}

String getEloquentQuality(Qualities quality) {
  switch (quality) {
    case Qualities::PACKAGING:
      return "Collo rovinato";
      break;
    case Qualities::RUINED:
      return "Estetica prodotto";
      break;
    case Qualities::SPOILED:
      return "Maturazione avanzata";
      break;
    default:
      return "";
      break;
  }
}

void listenToEncoderPins(){
  Serial.print("A: ");
  Serial.print(digitalRead(ENCODER_A));
  Serial.print(" B: ");
  Serial.print(digitalRead(ENCODER_B));
  Serial.print(" C: ");
  Serial.println(digitalRead(ENCODER_C));
  delay(250);
}

void printDonations() {
  Serial.println("\nDonazioni inviate: ");
  for (short i = 0; i < offerIds.size(); i++) {
    Serial.println(offerIds[i]);
  }
}

void printState() {
  switch (mainState) {
  case States::START:
    Serial.println("\nPremi il pulsante per iniziare una donazione");
    break;
  case States::QUANTITY:
    Serial.println("\nSelezione la quantità di colli e premi il pulsante proseguire");
    break;
  case States::QUALITY:
    Serial.println("\nImposta il motivo della donazione e premi il pulsante proseguire");
    break;
  case States::SEND:
    Serial.println("\nInvio donazione");
    break;
  case States::RECEIVE:
    Serial.println("\nAggiornamento richiesto ritiro");
    break;
  default:
    break;
  }
}

// This function is async and blocking!!!
void turnLed(Colors color) {
  u_int8_t r = map(255 - colors[color][0], 0, 255, 255-ledBrightness, 255);
  u_int8_t g = map(255 - colors[color][1], 0, 255, 255-ledBrightness, 255);
  u_int8_t b = map(255 - colors[color][2], 0, 255, 255-ledBrightness, 255);
  u_int8_t rPrev = ledcRead(ledRChannel);
  u_int8_t gPrev = ledcRead(ledGChannel);
  u_int8_t bPrev = ledcRead(ledBChannel);
  int ramp = 250;  
  for (short i = 0; i < ramp; i++) {
    ledcWrite(ledRChannel, map(i, 0, ramp, rPrev, r));
    ledcWrite(ledGChannel, map(i, 0, ramp, gPrev, g));
    ledcWrite(ledBChannel, map(i, 0, ramp, bPrev, b));
    delay (1);  
  }
  ledcWrite(ledRChannel, r);
  ledcWrite(ledGChannel, g);
  ledcWrite(ledBChannel, b);
}

void turnDisplay(Colors color) {
  u_int8_t r = map(255 - colors[color][0], 0, 255, 255-displayBrightness, 255);
  u_int8_t g = map(255 - colors[color][1], 0, 255, 255-displayBrightness, 255);
  u_int8_t b = map(255 - colors[color][2], 0, 255, 255-displayBrightness, 255);
  /*
  u_int8_t rPrev = ledcRead(displayRChannel);
  u_int8_t gPrev = ledcRead(displayGChannel);
  u_int8_t bPrev = ledcRead(displayBChannel);
  int ramp = 250;
  for (short i = 0; i < ramp; i++) {
    ledcWrite(displayRChannel, map(i, 0, ramp, rPrev, r));
    ledcWrite(displayGChannel, map(i, 0, ramp, gPrev, g));
    ledcWrite(displayBChannel, map(i, 0, ramp, bPrev, b));
    delay (1);
  }
  */
  ledcWrite(displayRChannel, r);
  ledcWrite(displayGChannel, g);
  ledcWrite(displayBChannel, b);
}

/*
void printDisplay(DisplayContent &c) {
  lcd.clear();
  for (short i = 0; i < c.size(); i++) {
    lcd.setCursor(c[i].y, c[i].x);
    lcd.print(c[i].message);
  }
}
*/

void blinkRoutine(Colors first, Colors last) {
  turnLed(first);
  turnLed(last);
  turnLed(first);
  turnLed(last);
  turnLed(first);
}
