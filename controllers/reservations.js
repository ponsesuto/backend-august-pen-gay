// controllers/reservations.js
const Reservation = require('../models/Reservation');
const Coworking = require('../models/Coworking');
const User = require('../models/User');

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
        select: 'name type address telephone openTime closeTime price_per_hour' 
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

//@desc     Get Dashboard Statistics for Admin
//@route    GET /api/v1/reservations/dashboard/stats
//@access   Private/Admin
exports.getDashboardStats = async (req, res, next) => {
  try {
    // 🟢 รับค่า ปี จาก Frontend (ถ้าไม่ส่งมาจะใช้ปีปัจจุบัน)
    const year = req.query.year ? parseInt(req.query.year) : new Date().getFullYear();

    // 1. หาจำนวนสมาชิกทั้งหมด
    const membersCount = await User.countDocuments({ role: 'user' });

    // 2. หาจำนวนการจองของ "วันนี้"
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    // 🟢 ดึงข้อมูลการจองทั้งหมดที่มีคิวในวันนี้
    const reservationsToday = await Reservation.find({
      date: { $gte: startOfDay, $lte: endOfDay }
    });
    const bookingsTodayCount = reservationsToday.length; // จำนวน transaction การจองวันนี้

    // 🟢 คำนวณหาจำนวน "พื้นที่ (โต๊ะ/ห้อง)" ที่โดนจองไปแล้วในวันนี้ (นับแบบไม่ซ้ำกัน)
    const bookedUnits = new Set(reservationsToday.map(r => `${r.coworking}_${r.desk}`));
    const bookedUnitsTodayCount = bookedUnits.size; 

    // 3. ดึงข้อมูลการจองทั้งหมดเพื่อคำนวณรายได้รวม และรายได้แยกรายเดือน
    const allReservations = await Reservation.find().populate('coworking');
    let totalRevenue = 0;

    const monthlyRevenueMap = {
      0: { name: 'JAN', total: 0 }, 1: { name: 'FEB', total: 0 }, 2: { name: 'MAR', total: 0 },
      3: { name: 'APR', total: 0 }, 4: { name: 'MAY', total: 0 }, 5: { name: 'JUN', total: 0 },
      6: { name: 'JUL', total: 0 }, 7: { name: 'AUG', total: 0 }, 8: { name: 'SEP', total: 0 },
      9: { name: 'OCT', total: 0 }, 10: { name: 'NOV', total: 0 }, 11: { name: 'DEC', total: 0 }
    };

    allReservations.forEach(r => {
      if (r.coworking && r.coworking.price_per_hour && r.startTime && r.endTime) {
        const [startH, startM] = r.startTime.split(':').map(Number);
        const [endH, endM] = r.endTime.split(':').map(Number);
        
        let hours = (endH + (endM / 60)) - (startH + (startM / 60));
        if (hours < 0) hours += 24;
        
        if (hours > 0) {
          const amount = (hours * r.coworking.price_per_hour);
          totalRevenue += amount;

          const rDate = r.date ? new Date(r.date) : new Date(r.createdAt);
          if (rDate.getFullYear() === year) {
            monthlyRevenueMap[rDate.getMonth()].total += amount;
          }
        }
      }
    });

    const monthlyRevenue = Object.values(monthlyRevenueMap);

    // 🟢 4. อัตราการเข้าใช้งาน (Occupancy) แบบรายวัน
    const Coworking = require('../models/Coworking'); // ให้ชัวร์ว่ามีการเรียกใช้ Model
    const allSpaces = await Coworking.find();
    
    // เอา capacity ของทุกสาขามาบวกกัน
    const totalCapacity = allSpaces.reduce((sum, space) => sum + (space.capacity || 0), 0);

    let occupancy = 0;
    if (totalCapacity > 0) {
      occupancy = Math.min(Math.round((bookedUnitsTodayCount / totalCapacity) * 100), 100);
    }

    // 5. ดึงรายการธุรกรรมล่าสุด 5 รายการ
    const recentReservations = await Reservation.find()
      .sort({ createdAt: -1 })
      // .limit(5)
      .populate('user', 'name email')
      // 🟢 ดึง name ของ coworking มาด้วยเพื่อให้ฟอร์มแก้ไขโชว์ชื่อได้
      .populate('coworking', 'name price_per_hour'); 

    const recentTransactions = recentReservations.map(r => {
      let amount = 0;
      if (r.coworking && r.coworking.price_per_hour && r.startTime && r.endTime) {
        const [startH, startM] = r.startTime.split(':').map(Number);
        const [endH, endM] = r.endTime.split(':').map(Number);
        let hours = (endH + (endM / 60)) - (startH + (startM / 60));
        if (hours < 0) hours += 24;
        if (hours > 0) amount = hours * r.coworking.price_per_hour;
      }

      const displayDate = r.date ? new Date(r.date) : new Date(r.createdAt);

      return {
        id: r._id,
        user: r.user ? r.user.name : 'Unknown User',
        email: r.user ? r.user.email : 'N/A',
        amount: `฿${amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
        time: displayDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
        status: 'Completed',
        statusColor: 'bg-emerald-500/10 text-emerald-500',
        
        // 🟢 เพิ่มข้อมูลดิบ เอาไว้ให้ปุ่ม Edit ดึงไปแสดงในช่องกรอกข้อมูล
        rawDate: r.date ? displayDate.toISOString().split('T')[0] : '',
        startTime: r.startTime || '',
        endTime: r.endTime || '',
        desk: r.desk || '',
        coworkingId: r.coworking ? r.coworking._id : null,
        coworkingName: r.coworking ? r.coworking.name : ''
      };
    });

    res.status(200).json({
      success: true,
      data: {
        revenue: totalRevenue,
        members: membersCount,
        bookingsToday: bookingsTodayCount, // จำนวนการจองทั้งหมดวันนี้
        bookedSpacesToday: bookedUnitsTodayCount, // จำนวนพื้นที่(โต๊ะ) ที่โดนจองแล้ววันนี้
        occupancy: occupancy, // % อัตราการใช้พื้นที่ของวันนี้
        recentTransactions: recentTransactions,
        monthlyRevenue: monthlyRevenue 
      }
    });

  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error on Dashboard Stats' });
  }
};