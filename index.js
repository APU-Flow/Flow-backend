var express = require('express')
var MongoClient = require('mongodb').MongoClient
var app = express()
var dburl = 'mongodb://localhost:27017/flow'
app.listen(3000, function () {
  console.log('FLOW listening on port 3000!')
})

//here are some routes
app.route('/api/usageEvent').post(function(req, res){
  console.log(req)
  res.send('You sent: ${body} to Express')

  var idVal = req.body.id;
  var startTimeVal = req.body.startTime
  var endTimeVal = req.body.endTime
  var totalVolumeVal = req.body.totalVolume
  console.log("");
  console.log("-------------------------")
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


app.route('/api/newUser').post(function(req, res){
  /*
  var firstName = req.body.firstName;
  var lastName = req.body.lastName;
  var streetAddress = req.body.streetAddress;
  var city = req.body.city;
  var state = req.body.state;
  var email = req.body.email;
  var password = req.body.password
  console.log("New user registered");
  console.log(firstName);
  console.log(lastName);
  console.log(city);
  console.log(state);
  console.log(email);
  console.log(password);
  */
  console.log(req.body)
})



app.route('/api/login').post(function(req, res){
  var email = req.param('email')
  var password = req.param('password')
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
