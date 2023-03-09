const express = require('express')
const cors = require('cors')
const mongoose = require('mongoose')
const bodyParser = require('body-parser')
const dotenv = require("dotenv").config();
const userRoute = require('./routes/userRoute.js')
const contactRoute = require('./routes/contactRoute.js')
const productRoute = require('./routes/productRoute.js')
const cookieParser = require('cookie-parser')
const errorHandler = require('./middleWare/errorMidleware.js')
const path = require("path")

const app = express();


app.use(express.json())
app.use(cookieParser())
app.use(express.urlencoded({extended:false}))
app.use(bodyParser.json())
app.use(cors({
  origin:["http://localhost:3000","https://pinvent-app.vercel.app"],
  credentials: true
}))

app.use("/uploads", express.static(path.join(__dirname,"uploads")))

app.use('/api/users', userRoute)
app.use('/api/products', productRoute)
app.use('/api/contactus', contactRoute)
app.get('/', (req, res) => {
    res.send("Home Page");
  });
  
app.use(errorHandler)

const PORT = process.env.PORT || 5001;

mongoose
  .connect(process.env.CONNECTION_URL,{useNewUrlParser: true, useUnifiedTopology:true})
  .then(() => {
    console.log('mongoDB connected')
    app.listen(PORT, () => {
      console.log(`Server Running on port ${PORT}`);
    });
  })
  .catch((err) => console.log(err.message));
 

