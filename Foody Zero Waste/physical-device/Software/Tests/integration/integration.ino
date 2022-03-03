#include <LiquidCrystal.h>
#include <Tone32.h>

LiquidCrystal lcd(0, 1, 2, 3, 4, 5);
#define LCD_G 7
#define LCD_R 6
#define LCD_B 8

#define LED_R 14
#define LED_G 15
#define LED_B 16
#define LED_R_CHANNEL 1
#define LED_G_CHANNEL 2
#define LED_B_CHANNEL 3
uint32_t LEDresolution = 8;
uint32_t LEDfreq = 2000;
uint32_t counter = 0;

#define BUTTON 13
bool buttonFlag;

#define BUZZER_PIN 17
#define BUZZER_CHANNEL 0
uint32_t resolution = 8;
uint32_t freq = 600;

#define ENCODER_A 41
#define ENCODER_B 42
int lastAState, currentAState;
enum EncoderState { STILL, CW, CCW };
EncoderState encoderState;
bool incrementFlag;
void IRAM_ATTR encoderStep();

void setup() {
  Serial.begin(115200);
  Serial.println("BOTTO - Integration test");

  // Screen
  lcd.begin(20, 4);
  lcd.print("hello, world!");

  // Button
  pinMode(BUTTON, INPUT_PULLUP);
  buttonFlag = false;

  // Encoder
  pinMode(ENCODER_A, INPUT_PULLUP);
  pinMode(ENCODER_B, INPUT_PULLUP);
  attachInterrupt(digitalPinToInterrupt(ENCODER_A), encoderStep, CHANGE);
	lastAState = digitalRead(ENCODER_A);
  encoderState = EncoderState::STILL;

  // Buzzer
  ledcSetup(BUZZER_CHANNEL, freq, resolution);
  ledcAttachPin(BUZZER_PIN, BUZZER_CHANNEL);
  ledcWrite(BUZZER_CHANNEL, 180);
  delay(400);
  ledcWrite(BUZZER_CHANNEL, 0);
  delay(200);
  ledcWrite(BUZZER_CHANNEL, 255);
  delay(400);
  ledcWrite(BUZZER_CHANNEL, 0);

  // LED
  pinMode(LED_R, OUTPUT);
  pinMode(LED_G, OUTPUT);
  pinMode(LED_B, OUTPUT);
  ledcSetup(LED_R_CHANNEL, freq, resolution);
  ledcAttachPin(LED_R, LED_R_CHANNEL);
  ledcWrite(LED_G_CHANNEL, 0);
  ledcSetup(LED_G_CHANNEL, freq, resolution);
  ledcAttachPin(LED_G, LED_G_CHANNEL);
  ledcWrite(LED_G_CHANNEL, 0);
  ledcSetup(LED_B_CHANNEL, freq, resolution);
  ledcAttachPin(LED_B, LED_B_CHANNEL);
  ledcWrite(LED_B_CHANNEL, 0);

  // Screen routine
  pinMode(LCD_R, OUTPUT);
  pinMode(LCD_G, OUTPUT);
  pinMode(LCD_B, OUTPUT);
  digitalWrite(LCD_R, LOW);
  digitalWrite(LCD_G, LOW);
  digitalWrite(LCD_B, LOW);
  delay(500);
  digitalWrite(LCD_R, HIGH);
  digitalWrite(LCD_G, LOW);
  digitalWrite(LCD_B, LOW);
  delay(500);
  digitalWrite(LCD_R, LOW);
  digitalWrite(LCD_G, HIGH);
  digitalWrite(LCD_B, LOW);
  delay(500);
  digitalWrite(LCD_R, LOW);
  digitalWrite(LCD_G, LOW);
  digitalWrite(LCD_B, HIGH);
  delay(500);
  digitalWrite(LCD_R, LOW);
  digitalWrite(LCD_G, LOW);
  digitalWrite(LCD_B, LOW);
  // end screen routine

  lcd.clear();
  lcd.noDisplay();
  digitalWrite(LCD_R, HIGH);
  digitalWrite(LCD_G, HIGH);
  digitalWrite(LCD_B, HIGH);
}

void loop() {
  if (encoderOperated()) {    
    if (incrementFlag) {
      counter = counter < 255 ? counter + 10 : 255;
    } else {
      counter = counter > 0 ? counter - 10 : 0;
    }
    ledcWrite(LED_R_CHANNEL, counter);
    ledcWrite(LED_G_CHANNEL, counter);
    ledcWrite(LED_B_CHANNEL, counter);
  }

  if (!digitalRead(BUTTON)) {
    if (!buttonFlag) { // light up and prints on screen while button is pressed
      buttonFlag = true;
      digitalWrite(LCD_R, LOW);
      digitalWrite(LCD_G, LOW);
      digitalWrite(LCD_B, LOW);
      lcd.display();
      lcd.clear();
      lcd.print(millis()/1000);
      ledcWrite(BUZZER_CHANNEL, 180);
    }
  } else {
    if (buttonFlag) {
      buttonFlag = false;
      digitalWrite(LCD_R, HIGH);
      digitalWrite(LCD_G, HIGH);
      digitalWrite(LCD_B, HIGH);
      lcd.noDisplay();
      ledcWrite(BUZZER_CHANNEL, 0);
    }
  }
  delay(50); // debouncing delay
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

bool encoderOperated() {  
  if (encoderState != EncoderState::STILL) {    
    incrementFlag = encoderState == EncoderState::CW ? true : false;
    encoderState = EncoderState::STILL;
  } else {
    return false;
  }
  return true;
}