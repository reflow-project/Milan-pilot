#define PLAY

// System & device libraries
#include <map>
#include "WiFi.h"
#include <HTTPClient.h>
#include <Arduino_JSON.h>
#include "time.h"

// Messages library
#include "messages.h"
#include "tunes.h"

#if __has_include("info.h")
#include "info.h"
#endif

// Device parameters
#if __has_include("settings.h")
#include "settings.h"
#else
String wifiSSID;
String wifiPass;
String graphqlServer;
String graphqlUser;
String graphqlPass;
#endif

// Custom libraries
#include "src/RGBEntity/RGBEntity.h"
#include "src/Button/Button.h"
#include "src/Encoder/Encoder.h"
#include "src/Speaker/Speaker.h"
#include "src/Display/Display.h"

RGBEntity led(14, 16, 15, 1, 2, 3, 2000, 8);
RGBEntity lcd(6, 8, 7, 4, 5, 6, 2000, 8);

Button button(13);

Encoder encoder(41, 42);
void IRAM_ATTR isr() { encoder.encoderStep(); }; // trick for associating a class function as an interrupt function

Speaker speaker(17, 0, 600, 8);

Display display(0, 1, 2, 3, 4, 5);

String* displayBuffer[4];
String tmpRow;
String timeRow;

// GraphQL communication variables
HTTPClient http;
int httpResponseCode;
String graphqlToken;
String graphqlId;

enum Colors { BLACK, WHITE, RED, GREEN, BLUE, LIGHT_WHITE, SIZE_OF_COLORS };
short colors[SIZE_OF_COLORS][3] = {
  {255, 255, 255},  //BLACK
  {50, 50, 50},      //WHITE
  {0, 220, 220},    //RED
  {220, 0, 220},    //GREEN
  {220, 220, 0},    //BLUE
  {245, 245, 245}   //LIGHT_WHITE
};

Colors ledColor;
Colors lcdColor;

// Environment variables
enum States { START, QUANTITY, QUALITY, SEND, RECEIVE, IDLE, LIST};
States mainState, nextState;
bool stateChange;
long timer;
int delta;
const int idleDelta = 60000; // time for getting back to start menu or going idle
const int holdDelta = 2000; // time for held button feature
const int satisfactionDelta = 10000; // time for checking satisfactions
const int expiredDelta = 900000; // time for checking satisfactions
Tune* selectedTune;
bool playTune;
bool menuFlag;
bool alertFlag;
bool alertMeaning; // true accepted, false refused

// Donations variables
#define MAX_DONATIONS 20
String donations[MAX_DONATIONS];
unsigned short donationsCounter;

String* acceptedDonations[MAX_DONATIONS];
unsigned short acceptedCounter;
bool commitmentFlag;

String* refusedDonations[MAX_DONATIONS];
unsigned short refusedCounter;
bool refusedFlag;

unsigned int satisfactionFlag;

// List variables
unsigned int listedDonation;
String listDate;
String listQuantity;
String listStatus;

// Time variables
const char* ntpServer = "pool.ntp.org";
const long gmtOffset_sec = 0;
const int daylightOffset_sec = 3600;

// Offer variables
enum Qualities { PACKAGING, RUINED, SPOILED, SIZE_OF_QUALITIES };
Qualities donationQuality;
unsigned int donationQuantity;
const unsigned int maxQuantity = 100;

void changeState(short state) {
  nextState = States(state);
  stateChange = true;
  timer = millis();
  setDelta(0);
}

void setup() {
  Serial.begin(115200);
  delay(200); // just a delay to let everything be set in place
  #ifdef INFO
  printInfo(info);
  #endif

  display.begin(20, 4);

  // Reset peripherals
  ledColor = Colors::BLACK;
  lcdColor = Colors::BLACK;
  setDisplayBuffer(message["deb004"], message["deb004"], message["deb004"], message["deb004"]);
  renderState();

  // Encoder interrupt association
  attachInterrupt(digitalPinToInterrupt(encoder.interruptPin()), isr, CHANGE);

  WiFiSetup();
  graphqlSetup();

  // Time setup
  configTime(gmtOffset_sec, daylightOffset_sec, ntpServer);

  // Environment setup
  mainState = States::START;
  stateChange = false;
  donationsCounter = 0;
  acceptedCounter = 0;
  refusedCounter = 0;
  commitmentFlag = false;
  menuFlag = true;
  alertFlag = false;
  retrieveDonations();
  timer = millis();
}

void loop() {
  readInput();
  updateSystem();
  renderState();
}

void readInput() {
  switch (mainState) {
    case States::START: {
      if (encoder.operated()) { menuFlag = !menuFlag; } // true for QUANTITY; false for LIST
      if (button.operated()) {
        if (menuFlag) {
          changeState(States::QUANTITY);
          donationQuantity = 1;
          donationQuality = Qualities::PACKAGING;
          setDelta(500);
          playTune = true;
        } else {
          if (donationsCounter > 0) {
            alertFlag = false;
            changeState(States::LIST);            
            listedDonation = 0;
            getDonationInfo();
            setDelta(500);
            playTune = true;
          }          
        }
      }

      if (millis() - timer > idleDelta) {
        changeState(States::IDLE);
      }

      if (millis() - timer > expiredDelta) {
        discardExpired();
      }

      // Check for new commitments
      if ((millis() - timer) / satisfactionDelta > 1) {
        checkSatisfactions();
      }

      // Check if commitments happened
      if (commitmentFlag || refusedFlag) {        
        changeState(States::RECEIVE);
        playTune = true;
        setDelta(10000);
      }
      break;
    }
    case States::QUANTITY: {
      if (stateChange && deltaOver()) {
        stateChange = false;
      }
      if (encoder.operated()) {
        if (encoder.direction() && donationQuantity < maxQuantity) {
          donationQuantity++;
        } else if (!encoder.direction() && donationQuantity > 1) {
          donationQuantity--;
        }
      }
      if (button.operated()) {
        if (holdCheck(2000)) {
          changeState(States::START);
        } else {
          changeState(States::QUALITY);
          setDelta(500);
          playTune = true;
        }
      }
      if (millis() - timer > idleDelta) {
        changeState(States::START);
      }
      break;
    }
    case States::QUALITY: {
      if (stateChange && deltaOver()) {
        stateChange = false;
      }
      if (encoder.operated()) {
        if (encoder.direction() && donationQuality < Qualities::SIZE_OF_QUALITIES - 1 ) {
          donationQuality = Qualities(int(donationQuality) + 1);
        } else if (!encoder.direction() && donationQuality > 0) {
          donationQuality = Qualities(int(donationQuality) - 1);
        }
      }
      if (button.operated()) {
        if (holdCheck(2000)) {
          changeState(States::START);
        } else {
          changeState(States::SEND);
          setDelta(3500);
          playTune = true;
        }
      }
      if (millis() - timer > idleDelta) {
        changeState(States::START);
      }
      break;
    }
    case States::SEND: {
      if (deltaOver()) {
        changeState(States::START);
      }
      break;
    }
    case States::RECEIVE:{
      if (button.operated() || deltaOver()) {
        changeState(States::START);
        alertFlag = true;
        alertMeaning = commitmentFlag;
        commitmentFlag = false;
        refusedFlag = false;        
      }
      break;
    }
    case States::IDLE: {
      if (button.operated() || encoder.operated()) {
        changeState(States::START);
      }

      // Check for new commitments
      if (millis() - timer > satisfactionDelta) {
        checkSatisfactions();
        timer = millis();
      }
      // Check if commitments happened
      if (commitmentFlag) {
        commitmentFlag = false;
        changeState(States::RECEIVE);
        playTune = true;
        setDelta(10000);
      }

      if (millis() - timer > expiredDelta) {
        discardExpired();
      }
      break;
    }
    case States::LIST: {
      if (stateChange && deltaOver()) {
        stateChange = false;
      }

      if (encoder.operated()) {
        if (encoder.direction()) {
          if (listedDonation < donationsCounter-1) { listedDonation++; }
          else { listedDonation = 0; }
        } else {
          if (listedDonation > 0) { listedDonation--; }
          else { listedDonation = donationsCounter-1; }
        }
        getDonationInfo();
      }

      if (button.operated() || millis() - timer > idleDelta) {
        changeState(States::START);
      }
      break;
    }
    default: {
      //
      break;
    }      
  }
}

void updateSystem() {
  if (stateChange) { mainState = nextState; }

  switch (mainState) {
  case States::START: {
    if (alertFlag) {
      ledColor = alertMeaning ? Colors::GREEN : Colors::RED;
    } else {
      ledColor = Colors::LIGHT_WHITE;
    }
    lcdColor = Colors::WHITE;

    tmpRow = "-> ";
    if (menuFlag) {
      tmpRow.concat(message["sta001"]);
      setDisplayBuffer(tmpRow, message["sta002"], message["sta003"], message["sta004"]);
    } else {
      tmpRow.concat(message["sta002"]);
      setDisplayBuffer(message["sta001"], tmpRow, message["sta003"], message["sta004"]);
    }
    if (playTune) {
      selectedTune = &tune4;
    }
    break;
  }
  case States::QUANTITY: {
    ledColor = stateChange ? Colors::RED : Colors::LIGHT_WHITE;
    lcdColor = Colors::WHITE;
    timeRow = getShortenedTime();
    tmpRow = message["qnt001"];
    tmpRow.concat(donationQuantity);
    setDisplayBuffer(timeRow, tmpRow, message["qnt002"], message["qnt003"]);
    if (playTune) {
      selectedTune = &tune4;
    }
    break;
  }
  case States::QUALITY: {
    ledColor = stateChange ? Colors::RED : Colors::LIGHT_WHITE;
    lcdColor = Colors::WHITE;
    tmpRow = getEloquentQuality(donationQuality);
    setDisplayBuffer(message["qlt001"], tmpRow, message["qlt005"], message["qlt006"]);
    if (playTune) {
      selectedTune = &tune4;
    }
    break;
  }
  case States::SEND: {
    if (stateChange) {
      stateChange = false;
      // implement a failsafe solution with error message - by AG
      donations[donationsCounter] = sendDonation(donationQuantity, donationQuality);      
      donationsCounter++;
    }
    lcdColor = Colors::WHITE;
    ledColor = Colors::RED;
    setDisplayBuffer(message["deb004"], message["sen001"], message["deb004"], message["deb004"]);
    if (playTune) {
      selectedTune = &tune1;
    }

    break;
  }
  case States::RECEIVE: {
    ledColor = commitmentFlag ? Colors::GREEN : Colors::RED;
    lcdColor = Colors::WHITE;
    tmpRow = message["rec001"];
    tmpRow.concat(satisfactionFlag+1);
    if (commitmentFlag) timeRow = message["rec002"];
    else timeRow = message["rec003"];
    setDisplayBuffer(message["deb004"], tmpRow, timeRow, message["deb004"]);
    if (playTune) {
      selectedTune = &tune2;
    }
    break;
  }
  case States::IDLE: {
    setDisplayBuffer(message["deb004"], message["deb004"], message["deb004"], message["deb004"]);
    ledColor = Colors::BLACK;
    lcdColor = Colors::BLACK;
    break;
  }
  case States::LIST: {
    ledColor = stateChange ? Colors::RED : Colors::LIGHT_WHITE;
    lcdColor = Colors::WHITE;

    timeRow = "#";
    timeRow.concat(listedDonation+1);
    timeRow.concat(" - ");    
    String date = listDate.substring(8, 10) + '/' + listDate.substring(5, 7) + " - " + listDate.substring(11, 16);
    timeRow.concat(date);     
    tmpRow = message["lis001"];
    tmpRow.concat(listQuantity);
    setDisplayBuffer(timeRow, tmpRow, listStatus, message["lis002"]);
    if (playTune) { selectedTune = &tune4; }
    break;
  }
  default:
    //
    break;
  }
}

void renderState() {
  if (mainState == States::IDLE) {
    display.noDisplay();
  } else {
    display.display();
  }
  display.clear();
  for (short i = 0; i < 4; i++) {
    display.setCursor(0, i);
    display.print(*displayBuffer[i]);
  }
  lcd.setColor(colors[lcdColor]);
  led.setColor(colors[ledColor]);
  if (playTune) {
    playTune = false;
    #ifdef PLAY
    speaker.playTune(selectedTune->notes, selectedTune->steps);
    #endif
  }
}

void WiFiSetup() {
  WiFi.mode(WIFI_STA);

  if (wifiSSID == "") {
    // Scan wifi networks
    Serial.println(message["wifi001"]);
    int n = WiFi.scanNetworks();
    if (n == 0) {
      Serial.println(message["wifi002"]);
      return;
    }
    Serial.print(n);
    Serial.println(message["wifi003"]);
    for (int i = 0; i < n; ++i) {
      Serial.print(i + 1);
      Serial.print(": ");
      Serial.println(WiFi.SSID(i));
    }

    // Choose SSID by number
    Serial.print(message["wifi004"]);
    while (!Serial.available());
    int c = Serial.read() - 48; // this doesn't work with numbers bigger that 9!
    Serial.println(c);
    wifiSSID = WiFi.SSID(c-1);
    Serial.print('\n');
    Serial.println(wifiSSID);
    Serial.print('\n');
    if (wifiPass.length() == 0) {
      // Ask for password
      Serial.print(message["wifi005"]);
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
  Serial.println(message["wifi006"]);
  WiFi.begin(&wifiSSID[0], &wifiPass[0]);
  while (WiFi.status() != WL_CONNECTED) {
    delay(1000);
    Serial.println(message["wifi006"]);
  }
  Serial.println(message["wifi008"]);
  Serial.print(message["wifi009"]);
  Serial.println(WiFi.localIP());
}

void graphqlSetup() {
  // Check Host
  if (graphqlServer.length() == 0) {
    Serial.print(message["gql001"]);
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
    Serial.print(message["gql002"]);
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
    Serial.print(message["gql003"]);
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
  Serial.println(message["gql004"]);
  http.begin(graphqlServer);
  http.addHeader("Content-Type", "application/json");
  String query = "{\"query\":\"mutation {\\n  login(\\n    emailOrUsername: \\\"" + graphqlUser + "\\\",\\n    password: \\\"" + graphqlPass + "\\\"\\n  ) {\\n    token,\\n    currentUser { id }\\n  }\\n}\",\"variables\":{}}";
  httpResponseCode = http.POST(query);
  if (httpResponseCode > 0) {
    if (httpResponseCode = 200) {
      Serial.println(message["gql005"]);
      String response = http.getString();
      JSONVar responseObject = JSON.parse(response);
      graphqlToken = responseObject["data"]["login"]["token"];
      graphqlId = responseObject["data"]["login"]["currentUser"]["id"];
    } else {
      Serial.println("HTTP Error: " + httpResponseCode);
      Serial.println(http.getString());
      // error handling?
    }
  } else {
    Serial.println(message["gql006"]);
  }
  http.end();
}

String getTime(){
  struct tm timeinfo;
  if(!getLocalTime(&timeinfo)){
    Serial.println("Failed to obtain time");
    return "FAIL";
  }
  char tmp[25];
  strftime(tmp, 25, "%Y-%m-%dT%T.001Z", &timeinfo);
  return tmp;
}

String getShortenedTime(){
  struct tm timeinfo;
  if(!getLocalTime(&timeinfo)){
    Serial.println("Failed to obtain time");
    return "FAIL";
  }
  char tmp[14];
  strftime(tmp, 14, "%d/%m - %R", &timeinfo);
  return tmp;
}

String getEloquentQuality(int q) {
  switch (q) {
    case Qualities::PACKAGING:
      return message["qlt002"];
      break;
    case Qualities::RUINED:
      return message["qlt003"];
      break;
    case Qualities::SPOILED:
      return message["qlt004"];
      break;
    default:
      return "";
      break;
  }
}

String sendDonation(int quantity, int q) {
  String id = "";
  http.begin(graphqlServer);
  http.addHeader("Authorization", "Bearer " + graphqlToken);
  http.addHeader("Content-Type", "application/json");
  String query = "{\"query\":\"mutation {\\n createOffer(intent: {\\n      action: \\\"transfer\\\",\\n      name: \\\"Donazione\\\",\\n      receiver:\\\"01FVAF3EZCV3AQCN9NH3SFPB3X\\\",\\n      hasPointInTime: \\\"" + getTime() + "\\\",\\n      availableQuantity: {hasUnit: \\\"01FVAFF05F0CEC526J8ZK0YBDC\\\", hasNumericalValue: " + String(quantity) + "},\\n      note: \\\"" + getEloquentQuality(q) + "\\\"\\n}){\\n  intent{\\n    id\\n  }\\n}\\n}\",\"variables\":{}}";  
  httpResponseCode = http.POST(query);
  if (httpResponseCode > 0) {
    String response = http.getString();
    JSONVar responseObject = JSON.parse(response);
    id = JSONVar::stringify(responseObject["data"]["createOffer"]["intent"]["id"]);
    id = id.substring(1, id.length()-1);
  } else {
    Serial.println(message["deb003"]);
    id = message["sen002"];
  }
  http.end();
  return id;
}

void setDisplayBuffer(String& firstRow, String& secondRow, String& thirdRow, String& fourthRow) {
  displayBuffer[0] = &firstRow;
  displayBuffer[1] = &secondRow;
  displayBuffer[2] = &thirdRow;
  displayBuffer[3] = &fourthRow;
}

void setDelta(int d) {
  delta = d;
}

bool deltaOver() {
  return (millis() - timer > delta);
}

void checkSatisfactions() {
  // Check status of every donation sent
  for (short i = 0; i < donationsCounter; i++) {
    bool skipFlag = false;
    // check on accepted
    short k = 0;
    while (k < acceptedCounter && !skipFlag) {
      if (donations[i] == *acceptedDonations[k]) { skipFlag = true; }
      k++;
    }
    // check on resufed
    k = 0;
    while (k < refusedCounter && !skipFlag) {
      if (donations[i] == *refusedDonations[k]) { skipFlag = true; }
      k++;
    }

    if (!skipFlag) {
      String query = "{\"query\":\"query{\\n  intent(id:\\\"" + donations[i] + "\\\"){\\n    satisfiedBy{\\n      resourceQuantity{\\n        hasNumericalValue\\n      }\\n    }\\n  }\\n}\",\"variables\":{}}";
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
            acceptedDonations[acceptedCounter] = &donations[i];
            acceptedCounter++;
            commitmentFlag = true;
          } else {
            refusedDonations[refusedCounter] = &donations[i];
            refusedCounter++;
            refusedFlag = true;
          }
          satisfactionFlag = i;          
        }
      }
      http.end();
    }
  }
}

void getDonationInfo(){
  String query = "{\"query\":\"query{\\n    intent(id: \\\"" + donations[listedDonation] + "\\\"){     \\n        hasPointInTime,\\n        availableQuantity {\\n            hasNumericalValue\\n        },\\n        satisfiedBy {\\n            resourceQuantity { \\n                hasNumericalValue\\n            }\\n        }\\n    }\\n}\",\"variables\":{}}";
  http.begin(graphqlServer);
  http.addHeader("Authorization", "Bearer " + graphqlToken);
  http.addHeader("Content-Type", "application/json");
  httpResponseCode = http.POST(query);
  if (httpResponseCode > 0) {
    String response = http.getString();
    JSONVar responseObject = JSON.parse(response);    
    responseObject = responseObject["data"]["intent"];     
    listDate = responseObject["hasPointInTime"];    
    listQuantity = (double)responseObject["availableQuantity"]["hasNumericalValue"];
    responseObject = responseObject["satisfiedBy"];
    listStatus = "";
    if (responseObject.length() != 0) {
      double n = (int)(double)responseObject[0]["resourceQuantity"]["hasNumericalValue"];
      if (n == 0.0) {
        listStatus = "Rifiutato";
      } else {
        listStatus = "Accettato";
      }          
    }
  }
  http.end();
}

bool holdCheck(int holdDelta) {
  int tmpCounter = millis();
  bool holdFlag = true;
  while (holdFlag && millis() - tmpCounter < holdDelta) {
    holdFlag = !button.value();
  }
  return holdFlag;
}

void discardExpired() {
  for (short i = 0; i < refusedCounter; i++) {
    short k = 0;
    bool flag = false;    
    while (!flag && k < donationsCounter) {
      if (*refusedDonations[i] == donations[k]) {
        flag = true;
        for (short j = k; j < donationsCounter-1; j++) {
          donations[j] = donations[j+1];
        }
      }
      k++;
      if (flag) { donationsCounter--; }
    }
  }
  for (short i = 0; i < refusedCounter; i++) {
    refusedDonations[i] = nullptr;
  }
  refusedCounter = 0;

  for (short i = 0; i < acceptedCounter; i++) {
    short k = 0;
    bool flag = false;    
    while (!flag && k < donationsCounter) {
      if (*acceptedDonations[i] == donations[k]) {
        flag = true;
        for (short j = k; j < donationsCounter-1; j++) {
          donations[j] = donations[j+1];
        }
      }
      k++;
      if (flag) { donationsCounter--; }
    }
  }
  for (short i = 0; i < acceptedCounter; i++) {
    acceptedDonations[i] = nullptr;
  }
  acceptedCounter = 0;
}

void retrieveDonations() {
  String query = "{\"query\":\"query{\\n  intents\\n  (limit: 20, filter:{provider: \\\"" + graphqlId + "\\\"}){      \\n    id,    \\n    satisfiedBy{ \\n      resourceQuantity{\\n        hasNumericalValue\\n      }\\n    }\\n  }\\n}\",\"variables\":{}}";
  http.begin(graphqlServer);
  http.addHeader("Authorization", "Bearer " + graphqlToken);
  http.addHeader("Content-Type", "application/json");
  httpResponseCode = http.POST(query);
  if (httpResponseCode > 0) {
    String response = http.getString();
    JSONVar responseObject = JSON.parse(response);    
    responseObject = responseObject["data"]["intents"];
    for (short i = 0; i < responseObject.length(); i++) {
      if (responseObject[i]["satisfiedBy"].length() == 0) {
        donations[donationsCounter] = responseObject[i]["id"];
        donationsCounter++;
      }
    }
  }
  http.end();
}