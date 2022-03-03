#include "Encoder.h"

Encoder::Encoder(short pinA, short pinB)
: _pinA(pinA), _pinB(pinB) {
  pinMode(_pinA, INPUT_PULLUP);
  pinMode(_pinB, INPUT_PULLUP);
  
	_lastAState = digitalRead(_pinA);
  _state = EncoderState::STILL;
  _halfstepFlag = false;
  _halfstepCounter = 0;
}

bool Encoder::operated() {
  if (_state != EncoderState::STILL) {
    if (_halfstepFlag) {
      _halfstepFlag = false;
      _incrementFlag = _state == EncoderState::CW ? true : false;
      _state = EncoderState::STILL;
      return true;
    } else {
      // trick to reduce readings
      _halfstepCounter++;
      if (_halfstepCounter >= _halfstep) {
        _halfstepFlag = true;
        _halfstepCounter = 0;
        }
      return false;
    }    
  } else {
    return false;
  }
}

bool Encoder::direction() {
  return _incrementFlag;
}

short Encoder::interruptPin() {
  return _pinA;
}

void Encoder::encoderStep(void) {
  _currentAState = digitalRead(_pinA);
  if (_currentAState != _lastAState) {
    if (digitalRead(_pinB) != _currentAState) {
      _state = EncoderState::CW;
    } else {
      _state = EncoderState::CCW;
    }
  }
  _lastAState = _currentAState;
}
