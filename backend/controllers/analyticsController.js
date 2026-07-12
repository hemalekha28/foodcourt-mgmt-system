const Reservation = require('../models/Reservation');
const Table = require('../models/Table');

// 1. Get reservations by day
exports.getReservationsByDay = async (req, res) => {
  try {
    const data = await Reservation.aggregate([
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
          totalReservations: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } },
      {
        $project: {
          _id: 0,
          date: "$_id",
          totalReservations: 1
        }
      }
    ]);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// 2. Get reservations by time slot
exports.getReservationsByTimeSlot = async (req, res) => {
  try {
    const data = await Reservation.aggregate([
      {
        $group: {
          _id: "$timeSlot",
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      {
        $project: {
          _id: 0,
          timeSlot: "$_id",
          count: 1
        }
      }
    ]);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// 3. Get table utilisation
exports.getTableUtilisation = async (req, res) => {
  try {
    const data = await Reservation.aggregate([
      { $match: { status: 'confirmed' } },
      {
        $group: {
          _id: "$tableId",
          totalBookings: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'tables',
          localField: '_id',
          foreignField: '_id',
          as: 'tableInfo'
        }
      },
      { $unwind: '$tableInfo' },
      {
        $project: {
          _id: 0,
          tableNumber: '$tableInfo.tableNumber',
          capacity: '$tableInfo.capacity',
          totalBookings: 1
        }
      }
    ]);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// 4. Get status breakdown
exports.getStatusBreakdown = async (req, res) => {
  try {
    const data = await Reservation.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          _id: 0,
          status: "$_id",
          count: 1
        }
      }
    ]);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
