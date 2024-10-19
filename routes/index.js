const express = require('express');
const router = express.Router();
const { seedDatabase } = require('../controllers/seedController');
const { listTransactions, getStatistics, getBarChartData, getPieChartData, getCombinedData } = require('../controllers/transactionController');

router.get('/seed', seedDatabase);
router.get('/transactions', listTransactions);
router.get('/statistics', getStatistics);
router.get('/barchart', getBarChartData);
router.get('/piechart', getPieChartData);
router.get('/combined', getCombinedData);

module.exports = router;
