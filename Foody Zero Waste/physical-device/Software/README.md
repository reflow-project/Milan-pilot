# Useful tips
## Arduino IDE
In this section you can find how to update sketches with `Arduino IDE`.

### Install ESP32 boards
Before any operation, be sure that you can compile and sketch to ESP32-S2 boards, by installing the related repsitory. These are the steps to follow:
- Click on the **Arduino** menu and select **Settings**;
- In the section **Additional URLs** add the following URL https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_dev_index.json and click ok;
- Go the **Tools** menu and select **Board -> Boards Library...**;
- In the newly opened window, search for the **esp32** library by *espressif* and install it;

Now you can work with ESP32-S2 boards.

### Compile and upload
To compile and upload sketches, in the **Tools** menu select **Boards -> ESP32 Arduino -> ESP32S2 Dev Module** and them promot the right USB port. Now you can deploy your sketches.

## Arduino CLI
In this section you can find a list of commands to compile, flash and test Arduino sketches for ESP32-S2 directly from `terminal` with the help of `arduino-cli`.

### Install ESP-32 support for arduino-cli
You can use the [following reference](https://dev.to/stepanvrany/esp32-with-arduino-cli-36mh) to add support for the ESP32-S2 controller, but use the url https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_dev_index.json instead of the one suggested.

### Compile
To compile a sketch, enter in the the sketch folder and run:
```
arduino-cli compile --fqbn esp32:esp32:esp32s2 .
```

### Flash
To flash a sketch, first you have to find the port of the board with the following command:
```
arduino-cli board list
```
Find your board among the listed results, and the flash the sketch with by running this command:
```
arduino-cli upload -p SERIAL__PORT --fqbn esp32:esp32:esp32s2 .
```

### Monitor
After retrieving the active port and the baudrate set in the sketch for the serial communication, run the following command:
```
screen SERIAL__PORT BAUDRATE
```
To kill `screen` without leaving the program running in the background, press `control + A`, then `k` and confirm.

### Makefile
I created a `Makefile` template containing shorthands for all the commands above, just run `make` and one the three actions. For the sake of easiness, you can run `make deploy` and run all of the above at once.

Remember to copy the `Makefile`in the folder of the sketch and to change its inner parameters if anything changes (especially the board port).

## Settings
Certain tests and the final sketch use a `settings.h` file to pass various credentials and other environment information. I've set a template at this location that should be copied and customized wherever needed.

In case of missing file, certain info will be asked and should be prompted via serial communication.