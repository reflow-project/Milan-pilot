/*
A basic utility to print through serial some firmware information
Relies on a info.h file located at the same level of the main sketch
Can be used by calling printInfo(info) right after Serial.begin()
*/

#define INFO

#include <map>
#include "Arduino.h"

enum InfoFields {name, version, author, license, website};
typedef std::map<InfoFields, String> Info;
void printInfo(Info i) {
  Serial.println(i[InfoFields::name]);
  Serial.print("Version: ");
  Serial.println(i[InfoFields::version]);
  Serial.print("Author: ");
  Serial.println(i[InfoFields::author]);
  Serial.print("License: ");
  Serial.println(i[InfoFields::license]);
  Serial.print("Info at: ");
  Serial.println(i[InfoFields::website]);
}