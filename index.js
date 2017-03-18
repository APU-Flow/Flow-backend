let _ = require("lodash");
let express = require('express');
let app = express();
let port = 3000;
let MongoClient = require('mongodb').MongoClient;
let assert = require('assert');

let bodyParser = require('body-parser');
let jwt = require('jsonwebtoken');

let config = require('./config'); // Get our config file
app.set('uberSecret', config.secret);

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());


// get an instance of the router for api routes
let apiRoutes = express.Router();
app.use('/api', apiRoutes);

// Route middleware to verify a token
apiRoutes.use(function(req, res, next) {

  // Check header, url parameters, and post parameters for token
  var token = req.body.token || req.query.token || req.headers['x-access-token'];

  if (token) {
    // Verify the secret and check the expiry
    jwt.verify(token, app.get('uberSecret'), function(err, decoded) {      
      if (err) {
        return res.json({ success: false, message: 'Failed to authenticate token.' });    
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

app.post('/login', function(req, res){
  res.setHeader('Content-Type', 'application/json');
  let emailVal = req.param('email')
  let passwordVal = req.param('password')
  console.log("");
  console.log("");
  console.log("");
  console.log("");
  console.log("-------------------------")
  console.log("The user @ " + emailVal + " attempted to log in")
  console.log(new Date())
  //res.send("You attempted to login with email: " + emailVal + " and password: " + passwordVal)

  MongoClient.connect(config.database, function(err, db){
    assert.equal(null, err);
    db.collection('users').find({email: emailVal}).toArray(function (err, result){
      jsonBody = result[0]
      // If our user is authenticated successfully:
      if (passwordVal == jsonBody["password"]){
        
        let token = jwt.sign(user, app.get('uberSecret'), {
          expiresInMinutes: 1440 // Expires in 24 hours
        });

        res.json({
          message: "ok",
          firstName: jsonBody["firstName"],
          token
        });
      } else {
        res.json({message: "lol nice tri n00b"});
      }
      console.log("found in database:", result)
    })
  });
});


app.post('/newUser', function(req, res){
  let firstName = req.body.firstName;
  let lastName = req.body.lastName;
  let streetAddress = req.body.streetAddress;
  let city = req.body.city;
  let state = req.body.state;
  let email = req.body.email;
  let password = req.body.password;

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

  MongoClient.connect(config.database, function(err, db){
    assert.equal(null, err);
    insertUser(db, function(){db.close()},
      firstName, lastName, streetAddress, city, state, email, password
    );
  });


  res.json({status: "OK", userEmail: email});
});


//here are some protected routes
apiRoutes.post('/usageEvent', function(req, res){
  console.log(req)
  res.send('You sent a usageEvent to Express')

  let idVal = req.body.id;
  let startTimeVal = req.body.startTime
  let endTimeVal = req.body.endTime
  let totalVolumeVal = req.body.totalVolume
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
  MongoClient.connect(config.database, function(err, db) {
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
})


apiRoutes.get('/getUsageEvent', function(req, res){
  emailVal = req.param("email");
  console.log("")
  console.log("")
  console.log("")
  console.log("____________________")
  console.log("Usage event for " + emailVal + "pulled");
  MongoClient.connect(config.database, function(err, db){
    assert.equal(null, err);
    db.collection('events').find({email: emailVal}).toArray(function (err, result){
      jsonBody = result[0]
      res.send(jsonBody);
    })
  });
});


//HERE ARE SOME HELPER FUNCTIONS
let insertUser = function(db, callback, firstName, lastName, streetAddress, city, state, email, password){
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

app.listen(port);
console.log(`Flow-backend server running on port ${port}`);
