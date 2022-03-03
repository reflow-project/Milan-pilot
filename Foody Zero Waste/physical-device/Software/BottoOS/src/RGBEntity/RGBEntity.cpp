#include "RGBEntity.h"

RGBEntity::RGBEntity(short pinR, short pinG, short pinB, short channelR, short channelG, short channelB, short frequency, short resolution):
_frequency(frequency), _resolution(resolution) {
  setPins(pinR, pinB, pinG);
  setChannels(channelR, channelG, channelB);
  attachEntity();
}

void RGBEntity::setPins(short r, short g, short b){
  _pin[0] = r;
  _pin[1] = g;
  _pin[2] = b;
  attachEntity();
}

void RGBEntity::setChannels(short r, short g, short b){
  _channel[0] = r;
  _channel[1] = g;
  _channel[2] = b;
  attachEntity();
}

void RGBEntity::setFrequency(short frequency){
  _frequency = frequency;
  setupEntity();
}

void RGBEntity::setResolution(short resolution){
  _resolution = resolution;
  setupEntity();
}

void RGBEntity::attachEntity(){
  pinMode(_pin[0], OUTPUT);
  pinMode(_pin[1], OUTPUT);
  pinMode(_pin[2], OUTPUT);  
  ledcAttachPin(_pin[0], _channel[0]);
  ledcAttachPin(_pin[1], _channel[1]);
  ledcAttachPin(_pin[2], _channel[2]);
  setupEntity();
  ledcWrite(_channel[0], 0);
  ledcWrite(_channel[1], 0);
  ledcWrite(_channel[2], 0);
}

void RGBEntity::setupEntity(){
  ledcSetup(_channel[0], _frequency, _resolution);
  ledcSetup(_channel[1], _frequency, _resolution);
  ledcSetup(_channel[2], _frequency, _resolution);
}

void RGBEntity::setColor(short r, short g, short b){
  ledcWrite(_channel[0], r);
  ledcWrite(_channel[1], g);
  ledcWrite(_channel[2], b);
}

void RGBEntity::setColor(short* color){
  setColor(color[0], color[1], color[2]);
}