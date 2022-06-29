const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
const bodyParser = require('body-parser')

app.use(bodyParser.urlencoded({ extended: "false" }));

//Connection to the Database
const { LEGAL_TLS_SOCKET_OPTIONS } = require('mongodb');
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });


app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});


let userSchema = new mongoose.Schema({
  username : {
    type: String,
    unique: true,
  },
  description :  String,
  duration : Number,
  date : String,
  log : {
    type: Array,
    default: []
  },
  count : Number
  })

let User = mongoose.model("User", userSchema);

app.post('/api/users', function(req,res) {
  var userUsername = req.body.username;
  var user = new User ({username: userUsername})
  user.save((err,addedPerson)=>{
    if (err) return console.log(err);
    res.json({username:addedPerson.username, _id:addedPerson._id})
  })
})

app.get('/api/users', function(req,res){
  User.find({})
  .select('username _id')
  .exec(function(err,usersCalled){
    if (err) return console.log(err);
    res.send(usersCalled)
  })
})

app.post('/api/users/:_id/exercises', function(req,res){
  var personId = req.params._id;
  var description = req.body.description;
  var duration = Number(req.body.duration);
  
  if(typeof req.body.date === 'undefined'){
    var date = new Date().toDateString();
  } else 
  var date = new Date(req.body.date).toDateString();

  User.findByIdAndUpdate(
    personId, 
    {$push: {log: {
      description: description, 
      duration: duration, 
      date: date}}},
    {new: false},(eer,updatedUser)=>{
      res.json({
        _id: updatedUser._id,
        username: updatedUser.username,
        date: date,
        duration: duration,
        description: description,
      })

    })
})

app.get('/api/users/:_id/logs', function(req,res){
  var personId = req.params._id;
  var limit = Number(req.query.limit);
  var from = req.query.from;
  var to = req.query.to;
  User.findById(personId)
  .select('_id username log')
  .exec(function(err,dictionary){
    if (err) return console.log(err);
    var userLog = dictionary._doc
    var newUserLog = {...userLog, "count": userLog.log.length}
    // if(from && to){
    //   var omoUserlog = newUserLog.log;
    //   omoUserlog = omoUserlog.filter((d)=> { return (Date.parse(d.date) >= Date.parse(from)) && (Date.parse(d.date) <= Date.parse(to));})
    // }
    
    
    var omoUserlog = newUserLog.log;
    if(from) {
      omoUserlog = omoUserlog.filter((d)=> { return (Date.parse(d.date) >= Date.parse(from)) ;})
    }
    if(to) {
      omoUserlog = omoUserlog.filter((d)=> { return (Date.parse(d.date) <= Date.parse(to));})
    }

    if(limit) {
      var omoUserlog = omoUserlog.slice(0,limit)
    }

    else var omoUserlog = newUserLog.log;
    res.json({
      _id: newUserLog._id,
      username: newUserLog.username,
      count: newUserLog.count,
      log: omoUserlog
    });
  })
})




const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
