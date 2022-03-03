#define LED_R 14
#define LED_G 15
#define LED_B 16

// PWM properties
const int freq = 5000;
const int RChannel = 0;
const int GChannel = 1;
const int BChannel = 2;
const int resolution = 8;

void setup() {
  Serial.begin(115200);
  ledcSetup(RChannel, freq, resolution);
  ledcSetup(GChannel, freq, resolution);
  ledcSetup(BChannel, freq, resolution);
  ledcAttachPin(LED_R, RChannel);
  ledcAttachPin(LED_G, GChannel);
  ledcAttachPin(LED_B, BChannel);  
}

void loop() {
  ledcWrite(RChannel, 0);
  ledcWrite(GChannel, 255);
  ledcWrite(BChannel, 255);  
  delay(1000);
  ledcWrite(RChannel, 255);
  ledcWrite(GChannel, 0);
  ledcWrite(BChannel, 255);  
  delay(1000);
  ledcWrite(RChannel, 255);
  ledcWrite(GChannel, 255);
  ledcWrite(BChannel, 0);   
  delay(1000);
}