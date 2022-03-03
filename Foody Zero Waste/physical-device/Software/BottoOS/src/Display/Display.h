/*
Function to handle 20*4 LCD display and related offsetted line printing
*/

#ifndef LCDISPLAY
#define LCDISPLAY

#include "Arduino.h"
#include <LiquidCrystal.h>

class Display {
  public:
    Display(int rs, int enable, int d4, int d5, int d6, int d7);
    ~Display();
    void begin(int col, int row);
    void clear();    
    void setCursor(short x, short y);
    void write(char c);
    void print(String& message);
    void display();
    void noDisplay();
    int getX();
    int getY();
    
  private:
    void advancePosition();
    void advancePosition(short n);    
    LiquidCrystal* _lcd; // requires a pointer, since it's impossible to declare a constructor on class definition
    short _x;
    short _y;
};

#endif

