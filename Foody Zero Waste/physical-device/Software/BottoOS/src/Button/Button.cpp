#include "Button.h"

Button::Button()
: _logic(false), _flag(false) {
}

Button::Button(short pin)
: _pin(pin), _logic(false), _flag(false) {  
  setup();
}

Button::Button(short pin, bool logic)
: _pin(pin), _logic(logic), _flag(false) {
  setup();
}

void Button::setup() {
  if (_logic) {
    pinMode(_pin, INPUT);
  } else {
    pinMode(_pin, INPUT_PULLUP);
  }
}

bool Button::value() {  
  return _logic ? !digitalRead(_pin) : digitalRead(_pin);
}

void Button::check() {
  if (value()) _flag = true;  
}

bool Button::operated() {
  check();
  if (_flag) {
    if (!value()) {
      _flag = false;
      return true;
    }
  }
  return false;
}