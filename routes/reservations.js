const express = require('express');

const { getReservations, getReservation, addReservation, updateReservation, deleteReservation,checkAvailability,
deleteAllReservations} 
= require('../controllers/reservations');

const router = express.Router({mergeParams:true});

const {protect,authorize} = require('../middleware/auth');

router.route('/')
    .get(protect, authorize('admin','user') , getReservations)
    .post(protect, authorize('admin', 'user'), addReservation);
router.delete(
  '/deleteAll',
  protect,
  authorize('admin'),
  deleteAllReservations
);
router.route('/:id')
    .get(protect, authorize('admin','user') , getReservation)
    .put(protect, authorize('admin', 'user'), updateReservation)
    .delete(protect, authorize('admin', 'user'), deleteReservation);
router.post(
  '/check/:coworkingId',
  protect,
  checkAvailability
);

module.exports=router;