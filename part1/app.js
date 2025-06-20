var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const mysql = require('mysql2/promise');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

var app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

//share the database
let db;
(async () => {

    try {
    //Create the database if it doesn't exist
    const conn = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: ''
    });
    await conn.query

})();

app.use('/', indexRouter);
app.use('/users', usersRouter);

module.exports = app;
