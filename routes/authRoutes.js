import express from 'express';
const router = express.Router()

import  {register, forgotPassword, resetPassword, login, logout} from '../controllers/authController.js'

router.post('/register', register)

router.post('/forgotPassword', forgotPassword)
router.patch('/resetPassword/:token', resetPassword)

router.post('/login', login)
router.post('/logout', logout)


export default router;
