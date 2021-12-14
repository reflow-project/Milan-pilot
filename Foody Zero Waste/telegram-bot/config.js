var config = {};

config.bot = {};
config.reflow = {};

config.bot.polling_time = 10000; // 10 sec - how often check for new donations
config.bot.donation_timeout = 1800000; // 30 min - how much time before automatically refuse a donation
config.bot.reminder_timeout =  300000; // 5 min - how much time before sending a reminder of not accepted donation

config.reflow.api_url = 'http://2.235.105.83:4000/api/explore';

module.exports = config;