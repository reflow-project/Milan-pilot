#define SERIAL_LOG

#define BUTTON 13
bool buttonFlag;

void setup() {
  Serial.begin(115200);
  pinMode(BUTTON, INPUT_PULLUP);
  buttonFlag = false;
  messageLog("Sketch ready");
}

void loop() {
  if (!digitalRead(BUTTON)) {
    if (!buttonFlag) {
      buttonFlag = true;
      messageLog("Button pressed");
    }
  } else {
    if (buttonFlag) {
      buttonFlag = false;
      messageLog("Button released");
    }
  }
  delay(50); // debouncing delay
}

void messageLog(char* message) {
  #ifdef SERIAL_LOG
  Serial.println(message);
  #endif
}