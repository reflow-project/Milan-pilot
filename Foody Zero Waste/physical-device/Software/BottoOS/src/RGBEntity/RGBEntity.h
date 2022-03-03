/*
Class to handle analog RGB devices with ESP32 controllers
For the sake of simplicity frequency and resolution are shared among all the channels
*/

#ifndef RGB_ENTITY
#define RGB_ENTITY

#include "Arduino.h"

class RGBEntity {
  public:
    RGBEntity(short pinR, short pinG, short pinB, short channelR, short channelG, short channelB, short frequency, short resolution);    
    void setFrequency(short frequency);
    void setResolution(short resolution);
    void setColor(short r, short g, short b);
    void setColor(short* color);

  private:
    void setPins(short r, short g, short b);
    void setChannels(short r, short g, short b);    
    void attachEntity();
    void setupEntity();
    short _pin[3];
    short _channel[3];
    short _resolution;
    short _frequency;
};

#endif