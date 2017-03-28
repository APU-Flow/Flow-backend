'use strict';
// index.js
// Flow Backend server
let express = require('express');
let app = express();
let port = 3000;
let MongoClient = require('mongodb').MongoClient;
let assert = require('assert');
let bodyParser = require('body-parser');
let jwt = require('jsonwebtoken');
let bcrypt  = require('bcrypt');
const saltRounds = 10;

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

let config = require('./config');     // Get our config file
app.set('uberSecret', config.secret); // Set the secret value used for JWTs

// Configure a special Router for /api/ routes with middleware for JWT auth
let apiRoutes = express.Router();
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
});


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
      db.collection('users').find({ email }).toArray(function (err, result) {
        // The user which matches should be the only item in the result toArray
        assert.ok(result.length === 1);
        let userObject = result[0];

        // If our user is authenticated successfully, generate a token and respond with it
        bcrypt.compare(password, userObject.password, function(err, compResult){
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
});

app.post('/newUser', function(req, res) {
  // Destructure new user fields from request body into individual variables
  let {firstName, lastName, streetAddress, city, state, email, password} = req.body;
  MongoClient.connect(config.database, function(err, db) {
    assert.equal(null, err);
    db.collection('users').count({ email }, function (err, count) {
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

        bcrypt.genSalt(saltRounds, function(err, salt){
          bcrypt.hash(password, salt, function(err, hash){
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

app.post('/usageEvent', function(req, res) {
  // Destructure new usage event fields from request body into individual variables
  let {meterId, startTime, duration, totalVolume, email} = req.body;

  console.log('\n\n-------------------------');
  console.log('New Usage Event logged!');
  console.log(startTime);
  console.log(duration);
  console.log(totalVolume);
  console.log(meterId);
  console.log(email);
  let trueStartTime = new Date();
  trueStartTime.setMinutes(trueStartTime.getMinutes() - 2);
  trueStartTime.setMilliseconds(trueStartTime.getMilliseconds() - Number(duration));
  console.log(trueStartTime);

  res.send('New usage event logged');
  MongoClient.connect(config.database, function(err, db) {
    assert.equal(null, err);
    db.collection('events').insertOne({
      meterId,
      'startTime': trueStartTime,
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


app.post('/api/addMeter', function(req, res) {
  console.log(req);
  res.send('You sent a usageEvent to Express');
  let numMeters = 0;

  let meterName = req.body.meterName;
  let userEmail = req.body.userEmail;
  MongoClient.connect(config.database, function(err, db) {
    assert.equal(null, err);
    db.collection('meters').find({email: userEmail}).toArray(function (err, result) {
      numMeters = result.length;
    });
  });

  let meterId = numMeters + 1;

  MongoClient.connect(config.database, function(err, db) {
    assert.equal(null, err);
    db.collection('meters').insertOne({
      meterId,
      meterName,
      userEmail
    }, function(err, result) {
      assert.equal(err, null);
      console.log('Inserted meter into db');
      db.close();
    });
  });

  console.log('\n\n-------------------------');
  console.log('New Meter Added!');
  console.log(meterId);
  console.log(meterName);
  console.log(userEmail);
  console.log(new Date());
  res.send('New Meter Added');
  /*
  MongoClient.connect(dburl, function(err, db) {
    if (err) return

    let collection = db.collection('flow')
    collection.insert({id: idVal, startTime: startTimeVal, endTime: endTimeVal, totalVolume: totalVolumeVal}, function(err, result) {
      collection.find({id: '1234'}).toArray(function(err, docs) {
        console.log(docs[0])
        db.close()
      })
    })
  })
  */
});

apiRoutes.get('/getUsageEvent', function(req, res) {
  let email = req.param('email');

  console.log('\n\n-------------------------');
  console.log(`Usage event for ${email} pulled`);

  MongoClient.connect(config.database, function(err, db) {
    assert.equal(null, err);
    db.collection('events').find({ email }).toArray(function(err, result) {
      res.send(result[0]);
    });
  });
});


//-----
// Fire up the server!
//-----
app.listen(port);
console.log(`Flow-backend server running on port ${port}`);
