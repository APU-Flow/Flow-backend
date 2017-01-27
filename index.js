var express = require('express')
var MongoClient = require('mongodb').MongoClient
var app = express()
var dburl = 'mongodb://localhost:27017/flow'
app.listen(3000, function () {
  console.log('FLOW listening on port 3000!')
})

//here are some routes
app.get('/api/usageEvent', function(req, res){
  var idVal = req.param('id');
  var startTimeVal = req.param('startTime')
  var endTimeVal = req.param('endTime')
  var totalVolumeVal = req.param('totalVolume')
  console.log("New Usage Event logged!")
  console.log(idVal)
  console.log(startTimeVal)
  console.log(endTimeVal)
  console.log(totalVolumeVal)
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


app.get('/api/newUser', function(req, res){
  var firstName = req.param('firstName');
  var lastName = req.param('lastName');
  var streetAddress = req.param('streetAddress');
  var city = req.param('city');
  var state = req.param('state');
  var email = req.param('email');
  var password = req.param('password')
  console.log("New user registered");
  console.log(firstName);
  console.log(lastName);
  console.log(city);
  console.log(state);
  console.log(email);
  console.log(password);
})



app.get('/api/login' function(req, res)){
  var email = req.param('email')
  var password = req.password('email')
  console.log("The user @ " + email + " attempted to log in")
  //todo: actual things
})


MongoClient.connect(dburl, function(err, db) {
  if (err) return

  var collection = db.collection('foods')
  collection.insert({name: 'taco', tasty: true}, function(err, result) {
    collection.find({name: 'taco'}).toArray(function(err, docs) {
      console.log(docs[0])
      db.close()
    })
  })
})
