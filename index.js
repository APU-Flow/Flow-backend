var _ = require("lodash")
var express = require('express')
var app = express()
var port = 3000
var bodyParser = require('body-parser');
var jwt = require('jsonwebtoken');
var passport = require('passport');
var passportJWT = require('passport-jwt')
var ExtractJWT = passportJWT.ExtractJwt;
var JwtStrategy = passportJWT.Strategy;
var date = new Date();
var url = "mongodb://localhost:27017/flow";
var MongoClient = require('mongodb').MongoClient
var assert = require('assert');
app.use( bodyParser.json() );
app.use(bodyParser.urlencoded({
  extended: true
}));

app.set('superSecret', 'bruh'); // secret variable
var jwtOptions = {}
jwtOptions.jwtFromRequest = ExtractJWT.fromAuthHeader();

var strategy = new JwtStrategy(jwtOptions, function(jwt_payload, next) {
  console.log('payload received', jwt_payload);
  // usually this would be a database call:
  var user =  "";

  MongoClient.connect(url, function(err, db){
    assert.equal(null, err);
    db.collection('users').find({_id: jwt_payload.id}).toArray(function (err, result){
      user = result[0]
    })
  });

  if (user) {
    next(null, user);
  } else {
    next(null, false);
  }
});

passport.use(strategy);
app.listen(port);



// get an instance of the router for api routes
var apiRoutes = express.Router();


// route middleware to verify a token
apiRoutes.use(function(req, res, next) {
  // check header or url parameters or post parameters for token
  var token = req.body.token || req.query.token || req.headers['x-access-token'];
  // decode token
  if (token) {
    // verifies secret and checks exp
    jwt.verify(token, app.get('superSecret'), function(err, decoded) {
      if (err) {
        return res.json({ success: false, message: 'Failed to authenticate token.' });
      } else {
        // if everything is good, save to request for use in other routes
        req.decoded = decoded;
        next();
      }
    });
  } else {
    // if there is no token
    // return an error
    return res.status(403).send({
        success: false,
        message: 'No token provided.'
    });

  }
});

//app.use('/api', apiRoutes);

app.post('/login', function(req, res){
  res.setHeader('Content-Type', 'application/json');
  var emailVal = req.param('email')
  var passwordVal = req.param('password')
  console.log("");
  console.log("");
  console.log("");
  console.log("");
  console.log("-------------------------")
  console.log("The user @ " + emailVal + " attempted to log in")
  console.log(new Date())
  //res.send("You attempted to login with email: " + emailVal + " and password: " + passwordVal)

  MongoClient.connect(url, function(err, db){
    assert.equal(null, err);
    db.collection('users').find({email: emailVal}).toArray(function (err, result){
      jsonBody = result[0]
      if(passwordVal == jsonBody["password"]){
       // res.send(jsonBody)
        var payload = {id: jsonBody.id};
        var token = jwt.sign(payload, jwtOptions.secretOrKey);
        res.json({message: "ok", token: token, email: emailVal});
      } else {
        res.json({message: "lol nice tri n00b");
      }
      console.log("found in database:", result)
    })
  });
  //todo: actual things
});



app.post('/newUser', function(req, res){
  var firstName = req.body.firstName;
  var lastName = req.body.lastName;
  var streetAddress = req.body.streetAddress;
  var city = req.body.city;
  var state = req.body.state;
  var email = req.body.email;
  var password = req.body.password;

  console.log("");
  console.log("");
  console.log("");
  console.log("");
  console.log("-------------------------");
  console.log("New user registered");
  console.log(firstName);
  console.log(lastName);
  console.log(city);
  console.log(state);
  console.log(email);
  console.log(password)
  console.log(new Date());

  MongoClient.connect(url, function(err, db){
    assert.equal(null, err);
    insertUser(db, function(){db.close()},
      firstName, lastName, streetAddress, city, state, email, password
    );
  });


  res.json({status: "OK", userEmail: email});
});



//here are some protected routes
app.post('/api/logUsageEvent', function(req, res){
  console.log(req)
  res.send('You sent a usageEvent to Express')

  var idVal = req.body.id;
  var startTimeVal = req.body.startTime
  var endTimeVal = req.body.endTime
  var totalVolumeVal = req.body.totalVolume
  var meterId = req.body.meterId
  var userEmail = req.body.userEmail
  console.log("");
  console.log("");
  console.log("");
  console.log("");
  console.log("-------------------------")
  console.log("New Usage Event logged!")
  console.log(idVal)
  console.log(startTimeVal)
  console.log(endTimeVal)
  console.log(meterId)
  console.log(userEmail);
  console.log(new Date())
  res.send("New usage event logged");
  /*
  MongoClient.connect(dburl, function(err, db) {
    if (err) return

    var collection = db.collection('flow')
    collection.insert({id: idVal, startTime: startTimeVal, endTime: endTimeVal, totalVolume: totalVolumeVal}, function(err, result) {
      collection.find({id: '1234'}).toArray(function(err, docs) {
        console.log(docs[0])
        db.close()
      })
    })
  })
  */
})



app.post('/api/addMeter', function(req, res){
  console.log(req)
  res.send('You sent a usageEvent to Express')
  var numMeters = 0;

  var meterName = req.body.meterName;
  var userEmail = req.body.userEmail;
  MongoClient.connect(url, function(err, db){
    assert.equal(null, err);
    db.collection('meters').find({email: emailVal}).toArray(function (err, result){
    numMeters = result.length;
  });

  var meterId = numMeters + 1;

  MongoClient.connect(url, function(err, db){
    assert.equal(null, err);
    insertMeter(db, function(){db.close()},
      meterId, meterName, userEmail
    );
  });
  console.log("");
  console.log("");
  console.log("");
  console.log("");
  console.log("-------------------------")
  console.log("New Meter Added!")
  console.log(meterId)
  console.log(meterName)
  console.log(endTimeVal)
  console.log(userEmail)
  console.log(new Date())
  res.send("New Meter Added");
  /*
  MongoClient.connect(dburl, function(err, db) {
    if (err) return

    var collection = db.collection('flow')
    collection.insert({id: idVal, startTime: startTimeVal, endTime: endTimeVal, totalVolume: totalVolumeVal}, function(err, result) {
      collection.find({id: '1234'}).toArray(function(err, docs) {
        console.log(docs[0])
        db.close()
      })
    })
  })
  */
})



app.get('/api/getUsageEvent', function(req, res){
  emailVal = req.param("email");
  console.log("")
  console.log("")
  console.log("")
  console.log("____________________")
  console.log("Usage event for " + emailVal + "pulled");
  MongoClient.connect(url, function(err, db){
    assert.equal(null, err);
    db.collection('events').find({email: emailVal}).toArray(function (err, result){
      jsonBody = result[0]
      res.send(jsonBody);
    })
  });
});




//HERE ARE SOME HELPER FUNCTIONS
var insertUser = function(db, callback, firstName, lastName, streetAddress, city, state, email, password){
  db.collection('users').insertOne({
    "firstName": firstName,
    "lastName": lastName,
    "streetAddress": streetAddress,
    "city": city,
    "state": state,
    "email": email,
    "password": password
  }, function(err, result) {
    assert.equal(err, null);
    console.log("Inserted user into db");
    callback();
  })
}


var insertMeter = function(db, callback, meterId, meterName, userEmail){
  db.collection('meters').insertOne({
    "meterId": meterId,
    "meterName": meterName,
    "userEmail": userEmail
  }, function(err, result) {
    assert.equal(err, null);
    console.log("Inserted meter into db");
    callback();
  })
}
