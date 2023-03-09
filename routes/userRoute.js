
const express = require('express')
const router = express.Router();
const {registerUser,loginUser,logoutUser,getUser,loginStatus,updatedUser,changePassword,forgotPassword,resetPassword }= require('../controllers/userController.js');
const protect = require('../middleWare/authMiddleware.js');

router.post('/register', registerUser)
router.post('/login', loginUser)
router.get('/logout', logoutUser)
router.get('/getuser',protect, getUser)
router.get('/loggedin', loginStatus)
router.patch('/updateuser',protect, updatedUser)
router.patch('/changepassword',protect, changePassword)
router.post('/forgotpassword', forgotPassword)
router.put('/resetpassword/:resetToken', resetPassword)

module.exports = router;