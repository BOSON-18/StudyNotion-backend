const mongoose = require('mongoose');
//Each subsection is a video
const subSectionSchema = new mongoose.Schema({
  title: {
    type: String
  },
  timeDuration: {
    type: String
  },
  description: {
    type: String
  },
  videoUrl: {
    type: String
  }
});

module.exports = mongoose.model("SubSection", subSectionSchema);