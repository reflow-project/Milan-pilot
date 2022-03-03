/*
Class to handle optical encoders
Requires defintion of the following function in the main file
  void IRAM_ATTR isr() { encoder.encoderStep(); };
And the attachment to interrupt during setup, such as:
  attachInterrupt(digitalPinToInterrupt(encoder.interruptPin()), isr, CHANGE);
*/

#ifndef ENCODER
#define ENCODER

#include "Arduino.h"

enum EncoderState { STILL, CW, CCW };

class Encoder {
  public:    
    Encoder(short pinA, short pinB);
    bool operated();
    bool direction();
    void encoderStep();
    short interruptPin();
  private:
    short _pinA;
    short _pinB;
    bool _lastAState;
    bool _currentAState;
    EncoderState _state;
    // trick to reduce readings
    bool _incrementFlag;
    bool _halfstepFlag;
    unsigned int _halfstepCounter;
    const unsigned int _halfstep = 5;
};

#endif