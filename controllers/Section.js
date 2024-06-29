const Section = require("../models/Section");
const Course = require("../models/Course");
const SubSection= require('../models/SubSection')
// CREATE a new section
exports.createSection = async (req, res) => {
  try {
    // Extract the required properties from the request body
    const { sectionName, courseId } = req.body;

    // Validate the input
    if (!sectionName || !courseId) {
      return res.status(400).json({
        success: false,
        message: "Missing required properties",
      });
    }

    // Create a new section with the given name
    const newSection = await Section.create({ sectionName });

    // Add the new section to the course's content array
    const updatedCourseDetails = await Course.findByIdAndUpdate(
      courseId,
      { $push: { courseContent: newSection._id } },
      { new: true }
    )
      .populate({ path: "courseContent", populate: { path: "subSection" } })
      .exec();

    console.log(updatedCourseDetails);

    // Return the updated course object in the response
    res.status(200).json({
      success: true,
      message: "Section created successfully",
      updatedCourseDetails,
    });
  } catch (error) {
    // Handle errors
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

exports.updateSection = async (req, res) => {
  try {
    //data input

    const { sectionName, sectionId ,courseId} = req.body;

    //data validation

    if (!sectionName || !sectionId) {
      return res.status(400).json({
        success: false,
        message: "Missing Properties",
      });
    }

    //update data

    const updatedSection = await Section.findByIdAndUpdate(
      sectionId,
      {
        sectionName,
      },
      { new: true }
    );

    const course=await Course.findById(courseId).populate({
      path:"courseContent",
      populate:{
        path:"subSection",
      }
    }).exec()
    //return res

    return res.status(200).json({
      success: true,
      data:course,
      message: "Section updated successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Section Updation Failed",
      error: error.message,
    });
  }
};

exports.deleteSection = async (req, res) => {
  try {
    //get id - assuing that we r sending it in params

    const { sectionId, courseId } = req.body||req.params;
    console.log("Debugging",courseId,sectionId)

    //use findByIdAnd Delete

    await Section.findByIdAndDelete(sectionId);

    //TODO : we need to delete it from course section also

    const course=await Course.findByIdAndUpdate(
      { _id: courseId },
      {
        $pull: { courseContent: sectionId },
      },
      { new: true }
    ); 

    //return res

    return res.status(200).json({
      success: true,
      data:course, 
      message: "Section Deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Section Updation Failed",
      error: error.message,
    });
  }
};
