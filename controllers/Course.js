const Course = require("../models/Course");
const Category = require("../models/Category");
const User = require("../models/User");
const { uploadToCloudinary } = require("../utils/imageUploader");
const { response } = require("express");
const SubSection =require("../models/SubSection")
const Section = require("../models/Section")
const {convertSecondsToDuration} = require('../utils/secToDuration')
const courseProgress = require("../models/courseProgress")

//createCoursehandler handler function

exports.createCourse = async (req, res) => {
  try {
    //fetch data

    const { courseName, courseDescription, whatYouWillLearn, price, category ,tag:_tag,status,instructions:_instructions} =
      req.body;

    //get thumbnail
     const thumbnail = req.files.courseThumbnail;

    const tag= JSON.parse(_tag);
    const instructions=JSON.parse(_instructions);
    //validation
    if (!courseName || !courseDescription || !whatYouWillLearn ||!thumbnail|| !price ||!tag.length || !category || !instructions.length) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    if(!status || status === undefined){
      status="Draft"
    }

    //check isInstructor
    //checking coz if we remove accountType from payload we have to make an extra DB call everywhere for validation

    //TODO: check for user.id and instructor details id same or not
    const userId = req.user.id;
    const instructorDetails = await User.findById(userId,{accountType:"Instructor"});
    console.log("Instructor Details:", instructorDetails);

    if (!instructorDetails) {
      return res.status(404).json({
        success: false,
        message: "Instructor Details not Found",
      });
    }

    //check given Category valid or not

    const categoryDetails = await Category.findById(category);
    console.log(categoryDetails) //coz in course model we have iut by ref =>> objectId

    if (!categoryDetails) {
      return res.status(404).json({
        success: false,
        message: "Category Details not Found",
      });
    }

    //upload image to cloudinary

     const thumbnailImage = await uploadToCloudinary(thumbnail, "StudyNotion");
     console.log(thumbnailImage)

    //create an entry for nerw course

    const newCourse = await Course.create({
      courseName,
      courseDescription,
      instructor: instructorDetails._id, //smjh me aaya kyu li thi id??
      whatYouWillLearn: whatYouWillLearn,
      price,

      tag,
      category:categoryDetails._id,
      status:status,
      instructions,
      thumbnail: thumbnailImage.secure_url,
    });

    // add this course to course list of instructor
    //add this to usere schema of instructor

    await User.findOneAndUpdate(
      { _id: instructorDetails._id },
      {
        $push: {
          course: newCourse._id,
        },
      },
      { new: true }
    );

    //update Category ka schema HW
//id ka updation
    const categoryDetails2= await Category.findByIdAndUpdate(
      {_id:categoryDetails._id},
      {
        $push:{
          course:newCourse._id,
        },
      },
      {new:true}
    )

    //return response

    return res.status(200).json({
      success: true,
      message: "Course created successfully",
      data: newCourse,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to create course",
      error: error.message,
    });
  }
};

// edit course

exports.editCourse = async (req, res) => {
  try {
    const { courseId } = req.body;
    const updates = req.body;

    const course = await Course.findById(courseId);

    if (!course) {
      return res.status(404).json({
        error: "Course not found",
      });
    }

    // If Thumbnail Image is found update it

    if (req.files) {
      console.log("Thumbnail found");
      const thumbnail = req.files.thumbnailImage;
      const thumbnailImage = await uploadToCloudinary(
        thumbnail,
        process.env.FOLDER_NAME
      );
      course.thumbnail = thumbnailImage.secure_url;
    }

    // update only the fields that are present in the req body

    for (const key in updates) {
      if (updates.hasOwnProperty(key)) {
        if (key === "tag" || key === "instructions") {
          course[key] = Json.parse(updates[key]);
        } else {
          course[key] = updates[key];
        }
      }
    }

    await course.save();

    const updatedCourse = await Course.findOne({
      _id: courseId,
    }).populate({
        path:"instructor",
        populate:{
            path:"additionalDetails"
        }
    }).populate("category").populate({
        path:"courseContent",
        populate:{
            path:"subSection"
        }
    }).exec()
    // ?.populate("ratingAndReviews")

    res.json({
        success:true,
        message:"Course updated successfully",
        data:updatedCourse
    })


  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: "Internal server error",
    });
  }
};

//getAllCourses handler function

exports.showAllCourses = async (req, res) => {
  try {
    const allCourses = await Course.find(
      {},
      {
        courseName: true,
        price: true,
        instructor: true,
        thumbnail: true,
        // ratingAndReviews: true,
        studentsEnrolled: true,
      }
    )
      .populate("instructor")
      .exec();

    return res.status(200).json({
      success: true,
      message: "Data for all course fetched successfully",
      data: allCourses,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "cannot Fetch course data",
      error: error.message,
    });
  }
};

//getCourseDetails

exports.getCourseDetails = async (req, res) => {
  try {
    //find course id
    //find course details
    //will be stored in id so populate
    //return response

    const { courseId } = req.body;

    const courseDetails = await Course.findById({ _id: courseId })
      .populate({
        path: "instructor",
        populate: {
          path: "additionalDetails",
        },
      })
      .populate("category")
        // ?.populate("ratingAndReviews")
      .populate({
        path: "courseContent",
        populate: {
          path: "sectionName",
        },
      })
      .exec();

    //validation

    if (!courseDetails) {
      return res.status(400).json({
        success: false,
        message: `Could not find the course with ${courseId}`,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Course details fetched successfully",
      data: courseDetails,
    });
  } catch (error) {
    console.log(error);
    return res.status(400).json({
      success: false,
      message: "Failed to fetch details of the course",
    });
  }
};

exports.getInstructorCourses = async(req,res)=>{
  try{

    const instructorId=req.user.id || req.body;

    const instructorCourses= await Course.find({
      instructor:instructorId,
    }).sort({createdAt:-1});

    res.status(200).json({
      success:true,
      data:instructorCourses
    })

  }catch(error){
    console.log(error);
    return res.status(500).json({
      success:false,
      message:"Internal server error failed tof etch instructor courses",
      error:error.message
    })
  }
}


exports.deleteCourse = async (req,res)=>{
  try{
    const {courseId}=req.body;

    const course = await Course.findById(courseId);

    if(!course){
      return res.status(404).json({

        success:false,
        message:"Course Not found"
      })
      
    }

    const studentsEnrolled = course.studentsEnrolled;

    for(const studentId of studentsEnrolled){
      await User.findByIdAndUpdate(studentId,{
        $pull:{courses:courseId}
      })
    }

    const courseSections= course.courseContent;

    for(const sectionId of courseSections){
      const section = await Section.findById(sectionId);

      if(section){
        const subSections= section.subSection;
        for(const subSectionId of subSections){
          await SubSection.findByIdAndDelete(subSectionId)
        }
      }

      await Section.findByIdAndDelete(sectionId);
    }

    await Course.findByIdAndDelete(courseId);

    return res.status(200).json({
      success:true,
      message:"Course Deleted Successfully",
      
    })
  }
  catch(error){
    console.error(error);
    return res.status(500).json({
      success:false,
      message:error.message
    })
  }
}

exports.getFullCourseDetails = async (req, res) => {
  try {
    const { courseId } = req.body
    const userId = req.user.id
    const courseDetails = await Course.findOne({
      _id: courseId,
    })
      .populate({
        path: "instructor",
        populate: {
          path: "additionalDetails",
        },
      })
      .populate("category")
      // ?.populate("ratingAndReviews")
      .populate({
        path: "courseContent",
        populate: {
          path: "subSection",
        },
      })
      .exec()

    let courseProgressCount = await courseProgress.findOne({
      courseID: courseId,
      userId: userId,
    })

    console.log("courseProgressCount : ", courseProgressCount)

    if (!courseDetails) {
      return res.status(400).json({
        success: false,
        message: `Could not find course with id: ${courseId}`,
      })
    }

    // if (courseDetails.status === "Draft") {
    //   return res.status(403).json({
    //     success: false,
    //     message: `Accessing a draft course is forbidden`,
    //   });
    // }

    let totalDurationInSeconds = 0
    courseDetails.courseContent.forEach((content) => {
      content.subSection.forEach((subSection) => {
        const timeDurationInSeconds = parseInt(subSection.timeDuration)
        totalDurationInSeconds += timeDurationInSeconds
      })
    })

    const totalDuration = convertSecondsToDuration(totalDurationInSeconds)

    return res.status(200).json({
      success: true,
      data: {
        courseDetails,
        totalDuration,
        completedVideos: courseProgressCount?.completedVideos
          ? courseProgressCount?.completedVideos
          : [],
      },
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    })
  }
}