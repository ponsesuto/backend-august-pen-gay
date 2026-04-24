const express = require('express');
const {
    getCoworkings,
    getCoworking,
    createCoworking,
    updateCoworking,
    deleteCoworking
} = require('../controllers/coworkings');

const reservationRouter = require('./reservations');

const router = express.Router();
const { protect, authorize } = require('../middleware/auth');

// Re-route into other resource routers
router.use('/:coworkingId/reservations', reservationRouter);

/**
 * @swagger
 * /coworkings:
 *   get:
 *     summary: Get all coworking spaces
 *     tags: [Coworkings]
 *     responses:
 *       200:
 *         description: List of coworking spaces
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
 *                       name:
 *                         type: string
 *                       type:
 *                         type: string
 *                       address:
 *                         type: string
 *                       telephone:
 *                         type: string
 *                       openTime:
 *                         type: string
 *                       closeTime:
 *                         type: string
 *                       price_per_hour:
 *                         type: number
 *                       capacity:
 *                         type: integer
 *   post:
 *     summary: Create a new coworking space (Admin only)
 *     tags: [Coworkings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - type
 *               - address
 *               - telephone
 *               - openTime
 *               - closeTime
 *               - price_per_hour
 *               - capacity
 *             properties:
 *               name:
 *                 type: string
 *                 example: Green Flag Coworking Space
 *               type:
 *                 type: string
 *                 example: Shared Office
 *               address:
 *                 type: string
 *                 example: 123 Main Street, Bangkok
 *               telephone:
 *                 type: string
 *                 example: 0212345678
 *               openTime:
 *                 type: string
 *                 example: 09:00
 *               closeTime:
 *                 type: string
 *                 example: 18:00
 *               price_per_hour:
 *                 type: number
 *                 example: 120
 *               capacity:
 *                 type: integer
 *                 example: 50
 *     responses:
 *       201:
 *         description: Coworking space created successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin only
 */
router.route('/')
    .get(getCoworkings)
    .post(protect, authorize('admin'), createCoworking);

/**
 * @swagger
 * /coworkings/{id}:
 *   get:
 *     summary: Get single coworking space
 *     tags: [Coworkings]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Coworking space ID
 *     responses:
 *       200:
 *         description: Coworking space details
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
 *                     _id:
 *                       type: string
 *                     name:
 *                       type: string
 *                     type:
 *                       type: string
 *                     address:
 *                       type: string
 *                     telephone:
 *                       type: string
 *                     openTime:
 *                       type: string
 *                     closeTime:
 *                       type: string
 *                     price_per_hour:
 *                       type: number
 *                     capacity:
 *                       type: integer
 *                     reservations:
 *                       type: array
 *       404:
 *         description: Coworking space not found
 *   put:
 *     summary: Update coworking space (Admin only)
 *     tags: [Coworkings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
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
 *             properties:
 *               name:
 *                 type: string
 *               type:
 *                 type: string
 *               address:
 *                 type: string
 *               telephone:
 *                 type: string
 *               openTime:
 *                 type: string
 *               closeTime:
 *                 type: string
 *               price_per_hour:
 *                 type: number
 *               capacity:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Coworking space updated successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin only
 *       404:
 *         description: Coworking space not found
 *   delete:
 *     summary: Delete coworking space (Admin only)
 *     tags: [Coworkings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Coworking space ID
 *     responses:
 *       200:
 *         description: Coworking space deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin only
 *       404:
 *         description: Coworking space not found
 */
router.route('/:id')
    .get(getCoworking)
    .put(protect, authorize('admin'), updateCoworking)
    .delete(protect, authorize('admin'), deleteCoworking);

module.exports = router;