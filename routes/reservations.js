const express = require('express');

const { 
  getReservations, 
  getReservation, 
  addReservation, 
  updateReservation, 
  deleteReservation,
  checkAvailability,
  deleteAllReservations,
  getDashboardStats // 
} = require('../controllers/reservations');

const router = express.Router({mergeParams:true});

const {protect,authorize} = require('../middleware/auth');

/**
 * @swagger
 * /reservations:
 *   get:
 *     summary: Get all reservations
 *     tags: [Reservations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by date (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: List of reservations
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 count:
 *                   type: integer
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       coworking:
 *                         type: object
 *                       user:
 *                         type: object
 *                       date:
 *                         type: string
 *                         format: date
 *                       startTime:
 *                         type: string
 *                       endTime:
 *                         type: string
 *                       desk:
 *                         type: string
 *       401:
 *         description: Unauthorized
 *   post:
 *     summary: Create a new reservation
 *     tags: [Reservations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - coworking
 *               - date
 *               - startTime
 *               - endTime
 *               - desk
 *             properties:
 *               coworking:
 *                 type: string
 *                 description: Coworking space ID
 *               date:
 *                 type: string
 *                 format: date
 *                 example: 2024-01-15
 *               startTime:
 *                 type: string
 *                 example: 09:00
 *               endTime:
 *                 type: string
 *                 example: 10:00
 *               desk:
 *                 type: string
 *                 example: A1
 *     responses:
 *       200:
 *         description: Reservation created successfully
 *       400:
 *         description: Bad request or limit exceeded
 *       401:
 *         description: Unauthorized
 */
router.route('/')
    .get(protect, authorize('admin','user') , getReservations)
    .post(protect, authorize('admin', 'user'), addReservation);

/**
 * @swagger
 * /reservations/deleteAll:
 *   delete:
 *     summary: Delete all reservations (Admin only)
 *     tags: [Reservations]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All reservations deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 deletedCount:
 *                   type: integer
 *                 message:
 *                   type: string
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin only
 */
router.delete(
  '/deleteAll',
  protect,
  authorize('admin'),
  deleteAllReservations
);

// 2. 
// 
// Temporarily removed auth middleware for testing
/**
 * @swagger
 * /reservations/dashboard/stats:
 *   get:
 *     summary: Get dashboard statistics (Admin only)
 *     tags: [Reservations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: year
 *         schema:
 *           type: integer
 *         description: Year for statistics (default: current year)
 *     responses:
 *       200:
 *         description: Dashboard statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     revenue:
 *                       type: number
 *                     members:
 *                       type: integer
 *                     bookingsToday:
 *                       type: integer
 *                     bookedSpacesToday:
 *                       type: integer
 *                     occupancy:
 *                       type: integer
 *                     recentTransactions:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           user:
 *                             type: string
 *                           email:
 *                             type: string
 *                           amount:
 *                             type: string
 *                           time:
 *                             type: string
 *                           status:
 *                             type: string
 *                     monthlyRevenue:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           name:
 *                             type: string
 *                           total:
 *                             type: number
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin only
 */
router.route('/dashboard/stats')
    .get(protect, authorize('admin'), getDashboardStats);

/**
 * @swagger
 * /reservations/{id}:
 *   get:
 *     summary: Get single reservation
 *     tags: [Reservations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Reservation ID
 *     responses:
 *       200:
 *         description: Reservation details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Reservation not found
 *   put:
 *     summary: Update reservation
 *     tags: [Reservations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Reservation ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               date:
 *                 type: string
 *                 format: date
 *               startTime:
 *                 type: string
 *               endTime:
 *                 type: string
 *               desk:
 *                 type: string
 *     responses:
 *       200:
 *         description: Reservation updated successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Reservation not found
 *   delete:
 *     summary: Delete reservation
 *     tags: [Reservations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Reservation ID
 *     responses:
 *       200:
 *         description: Reservation deleted successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Reservation not found
 */
router.route('/:id')
    .get(protect, authorize('admin','user') , getReservation)
    .put(protect, authorize('admin', 'user'), updateReservation)
    .delete(protect, authorize('admin', 'user'), deleteReservation);

/**
 * @swagger
 * /reservations/check/{coworkingId}:
 *   post:
 *     summary: Check availability for a coworking space
 *     tags: [Reservations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: coworkingId
 *         required: true
 *         schema:
 *           type: string
 *         description: Coworking space ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - date
 *             properties:
 *               date:
 *                 type: string
 *                 format: date-time
 *                 example: 2024-01-15T09:00:00Z
 *     responses:
 *       200:
 *         description: Availability check result
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       400:
 *         description: Coworking not found or closed at this time
 *       401:
 *         description: Unauthorized
 */
router.post(
  '/check/:coworkingId',
  protect,
  checkAvailability
);

module.exports=router;