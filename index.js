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

const config = require('./config');    // Get our config file
app.set('uberSecret', config.secret);  // Set the secret value used for JWTs

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
  // Destructure login info from request body into individual variables
  let {email, password} = req.body;
  email = email.toLowerCase();

  console.log('\n____________________');
  console.log(`The user ${email} attempted to log in`);
  console.log(new Date().toLocaleString());

  MongoClient.connect(config.database, function(err, db) {
    assert.equal(null, err);
    db.collection('users').find({ email }).toArray(function(err, result) {
      // The user which matches should be the only item in the result toArray
      if (result.length !== 1) {
        db.close();
        if (result.length === 0) {
          res.status(401).json({message: `No users found with email ${email}!`});
        } else {
          res.status(500).json({message: `Expected 0 or 1 users with email ${email}, found ${result.length}!`});
        }

        return;
      }
      let userObject = result[0];
      db.close();

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
          res.status(401).json({message: 'Password does not match.'});
        }
      });
    });
  });
}); // End route POST /login

app.post('/newUser', function(req, res) {
  // Destructure new user fields from request body into individual variables
  let {firstName, lastName, streetAddress, city, state, email, password} = req.body;
  email = email.toLowerCase();
  MongoClient.connect(config.database, function(err, db) {
    assert.equal(null, err);
    db.collection('users').count({ email }, function(err, count) {
      if (count !== 0) {
        res.status(409).json({message: `This email adress: ${email} is already registered to a user.`});
        db.close();
      } else {
        console.log('\n____________________');
        console.log(`New user registered: ${email}`);
        console.log(firstName);
        console.log(lastName);
        console.log(city);
        console.log(state);
        console.log(email);
        console.log(new Date().toLocaleString());

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
              res.json({userEmail: email});
            }); // End insertOne for the new user
          }); // End password hash
        }); // End saltGen

      }
    }); // End user count
  }); // End MongoClient connection
}); // End route


//-----
// Protected API Routes (on '/api/')
//-----

app.post('/usageEvent', function(req, res) { // Temporarily on /, not /api, because token auth on the meter isn't working yet
  // Destructure new usage event fields from request body into individual variables
  let {meterId, duration, totalVolume, email} = req.body;
  duration = Number(duration);

  let trueStartTime = new Date(Date.now() - (20000 + duration));

  console.log('\n____________________');
  console.log(`New Usage Event logged for ${email}!`);
  console.log(duration);
  console.log(totalVolume);
  console.log(meterId);
  console.log(trueStartTime);

  storeUsageEvent(meterId, trueStartTime, totalVolume, duration, email)
    .then(() => res.json({message: 'New usage event logged'}))
    .catch(() => res.status(500).json({message: 'Error logging new event to database!'}));
});


apiRoutes.get('/getNextMeterId', function(req, res) {
  let {email} = req.decoded;
  MongoClient.connect(config.database, function(err, db) {
    assert.equal(null, err);
    db.collection('meters').count({email}, function(err2, count) {
      assert.equal(null, err2);
      res.json({nextId: count+1});
    });
  });
});

apiRoutes.get('/getMeterIdList', function(req, res) {
  let {email} = req.decoded;
  MongoClient.connect(config.database, function(err, db) {
    assert.equal(null, err);
    db.collection('meters').find({email}).project({meterId: true}).toArray(function(err2, results) {
      assert.equal(null, err2);
      if (results.length > 0) {
        res.json({meterIds: results});
      } else {
        res.status(204).send();
      }
    });
  });
});


apiRoutes.post('/addMeter', function(req, res) {
  let {meterId, meterName} = req.body;
  let {email} = req.decoded;

  MongoClient.connect(config.database, function(err, db) {
    assert.equal(null, err);
    db.collection('meters').count({email}, function(err2, count) {
      assert.equal(null, err2);
      if (meterId !== count+1) {
        res.status(409).json({message: 'Invalid Meter ID - request a new ID and try again.', nextId: count+1});
        db.close();
        return;
      }

      db.collection('meters').insertOne({
        meterId,
        meterName,
        email
      }, function(err3, result) {
        assert.equal(err3, null);

        console.log('\n____________________');
        console.log(`New Meter Added for user ${email}!`);
        console.log(meterId);
        console.log(meterName);
        console.log(new Date().toLocaleString());

        res.json({message: 'New meter added'});
        db.close();
      }); // End insertOne() for the meter
    }); // End count() for the user's meters
  }); // End MongoClient connection
}); // End route POST /addMeter


// POST /getDailyUsage - Expects the following QUERY parameters:
//     meterId - number representing the meter whose data to pull
//     date - the desired date to get the data for, represented in milliseconds since zero time
apiRoutes.get('/getDailyUsage', function(req, res) {
  let {meterId, date} = req.query;

  // Set search end time to the date provided in the query
  let endTime = parseInt(date);
  // If this date doesn't represent a clean hour, round up to the next hour
  if ( endTime % 3600000 != 0 ) endTime += 3600000 - (endTime % 3600000);
  endTime = new Date(endTime);

  // Set search start time to 12 hours before the date in the query (resetting mins:secs:millis to 0)
  let startTime = new Date( endTime );
  startTime.setHours( endTime.getHours()-12, 0, 0, 0 );

  // Use helper method getUsageEvents to query the database for usage events (returns a Promise)
  getUsageEvents(req.decoded.email, meterId, startTime, endTime).then((events) => {
    // This function is called if the Promise is resolved.
    // If the query is successful, it resolves with an array
    if (Array.isArray(events)) {
      // Create an array that will contain 12 hours worth of aggregate data
      let hourlyData = [0,0,0,0,0,0,0,0,0,0,0,0];

      // Fix start/end window calculation problem
      let startHours = startTime.getHours();
      if ( startHours > endTime.getHours() ) startHours -= 24;

      // Iterate through the events found in the database
      for (let i = 0; i < events.length; i++) {
        // Destructure the current object into named variables that are easier to use
        let {startTime: eventTime, duration, totalVolume} = events[i];
        // Calculate the hour at which the current event begins
        eventTime = new Date(eventTime);
        let currentHour = eventTime.getHours();

        // Offset currentHour by our search start time so that it represents an index in our array
        currentHour -= startHours;
        if ( currentHour < 0 ) currentHour += 12; // Fix the AM/PM problem by adding 12 to "negative" hours

        // Handle events which span multiple hour-slots
        do {
          // Calculate milliseconds from the event start time to the next hour-slot
          let millisToNextHour = (60 - eventTime.getMinutes()) * 60000;
          // If our duration extends into the next hour slot...
          if (duration > millisToNextHour) {
            // ...then add the percentage of totalVolume which occurred during this hour-slot...
            hourlyData[currentHour] += totalVolume * millisToNextHour / duration;
            // ...decrement the event's remaining duration by this hour-slot's time...
            duration -= millisToNextHour;
            // ...and then advance the counter to the next hour-slot...
            currentHour++;
          } else {
            // ...Otherwise, if our duration is completely contained in this hour-slot, then
            // we can simply add the total volume to this hour and stop looping.
            hourlyData[currentHour] += totalVolume;
            break;
          }
        } while (currentHour < hourlyData.length); // If we reach the bound of our array, stop the loop
      }
      // If we reach this point, then we have the aggregated usage data in the hourlyData array.
      // So, send the data array back to the user.
      res.json({data: hourlyData });
    } else {
      // If the database Promise resolves empty, getUsageEvents returns an error message
      // JSON object that we just send on back to the user
      res.status(204).send();
    }
  }, (err) => {
    // This function is called if the Promise is rejected. Alert the user.
    res.status(500).json({message: err});
  });
}); // End route GET /getDailyUsage

// POST /getWeeklyUsage - Expects the following QUERY parameters:
//     meterId - number representing the meter whose data to pull
//     date - the date representing the end of the week to get data for, in milliseconds since zero time
apiRoutes.get('/getWeeklyUsage', function(req, res) {
  let {meterId, date} = req.query;

  let endTime = new Date( parseInt(date) );
  // If the date we're given is exactly clean at a date mark, do not modify it. Otherwise, set
  // search end time to the first millisecond of the day after the date given in the query
  // (since getUsageEvents pulls events less than endTime non-inclusively)
  if ( endTime.valueOf() % 86400000 != 0 ) {
    endTime.setDate( endTime.getDate() + 1 );
    endTime.setHours(0,0,0,0);
  }
  // Set search start time to 7 days before the date in the query
  let startTime = new Date( endTime );
  startTime.setDate( endTime.getDate() - 7 );

  // Use helper method getUsageEvents to query the database for usage events (returns a Promise)
  getUsageEvents(req.decoded.email, meterId, startTime, endTime).then((events) => {
    // This function is called if the Promise is resolved.
    // If the query is successful, it resolves with an array
    if (Array.isArray(events)) {
      // Create an array that will contain 7 days worth of aggregate data
      let weeklyData = [0,0,0,0,0,0,0];

      // Iterate through the events found in the database
      for (let i = 0; i < events.length; i++) {
        // Destructure the current object into named variables that are easier to use
        let {startTime: eventTime, totalVolume} = events[i];
        // Calculate the day of the week at which the current event begins
        eventTime = new Date(eventTime);
        let currentDay = eventTime.getDay();
        // Offset currentDay by our search start weekday so that it represents an index in our array
        currentDay -= startTime.getDay();
        if ( currentDay < 0 ) currentDay += 7; // Fix negative weekdays by adding 7

        // Events will never span multiple days, because they are split along date lines on
        // receipt by the POST /usageEvent route handler. So, just add this event's volume to
        // the current day's index of the array and move on to the next event.
        weeklyData[currentDay] += totalVolume;
      }

      // If we reach this point, then we have the aggregated usage data in the weeklyData array.
      // So, send the data array back to the user.
      res.json({data: weeklyData });
    } else {
      // If the database Promise resolves empty, getUsageEvents returns an error message
      // JSON object that we just send on back to the user
      res.status(204).send();
    }
  }, (err) => {
    // This function is called if the Promise is rejected. Alert the user.
    res.status(500).json({message: err});
  });
}); // End route GET /getWeeklyUsage

// POST /getMonthlyUsage - Expects the following QUERY parameters:
//     meterId - number representing the meter whose data to pull
//     year - the year of data to pull, represented as a number (e.g. "2017")
apiRoutes.get('/getMonthlyUsage', function(req, res) {
  let {email} = req.decoded;
  let {meterId, year} = req.query;
  year = parseInt(year);

  if (Number.isNaN(year)) {
    res.status(400).json({message: 'Must provide "year" query as a number! (e.g. "2017")'});
    return;
  }

  let endTime = new Date(year+1,0,0,0,0,0,0);
  let startTime = new Date(year,0,0,0,0,0,0);

  MongoClient.connect(config.database, function(err, db) {
    assert.equal(null, err);
    // Construct a query that finds relevant usage events
    let query = {
      email,
      $and: [
        {startTime: {$gte: startTime}},
        {startTime: {$lt: endTime}}
      ]
    };
    // Set the query's meterId property to the value of meterId, as long as it exists.
    // If it exists, ensure that the value is a Number, not a string.
    if (typeof meterId !== 'undefined' && meterId !== null) {
      query.meterId = parseInt(meterId);
    }

    // Create an array that will contain 12 months worth of aggregate data
    let monthlyData = [0,0,0,0,0,0,0,0,0,0,0,0];
    let currentDay = null;

    db.collection('events').find(query).forEach(function(event) {
      // Destructure the current object into named variables that are easier to use
      let {startTime: eventTime, totalVolume} = event;
      // Calculate the month in which the current event takes place
      eventTime = new Date(eventTime);
      currentDay = eventTime.getMonth();

      // Events will never span multiple months, because they are split along date lines on
      // receipt by the POST /usageEvent route handler. So, just add this event's volume to
      // the current month's index of the array and move on to the next event.
      monthlyData[currentDay] += totalVolume;
    }, function(err) {
      db.close();
      if (err !== null) {
        // If there was a database error, send the error back to the client
        res.status(500).json({message: err});
      } else if (currentDay === null) {
        // If the currentDay variable was never modified, then no events were found
        res.status(204).send();
      } else {
        // If we reach this point, then we have the aggregated usage data in the monthlyData array.
        // So, send the data array back to the user.
        res.json({data: monthlyData});
      }
    }); // End find() query
  }); //End MongoClient connection
}); // End route GET /getMonthlyUsage


apiRoutes.get('/deleteUserData', function(req, res) {
  let email = req.decoded.email;

  MongoClient.connect(config.database, function(err, db) {
    assert.equal(null, err);
    db.collection('events').remove({email}, function(err, result) {
      console.log('\n____________________');
      console.log('Event data for user ' + email + ' deleted');
      console.log(new Date().toLocaleString());
    });
    res.send({message: 'You have deleted your data, please email us with your name so we can sue you for leaving Flow. Thank you.'});
  });
});


//-----
// Helper Methods
//-----

function storeUsageEvent(meterId, startTime, totalVolume, duration, email) {
  return new Promise((resolve, reject) => {
    let endTime = new Date(startTime.valueOf() + duration);
    // Check to see if an event spans a date line. If it does, split it into multiple events
    if (startTime.getDate() !== endTime.getDate()) {
      // Make endTime represent the clean date mark
      let nextDay = new Date(endTime.setHours(0,0,0,0));

      // Calculate the portion of the duration and volume which occurred on the next day
      let nextDayDuration = duration - (nextDay.valueOf() - startTime.valueOf());
      let nextDayVolume = ((duration - nextDayDuration) / duration) * totalVolume;

      // Recursively call this method to store the next day's worth of this event
      storeUsageEvent(meterId, nextDay, nextDayVolume, nextDayDuration, email);

      // Adjust this day's values to only contain data for this day
      duration -= nextDayDuration;
      totalVolume -= nextDayVolume;

      // Continue on with the method - store the data
    }

    MongoClient.connect(config.database, function(err, db) {
      if (err !== null)  {
        reject();
        return;
      }

      db.collection('events').insertOne({
        meterId,
        startTime,
        totalVolume,
        duration,
        email
      }, function(err, result) {

        db.close();

        if (err !== null) {
          reject();
        } else {
          console.log('Inserted usage event into db');
          resolve();
        }
      });
    });
  });
}

function getUsageEvents(email, meterId, startTime, endTime) {
  return new Promise((resolve, reject) => {
    let useTimes = (typeof startTime !== 'undefined' && typeof endTime !== 'undefined');
    if (useTimes) {
      startTime = new Date(startTime);
      endTime = new Date(endTime);
    }
    assert.notEqual(null, email);

    console.log('\n____________________');
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

      // No matter what useTimes is, set the query's meterId property to the value of meterId,
      // as long as it exists. If it exists, ensure that the value is a Number, not a string.
      if (typeof meterId !== 'undefined' && meterId !== null) {
        query.meterId = parseInt(meterId);
      }

      db.collection('events').find(query).toArray(function(err, results) {
        db.close();
        if (err !== null) {
          reject(err); // Reject the promise, passing the error message
        }
        // Resolve the promise, returning the results
        if (results.length > 0) {
          resolve(results);
        } else {
          resolve({message: 'No data found for given parameters.'});
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
