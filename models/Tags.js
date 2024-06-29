const mongoose = require('mongoose');

const tagsSchema = new mongoose.create({
    name:{
        type:String,
        required:true
    }
})

module.exports= mongoose.model("Tag",tagsSchema);