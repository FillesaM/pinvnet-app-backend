const asyncHandler = require("express-async-handler")
const User = require('../models/userModel')
const Token = require('../models/tokenModel')
const jwt = require("jsonwebtoken")
const bcrypt = require('bcrypt')
const crypto = require('crypto')
const sendEmail = require("../utils/sendEmail")

const generateToken =(id)=>{
    return jwt.sign({id}, process.env.JWT_SECRET,{expiresIn: "1d"})
}

 const registerUser= asyncHandler(async(req,res)=>{

    const {name,email,password} = req.body;

    if(!name || !email || !password) {
        res.status(400)
        throw new Error("Please fill in all required fields")
    }
    if(password.length < 6) {
        res.status(400)
        throw new Error ("Password must be up to 6 characters")
    }
   const userExists = await User.findOne({email})

   if(userExists) {
    res.status(404)
    throw new Error("Email has already been registered")
   }

   const user = await User.create({
    name,
    email,
    password
   }) 

   const token = generateToken(user._id);
   
   res.cookie("token", token, {
    path: "/",
    httpOnly: true,
    expires: new Date(Date.now() + 1000 * 86400), // 1 day
    sameSite: "none",
    secure: true,
  });

   if(user) {
    const {_id,name,email,photo,phone,bio} = user
    res.status(201).json({
       _id,name,email,phone,photo,bio,token
    });
   }else {
    res.status(400)
    throw new Error("Invalid user data")
   }
 })

const loginUser = asyncHandler(async(req,res)=>{

 const {email,password} = req.body;

 if(!email || !password) {
    res.status(400)
    throw new Error("Please add email and password")
 }

 const user = await User.findOne({email})
 if(!user) {
    res.status(400)
    throw new Error("User not found. Please sign up!")
 }
const passwordIsCorrect = await bcrypt.compare(password, user.password)

const token = generateToken(user._id);

   res.cookie("token",token,{
    path:"/",
    httpOnly:true,
    expires: new Date(Date.now()+ 1000 * 86400),
    sameSite:"none",
    secure:true
   });

if(user && passwordIsCorrect) {
    const {_id,name,email,photo,phone,bio} = user
    res.status(200).json({
       _id,name,email,phone,photo,bio,token
    });
}else {
    res.status(400)
    throw new Error("Invalid email or password");
}
});

const logoutUser=asyncHandler(async(req,res)=>{
    res.cookie("token","",{
        path:"/",
        httpOnly:true,
        expires: new Date(0),
        sameSite:"none",
        secure:true
       });
    return res.status(200).json({message:"User has been logged out succesfully"})
})

const getUser=asyncHandler(async(req,res)=>{
    const user = await User.findById(req.user._id)
    if(user) {
        const {_id,name,email,photo,phone,bio} = user
        res.status(200).json({
           _id,name,email,phone,photo,bio
        });
       }else {
        res.status(400)
        throw new Error("User not found")
       }
    
})

const loginStatus = asyncHandler(async(req,res)=>{
    const token = req.cookies.token;
    if(!token) {
        return res.json(false)
    }
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    if(verified) {
       return res.json(true)
    }else{
        return res.json(false)
    }
})

const updatedUser=asyncHandler(async(req,res)=>{
  const user = await User.findById(req.user._id)
  if(user) {
    const {name,email,photo,phone,bio} = user;
    user.email = email;
    user.name = req.body.name || name;
    user.photo=req.body.photo || photo;
    user.phone = req.body.phone || phone;
    user.bio = req.body.bio || bio;

    const updatedUser = await user.save()
    res.status(200).json({
        _id:updatedUser._id,
        name:updatedUser.name,
        email:updatedUser.email,
        phone:updatedUser.phone,
        photo:updatedUser.photo,
        bio:updatedUser.bio
    })
  }else{
    res.status(404)
    throw new Error("User not found")
  }
})

const changePassword =asyncHandler(async(req,res)=>{
    const user = await User.findById(req.user._id);
    if(!user) {
        res.status(400)
        throw new Error("User not found, please sign up")
    }
    const {oldPassword,password} = req.body;
    if(!oldPassword || !password) {
        res.status(400)
        throw new Error("Please add old and new password")
    }
   
    const passwordIsCorrect = await bcrypt.compare(oldPassword,user.password);

    if(user || passwordIsCorrect) {
        user.password = password;
        await user.save()
        res.status(200).send('Password changed successfully')
    }else{
        res.status(400)
        throw new Error("Old password is incorrect")
    }

})

const forgotPassword=asyncHandler(async(req,res)=> {
const {email}= req.body
const user = await User.findOne({email})

if(!user) {
    res.status(404)
    throw new Error("User does not exist")
}

let token = await Token.findOne({userId:user._id})

if(token) {
    await Token.deleteOne()
}

let resetToken = crypto.randomBytes(32).toString("hex") + user._id;

const hashedToken = crypto.createHash("sha256").update(resetToken).digest("hex")

await new Token({
    userId: user._id,
    token:hashedToken,
    createdAt:Date.now(),
    expiresAt:Date.now() + 30 * (60 * 1000)// 30 min
}).save()

const resetUrl = `${process.env.FRONTEND_URL}/resetpassword/${resetToken}`

const message = `
<h2>Hello ${user.name}</h2>
<p>Please use the url below to reset your password</p>
<p>Reset link is valid for 30 minutes</p>
<a href=${resetUrl} clicktracking=off>${resetUrl}</a>
<p>Best regards</p>
<p>Pinvent Team</p>
`;
const subject = "Password Reset Request"
const send_to = user.email;
const sent_from = process.env.EMAIL_USER;

try{
 await sendEmail(subject,message,send_to,sent_from)
 res.status(200).json({success:true,message:"Reset Email Sent"})
}catch(error){
res.status(500)
throw new Error("Email not sent, please try again")
}
})

const resetPassword=asyncHandler(async(req,res)=>{
    const {password} = req.body;
    const {resetToken} = req.params;

    const hashedToken = crypto.createHash("sha256").update(resetToken).digest("hex")

    const userToken = await Token.findOne({
        token: hashedToken,
        expiresAt:{$gt: Date.now()}
    })

    if(!userToken) {
        res.status(404)
        throw new Error("Expired or Invalid token")
    }

    const user = await User.findOne({_id:userToken.userId})
    user.password = password;
    await user.save();
    res.status(200).json({message:'Password reset was successfull, please login'})
}) 

module.exports ={
     registerUser,
     loginUser,
     logoutUser,
     getUser,
     loginStatus,
     updatedUser,
     changePassword,
     forgotPassword,
     resetPassword
    }