const Reservation = require('../models/Reservation');
const Coworking = require('../models/Coworking');
const mongoose = require('mongoose');

//@desc     Get sales data filtered by year, month, and coworking
//@route    GET /api/v1/sales
//@access   Private/Admin
exports.getSales = async (req, res, next) => {
  try {
    const { year, month, coworking } = req.query;

    // Validate year parameter
    if (!year) {
      return res.status(400).json({
        success: false,
        message: 'Year parameter is required'
      });
    }

    const startDate = new Date(`${year}-01-01`);
    const endDate = new Date(`${year}-12-31`);
    endDate.setHours(23, 59, 59, 999);

    let salesData = [];

    if (month === 'all' || !month) {
      // Case 1: Get monthly data for the entire year
      
      // First, check if there are any reservations in the date range
      const reservationCount = await Reservation.countDocuments({
        date: {
          $gte: startDate,
          $lte: endDate
        }
      });
      
      // Check if there are any reservations in other years
      const totalReservations = await Reservation.countDocuments();
      
      if (totalReservations > 0) {
        // Check what years have reservations
        const yearsWithReservations = await Reservation.aggregate([
          {
            $group: {
              _id: { $year: '$date' },
              count: { $sum: 1 }
            }
          },
          {
            $sort: { '_id': -1 }
          }
        ]);
      }
      
      // Get a sample reservation to check format
      const sampleReservation = await Reservation.findOne({
        date: {
          $gte: startDate,
          $lte: endDate
        }
      });
      
      // Build match stage
      const matchStage = {
        date: {
          $gte: startDate,
          $lte: endDate
        }
      };
      
      // Add coworking filter if provided
      if (coworking && mongoose.Types.ObjectId.isValid(coworking)) {
        matchStage.coworking = new mongoose.Types.ObjectId(coworking);
      }
      
      const monthlySales = await Reservation.aggregate([
        {
          $match: matchStage
        },
        {
          $lookup: {
            from: 'coworkings',
            localField: 'coworking',
            foreignField: '_id',
            as: 'coworkingInfo'
          }
        },
        {
          $unwind: '$coworkingInfo'
        },
        {
          $addFields: {
            pricePerHour: '$coworkingInfo.price_per_hour',
            // Parse hours from time strings (assuming format "HH:MM")
            startHour: { $toInt: { $substr: ['$startTime', 0, 2] } },
            endHour: { $toInt: { $substr: ['$endTime', 0, 2] } }
          }
        },
        {
          $addFields: {
            durationHours: { $subtract: ['$endHour', '$startHour'] }
          }
        },
        {
          $addFields: {
            revenue: {
              $multiply: ['$pricePerHour', '$durationHours']
            }
          }
        },
        {
          $group: {
            _id: {
              month: { $month: '$date' }
            },
            total: { 
              $sum: '$revenue' 
            }
          }
        },
        {
          $sort: { '_id.month': 1 }
        }
      ]);

      // Map month numbers to month names
      const monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
      
      // Initialize all months with 0
      const monthlyData = monthNames.map((name, index) => ({
        name: name,
        total: 0
      }));

      // Fill in actual data
      monthlySales.forEach(item => {
        const monthIndex = item._id.month - 1;
        if (monthIndex >= 0 && monthIndex < 12) {
          monthlyData[monthIndex].total = item.total;
        }
      });

      salesData = monthlyData;

    } else {
      // Case 2: Get daily data for a specific month
      const monthNum = parseInt(month);
      if (isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
        return res.status(400).json({
          success: false,
          message: 'Invalid month parameter. Must be between 1 and 12'
        });
      }

      const monthStartDate = new Date(`${year}-${monthNum.toString().padStart(2, '0')}-01`);
      const monthEndDate = new Date(year, monthNum, 0); // Last day of the month
      monthEndDate.setHours(23, 59, 59, 999);

      // Build match stage
      const matchStage = {
        date: {
          $gte: monthStartDate,
          $lte: monthEndDate
        }
      };
      
      // Add coworking filter if provided
      if (coworking && mongoose.Types.ObjectId.isValid(coworking)) {
        matchStage.coworking = new mongoose.Types.ObjectId(coworking);
      }

      const dailySales = await Reservation.aggregate([
        {
          $match: matchStage
        },
        {
          $lookup: {
            from: 'coworkings',
            localField: 'coworking',
            foreignField: '_id',
            as: 'coworkingInfo'
          }
        },
        {
          $unwind: '$coworkingInfo'
        }
      ]);

      // Calculate revenue in JavaScript
      const dailySalesWithRevenue = dailySales.map(item => {
        let durationHours = 0;
        if (item.startTime && item.endTime) {
          const [startH, startM] = item.startTime.split(':').map(Number);
          const [endH, endM] = item.endTime.split(':').map(Number);
          durationHours = (endH + (endM / 60)) - (startH + (startM / 60));
          if (durationHours < 0) durationHours += 24;
        }
        const revenue = (item.coworkingInfo.price_per_hour || 0) * durationHours;
        return {
          day: { $dayOfMonth: '$date' },
          total: revenue,
          date: item.date
        };
      });
      
      // Group by day
      const dailySalesGrouped = {};
      dailySalesWithRevenue.forEach(item => {
        const day = new Date(item.date).getDate();
        if (!dailySalesGrouped[day]) {
          dailySalesGrouped[day] = 0;
        }
        dailySalesGrouped[day] += item.total;
      });
      
      // Convert to array format
      const dailySalesArray = Object.keys(dailySalesGrouped).map(day => ({
        _id: { day: parseInt(day) },
        total: dailySalesGrouped[parseInt(day)]
      })).sort((a, b) => a._id.day - b._id.day);

      // Get the number of days in the selected month
      const daysInMonth = monthEndDate.getDate();

      // Initialize all days with 0
      const dailyData = Array.from({ length: daysInMonth }, (_, index) => ({
        name: (index + 1).toString(),
        total: 0
      }));

      // Fill in actual data
      dailySalesArray.forEach(item => {
        const dayIndex = item._id.day - 1;
        if (dayIndex >= 0 && dayIndex < daysInMonth) {
          dailyData[dayIndex].total = item.total;
        }
      });

      salesData = dailyData;
    }

    res.status(200).json({
      success: true,
      data: salesData
    });

  } catch (error) {
    console.error('Error fetching sales data:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};
