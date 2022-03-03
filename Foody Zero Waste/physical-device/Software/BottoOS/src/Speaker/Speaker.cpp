#include "Speaker.h"

Speaker::Speaker(short pin, short channel, short frequency, short resolution)
: _pin(pin), _channel(channel), _frequency(frequency), _resolution(resolution) {
  setup();
  ledcAttachPin(_pin, _channel);
}

void Speaker::setup() {
  ledcSetup(_channel, _frequency, _resolution);
}

void Speaker::setFrequency(short frequency) {
  _frequency = frequency;
  setup();
}

void Speaker::setResolution(short resolution) {
  _resolution = resolution;
  setup();
}

void Speaker::beep(short pulse) {
  ledcWrite(_channel, pulse);
}

void Speaker::tone(short pulse) {
  tone(pulse, 10);
}

void Speaker::tone(short pulse, short time) {
  // does this make sense?
  for (short i = 0; i < time; i++) {
    beep(pulse);
    delay(1);
    beep(0);   
  }
}

void Speaker::tone(short pulse, short time, short frequency) {
  setFrequency(frequency);
  tone(pulse, time);
}

void Speaker::playTune(short tune[][3], short notes) {
  for (short i = 0; i < notes; i++) {    
    tone(tune[i][0], tune[i][1], tune[i][2]);
  }
}