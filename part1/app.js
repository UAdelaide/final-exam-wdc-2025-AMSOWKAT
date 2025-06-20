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

    await conn.query('CREATE DATABASE IF NOT EXISTS DogWalkService');
    await conn.end();


    //connect to the db
     db = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'DogWalkService'
    });


    //if the table is empty
    const [uc] = await db.execute('SELECT COUNT(*) AS cnt FROM Users');
    if (uc[0].cnt === 0)
        {
        await db.execute(`
        INSERT INTO Users (username,email,password_hash,role) VALUES
        ('alice123','alice@example.com','hashed123','owner'),
        ('bobwalker','bob@example.com','hashed456','walker'),
        ('carol123','carol@example.com','hashed789','owner'),
        ('davidwalker','david@example.com','hashed999','walker'),
        ('emilyowner','emily@example.com','hashed000','owner')
      `);
    }

    //if dog table is empty
    const [dc] = await db.execute('SELECT COUNT(*) AS cnt FROM Dogs');
    if (dc[0].cnt === 0) {
      await db.execute(`
        INSERT INTO Dogs (owner_id,name,size) VALUES
        ((SELECT user_id FROM Users WHERE username='alice123'),'Max','medium'),
        ((SELECT user_id FROM Users WHERE username='carol123'),'Bella','small'),
        ((SELECT user_id FROM Users WHERE username='emilyowner'),'Rocky','large'),
        ((SELECT user_id FROM Users WHERE username='alice123'),'Milo','small'),
        ((SELECT user_id FROM Users WHERE username='carol123'),'Luna','medium')
      `);
    }

    //if the walkrquest is empty
    const [wc] = await db.execute('SELECT COUNT(*) AS cnt FROM WalkRequests');
    if (wc[0].cnt === 0)
    {
        await db.execute
    }

})();

app.use('/', indexRouter);
app.use('/users', usersRouter);

module.exports = app;
