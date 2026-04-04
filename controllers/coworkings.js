const Coworking = require('../models/Coworking');

//@desc     Get all coworking spaces
//@route    GET /api/v1/coworkings
//@access   Public
exports.getCoworkings = async (req, res, next) => {
    try {
        // ลองดึงแบบคลีนๆ เพื่อเช็คว่าต่อ DB ติดจริงไหม
        const coworkings = await Coworking.find(); 
        
        res.status(200).json({
            success: true, 
            count: coworkings.length, 
            data: coworkings
        });
    } catch (err) {
        res.status(400).json({ success: false });
    }
};
//@desc     Get single coworking space
//@route    GET /api/v1/coworkings/:id
//@access   Public
exports.getCoworking = async (req, res, next) => {
    try {
        const coworking = await Coworking.findById(req.params.id).populate('reservations');
        if (!coworking) {
            return res.status(400).json({ success: false, message: 'Coworking space not found' });
        }
        res.status(200).json({ success: true, data: coworking });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

//@desc     Create new coworking space
//@route    POST /api/v1/coworkings
//@access   Private (Admin)
exports.createCoworking = async (req, res, next) => {
    try {
        const coworking = await Coworking.create(req.body);
        res.status(201).json({ success: true, data: coworking });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

//@desc     Update coworking space
//@route    PUT /api/v1/coworkings/:id
//@access   Private (Admin)
exports.updateCoworking = async (req, res, next) => {
    try {
        const coworking = await Coworking.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });
        if (!coworking) {
            return res.status(400).json({ success: false, message: 'Coworking space not found' });
        }
        res.status(200).json({ success: true, data: coworking });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

//@desc     Delete coworking space
//@route    DELETE /api/v1/coworkings/:id
//@access   Private (Admin)
exports.deleteCoworking = async (req, res, next) => {
    try {
        const coworking = await Coworking.findById(req.params.id);
        
        if (!coworking) {
            return res.status(404).json({ success: false, message: 'Coworking space not found' });
        }
        const Reservation = require('../models/Reservation'); 
        await Reservation.deleteMany({ coworking: req.params.id });

        await coworking.deleteOne(); 

        res.status(200).json({ success: true, data: {} });
    } catch (err) {
        res.status(400).json({ 
            success: false, 
            message: err.message 
        });
    }
};