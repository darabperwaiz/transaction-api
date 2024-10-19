const axios = require('axios');
const Transaction = require('../models/Transaction');

// Seed database with third-party data
const seedDatabase = async (req, res) => {
  try {
    const { data } = await axios.get('https://s3.amazonaws.com/roxiler.com/product_transaction.json');
    await Transaction.deleteMany(); // Clear existing data
    await Transaction.insertMany(data); // Insert new data
    res.status(200).json({ message: 'Database initialized with seed data.' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to seed database.', error: error.message });
  }
};

module.exports = { seedDatabase };
