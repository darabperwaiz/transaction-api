const express = require('express');
const mongoose = require('mongoose');
const routes = require('./routes');
require('dotenv').config();
const cors = require('cors');

const app = express();

// Allow all origins
app.use(cors());

const PORT = process.env.PORT || 3000;

mongoose.connect(process.env.DB_URI)
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.error('MongoDB connection error:', err));

app.use(express.json());
app.use('/api', routes);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
