#include "Display.h"

Display::Display(int rs, int enable, int d4, int d5, int d6, int d7):
_x(0), _y(0) {
  _lcd = new LiquidCrystal(rs, enable, d4, d5, d6, d7);
}

Display::~Display() {
  delete _lcd;
}

void Display::begin(int col, int row) {
  _lcd->begin(col, row);
}

void Display::clear() {
  _lcd->clear();
  setCursor(0, 0);  
}

void Display::setCursor(short x, short y) {  
  _x = x;
  _y = y;  
  _lcd->setCursor(_x, _y);
}

// Trick to fix the cursor offsetting
void Display::advancePosition() {
  if (_x != 19) {
    _x++;
  } else {
    _y = _y == 3 ? 0 : _y + 1;
    _x = 0;
  }
  _lcd->setCursor(_x, _y);
}

void Display::advancePosition(short n) {
  for (short i = 0; i < n; i++) {
    advancePosition();
  }
}

void Display::write(char c) {  
  _lcd->write(c);
  advancePosition();  
}

void Display::print(String& message) {
  advancePosition(_lcd->print(message));  
}

void Display::display() {
  _lcd->display();
}

void Display::noDisplay() {
  _lcd->noDisplay();
}

int Display::getX() { return _x;}
int Display::getY() { return _y;}