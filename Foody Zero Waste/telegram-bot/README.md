# Foody Zero Waste
## BOTTO the Bot

**BOTTO** is an automated communication solution integrated with a tracking and redistribution system based on the blockchain network [ReflowOS](https://github.com/dyne/reflow-os) that facilitates the reallocation of surplus food.

**BOTTO** is made of two main components:  
- A **physical device** designed for wholesalers, for quick and easy reporting of surpluses, that can be found [here](https://github.com/reflow-project/Milan-pilot/tree/main/Foody%20Zero%20Waste/physical-device).  
- A **Telegram bot**, written in NodeJS, running in dedicated channels to receive notifications of donations, manage the transfer of goods and keep track of all sorting operations.

![BOTTO flow](https://user-images.githubusercontent.com/642555/144258482-510b7210-b017-4a55-ad84-fece1b22cce8.png)

## Installation

The quickest way to start using the bot, is to download the code with

```bash
git clone https://github.com/reflow-project/Milan-pilot/
cd Foody\ Zero\ Waste/telegram-bot/
```

and install the dependencies with

```bash
npm install
```

## Configuration

The configuration step requires some operations both on the Telegram bot and ReflowOS backend sides.

### ReflowOS

**BOTTO** involves 3 different entities, all modeled in the ReflowOS backend. 
1. Create the **provider** and **receiver** agents in the backend and take note of the generated `id` (see [Register a new user](https://reflowos.dyne.org/docs/api_tour#register-a-new-user)).
2. Create the involved **units**, named *colli* and *kilograms*, and take note of the generated `id` (see [Create a unit](https://reflowos.dyne.org/docs/api_tour#create-a-unit)).
3. Create a new **category**, named *sorted*, to mark the sorted economic resources, and take note of the generated `id`.
4. Paste all the generated `id` into the `db.js` file in correspondence of the `reflow_id` field of each entity.
5. Rename the `secrets.js.template` file to `secrets.js`.
6. Edit the `secrets.js` file, providing the `secrets.reflow.username` and `secrets.reflow.password` of your main receiver ReflowOS account (namely RECUP).
7. Edit the `config.js` file, providing the `config.reflow.api_url` of your ReflowOS instance.

### Telegram

1. Register a new bot in Telegram following [these steps](https://core.telegram.org/bots#3-how-do-i-create-a-bot).
2. Take note of the generated `token` and paste it on the `secrets.js` file, in the `secrets.bot.token` field.  
*Keep your token secure and store it safely, it can be used by anyone to control your bot.*
3. Send to `@BotFather` the commands `/setjoingroups` and `/setprivacy` to enable **Allow groups** and disable **Privacy mode** settings of your bot.
4. Edit the `db.js` file and replace the `tg_id` of the `IN` and `OUT` groups with the related telegram group ids.

## Acknowledge
Foody Zero Waste is part of a project that has received funding from the European Union's Horizon 2020 research and innovation programme under grant agreement number 820937.