/*
Class to handle negative and positive logic momentary switch with non-blocking downpress sensing
*/

#ifndef BUTTON
#define BUTTON

#include "Arduino.h"

class Button {
  public:
    Button();
    Button(short pin);
    Button(short pin, bool logic); // if logic not provided, negative logic assumed

    void setup();
    bool value();
    void check();
    bool operated();

  private:
    short _pin;
    bool _flag;
    bool _logic; // false for pull-up; true for pull-down
};

#endif