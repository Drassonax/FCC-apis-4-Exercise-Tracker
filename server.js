const express = require('express')
const app = express()
const bodyParser = require('body-parser')

const cors = require('cors')

const mongoose = require('mongoose')
mongoose.connect(process.env.MLAB_URI, { useNewUrlParser: true })

app.use(cors())

app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json())


app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});



// ----------assignment----------

// database
let userSchema = new mongoose.Schema({
  username: String,
  exercises: Array
})
let User = mongoose.model('User', userSchema)

// create new user: POST /api/exercise/new-user
app.post('/api/exercise/new-user', (req, res) => {
  let newUser = new User({
    username: req.body.username,
    exercises: Array
  })
  newUser.save((err, user) => {
    res.json({
      username: user.username,
      id: user._id
    })
  })
})

// get all users: GET /api/exercise/users
app.get('/api/exercise/users', (req, res) => {
  User.find({}, (err, docs) => {
    res.json(docs.map((user) => ({
      username: user.username,
      id: user._id
    })))
  })
})

// add an exercise : POST /api/exercise/add
app.post('/api/exercise/add', (req, res) => {
  let exerciseDate
  if(req.body.date) {
    exerciseDate = new Date(req.body.date)
  } else {
    exerciseDate = new Date()
  }
  let exercise = {
    description: req.body.description,
    duration: req.body.duration,
    date: exerciseDate.toDateString()
  }
  User.findByIdAndUpdate(
    req.body.userId, 
    {
      $push: {
        exercises: exercise
      }
    },
    (err, doc) => {
      res.json({
        username: doc.username,
        id: doc._id,
        description: req.body.description,
        duration: req.body.duration,
        date: exerciseDate.toDateString()
    })
  })
})

// get full exercise log of a user: GET /api/exercise/log
// get partial exercise log of a user: GET /api/exercise/log?{userId}[&from][&to][&limit]
app.get('/api/exercise/log', (req, res) => {
  let start = req.query.from ? new Date(req.query.from) : new Date('1970-01-01')
  let end = req.query.to ? new Date(req.query.to) : new Date()
  let limit = req.query.limit ? Number(req.query.limit) : false
  User.findById(req.query.userId, (err, doc) => {
    let logs = doc.exercises.filter((log) => {
        return new Date(log.date) >= start && new Date(log.date) <= end
      }).filter((log) => {
        return limit ? log.duration <= limit : true 
      })
    res.json({
      username: doc.username,
      id: doc._id,
      count: logs.length,
      log: logs
    })
  })
})

// ------------------------------


// Not found middleware
app.use((req, res, next) => {
  return next({status: 404, message: 'not found'})
})

// Error Handling middleware
app.use((err, req, res, next) => {
  let errCode, errMessage

  if (err.errors) {
    // mongoose validation error
    errCode = 400 // bad request
    const keys = Object.keys(err.errors)
    // report the first validation error
    errMessage = err.errors[keys[0]].message
  } else {
    // generic or custom error
    errCode = err.status || 500
    errMessage = err.message || 'Internal Server Error'
  }
  res.status(errCode).type('txt')
    .send(errMessage)
})


const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
