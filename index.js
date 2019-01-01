/*
 * Primary file for pizza-delivery company API
 * (Homework Assignment #2 for Pirple NodeJS Masterclass)
 */

// Dependencies
 var server = require('./lib/server');
 var bakers = require('./lib/bakers');

 // Declare the app
 var app = {};


 // Init function
app.init = function(){
  // Start the server
  server.init();


  // Start the workers
  bakers.init();

};

// Execute

app.init();

// Export the app
module.exports = app;
