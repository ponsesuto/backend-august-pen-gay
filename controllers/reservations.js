// controllers/reservations.js
const Reservation = require('../models/Reservation');
const Coworking = require('../models/Coworking');

//@desc    Get all reservations
//@route   GET /api/v1/reservations
//@access  Private
exports.getReservations = async (req, res, next) => {
  try {
    let filter = {};

    // ถ้าเป็น user ธรรมดา → ดูได้เฉพาะของตัวเอง (ถ้าเป็น admin จะไม่มี filter นี้ ทำให้ดึงข้อมูลทุกคน)
    if (req.user.role !== "admin") {
      filter.user = req.user.id;
    }

    // Filter by date (แบบทั้งวัน)
    if (req.query.date) {
      const selectedDate = new Date(req.query.date);
      const nextDate = new Date(req.query.date);
      nextDate.setDate(nextDate.getDate() + 1);

      filter.date = {
        $gte: selectedDate,
        $lt: nextDate
      };
    }

    // 🟢 แก้ไขตรงนี้: เพิ่มการ populate('user') และเพิ่ม type ของ coworking
    const reservations = await Reservation.find(filter)
      .populate({
        path: 'coworking',
        select: 'name type address telephone openTime closeTime' 
      })
      .populate({
        path: 'user',
        select: 'name _id' // 🟢 ทำให้ Admin เห็นชื่อ User ใน Frontend ได้
      });

    res.status(200).json({
      success: true,
      count: reservations.length,
      data: reservations
    });

  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Cannot find Reservation"
    });
  }
};

//@desc    Get single reservation
//@route   GET /api/v1/reservations/:id
//@access  Private
exports.getReservation = async (req, res, next) => {
  try {
    const reservation = await Reservation.findById(req.params.id)
      .populate({
        path: 'coworking',
        select: 'name type address telephone openTime closeTime'
      })
      .populate({
        path: 'user',
        select: 'name _id'
      });

    if (!reservation) {
      return res.status(404).json({
        success: false,
        message: `No reservation with the id of ${req.params.id}`
      });
    }

    res.status(200).json({
      success: true,
      data: reservation
    });

    } catch (error) {
      console.log(error);
      return res.status(500).json({
      success: false,
      message: "Cannot find Reservation"
    });
  }
};

//@desc    Add reservation
//@route   POST /api/v1/coworkings/:coworkingId/reservations
//@access  Private
exports.addReservation = async (req, res, next) => {
    try {

        req.body.coworking = req.params.coworkingId; 

        req.body.user = req.user.id;
        
        const coworking = await Coworking.findById(req.params.coworkingId);

        if (!coworking) {
            return res.status(404).json({
              success:false,
              message: `No Coworking with the id of ${req.params.coworkingId}`
            });
        }

        const existedReservations = await Reservation.find({user:req.user.id});

        if (existedReservations.length >= 3 && req.user.role !== 'admin') {
            return res.status(400).json({
                success: false,
                message: `The user with ID ${req.user.id} has already made 3 reservations`
            }); 
        }

        const reservation = await Reservation.create(req.body);

        res.status(200).json({
            success: true,
            data: reservation
        });

    } catch (err) {
        console.log(err.stack);
        res.status(500).json({
            success: false,
            message: "Cannot create Reservation"
        });
    }
};

//@desc     Update reservation
//@route    PUT /api/v1/reservations/:id
//@access   Private
exports.updateReservation = async (req, res, next) => {
  try {
    let reservation = await Reservation.findById(req.params.id);

    if (!reservation) {
      return res.status(404).json({
        success: false,
        message: `No reservation with the id of ${req.params.id}`
      });
    }
    // Requirement #5 & #8: User edit their own, Admin edit any
    if (reservation.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({
        success: false,
        message: `User ${req.user.id} is not authorized to update this reservation`
      });
    }

    reservation = await Reservation.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    );

    res.status(200).json({
      success: true,
      data: reservation
    });

  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Cannot update Reservation"
    });
  }
};

//@desc     Delete reservation
//@route    DELETE /api/v1/reservations/:id
//@access   Private
exports.deleteReservation = async (req, res, next) => {
  try {
    const reservation = await Reservation.findById(req.params.id);

    if (!reservation) {
      return res.status(404).json({
        success: false,
        message: `No reservation with the id of ${req.params.id}`
      });
    }

    // Requirement #6 & #9: User delete their own, Admin delete any
    if (reservation.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({
        success: false,
        message: `User ${req.user.id} is not authorized to delete this reservation`
      });
    }

    await reservation.deleteOne();

    res.status(200).json({
      success: true,
      data: {}
    });

  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Cannot delete Reservation"
    });
  }
};

exports.checkAvailability = async (req, res, next) => {
  try {
    const { date } = req.body;

    const coworking = await Coworking.findById(req.params.coworkingId);

    if (!coworking) {
      console.log("Coworking not found");
      return res.status(404).json({
        success: false,
        message: "Coworking not found"
      });
    }

    const bookingTime = new Date(date);
    const hour = bookingTime.getHours();

    const openHour = parseInt(coworking.openTime.split(":")[0]);
    const closeHour = parseInt(coworking.closeTime.split(":")[0]);

    if (!(hour >= openHour && hour < closeHour)) {
      return res.status(400).json({
        success: false,
        reason: "Coworking is closed at this time"
      });
    }
    res.status(200).json({
      success: true,
      message: "Slot is available"
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Server Error"
    });
  }
};

exports.deleteAllReservations = async (req, res, next) => {
  try {

    const result = await Reservation.deleteMany({});

    res.status(200).json({
      success: true,
      deletedCount: result.deletedCount,
      message: "All reservations have been deleted"
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete reservations"
    });
  }
};