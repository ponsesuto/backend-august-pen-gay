const express = require('express');
const { getSales } = require('../controllers/sales');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Get sales data with year and month filters
// Protected route - only admin can access
/**
 * @swagger
 * /sales:
 *   get:
 *     summary: Get sales data filtered by year, month, and coworking (Admin only)
 *     tags: [Sales]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: year
 *         required: true
 *         schema:
 *           type: integer
 *         description: Year for sales data
 *       - in: query
 *         name: month
 *         schema:
 *           type: string
 *           enum: ['all', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12']
 *         description: Month for daily data (1-12) or 'all' for monthly data
 *       - in: query
 *         name: coworking
 *         schema:
 *           type: string
 *         description: Filter by specific coworking space ID
 *     responses:
 *       200:
 *         description: Sales data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       name:
 *                         type: string
 *                         description: Month name (JAN, FEB, etc.) or day number
 *                       total:
 *                         type: number
 *                         description: Revenue amount
 *       400:
 *         description: Bad request - missing year or invalid month
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin only
 */
router.route('/')
  .get(protect, authorize('admin'), getSales);

module.exports = router;
