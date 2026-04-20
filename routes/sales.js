const express = require('express');
const { getSales } = require('../controllers/sales');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Get sales data with year and month filters
// Protected route - only admin can access
router.route('/')
  .get(protect, authorize('admin'), getSales);

module.exports = router;
