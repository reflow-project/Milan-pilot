// Encoder
#define ENCODER_A 1
#define ENCODER_B 2
#define ENCODER_C 3
int lastAState, currentAState;
enum EncoderState { STILL, CW, CCW };
EncoderState encoderState;
bool incrementFlag;

void IRAM_ATTR encoderStep();

int c;

void setup() {
  Serial.begin(115200);
  // Encoder setup
  pinMode(ENCODER_A, INPUT_PULLUP);
  pinMode(ENCODER_B, INPUT_PULLUP);
  pinMode(ENCODER_C, INPUT_PULLDOWN);
  attachInterrupt(digitalPinToInterrupt(ENCODER_A), encoderStep, CHANGE);
	lastAState = digitalRead(ENCODER_A); 
  encoderState = EncoderState::STILL;

  c = 0;
}

void loop() {
  if (encoderOperated()) {
    if (incrementFlag) c++;
    else c--;
    Serial.println(c);
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

bool encoderOperated() {
  if (encoderState != EncoderState::STILL) {
    incrementFlag = encoderState == EncoderState::CW ? true : false;
    encoderState = EncoderState::STILL;
  } else {
    return false;
  }
  return true;
}