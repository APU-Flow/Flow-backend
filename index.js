'use strict';
// index.js
// Flow Backend server
const express = require('express');
const app = express();
const MongoClient = require('mongodb').MongoClient;
const assert = require('assert');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const bcrypt  = require('bcrypt');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

const config = require('./config');     // Get our config file
app.set('uberSecret', config.secret); // Set the secret value used for JWTs

// Configure a special Router for /api/ routes with middleware for JWT auth
const apiRoutes = express.Router();
app.use('/api', apiRoutes);
apiRoutes.use(function(req, res, next) {

  // Check header, url parameters, and post parameters for token
  let token = req.body.token || req.query.token || req.headers['x-access-token'];

  if (token) {
    // Verify the secret and check the expiry
    jwt.verify(token, app.get('uberSecret'), function(err, decoded) {
      if (err) {
        return res.json({
          success: false,
          message: 'Failed to authenticate token.'
        });
      } else {
        // If everything is good, save the decoded token to the request for use in other routes
        req.decoded = decoded;
        next();
      }
    });
  } else {
    // If there is no token, return an error
    return res.status(403).send({
      success: false,
      message: 'No token provided.'
    });
  }
}); // End JWT authentication middleware


//-----
// Main app routes (on '/')
//-----

app.post('/login', function(req, res) {
  res.setHeader('Content-Type', 'application/json');
  // Destructure login info from request body into individual variables
  let {email, password} = req.body;

  console.log('\n\n-------------------------');
  console.log(`The user ${email} attempted to log in`);
  console.log(new Date());

  try {
    MongoClient.connect(config.database, function(err, db) {
      assert.equal(null, err);
      db.collection('users').find({ email }).toArray(function(err, result) {
        // The user which matches should be the only item in the result toArray
        assert.ok(result.length === 1);
        let userObject = result[0];

        // If our user is authenticated successfully, generate a token and respond with it
        bcrypt.compare(password, userObject.password, function(err, compResult) {
          if (compResult === true) {
            let token = jwt.sign(userObject, app.get('uberSecret'), {
              expiresIn: '1d'
            });

            res.json({
              message: 'ok',
              firstName: userObject.firstName,
              email: userObject.email,
              token
            });
          } else {
            throw 'Password does not match.';
          }
        });
        console.log('Found in database:', result);
        db.close();
      });
    });
  } catch (e) {
    if (e.name === 'AssertionError') {
      throw e;
    } else {
      // If the authentication fails, respond with an appropriate message
      res.json({ message: 'lol nice tri n00b' });
    }
  }
}); // End route POST /login

app.post('/newUser', function(req, res) {
  // Destructure new user fields from request body into individual variables
  let {firstName, lastName, streetAddress, city, state, email, password} = req.body;
  MongoClient.connect(config.database, function(err, db) {
    assert.equal(null, err);
    db.collection('users').count({ email }, function(err, count) {
      if (count !== 0) {
        res.json({status: 'bad', message: 'This email adress is already registered to a user.'});
        db.close();
      } else {
        console.log('\n\n-------------------------');
        console.log('New user registered');
        console.log(firstName);
        console.log(lastName);
        console.log(city);
        console.log(state);
        console.log(email);
        console.log(new Date());

        bcrypt.genSalt(config.saltRounds, function(err, salt) {
          bcrypt.hash(password, salt, function(err, hash) {
            assert.equal(null, err);
            db.collection('users').insertOne({
              firstName,
              lastName,
              streetAddress,
              city,
              state,
              email,
              password: hash
            }, function(err, result) {
              assert.equal(err, null);
              console.log('Inserted user into db');
              db.close();
            }); // End insertOne for the new user
          }); // End password hash
        }); // End saltGen
        res.json({ status: 'ok', userEmail: email });
      }
    }); // End user count
  }); // End MongoClient connection
}); // End route


//-----
// Protected API Routes (on '/api/')
//-----

app.post('/usageEvent', function(req, res) { // Temporarily on /, not /api, because token auth on the meter isn't working yet
  // Destructure new usage event fields from request body into individual variables
  let {meterId, startTime, duration, totalVolume, email} = req.body;

  console.log('\n\n-------------------------');
  console.log('New Usage Event logged!');
  console.log(startTime);
  console.log(duration);
  console.log(totalVolume);
  console.log(meterId);
  console.log(email);
  let trueStartTime = new Date(new Date().valueOf() - (120000 + Number(duration)));

  res.send('New usage event logged');
  MongoClient.connect(config.database, function(err, db) {
    assert.equal(null, err);
    db.collection('events').insertOne({
      meterId,
      startTime: trueStartTime,
      totalVolume,
      duration,
      email
    }, function(err, result) {
      assert.equal(err, null);
      console.log('Inserted usage event into db');
      db.close();
    });
  });
});

apiRoutes.post('/addMeter', function(req, res) {
  console.log(req);
  res.send('You sent a usageEvent to Express');
  let {meterName, userEmail} = req.body;

  MongoClient.connect(config.database, function(err, db) {
    assert.equal(null, err);
    db.collection('meters').find({email: userEmail}).toArray(function(err, result) {
      let meterId = result.length + 1;

      db.collection('meters').insertOne({
        meterId,
        meterName,
        userEmail
      }, function(err, result) {
        assert.equal(err, null);
        console.log('\n\n-------------------------');
        console.log('New Meter Added!');
        console.log(meterId);
        console.log(meterName);
        console.log(userEmail);
        console.log(new Date());
        res.send('New Meter Added');
        db.close();
      }); // End insertOne() for the meter

    }); // End find() for the user's meters
  }); // End MongoClient connection
}); // End route POST /addMeter


apiRoutes.get('/getUsageEvent', function(req, res) {
  let {email, meterId, startTime, endTime} = req.query;
  res.send( getUsageEvents(email, meterId, startTime, endTime) );
}); // End route GET /getUsageEvent

apiRoutes.get('/getDailyUsage', function(req, res) {
  let {email, meterId, date} = req.query;

  // Set search start time to 00:00:00 on the day provided in the query
  let startTime = new Date(date);
  startTime.setHours(0,0,0,0);

  // Set search end time to one calendar day after the search start time
  let endTime = new Date(startTime);
  endTime.setDate(endTime.getDate() + 1);

  // Use helper method getUsageEvents to query the database for usage events (returns a Promise)
  getUsageEvents(email, meterId/* TEMP , startTime, endTime*/).then((events) => {
    // This function is called if the Promise is resolved.
    // If the query is successful, it resolves with an array
    if (Array.isArray(events)) {
      // Create an array that will contain the hourly metrics (aggregate from usage events)
      // TEMP: 0 is 12am, 12 is 12pm
      let hourlyData = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];

      // Iterate through the events found in the database
      for (let i = 0; i < events.length; i++) {
        // Destructure the current object into named variables that are easier to use
        let {startTime: eventTime, duration, totalVolume} = events[i];
        console.log(`events[${i}]: ${eventTime}, ${duration}, ${totalVolume}`);
        // Calculate the hour at which the current event begins
        eventTime = new Date(eventTime);
        let eventHour = eventTime.getHours();

        // Handle events which span multiple hour-slots
        do {
          // Calculate milliseconds from the event start time to the next hour-slot
          let millisToNextHour = (60 - eventTime.getMinutes()) * 60000;
          // If our duration extends into the next hour slot...
          if (duration > millisToNextHour) {
            // ...then add the percentage of totalVolume which occurred during this hour-slot...
            hourlyData[eventHour] += totalVolume * millisToNextHour / duration;
            // ...decrement the event's remaining duration by this hour-slot's time...
            duration -= millisToNextHour;
            // ...and then advance the counter to the next hour-slot...
            eventHour++;
          } else {
            // ...Otherwise, if our duration is completely contained in this hour-slot, then
            // we can simply add the total volume to this hour and stop looping.
            hourlyData[eventHour] += totalVolume;
            break;
          }
        } while (eventHour < hourlyData.length); // If we reach the bound of our array, stop the loop
      }
      // If we reach this point, then we have the aggregated usage data in the hourlyData array.
      // So, send the data array back to the user.
      res.json({ status: 'ok', data: hourlyData });
    } else {
      // If the database Promise resolves empty, getUsageEvents returns an error message
      // object that we just send on back to the user
      res.status(204).json(events);
    }
  }, (err) => {
    // This function is called if the Promise is rejected. Alert the user.
    res.status(500).send(err);
  });
}); // End route GET /getDailyUsage

apiRoutes.get('/getWeeklyUsage', function(req, res) {
  let {email, meterId, date} = req.query;

  let endTime = new Date(date);
  endTime.setHours(0,0,0,0);

  let startTime = new Date(endTime.valueOf() - 604800000);

  res.send( getUsageEvents(email, meterId, startTime, endTime) );
}); // End route GET /getWeeklyUsage

apiRoutes.get('/getMonthlyUsage', function(req, res) {
  let {email, meterId, year} = req.query;

  let endTime = new Date(year,0,0,0,0,0,0);
  let startTime = new Date(endTime);
  endTime.setFullYear(startTime.getFullYear() - 1);

  res.send( getUsageEvents(email, meterId, startTime, endTime) );
}); // End route GET /getMonthlyUsage


//-----
// Helper Methods
//-----

function getUsageEvents(email, meterId, startTime, endTime) {
  return new Promise((resolve, reject) => {
    let useTimes = (typeof startTime !== 'undefined' && typeof endTime !== 'undefined');
    if (useTimes) {
      startTime = new Date(startTime);
      endTime = new Date(endTime);
    }
    assert.notEqual(null, email);

    console.log('\n\n-------------------------');
    console.log(`Usage event for ${email} pulled`);

    MongoClient.connect(config.database, function(err, db) {
      assert.equal(null, err);
      // Construct a query that finds relevant usage events
      let query = (useTimes) ? { // If we're using time restrictions...
        email,
        $and: [ // ...then include all events with startTime between our start and end times...
          {startTime: {$gte: startTime}},
          {startTime: {$lt: endTime}}
        ]
      } : { email }; // ...otherwise exclude startTime and endTime from the query
      if (typeof meterId !== 'undefined' && meterId !== null) {
        query.meterId = parseInt(meterId);
      }

      let results = [];
      db.collection('events').find(query).forEach(function(event) {
        // Iterator callback - called once for each event found
        results.push(event);
      }, function(err) {
        // End callback - called once after iteration is complete
        if (err !== null) {
          reject(err); // Reject the promise, passing the error message
        }
        // Resolve the promise, returning the results
        if (results.length > 0) {
          resolve(results);
        } else {
          reject({status: 'bad', message: 'No data found for given parameters.'});
        }
      }); // End find() query
    }); //End MongoClient connection
  });
}


//-----
// Fire up the server!
//-----
app.listen(config.port);
console.log(`Flow-backend server running on port ${config.port}`);
