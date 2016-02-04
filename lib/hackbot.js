'use strict';

var util = require('util');
var path = require('path');
var fs = require('fs');
var SQLite = require('sqlite3').verbose();
var Bot = require('slackbots');
var GPIO = require('onoff').Gpio;

var HackBot = function Constructor(settings) {
  this.settings = settings;
  this.settings.name = this.settings.name || 'hackbot';
  this.dbPath = settings.dbPath || path.resolve('/', 'home', 'pi', 'hackbot', 'data', 'hackbot.db');
  this.user = null;
  this.db = null;
  this.defaultChannelName = 'hackbot-development';
  this.lightSensor = new GPIO(17, 'in', 'both', {debounceTimeout: 50});
}

// inherits methods and properties from the Bot constructor
util.inherits(HackBot, Bot);

HackBot.prototype.run = function() {
  var self = this;
  HackBot.super_.call(this, this.settings);
  this.on('start', this._onStart);
  this.on('message', this._onMessage);
  this.lightSensor.watch(function(err, state) {
    if (state == 1) {
      self.postMessageToChannel(self.defaultChannelName, 'The hackspace has just been opened.', {as_user: true}); 
    } else {
      self.postMessageToChannel(self.defaultChannelName, 'The hackspace has just been closed.', {as_user: true}); 
    }  
  });
};

HackBot.prototype._onStart = function() {
  console.log('_onStart');
  this._loadBotUser();
  this._connectDb();
  this._firstRunCheck();
};

HackBot.prototype._loadBotUser = function() {
  var self = this;
  this.user = this.users.filter(function(user) {
    return user.name === self.name;
  })[0];
};

HackBot.prototype._connectDb = function() {
  if (!fs.existsSync(this.dbPath)) {
    console.error('Database path ' + '"' + this.dbPath + '" does not exists or is not readable.');
    process.exit(1);
  }
  this.db = new SQLite.Database(this.dbPath);
  this.db.serialize();
  // Create the database structure
  this.db.run('CREATE TABLE IF NOT EXISTS info (name TEXT PRIMARY KEY, val TEXT DEFAULT NULL)');
};


HackBot.prototype._firstRunCheck = function() {
  var self = this;
  console.log('_firstRunCheck')
  self.db.get('SELECT val FROM info WHERE name = "lastrun" LIMIT 1', function (err, record) {
    if (err) {
      return console.error('DATABASE ERROR:', err);
    }
    var currentTime = (new Date()).toJSON();
    // this is a first run
    if (!record) {
      self._welcomeMessage();
      return self.db.run('INSERT INTO info(name, val) VALUES("lastrun", ?)', currentTime);
    }

    // update with new last running time
    console.log('updating lastrun')
    self._runMessage();
    self.db.run('UPDATE info SET val = ? WHERE name = "lastrun"', currentTime);
  });
};

HackBot.prototype._welcomeMessage = function() {
  console.log('posting welcome message to ' + this.defaultChannelName);
  this.postMessageToChannel(this.defaultChannelName, 'Hi guys.  I\'m now on-line announcing the status of the hackspace.  Just say `' + this.name + '` to invoke me!', {as_user: true});
};

HackBot.prototype._runMessage = function() {
  console.log('posting run message to ' + this.defaultChannelName);
  this.postMessageToChannel(this.defaultChannelName, 'I\'m on-line.', {as_user: true});
  console.log('posted');
};

HackBot.prototype._onMessage = function(message) {
  console.log('_onMessage');
};

module.exports = HackBot;

