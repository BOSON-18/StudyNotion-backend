const mongoose=require('mongoose');
require("dotenv").config();

exports.connect=()=>{
    mongoose.connect(process.env.MONGODB_URL,{
        useNewUrlParser: true,
        useUnifiedTopology: true,
    })
    .then(()=>console.log("DB connected successfully"))
    .catch((err)=> {
        console.error(`Error connecting to the database: ${err}`);
        console.log("DB connecttion Failed");
        process.exit(1);
    })
}; 