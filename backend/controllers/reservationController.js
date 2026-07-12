const Table = require('../models/Table');
const Reservation = require('../models/Reservation');
const {
  sendReservationConfirmationEmail,
  sendReservationCancellationEmail
} = require('../utils/mailer');

/* -------------------------------------------------- */
/* HELPER: emit tableUpdated via Socket.io            */
/* -------------------------------------------------- */
const emitTableUpdate = (req, tableId, newStatus) => {
  try {
    const io = req.app.locals.io;
    if (io) {
      io.emit('tableUpdated', { tableId, newStatus });
    }
  } catch (err) {
    console.error('Socket.io emit error:', err.message);
  }
};

/* -------------------------------------------------- */
/* CHECK AVAILABILITY                                 */
/* GET /api/reservations/availability?date=&timeSlot=&seats= */
/* -------------------------------------------------- */
exports.checkAvailability = async (req, res) => {
  try {
    const { date, timeSlot, seats } = req.query;

    if (!date || !timeSlot || !seats) {
      return res.status(400).json({
        success: false,
        message: 'date, timeSlot, and seats are required'
      });
    }

    const numSeats = parseInt(seats);

    // Find tables with enough capacity that are active and NOT locked
    const suitableTables = await Table.find({
      capacity: { $gte: numSeats },
      isActive: true,
      $or: [{ lockedUntil: null }, { lockedUntil: { $lt: new Date() } }]
    });

    if (suitableTables.length === 0) {
      return res.json({
        success: true,
        availableCount: 0,
        tables: []
      });
    }

    const suitableIds = suitableTables.map(t => t._id);

    // Find reservations that clash with the requested date + timeSlot
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const bookedReservations = await Reservation.find({
      tableId: { $in: suitableIds },
      date: { $gte: startOfDay, $lte: endOfDay },
      timeSlot,
      status: { $in: ['pending', 'confirmed'] }
    }).select('tableId');

    const bookedTableIds = new Set(
      bookedReservations.map(r => r.tableId.toString())
    );

    const availableTables = suitableTables.filter(
      t => !bookedTableIds.has(t._id.toString())
    );

    return res.json({
      success: true,
      availableCount: availableTables.length,
      tables: availableTables
    });
  } catch (err) {
    console.error('checkAvailability error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

/* -------------------------------------------------- */
/* CREATE RESERVATION                                 */
/* POST /api/reservations                             */
/* -------------------------------------------------- */
exports.createReservation = async (req, res) => {
  try {
    const {
      customerName,
      customerEmail,
      customerPhone,
      date,
      timeSlot,
      numberOfSeats,
      tableId,
      sessionId
    } = req.body;

    if (
      !customerName ||
      !customerEmail ||
      !customerPhone ||
      !date ||
      !timeSlot ||
      !numberOfSeats ||
      !tableId
    ) {
      return res.status(400).json({
        success: false,
        message: 'All fields including tableId are required'
      });
    }

    // Pre-check: Is this table already reserved for this specific date+timeSlot?
    // This is the per-slot check — NOT based on currentStatus (which is just a persistent display field)
    const slotStart = new Date(date);
    slotStart.setHours(0, 0, 0, 0);
    const slotEnd = new Date(date);
    slotEnd.setHours(23, 59, 59, 999);

    const existingSlotReservation = await Reservation.findOne({
      tableId,
      date: { $gte: slotStart, $lte: slotEnd },
      timeSlot,
      status: { $in: ['confirmed', 'pending'] }
    });

    if (existingSlotReservation) {
      return res.status(409).json({
        success: false,
        message: 'This table is already booked for the selected date and time slot.'
      });
    }

    // Phase 1: Atomic Lock Acquisition
    // NOTE: We do NOT check currentStatus here — currentStatus is a display flag
    // and may still say 'reserved' from a past booking. We rely on the per-slot
    // reservation check above + the lock mechanism for true concurrency control.
    const lockExpiry = new Date(Date.now() + 30000); // lock for 30s
    const acquiredTable = await Table.findOneAndUpdate(
      {
        _id: tableId,
        isActive: true,
        $or: [{ lockedUntil: null }, { lockedUntil: { $lt: new Date() } }]
      },
      {
        $set: {
          lockedUntil: lockExpiry,
          lockedBy: sessionId || 'system'
        }
      },
      { new: true }
    );

    if (!acquiredTable) {
      return res.status(409).json({
        success: false,
        message: 'Table just got booked by someone else. Please go back and recheck availability.'
      });
    }

    // Phase 2: Create Reservation
    try {
      // Create reservation
      const reservation = new Reservation({
        customerName,
        customerEmail,
        customerPhone,
        tableId: acquiredTable._id,
        date: new Date(date),
        timeSlot,
        numberOfSeats,
        status: 'confirmed',
        sessionId
      });

      await reservation.save();

      // Finalize table status and clear lock
      acquiredTable.currentStatus = 'reserved';
      acquiredTable.lockedUntil = null;
      acquiredTable.lockedBy = null;
      await acquiredTable.save();

      // Emit real-time update
      emitTableUpdate(req, acquiredTable._id, 'reserved');

      // Send confirmation email (non-blocking)
      sendReservationConfirmationEmail({
        customerName,
        customerEmail,
        confirmationCode: reservation.confirmationCode,
        tableNumber: acquiredTable.tableNumber,
        capacity: acquiredTable.capacity,
        location: acquiredTable.location,
        date: reservation.date,
        timeSlot,
        numberOfSeats
      }).catch(err =>
        console.error('Reservation email failed (non-fatal):', err.message)
      );

      return res.status(201).json({
        success: true,
        message: 'Reservation created successfully',
        data: {
          reservation: {
            ...reservation.toObject(),
            tableNumber: acquiredTable.tableNumber,
            location: acquiredTable.location,
            capacity: acquiredTable.capacity
          }
        }
      });
    } catch (phase2Error) {
      // Rollback lock if Phase 2 fails
      console.error('Phase 2 booking error, releasing lock...', phase2Error);
      await Table.findByIdAndUpdate(tableId, { lockedUntil: null, lockedBy: null });
      throw phase2Error; // Handled by outer catch
    }
  } catch (err) {
    console.error('createReservation error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

/* -------------------------------------------------- */
/* CANCEL RESERVATION (by confirmationCode)           */
/* POST /api/reservations/cancel                      */
/* -------------------------------------------------- */
exports.cancelReservation = async (req, res) => {
  try {
    const { confirmationCode } = req.body;

    if (!confirmationCode) {
      return res.status(400).json({
        success: false,
        message: 'confirmationCode is required'
      });
    }

    const reservation = await Reservation.findOne({
      confirmationCode: confirmationCode.toUpperCase()
    }).populate('tableId');

    if (!reservation) {
      return res.status(404).json({
        success: false,
        message: 'Reservation not found'
      });
    }

    if (reservation.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Reservation is already cancelled'
      });
    }

    reservation.status = 'cancelled';
    await reservation.save();

    // Free up the table
    const table = reservation.tableId;
    if (table) {
      table.currentStatus = 'available';
      await table.save();
      emitTableUpdate(req, table._id, 'available');
    }

    // Send cancellation email (non-blocking)
    sendReservationCancellationEmail({
      customerName: reservation.customerName,
      customerEmail: reservation.customerEmail,
      confirmationCode: reservation.confirmationCode,
      tableNumber: table ? table.tableNumber : 'N/A',
      date: reservation.date,
      timeSlot: reservation.timeSlot
    }).catch(err =>
      console.error('Cancellation email failed (non-fatal):', err.message)
    );

    return res.json({
      success: true,
      message: 'Reservation cancelled successfully'
    });
  } catch (err) {
    console.error('cancelReservation error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

/* -------------------------------------------------- */
/* GET ALL RESERVATIONS (admin)                       */
/* GET /api/reservations                              */
/* -------------------------------------------------- */
exports.getAllReservations = async (req, res) => {
  try {
    const { date, status } = req.query;
    const filter = {};

    if (status) filter.status = status;

    if (date) {
      const start = new Date(date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(date);
      end.setHours(23, 59, 59, 999);
      filter.date = { $gte: start, $lte: end };
    }

    const reservations = await Reservation.find(filter)
      .populate('tableId', 'tableNumber capacity location currentStatus')
      .sort({ createdAt: -1 });

    return res.json({
      success: true,
      data: { reservations }
    });
  } catch (err) {
    console.error('getAllReservations error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

/* -------------------------------------------------- */
/* UPDATE RESERVATION STATUS (admin)                  */
/* PUT /api/reservations/:id/status                   */
/* -------------------------------------------------- */
exports.updateReservationStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['pending', 'confirmed', 'cancelled', 'completed'];

    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `status must be one of: ${validStatuses.join(', ')}`
      });
    }

    const reservation = await Reservation.findById(req.params.id).populate(
      'tableId'
    );

    if (!reservation) {
      return res.status(404).json({
        success: false,
        message: 'Reservation not found'
      });
    }

    reservation.status = status;
    await reservation.save();

    // Sync table status based on reservation status
    const table = reservation.tableId;
    if (table) {
      if (status === 'cancelled' || status === 'completed') {
        table.currentStatus = 'available';
      } else if (status === 'confirmed') {
        table.currentStatus = 'reserved';
      }
      await table.save();
      emitTableUpdate(req, table._id, table.currentStatus);
    }

    return res.json({
      success: true,
      message: `Reservation marked as ${status}`,
      data: { reservation }
    });
  } catch (err) {
    console.error('updateReservationStatus error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

/* -------------------------------------------------- */
/* GET ALL TABLES (for availability grid)             */
/* GET /api/reservations/tables                       */
/* Computes real-time effective status per table      */
/* based on actual reservations for NOW, not the      */
/* persistent currentStatus field which can go stale. */
/* -------------------------------------------------- */
exports.getAllTables = async (req, res) => {
  try {
    const tables = await Table.find({ isActive: true }).sort({ tableNumber: 1 });

    // Compute current time slot string, e.g. "14:00-15:00"
    const now = new Date();
    const currentHour = now.getHours();
    const currentTimeSlot = `${String(currentHour).padStart(2, '0')}:00-${String(currentHour + 1).padStart(2, '0')}:00`;
    const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0);
    const todayEnd   = new Date(now); todayEnd.setHours(23, 59, 59, 999);

    // Find confirmed reservations active RIGHT NOW (today + current slot)
    const activeNowReservations = await Reservation.find({
      tableId: { $in: tables.map(t => t._id) },
      date: { $gte: todayStart, $lte: todayEnd },
      timeSlot: currentTimeSlot,
      status: { $in: ['confirmed', 'pending'] }
    }).select('tableId');

    const reservedNowIds = new Set(
      activeNowReservations.map(r => r.tableId.toString())
    );

    // Also find tables that are locked (mid-booking transaction)
    const lockedIds = new Set(
      tables
        .filter(t => t.lockedUntil && t.lockedUntil > now)
        .map(t => t._id.toString())
    );

    // Build response with computed effectiveStatus
    const tablesWithStatus = tables.map(t => {
      let effectiveStatus;
      if (t.currentStatus === 'occupied') {
        // 'occupied' is manually set by admin — honour it
        effectiveStatus = 'occupied';
      } else if (lockedIds.has(t._id.toString())) {
        // Currently being booked by someone (lock active)
        effectiveStatus = 'reserved';
      } else if (reservedNowIds.has(t._id.toString())) {
        // Has a confirmed/pending reservation for THIS exact hour
        effectiveStatus = 'reserved';
      } else {
        // No active reservation for this slot → available
        effectiveStatus = 'available';
      }
      return { ...t.toObject(), currentStatus: effectiveStatus };
    });

    return res.json({ success: true, data: { tables: tablesWithStatus } });
  } catch (err) {
    console.error('getAllTables error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

/* -------------------------------------------------- */
/* GET MY RESERVATIONS (logged-in user)               */
/* GET /api/reservations/my                           */
/* -------------------------------------------------- */
exports.getMyReservations = async (req, res) => {
  try {
    // req.user is set by the protect middleware (JWT verified)
    const userEmail = req.user.email.toLowerCase();

    const reservations = await Reservation.find({ customerEmail: userEmail })
      .populate('tableId', 'tableNumber capacity location currentStatus')
      .sort({ createdAt: -1 });

    return res.json({
      success: true,
      data: { reservations }
    });
  } catch (err) {
    console.error('getMyReservations error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

/* -------------------------------------------------- */
/* CANCEL MY RESERVATION (logged-in user, email-gated)*/
/* POST /api/reservations/cancel-my                   */
/* -------------------------------------------------- */
exports.cancelMyReservation = async (req, res) => {
  try {
    const { confirmationCode } = req.body;
    const userEmail = req.user.email.toLowerCase();

    if (!confirmationCode) {
      return res.status(400).json({
        success: false,
        message: 'confirmationCode is required'
      });
    }

    const reservation = await Reservation.findOne({
      confirmationCode: confirmationCode.toUpperCase()
    }).populate('tableId');

    if (!reservation) {
      return res.status(404).json({
        success: false,
        message: 'Reservation not found'
      });
    }

    // ✅ Email ownership check — only owner can cancel
    if (reservation.customerEmail.toLowerCase() !== userEmail) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorised to cancel this reservation.'
      });
    }

    if (reservation.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Reservation is already cancelled'
      });
    }

    if (reservation.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Completed reservations cannot be cancelled'
      });
    }

    reservation.status = 'cancelled';
    await reservation.save();

    // Free the table
    const table = reservation.tableId;
    if (table) {
      table.currentStatus = 'available';
      await table.save();
      emitTableUpdate(req, table._id, 'available');
    }

    // Send cancellation email (non-blocking)
    sendReservationCancellationEmail({
      customerName: reservation.customerName,
      customerEmail: reservation.customerEmail,
      confirmationCode: reservation.confirmationCode,
      tableNumber: table ? table.tableNumber : 'N/A',
      date: reservation.date,
      timeSlot: reservation.timeSlot
    }).catch(err =>
      console.error('Cancellation email failed (non-fatal):', err.message)
    );

    return res.json({
      success: true,
      message: 'Reservation cancelled successfully'
    });
  } catch (err) {
    console.error('cancelMyReservation error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};
