/*
 *
 * These are the request handlers
 *
 */

 // Dependencies
var _data = require('./data');
var helpers = require('./helpers');
var config = require('./config');
var util = require('util');
var debug = util.debuglog('handlers');

// Define all the handlers
var handlers = {};


// users

handlers.users = function(data,callback){
  var acceptableMethods = ['post','get','put','delete'];
  if(acceptableMethods.indexOf(data.method) > -1){
    handlers._users[data.method](data,callback);
  } else {
    callback(405);
  }
};

// Container for the users submethods
handlers._users = {};

// Users - post
// Required fields: firstName, lastName, email, password, tosAgreement
// Optional data: none

handlers._users.post = function(data, callback){
  // check that all required fields are filled out
  var firstName = typeof(data.payload.firstName) == 'string' && data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false;
  var lastName = typeof(data.payload.lastName) == 'string' && data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() : false;
  var email = typeof(data.payload.email) == 'string' && data.payload.email.indexOf('@') > 0 && data.payload.email.trim().indexOf('.') > 0 ? data.payload.email.trim() : false;
  var address = typeof(data.payload.address) == 'string' && data.payload.address.trim().length > 0 ? data.payload.address.trim() : false;
  var password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;
  var tosAgreement = typeof(data.payload.tosAgreement) == 'boolean' && data.payload.tosAgreement == true ? true : false;

  if(firstName && lastName && email && password && tosAgreement){
    // Make sure that the user doesn't already exist
    _data.read('users',email,function(err,data){
      if(err){
        // Hash the password
        var hashedPassword = helpers.hash(password);

        // Create the user object
        if(hashedPassword){
          var userObject = {
            'firstName' : firstName,
            'lastName' : lastName,
            'email' : email,
            'address' : address,
            'hashedPassword' : hashedPassword,
            'tosAgreement' : true
          };

          // Store the user
          _data.create('users',email.replace('@','-+-'),userObject,function(err){
            if(!err){
              callback(200);
            } else {
              console.log(err);
              callback(500,{'error':'Could not create the new user'});
            }
          });
        } else {
          callback(500,{'error' : 'Could not hash the password'});
        }
      } else {
        // User with email already exists
        callback(400,{'error':'User with that email number already exists.'});
      }

    });

  } else {
    callback(400,{'error':'Missing required fields'});
  }
};

// Users - get
// Required Data: email
// Optional data: none
handlers._users.get = function(data, callback){
  // Check that the email is valid
  var email = typeof(data.queryStringObject.email) == 'string' && data.queryStringObject.email.trim().indexOf('@') > 0 && data.queryStringObject.email.trim().indexOf('.') > 0 ? data.queryStringObject.email.trim() : false;
  if(email){
    // Get the token from the headers
    var token = typeof(data.headers.token) == 'string' ? data.headers.token : false;
    // Verify that the given token is valid for the email
    handlers._tokens.verifyToken(token,email,function(tokenIsValid){
      if(tokenIsValid){
        // Lookup the user
        _data.read('users', email.replace('@','-+-'), function(err,data){
          if(!err && data){
            // Remove the hashed password from the User object before return it to the requester.
            delete data.hashedPassword;
            callback(200,data);
          } else {
            callback(404);
          }
        });
      } else {
        callback(403,{'error':'Missing required token in header, or token is invalid'});
      }
    });
  } else {
    callback(400,{'error': 'Missing required field.'});
  }
};

// Users - put
// Required data : email
// Optional data : firstName, lastName, password (at least one must be specified)
handlers._users.put = function(data, callback){
  // check for the required fields
  var email = typeof(data.queryStringObject.email) == 'string' && data.queryStringObject.email.trim().indexOf('@') > 0 && data.queryStringObject.email.trim().indexOf('.') > 0 ? data.queryStringObject.email.trim() : false;

  // Check for the optional fields
  var firstName = typeof(data.payload.firstName) == 'string' && data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false;
  var lastName = typeof(data.payload.lastName) == 'string' && data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() : false;
  var address = typeof(data.payload.address) == 'string' && data.payload.address.trim().length > 0 ? data.payload.address.trim() : false;
  var password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;

  // Error if the email is invalid in all Cases
  if(email){
    // Error if nothing is sent to Update
    if(firstName || lastName || password || address){

      // Get the token from the headers
      var token = typeof(data.headers.token) == 'string' ? data.headers.token : false;

      // Verify that the given token is valid for the email
      handlers._tokens.verifyToken(token,email,function(tokenIsValid){
        if(tokenIsValid){
          // Lookup the user
          _data.read('users',email.replace('@','-+-'),function(err,userData){
            if(!err && data){
              // Update the fields necessary
              if(firstName){
                userData.firstName = firstName;
              };
              if(lastName){
                userData.lastName = lastName;
              };
              if(address){
                userData.address = address;
              }
              if(password){
                userData.hashedPassword = helpers.hash(password);
              };
              // Store the new updates
              _data.update('users',email.replace('@','-+-'),userData,function(err){
                if(!err){
                  callback(200);
                } else {
                  console.log(err);
                  callback(500,{'error' : 'Couldnot update the user'});
                };
              });
            } else {
              callback(403,{'error':'Missing required token in header, or token is invalid'});
            }
          });
        } else {
          callback(400,{'error':'The specified user does not exist'});
        }
      });
    } else {
      callback(400,{'error':'Missing fields to update'});
    }
  } else {
    callback(400,{'error':'Missing the required field'});
  }
};

// Users - delete
// Required field: email
handlers._users.delete = function(data, callback){
  // Check that the email is valid.
  var email = typeof(data.queryStringObject.email) == 'string' && data.queryStringObject.email.trim().indexOf('@') > 0 && data.queryStringObject.email.trim().indexOf('.') > 0 ? data.queryStringObject.email.trim() : false;
  if(email){
  // Get the token from the headers
    var token = typeof(data.headers.token) == 'string' ? data.headers.token : false;

  // Verify that the given token is valid for the email
    handlers._tokens.verifyToken(token,email,function(tokenIsValid){
      if(tokenIsValid){
        // Lookup the user
        _data.read('users',email.replace('@','-+-'),function(err,userData){
          if(!err && userData){
            _data.delete('users',email.replace('@','-+-'),function(err){
              if(!err){
                // Delete each of the orders associated with the user
                debug('Deleted user. Now deleting associated orders.');
              } else {
                callback(500,{'error' : 'Could not delete the specified user'});
              }
            });
          } else {
            callback(400,{'error':'The specified user does not exist'});
          }
        });
      } else {
        callback(403,{'error':'Missing required token in header, or token is invalid'});
      }
    });
  } else {
    callback(400,{'error':'Missing the required field'});
  }
};

// tokens
handlers.tokens = function(data,callback){
  var acceptableMethods = ['post','get','put','delete'];
  if(acceptableMethods.indexOf(data.method) > -1){
    handlers._tokens[data.method](data,callback);
  } else {
    callback(405);
  }
};

// Container for all the tokens methods
handlers._tokens = {};


// Tokens - post
// Required data: email, password
// Optional data: none
handlers._tokens.post = function(data,callback){
  var email = typeof(data.payload.email) == 'string' && data.payload.email.trim().indexOf('@') > 0 && data.payload.email.trim().indexOf('.') > 0 ? data.payload.email.trim() : false;
  var password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;
  if (email && password){
    // Lookup the user who matches that email number
    _data.read('users',email.replace('@','-+-'), function(err,userData){
      if(!err && userData){
        // hash the sent password, and compare it to the password stored in the User Object
          var hashedPassword = helpers.hash(password);
          if(hashedPassword == userData.hashedPassword){
            // If valid create a new token with a random name. Set expiration date one hour in the future.
            var tokenId = helpers.createRandomString(20);
            var expires = Date.now() + 1000 * 60 * 60;
            var tokenObject = {
              'email' : email,
              'id' : tokenId,
              'expires' : expires
            };

            // Store the token
            _data.create('tokens',tokenId,tokenObject,function(err){
              if(!err){
                callback(200,tokenObject);
              } else {
                callback(500,{'error':'Could not create the new token.'});
              }
            });
          } else {
            callback(400,{'error':'Password did not match the specified user\'s stored password.'})
          }
      } else {
        callback(400,{'error':'Could not find the specified user.'})
      }
    });
  } else {
    callback(400,{'error':'Missing required fields'});
  }
};

// Tokens - get
// Required data : id
// Optional data: none
handlers._tokens.get = function(data,callback){
  // Check that the id sent is valid
  var id = typeof(data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length == 20 ? data.queryStringObject.id.trim() : false;
  if(id){
    // Lookup the token
    _data.read('tokens', id, function(err,tokenData){
      if(!err && tokenData){
        callback(200,tokenData);
      } else {
        callback(404);
      }
    });
  } else {
    callback(400,{'error': 'Missing required field.'});
  }
};

// Tokens - put
// Required data : id, extend
// Optional data: none
handlers._tokens.put = function(data,callback){
  var id = typeof(data.payload.id) == 'string' && data.payload.id.trim().length == 20 ? data.payload.id.trim() : false;
  var extend = typeof(data.payload.extend) == 'boolean' && data.payload.extend == true ? true : false;
  if(id && extend){
    // Lookup the token
    _data.read('tokens',id,function(err,tokenData){
      if(!err && tokenData){
        // Check to make sure the token isn't already expired
        if(tokenData.expires > Date.now()){
          // Set the expiration an hour from now
          tokenData.expires = Date.now() + 1000 * 60 * 60;

          // Store the new updates
          _data.update('tokens',id,tokenData,function(err){
            if(!err){
              callback(200);
            } else {
              callback(500,{'error':'Could not update the token\'s expiration'});
            }
          });
        } else {
          callback(400,{'error':'The token has alrady expired and cannot be extended.'})
        }
      } else {
        callback(400,{'error':'Specified token does not exist'});
      }
    });
  } else {
    callback(400,{'error':'Missing required field(s) or fields(s) are invalid.'});
  }
};

// Tokens - delete
// Required data : id
// Optional data : none
handlers._tokens.delete = function(data,callback){
  // Check that the id is valid.
  var id = typeof(data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length == 20 ? data.queryStringObject.id.trim() : false;
  if(id){
    // Lookup the user
    _data.read('tokens',id,function(err,userData){
      if(!err && data){
        _data.delete('tokens',id,function(err){
          if(!err){
            callback(200);
          } else {
            callback(500,{'error' : 'Could not delete the specified token'});
          }
        });
      } else {
        callback(400,{'error':'The specified token does not exist'});
      }
    });
  } else {
    callback(400,{'error':'Missing the required field'});
  }
};

// Menu
handlers._menu = {};

handlers.menu = function(data,callback){
  var acceptableMethods = ['get'];
  if(acceptableMethods.indexOf(data.method) > -1){
    handlers._menu[data.method](data,callback);
  } else {
    callback(405);
  }
};


// Menu - get
// Required Data: email,id
// Optional data: none
handlers._menu.get = function(data, callback){
  // Check that the email is valid
  var email = typeof(data.queryStringObject.email) == 'string' && data.queryStringObject.email.trim().indexOf('@') > 0 && data.queryStringObject.email.trim().indexOf('.') > 0 ? data.queryStringObject.email.trim() : false;
  if(email){
    // Get the token from the headers
    var token = typeof(data.headers.token) == 'string' ? data.headers.token : false;
    // Verify that the given token is valid for the email
    handlers._tokens.verifyToken(token,email,function(tokenIsValid){
      if(tokenIsValid){
        // Lookup the user
        _data.read('menu', 'menu',function(err,data){
          if(!err && data){
            callback(200,data);
          } else {
            callback(404);
          }
        });
      } else {
        callback(403,{'error':'Missing required token in header, or token is invalid'});
      }
    });
  } else {
    callback(400,{'error': 'Missing required field.'});
  }
};


// Container for all the orders methods
handlers._orders = {};

// orders
handlers.orders = function(data,callback){
  var acceptableMethods = ['post','get','put','delete'];
  if(acceptableMethods.indexOf(data.method) > -1){
    handlers._orders[data.method](data,callback);
  } else {
    callback(405);
  }
};

// orders - post
// Required headers: token
// Required data: order
// Optional data: none
handlers._orders.post = function(data,callback){
  // Get order from input
  var order = typeof(data.payload.order) == 'object' && data.payload.order instanceof Array && data.payload.order.length > 0 ? data.payload.order : false;

  if(order){
    // Get the token from the headers
    var token = typeof(data.headers.token) == 'string' && data.headers.token.length == 20 ? data.headers.token : false;

    // lookup the user by reading the token
    _data.read('tokens',token,function(err,tokenData){
      if(!err && tokenData){
        var usereMail = tokenData.email;

        // Lookup the user Data
        _data.read('users',usereMail.replace('@','-+-'),function(err,userData){
          if(!err && userData){
            var userOrders = typeof(userData.orders) == 'object' && userData.orders instanceof Array ? userData.orders : [];
            // Verify that the user has less than the number of max orders per user set in config
            if(userOrders.length < config.maxOrders){
              // Create a random id for the order
              var orderId = helpers.createRandomString(20);

              // Create the order object and include the user's email address and delivery address
              var orderObject = {
                'id' : orderId,
                'usereMail' : usereMail,
                'address' : userData.address,
                'order' : order
              };

              // Save the object
              _data.create('orders',orderId,orderObject,function(err){
                if(!err){
                  // Add the orderId to the user's object
                  userData.orders = userOrders;
                  userData.orders.push(orderId);

                  // Save the new user data
                  _data.update('users',usereMail.replace('@','-+-'),userData,function(err){
                    if(!err){
                      // Return the data about the new order
                      callback(200,orderObject);
                    } else {
                      callback(500,{'error':'Could not update the user with the new order object.'})
                    }
                  });
                } else {
                  callback(500,{'error':'Could not create the new order object.'})
                }
              });
            } else {
              callback(400,{'error' : 'The user has too many orders to allow another. ('+config.maxChecks+')'})
            }
          } else {
            callback(403);
          }
        });
      } else {
        callback(403);
      }
    });
  } else {
    callback(400, {'error': 'Missing required inputs or inputs are invalid'});
  }
};

// orders - get
// Required Headers: email, token
// Optional Data: orderid
handlers._orders.get = function(data, callback){
  // Check the email from header is valid
  var email = typeof(data.headers.email) == 'string' && data.headers.email.trim().indexOf('@') > 0 && data.headers.email.trim().indexOf('.') > 0 ? data.headers.email.trim() : false;
  if(email){
    // Get the token from header
    var token = typeof(data.headers.token) == 'string' ? data.headers.token : false;
    // Verify the token is valid for given email address
    handlers._tokens.verifyToken(token,email,function(tokenIsValid){
      if(tokenIsValid){
        // Validate orderId
        var orderid = typeof(data.queryStringObject.orderid) == 'string' && data.queryStringObject.orderid.length == 20 ? data.queryStringObject.orderid : false;
        if(orderid){
          // Look for order by orderid
          _data.read('orders',orderid,function(err,orderObject){
            // return the orderObject
              callback(200,orderObject);
          });
        } else {
          callback(403,{'Error': 'Order id sent is invalid or orderid not sent.'});
        }
      } else {
        callback(403,{'Error' : 'Missing token in header or token is invalid for email address'});
      }
    });
  } else {
    callback(400,{'Error' : 'Missing a required field.'})
  }

};
// Verify if a given token id is currently valid for a given user
handlers._tokens.verifyToken = function(id,email,callback){
  // Lookup the token
  _data.read('tokens',id,function(err,tokenData){
    if(!err && tokenData){
      // Check that the token is for the given user and has not expired.
      if (tokenData.email == email && tokenData.expires > Date.now()){
        callback(true);
      } else {
        callback(false);
      }
    } else {
      callback(false);
    }
  });
};


// Ping handler
handlers.ping = function(data,callback){
    callback(200);
};

// Not-Found handler
handlers.notFound = function(data,callback){
  callback(404);
};


// Export the module
module.exports = handlers;
