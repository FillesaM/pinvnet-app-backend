const express = require('express');
const { contacUs } = require('../controllers/contactController.js');
const protect = require("../middleWare/authMiddleware.js");
const router = express.Router();

router.post('/',protect, contacUs)

module.exports = router;