const express = require('express');
const { protect, admin } = require('../middlewares/auth');
const {
  getReservationsByDay,
  getReservationsByTimeSlot,
  getTableUtilisation,
  getStatusBreakdown
} = require('../controllers/analyticsController');

const router = express.Router();

router.get('/by-day', protect, admin, getReservationsByDay);
router.get('/by-timeslot', protect, admin, getReservationsByTimeSlot);
router.get('/table-utilisation', protect, admin, getTableUtilisation);
router.get('/status-breakdown', protect, admin, getStatusBreakdown);

module.exports = router;
