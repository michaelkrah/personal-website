const express = require('express');
const app = express();

app.get('/', (req, res) => {
    console.log("yeap");
    res.render('index');
    res.send("Hi");
})

app.listen(3000)

