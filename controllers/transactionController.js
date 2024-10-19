const { response } = require("express");
const Transaction = require("../models/Transaction");

// List transactions with search and pagination
const listTransactions = async (req, res) => {
  try {
    const { month, search = "", page = 1, perPage = 10 } = req.query;

    // Ensure month is converted to an integer (0-11) for filtering
    const monthIndex = new Date(`${month} 1, 2000`).getMonth();

    // Create a query to filter by month, regardless of the year
    const dateQuery = {
      $expr: { $eq: [{ $month: "$dateOfSale" }, monthIndex + 1] },
    };

    // Construct the search query for title, description, and price
    const searchQuery = search
      ? {
          $or: [
            { title: { $regex: search, $options: "i" } },
            { description: { $regex: search, $options: "i" } },
            { price: isNaN(Number(search)) ? -1 : Number(search) }, // Handle numeric search
          ],
        }
      : {};

    const query = { ...dateQuery, ...searchQuery };

    // Apply pagination
    const transactions = await Transaction.find(query)
      .skip((page - 1) * perPage)
      .limit(parseInt(perPage));

    const total = await Transaction.countDocuments(query);
    const totalPages = Math.ceil(transactions.length/perPage)

    res.status(200).json({ transactions, total, page, perPage });
  } catch (error) {
    console.error("Error fetching transactions:", error.message);
    res.status(500).json({ error: "Failed to fetch transactions." });
  }
};

const getStatistics = async (req, res) => {
  try {
    const { month = "March" } = req.query;

    const monthIndex = new Date(`${month} 1, 2000`).getMonth() + 1;

    const dateQuery = {
      $expr: { $eq: [{ $month: "$dateOfSale" }, monthIndex] },
    };

    // Calculate total sale amount for sold items
    const totalSaleAmountResult = await Transaction.aggregate([
      { $match: { ...dateQuery, sold: true } },
      { $group: { _id: null, total: { $sum: "$price" } } },
    ]);

    const totalSaleAmount = totalSaleAmountResult[0]?.total || 0;

    // Count the total number of sold items
    const totalSoldItems = await Transaction.countDocuments({
      ...dateQuery,
      sold: true,
    });

    // Count the total number of not sold items
    const totalNotSoldItems = await Transaction.countDocuments({
      ...dateQuery,
      sold: false,
    });

    // Send the response with statistics
    res.status(200).json({
      totalSaleAmount,
      totalSoldItems,
      totalNotSoldItems,
    });
  } catch (error) {
    console.error("Error fetching statistics:", error.message);
    res.status(500).json({ error: "Failed to fetch statistics." });
  }
};

const getBarChartData = async (req, res) => {
  try {
    const { month = "March" } = req.query;

    // Convert month name to month index (0-11) and adjust to 1-12 for MongoDB’s $month
    const monthIndex = new Date(`${month} 1, 2000`).getMonth() + 1;

    // Create date query to filter by month, regardless of year
    const dateQuery = {
      $expr: { $eq: [{ $month: "$dateOfSale" }, monthIndex] },
    };

    // Define the price ranges for grouping
    const priceRanges = [
      { range: "0-100", min: 0, max: 100 },
      { range: "101-200", min: 101, max: 200 },
      { range: "201-300", min: 201, max: 300 },
      { range: "301-400", min: 301, max: 400 },
      { range: "401-500", min: 401, max: 500 },
      { range: "501-600", min: 501, max: 600 },
      { range: "601-700", min: 601, max: 700 },
      { range: "701-800", min: 701, max: 800 },
      { range: "801-900", min: 801, max: 900 },
      { range: "901-above", min: 901, max: Infinity },
    ];

    // Use aggregation to group transactions by price range
    const results = await Promise.all(
      priceRanges.map(async ({ range, min, max }) => {
        const count = await Transaction.countDocuments({
          ...dateQuery,
          price: {
            $gte: min,
            $lt: max === Infinity ? Number.MAX_SAFE_INTEGER : max,
          },
        });
        return { range, count };
      })
    );

    res.status(200).json(results);
  } catch (error) {
    console.error("Error fetching bar chart data:", error.message);
    res.status(500).json({ error: "Failed to fetch bar chart data." });
  }
};

const getPieChartData = async (req, res) => {
  const { month } = req.query; // Get month from query params
  if (!month) {
    return res.status(400).send({ error: "Month is required" });
  }
  const getMonthIndex = (month) => {
    return new Date(Date.parse(month + " 1, 2021")).getMonth(); // Jan = 0, Dec = 11
  };

  try {
    const monthIndex = getMonthIndex(month) + 1; // Convert to 1-based index for MongoDB

    // Aggregate to count items in each category for the selected month
    const results = await Transaction.aggregate([
      {
        $match: {
          // Match documents based on the month of dateOfSale
          $expr: {
            $eq: [{ $month: "$dateOfSale" }, monthIndex] // MongoDB months are 1-indexed
          }
        }
      },
      {
        $group: {
          _id: { $toLower: "$category" }, // Group by category in lowercase
          itemCount: { $sum: 1 } // Count the number of items in each category
        }
      },
      {
        $project: {
          category: { $toUpper: { $substr: ["$_id", 0, -1] } }, // Capitalize the first letter of the category
          itemCount: 1,
          _id: 0 // Exclude the _id field from the result
        }
      }
    ]);

    res.json(results);
  } catch (error) {
    console.error('Error fetching pie chart data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getCombinedData = async (req, res) => {
  try {
    const [transactions, statistics, barChartData, pieChartData] =
      await Promise.all([
        listTransactions(req, res),
        getStatistics(req, res),
        getBarChartData(req, res),
        getPieChartData(req, res),
      ]);

    res.json({ transactions, statistics, barChartData, pieChartData });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching combined data", error: error.message });
  }
};

module.exports = {
  listTransactions,
  getStatistics,
  getBarChartData,
  getPieChartData,
  getCombinedData,
};
