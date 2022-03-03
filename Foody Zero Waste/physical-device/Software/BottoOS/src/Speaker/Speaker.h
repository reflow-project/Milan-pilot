/*
Class to handle PWM operations on a speaker
*/

#ifndef SPEAKER
#define SPEAKER

#include "Arduino.h"

class Speaker {
  public:
    Speaker(short pin, short channel, short frequency, short resolution);
    void setFrequency(short frequency);
    void setResolution(short resolution);
    void beep(short pulse);
    void tone(short pulse);
    void tone(short pulse, short time);
    void tone(short pulse, short time, short frequency);
    void playTune(short tune[][3], short notes); // this is sooooo error prone - by AG
  private:
    void setup();
    short _pin;
    short _channel;
    short _frequency;
    short _resolution;
};

#endif