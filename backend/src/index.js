const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');


// Load the secret settings from .env file
dotenv.config();

const pool = require('./db/connection');

// Create the server
const app = express();

// Allow frontend to talk to backend
app.use(cors());

// Tell the server to understand JSON data
app.use(express.json());

// A simple test route - just to check if the server is running
const authRoutes = require('./routes/auth');
app.use('/auth', authRoutes);

const requestRoutes = require('./routes/requests');
app.use('/requests', requestRoutes);


app.get('/', (req, res) => {
  res.json({ message: 'Server is running!' });
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});