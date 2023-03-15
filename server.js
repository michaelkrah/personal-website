const express = require('express');
const app = express();

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger)
app.use('/public', express.static('public'));

app.get('/', (req, res) => {
    console.log("yeap");
    res.render('index');
})

const userRouter = require('./routes/users');
const aboutRouter = require('./routes/about');
const resumeRouter = require('./routes/resume');
const contactRouter = require('./routes/contact');

app.use('/about', aboutRouter)
app.use('/users', userRouter)
app.use('/resume', resumeRouter)
app.use('/contact', contactRouter)

function logger(req, res, next) {
    console.log(req.originalUrl)
    next()
}


app.listen(3000)

