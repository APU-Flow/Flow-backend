var express = require('express')
var app = express()
var port = 3000
var bodyParser = require('body-parser');
var date = new Date();
var ulr = "mongodb://localhost:27017/flow";
var MongoClient = require('mongodb').MongoClient
var assert = require('assert');
app.use( bodyParser.json() );
app.use(bodyParser.urlencoded({
  extended: true
}));

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
  var password = req.body.password

  console.log("");
  console.log("");
  console.log("");
  console.log("");
  console.log("-------------------------")
  console.log("New user registered");
  console.log(firstName);
  console.log(lastName);
  console.log(city);
  console.log(state);
  console.log(email);
  console.log(password)
  console.log(new Date())
  res.send("You just registered a new user named " + firstName + " " + lastName)
});



app.post('/api/login', function(req, res){
  var email = req.param('email')
  var password = req.param('password')
  console.log("");
  console.log("");
  console.log("");
  console.log("");
  console.log("-------------------------")
  console.log("The user @ " + email + " attempted to log in")
  console.log(new Date())
  res.send("You attempted to login with email: " + email + " and password: " + password)
  //todo: actual things
});
