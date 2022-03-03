#include <Tone32.h>

#define BUZZER_PIN 17
#define BUZZER_CHANNEL 0
uint32_t resolution = 8;
uint32_t freq = 600;

void setup() { 
  Serial.begin(115200);  
  ledcSetup(BUZZER_CHANNEL, freq, resolution);
  ledcAttachPin(BUZZER_PIN, BUZZER_CHANNEL);
}
 
void loop() {      
  ledcSetup(BUZZER_CHANNEL, 600, resolution);
  ledcWrite(BUZZER_CHANNEL, 180);  
  delay(200);
  ledcSetup(BUZZER_CHANNEL, 840, resolution);
  ledcWrite(BUZZER_CHANNEL, 255);  
  delay(400);
  ledcWrite(BUZZER_CHANNEL, 0);  
  delay(500);
  ledcWrite(BUZZER_CHANNEL, 0);  
  delay(100);
  ledcWrite(BUZZER_CHANNEL, 255);  
  delay(100);
  ledcWrite(BUZZER_CHANNEL, 0);  
  delay(100);
  ledcWrite(BUZZER_CHANNEL, 185);  
  delay(200);
  ledcWrite(BUZZER_CHANNEL, 0);  
  delay(500);
  ledcSetup(BUZZER_CHANNEL, 840, resolution);
  ledcWrite(BUZZER_CHANNEL, 255);  
  delay(400);
  ledcWrite(BUZZER_CHANNEL, 0);  
  delay(500);
  ledcSetup(BUZZER_CHANNEL, 840, resolution);
  ledcWrite(BUZZER_CHANNEL, 255);  
  delay(400);
  ledcWrite(BUZZER_CHANNEL, 0);  
  delay(500);
  Serial.println("repeat");

  //tone(BUZZER_PIN, NOTE_C4, 500, BUZZER_CHANNEL);
  //noTone(BUZZER_PIN, BUZZER_CHANNEL);
  //tone(BUZZER_PIN, NOTE_D4, 500, BUZZER_CHANNEL);
  //noTone(BUZZER_PIN, BUZZER_CHANNEL);
  //tone(BUZZER_PIN, NOTE_E4, 500, BUZZER_CHANNEL);
  //noTone(BUZZER_PIN, BUZZER_CHANNEL);
  //tone(BUZZER_PIN, NOTE_F4, 500, BUZZER_CHANNEL);
  //noTone(BUZZER_PIN, BUZZER_CHANNEL);
  //tone(BUZZER_PIN, NOTE_G4, 500, BUZZER_CHANNEL);
  //noTone(BUZZER_PIN, BUZZER_CHANNEL);
  //tone(BUZZER_PIN, NOTE_A4, 500, BUZZER_CHANNEL);
  //noTone(BUZZER_PIN, BUZZER_CHANNEL);
  //tone(BUZZER_PIN, NOTE_B4, 500, BUZZER_CHANNEL);
  //noTone(BUZZER_PIN, BUZZER_CHANNEL);
}