const express = require('express');
const { protect, admin } = require('../middlewares/auth');
const {
  checkAvailability,
  createReservation,
  cancelReservation,
  getAllReservations,
  updateReservationStatus,
  getAllTables,
  getMyReservations,
  cancelMyReservation
} = require('../controllers/reservationController');

const router = express.Router();

/* -------------------------------------------------- */
/* PUBLIC ROUTES                                      */
/* -------------------------------------------------- */

// GET /api/reservations/availability?date=&timeSlot=&seats=
router.get('/availability', checkAvailability);

// GET /api/reservations/tables — visual grid (public)
router.get('/tables', getAllTables);

// POST /api/reservations — create booking
router.post('/', createReservation);

// POST /api/reservations/cancel — cancel by confirmationCode (public / anonymous flow)
router.post('/cancel', cancelReservation);

/* -------------------------------------------------- */
/* LOGGED-IN USER ROUTES                              */
/* -------------------------------------------------- */

// GET /api/reservations/my — fetch reservations matching the logged-in user's email
router.get('/my', protect, getMyReservations);

// POST /api/reservations/cancel-my — cancel own reservation (email-gated)
router.post('/cancel-my', protect, cancelMyReservation);

/* -------------------------------------------------- */
/* ADMIN ROUTES                                       */
/* -------------------------------------------------- */

// GET /api/reservations — all reservations (admin)
router.get('/', protect, admin, getAllReservations);

// PUT /api/reservations/:id/status — update status (admin)
router.put('/:id/status', protect, admin, updateReservationStatus);

module.exports = router;
