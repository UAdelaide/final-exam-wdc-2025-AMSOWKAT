var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const mysql = require('mysql2/promise');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
const { Console, error } = require('console');

var app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// share the database
let db;
(async () => {


    try {
    // Create the database if it doesn't exist
    const conn = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: ''
    });

    await conn.query('CREATE DATABASE IF NOT EXISTS DogWalkService');
    await conn.end();


    // connect to the db
     db = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'DogWalkService'
    });


    // if the table is empty
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

    // if dog table is empty
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

    // if the walkrquest is empty
    const [wc] = await db.execute('SELECT COUNT(*) AS cnt FROM WalkRequests');
    if (wc[0].cnt === 0)
    {
        await db.execute(`
        INSERT INTO WalkRequests (dog_id,requested_time,duration_minutes,location,status) VALUES
        ((SELECT dog_id FROM Dogs WHERE name='Max'),'2025-06-10 08:00:00',30,'Parklands','open'),
        ((SELECT dog_id FROM Dogs WHERE name='Bella'),'2025-06-10 09:30:00',45,'Beachside Ave','accepted'),
        ((SELECT dog_id FROM Dogs WHERE name='Rocky'),'2025-06-11 10:00:00',60,'City Park','open'),
        ((SELECT dog_id FROM Dogs WHERE name='Milo'),'2025-06-11 11:00:00',20,'Riverside Trail','open'),
        ((SELECT dog_id FROM Dogs WHERE name='Luna'),'2025-06-12 15:30:00',40,'Greenway Path','cancelled')
      `);
    }

    Console.log('Test data is inputed into the database');
    }catch (err) {
        console.error('Error in the database. Start Mysql', err);
    }

})();

// Routes


// api/dogs route
app.get('/api/dogs', async (req, res) => {

    try {
     const [rows] = await db.execute(`
      SELECT d.name AS dog_name, d.size, u.username AS owner_username
      FROM Dogs d
      JOIN Users u ON d.owner_id = u.user_id
    `);
     res.json(rows);
    }catch (err) {
    res.status(500).json({ error: 'Failed to retrieve dogs' });
    }
});


// api/walkrequests/open
app.get('/api/walkrequests/open', async (req, res) => {
    try {
        const [rows] = await db.execute(`
      SELECT w.request_id,
             d.name   AS dog_name,
             w.requested_time,
             w.duration_minutes,
             w.location,
             u.username AS owner_username
      FROM WalkRequests w
      JOIN Dogs d  ON w.dog_id   = d.dog_id
      JOIN Users u ON d.owner_id = u.user_id
      WHERE w.status = 'open'
    `);
    res.json(rows);
    } catch (err){
        res.status(500).json({ error: 'Failed to retrive requests' });
    }
});

// api/walkers/summary
app.get('/api/walkers/summary', async (req, res) => {
    try {
    const [rows] = await db.execute(`
      SELECT
        u.username AS walker_username,
        COUNT(r.rating_id)         AS total_ratings,
        ROUND(AVG(r.rating), 1)    AS average_rating,
        (
          SELECT COUNT(*)
          FROM WalkRequests wr
          JOIN WalkApplications wa ON wr.request_id = wa.request_id
          WHERE wa.walker_id = u.user_id
            AND wr.status  = 'completed'
            AND wa.status  = 'accepted'
        )                           AS completed_walks
      FROM Users u
      LEFT JOIN WalkRatings r ON u.user_id = r.walker_id
      WHERE u.role = 'walker'
      GROUP BY u.user_id
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrive walker data' });
  }
});

app.use('/', indexRouter);
app.use('/users', usersRouter);


module.exports = app;
