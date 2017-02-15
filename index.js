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

var jwtOptions = {}
jwtOptions.jwtFromRequest = ExtractJWT.fromAuthHeader();
jwtOptions.secretOrKey = 'tasmanianDevil';

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


//here are some routes
app.post('/api/usageEvent', function(req, res){
  console.log(req)
  res.send('You sent a usageEvent to Express')

  var idVal = req.body.id;
  var startTimeVal = req.body.startTime
  var endTimeVal = req.body.endTime
  var totalVolumeVal = req.body.totalVolume
  console.log("");
  console.log("");
  console.log("");
  console.log("");
  console.log("-------------------------")
  console.log("New Usage Event logged!")
  console.log(idVal)
  console.log(startTimeVal)
  console.log(endTimeVal)
  console.log(totalVolumeVal)
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


app.post('/api/newUser', function(req, res){
  res.send("You sent a new user to express")
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


  res.json({status: "okay", userEmail: email});
});



app.post('/api/login', function(req, res){
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
        res.json({message: "ok", token: token});
      } else {
        res.send("Your password is incorrect, fool.");
      }
      console.log("found in database:", result)
    })
  });
  //todo: actual things
});


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
