const express = require('express')
const router = express.Router()

// middlewares
// const { authCheck, adminCheck } = require("../middlewares/auth");

// controllers
const { upload, remove } = require('../controllers/cloudinaryController')

router.post('/upload', upload)
router.post('/remove', remove)

module.exports = router
