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
    // 1. Create DB if needed
    const conn = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: ''      // your MySQL root password
    });
    await conn.query('CREATE DATABASE IF NOT EXISTS DogWalkService');
    await conn.end();

    // 2. Connect to DogWalkService
    db = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'DogWalkService'
    });

})();

app.use('/', indexRouter);
app.use('/users', usersRouter);

module.exports = app;
