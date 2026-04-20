const express = require('express');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
const connectDB = require('./config/db'); 
const mongoSanitize = require('express-mongo-sanitize');
const helmet = require('helmet');
const { xss } = require('express-xss-sanitizer');
const rateLimit = require('express-rate-limit');
const hpp = require('hpp');
const cors = require('cors');

// นำเข้า Swagger
const swaggerJsDoc = require('swagger-jsdoc');
const swaggerUI = require('swagger-ui-express');

// Load env vars
dotenv.config({ path: './config/config.env' });

// Connect to database
connectDB(); 

// --- [ 1. ดึงไฟล์ Router เข้ามา ] ---
const coworkings = require('./routes/coworkings');
const reservations = require('./routes/reservations');
const auth = require('./routes/auth');
const sales = require('./routes/sales');

const app = express();

app.use(hpp());

// --- [ อัปเดต CORS ให้รองรับ Frontend ] ---
app.use(cors({
    origin: ['http://localhost:3000', 'https://fe-project-nu.vercel.app','https://august-pen-gay.vercel.app','https://se-co1.vercel.app'], 
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // เพิ่ม OPTIONS เผื่อไว้สำหรับ Preflight request
    credentials: true 
}));

// Body parser
app.use(express.json());
app.use(mongoSanitize());
// Cookie parser
app.use(cookieParser());
app.use(helmet());
app.use(xss()); 

// Rate Limiter
// หมายเหตุ: หาก Render อยู่หลัง Proxy อาจจะต้องเพิ่ม app.set('trust proxy', 1); เพื่อให้ Rate limit อ่าน IP ถูกต้อง
app.set('trust proxy', 1); 

const limiter = rateLimit({
    windowMs: 10 * 60 * 1000, // 10 mins
    max: 100
});
app.use(limiter); 

// --- [ ส่วนของ Swagger API Documentation ] ---
const swaggerOptions = {
  swaggerDefinition: {
    openapi: '3.0.0',
    info: {
      title: 'Coworking Space Booking API',
      version: '1.0.0',
      description: 'API for User Authentication, Coworking Spaces, and Reservations'
    },
    servers: [
      {
        // 🌟 แก้ไข: เพิ่มการรองรับ URL จาก Environment Variable (สำหรับ Render) และมี localhost เป็นตัวสำรอง
        url: process.env.API_URL || 'http://localhost:5000/api/v1'
      }
    ]
  },
  apis: ['./routes/*.js'], 
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use('/api-docs', swaggerUI.serve, swaggerUI.setup(swaggerDocs));
// ---------------------------------------------

// --- [ 2. เรียกใช้งาน Router ] ---
app.use('/api/v1/coworkings', coworkings);
app.use('/api/v1/reservations', reservations);
app.use('/api/v1/auth', auth); 
app.use('/api/v1/sales', sales); 

// Render จะส่งค่า PORT มาให้ทาง process.env.PORT โค้ดนี้ของคุณเขียนถูกแล้ว
const PORT = process.env.PORT || 5000;

const server = app.listen(
    PORT, 
    console.log('Server running in ', process.env.NODE_ENV, ' mode on port ', PORT)
);

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
    console.log(`Error: ${err.message}`);
    server.close(() => process.exit(1));
});