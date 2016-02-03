'use strict';

var dotenv = require('dotenv');
dotenv.load();

var HackBot = require('../lib/hackbot');

var token = process.env.HACKBOT_SLACK_API_TOKEN;
var dbPath = process.env.BOT_DB_PATH;
var name = process.env.BOT_NAME;

var hackbot = new HackBot({
  token: token,
  dbPath: dbPath,
  name: name
})

hackbot.run();

