#include <LiquidCrystal.h>

LiquidCrystal lcd(0, 1, 2, 3, 4, 5);  
#define LCD_R 6
#define LCD_G 7
#define LCD_B 8

void setup() {  
  Serial.begin(115200);
  Serial.println("Start");    
  lcd.begin(20, 4);
  lcd.print("Ciao, Mondo!");
  Serial.println("Printed");  
  pinMode(LCD_R, OUTPUT);
  pinMode(LCD_G, OUTPUT);
  pinMode(LCD_B, OUTPUT);
  digitalWrite(LCD_R, LOW);  
  digitalWrite(LCD_G, LOW);  
  digitalWrite(LCD_B, LOW);
  delay(500);
  digitalWrite(LCD_R, HIGH);  
  digitalWrite(LCD_G, LOW);  
  digitalWrite(LCD_B, LOW);  
  delay(500);
  digitalWrite(LCD_R, LOW);  
  digitalWrite(LCD_G, HIGH);  
  digitalWrite(LCD_B, LOW);    
  delay(500);
  digitalWrite(LCD_R, LOW);  
  digitalWrite(LCD_G, LOW);  
  digitalWrite(LCD_B, HIGH);  
  delay(500);
  digitalWrite(LCD_R, LOW);  
  digitalWrite(LCD_G, LOW);  
  digitalWrite(LCD_B, LOW);
  lcd.clear();
}

void loop() {      
  lcd.print("Mi piace un Botto! ");  
  Serial.println(millis()/1000);
  delay(1000);
}