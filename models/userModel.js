const mongoose = require('mongoose')
const bcrypt = require("bcrypt")


const userSchema = mongoose.Schema({
    name: {
        type: String,
        required:[true,"Please add a name"]
    },
    email:{
        type:String,
        required:[true,"Please add an email"],
        unique:true,
        trim:true,
        match: [
            /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
            "Please enter a valid email",
        ]
    },
   password:{
    type:String,
    reqired:[true,"Please add a password"],
    minLength:[6,"Password must be up to 6 charachters"],
    //maxLength:[23,"Password must not be more than 23 charachters"]
   },
   photo:{
    type:String,
    required:[true,"Please add a photo"],
    default:"https://i.ibb.co/4pDNDk1/avatar.png"
   },
   phone:{
    type:String,
    default: "+383"
   },
   bio:{
     type:String,
     default: "bio",
     maxLength:[250, "Password must not be more than 250 charachters"]
   }
},
{timestamps:true}
)

userSchema.pre("save", async function(next){
    if(!this.isModified("password")){
        return next()
    }
    const salt = await bcrypt.genSalt(10)
    const hashedPassword=await bcrypt.hash(this.password,salt);
    this.password = hashedPassword;
    next();
})
const User = mongoose.model("User",userSchema)
module.exports = User;