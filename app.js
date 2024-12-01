const express = require('express');
const { client, connectToMongoDB } = require('./config/dbConfig');


const app = express();

app.set('view engine', 'ejs');

app.use(logger)
app.use('/public', express.static('public'));

const userRouter = require('./routes/users');
const aboutRouter = require('./routes/about');
const resumeRouter = require('./routes/resume');
const contactRouter = require('./routes/contact');
const songRouter = require('./routes/songs2'); //CHANGE to songs

app.use('/about', aboutRouter);
app.use('/users', userRouter);
app.use('/resume', resumeRouter);
app.use('/contact', contactRouter);
app.use('/songs', songRouter);


app.get('/', (req, res) => {
  res.render('index');
})

function logger(req, res, next) {
  console.log(req.originalUrl);
  next();
}

connectToMongoDB().catch((err) => console.error('Database connection error:', err));

const db = client.db()
const collection = db.collection('mySongs');
const result = collection.insertOne({ hello: "hello" });


module.exports = app;



