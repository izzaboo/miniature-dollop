/*
 * These are baker-related tasks
 * that will be used to create
 * and store orders from users
 *
 */

 // Dependencies

var path = require('path');
var fs = require('fs');
var _data = require('./data');
var https = require('https');
var http = require('http');
var helpers = require('./helpers');
var url = require('url');
var _logs = require('./logs');
var util = require('util');
var debug = util.debuglog('bakers');


// Instantiate the bakers object
var bakers = {};



// Rotate (aka compress) the log files
bakers.rotateLogs = function(){
// List all the (non compressed) log files
  _logs.list(false,function(err,logs){
    if(!err && logs && logs.length > 0){
      logs.forEach(function(logName){
        // compress the data to a different file
        var logId = logName.replace('.log','');
        var newFileId = logId+'-'+Date.now();
        _logs.compress(logId,newFileId,function(err){
          if(!err){
            // Truncate the log
            _logs.truncate(logId,function(){
              if(!err){
                debug("Success truncating log file");
              } else {
                debug("Error truncating log file.");
              }
            })
          } else {
            debug("Error compressing one of the log files", err);
          }
        })
      });
    } else {
      debug("Error: could not find any logs to rotate");
    }
  });
}

// Timer to execute the log rotation once per day
bakers.logRotationLoop = function(){
  setInterval(function(){
    bakers.rotateLogs();
  },1000 * 60 * 60 * 24);

}
// Init script
bakers.init = function(){

  // Send to console, in yellow
  console.log('\x1b[33m%s\x1b[0m','Background bakers are running');


  // Compress all the logs immediately
  bakers.rotateLogs();


  // Call the compression loop so logs will be compressed later on
  bakers.logRotationLoop();


};

// Export the module
module.exports = bakers;
