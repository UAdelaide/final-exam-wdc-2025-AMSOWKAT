const express = require('express');
const router = express.Router();
const db = require('../models/db');

// Get list of dog_id, name for the owner

router.get('/', async (req, res) => {
    const ownerId = req.session.user?.user_id;
    if (!ownerId) return res.status(401).json({ error: 'Not logged in' });

    try