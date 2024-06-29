const express=require('express')
const app= express();

const userRoutes= require('./routes/User');
//const userRoutes= require('./routes/User');
const profileRoutes= require('./routes/Profile');
const paymentRoutes= require('./routes/Payments');
const CourseRoutes= require('./routes/Course');

const database= require('./config/database')
const cookieParser= require('cookie-parser');
const cors= require("cors");
const {cloudinaryConnect}= require('./config/cloudinary');
const fileUpload= require("express-fileupload");
const dotenv= require("dotenv");
dotenv.config()
const PORT= process.env.PORT || 4000;
console.log(PORT)

//database connect

database.connect();

//middleWares
app.use(express.json());
app.use(cookieParser());
//backend frontend ki req entertain kre
app.use(cors({
    origin:"http://localhost:5173"||"http://localhost:5174",//is address se jo bhi request aari hai use entertain krne,
    credentials:true
}));
app.use(fileUpload({
    useTempFiles:true,
    tempFileDir:"/tmp",
}))

//cloudinary coonection
cloudinaryConnect();

//routes mount

app.use("/api/v1/auth",userRoutes);
app.use("/api/v1/profile",profileRoutes);
app.use("/api/v1/payment",paymentRoutes),
app.use("/api/v1/course",CourseRoutes);


//def route
app.get("/",(req,res)=>{
    return res.json({
        success:true,
        message:"App working successfuly"
    });

})

app.listen(PORT,()=>{
    console.log(`App working at ${PORT}`)

})