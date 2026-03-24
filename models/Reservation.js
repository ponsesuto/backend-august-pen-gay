const mongoose = require('mongoose');

const ReservationSchema = new mongoose.Schema({
    date: {
        type: Date,
        required: true
    },
    // 🟢 เพิ่มฟิลด์ startTime เข้ามา
    startTime: {
        type: String, 
        required: true
    },
    // 🟢 เพิ่มฟิลด์ endTime เข้ามา
    endTime: {
        type: String,
        required: true
    },
    // 🟢 เพิ่มฟิลด์ desk สำหรับเก็บหมายเลขโต๊ะ (ถ้าจำเป็นต้องบังคับเลือกโต๊ะ ให้ใส่ required: true)
    desk: {
        type: String,
        required: true
    },
    user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
    },
    coworking: { 
        type: mongoose.Schema.ObjectId,
        ref: 'Coworking', 
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Reservation', ReservationSchema);