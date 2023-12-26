import express from 'express';
const router = express.Router();
import studentRouter from './routes/studentRoutes.js'
import authRouter from './routes/authRoutes.js'


router.use("/student",  studentRouter);
router.use("/auth",  authRouter);

export default router
