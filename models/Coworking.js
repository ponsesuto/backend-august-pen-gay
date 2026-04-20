const mongoose = require('mongoose');

const CoworkingSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Please add a name'],
            unique: true,
            trim: true,
            maxlength: [100, 'Name can not be more than 100 characters']
        },
        address: {
            type: String,
            required: [true, 'Please add an address']
        },
        telephone: {
            type: String,
            required: [true, 'Please add a telephone number']
        },
        openTime: {
            type: String,
            required: [true, 'Please add an open time (e.g., 08:00)']
        },
        closeTime: {
            type: String,
            required: [true, 'Please add a close time (e.g., 20:00)']
        },
        // ✅ เพิ่มราคาต่อชั่วโมง
        price_per_hour: { type: Number, required: true },

        // 🟢 เพิ่ม capacity (ความจุ/จำนวนที่นั่งทั้งหมด) สำหรับคำนวณ Occupancy
        capacity: { 
            type: Number, 
            required: true,
            default: 10 // ตั้งค่าเริ่มต้นไว้ที่ 10 เพื่อไม่ให้ข้อมูลเก่าพัง
        },

        // ✅ เพิ่ม rating
        rating: { type: Number, default: 0, min: 0, max: 5 },

        // ✅ เพิ่ม status
        status: {
            type: String,
            enum: ["available", "unavailable", "maintenance"],
            default: "available"
        },
        // ✅ เพิ่ม type
        type: {
            type: String,
            enum: ["desk", "room", "meeting", "private"],
            required: true
        },
        
        // 🟢 เพิ่มฟิลด์สำหรับ Soft Delete
        isDeleted: {
            type: Boolean,
            default: false
        }
    },
    {
        toJSON: { virtuals: true },
        toObject: { virtuals: true }
    }
);

CoworkingSchema.virtual('reservations', {
    ref: 'Reservation',
    localField: '_id',
    foreignField: 'coworking',
    justOne: false
});

module.exports = mongoose.model('Coworking', CoworkingSchema);