var config = {};

config.bot = {};
config.reflow = {};

config.bot.token = '1872583825:AAFBEZhYVPvR0gtE7_HKLa6unXM3sysPQfg';
config.bot.polling_time = 10000; // 10 sec - how often check for new donations
config.bot.donation_timeout = 1800000; // 30 min - how much time before automatically refuse a donation

config.reflow.api_url = 'http://dotflow:4000/api/explore';

module.exports = config;