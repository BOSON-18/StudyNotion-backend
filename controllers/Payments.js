//IMP read Docs RazorPay

const { instance } = require("../config/razorpay");
const Course = require("../models/Course");
const User = require("../models/User");
const mailSender = require("../utils/mailSender");
const {
  courseEnrollmentEmail,
} = require("../mail/templates/courseEnrollmentEmail");
const { default: mongoose } = require("mongoose");
const {
  paymentSuccessEmail,
} = require("../mail/templates/paymentSuccessEmail");
const crypto = require("crypto");
const courseProgress = require("../models/courseProgress");
require("dotenv").config();

// //initiate the razorpay order
// exports.capturePayment = async(req, res) => {

//     const {courses} = req.body;
//     const userId = req.user.id;

//     if(courses.length === 0){
//         return res.json({success:false, message:"Please provide Course Id"});
//     }
//     let totalAmount = 0;

//     for(const course_id of courses) {
//         let course;
//         try{
//             course = await Course.findById(course_id);
//             if(!course) {
//                 return res.status(200).json({success:false, message:"Could not find the course"});
//             }

//             const uid  = new mongoose.Types.ObjectId(userId);
//             if(course.studentsEnrolled.includes(uid)) {
//                 return res.status(200).json({success:false, message:"Student is already Enrolled"});
//             }

//             totalAmount += course.price;
//         }
//         catch(error){
//             console.log(error);
//             return res.status(500).json({success:false, message:error.message});
//         }
//     }
//     const currency = "INR";
//     const options = {
//         amount: totalAmount * 100,
//         currency,
//         receipt: Math.random(Date.now()).toString(),
//     }

//     try{
//         const paymentResponse = await instance.orders.create(options);
//         res.json({
//             success:true,
//             message:paymentResponse,
//         })
//     }
//     catch(error) {
//         console.log(error);
//         return res.status(500).json({success:false, mesage:"Could not Initiate Order"});
//     }
// }

// //verify the payment
// exports.verifyPayment = async(req, res) => {
//     const razorpay_order_id = req.body?.razorpay_order_id;
//     const razorpay_payment_id = req.body?.razorpay_payment_id;
//     const razorpay_signature = req.body?.razorpay_signature;
//     const courses = req.body?.courses;
//     const userId = req.user.id;

//     if(!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !courses || !userId) {
//            return res.status(200).json({success:false, message:"Payment Failed"});
//     }

//     let body = razorpay_order_id + "|" + razorpay_payment_id;
//     const expectedSignature = crypto
//         .createHmac("sha256", process.env.RAZORPAY_SECRET)
//         .update(body.toString())
//         .digest("hex");

//         if(expectedSignature === razorpay_signature) {
//             await enrollStudents(courses, userId, res);                   //enroll karwao student ko
//             return res.status(200).json({success:true, message:"Payment Verified"});    //return res
//         }
//         return res.status(200).json({success:"false", message:"Payment Failed"});
// }

// const enrollStudents = async(courses, userId, res) => {

//     if(!courses || !userId) {
//         return res.status(400).json({success:false,message:"Please Provide data for Courses or UserId"});
//     }

//     for(const courseId of courses) {
//         try{                                            //find the course and enroll the student in it
//         const enrolledCourse = await Course.findOneAndUpdate({_id:courseId}, {$push:{studentsEnrolled:userId}}, {new:true},)

//         if(!enrolledCourse){
//             return res.status(500).json({success:false,message:"Course not Found"});
//         }
//         // created courseProgress for enrolled Courses in DB;
//         const courseProgress = await CourseProgress.create({
//             courseID:courseId,
//             userId:userId,
//             completedVideos: [],
//         })

//         //find the student and add the course to their list of enrolledCOurses
//         const enrolledStudent = await User.findByIdAndUpdate(userId,  {$push:{ courses: courseId,  courseProgress: courseProgress._id, }},{new:true})

//         ///Send mail to the Student;
//         const emailResponse = await mailSender( enrollStudents.email, `Successfully Enrolled into ${enrolledCourse.courseName}`,  courseEnrollmentEmail(enrolledCourse.courseName, `${enrolledStudent.firstName}`))
//     }
//         catch(error) {
//             console.log(error);
//             return res.status(500).json({success:false, message:error.message});
//         }
//     }
// }

// exports.sendPaymentSuccessEmail = async(req, res) => {
//     const {orderId, paymentId, amount} = req.body;

//     const userId = req.user.id;

//     if(!orderId || !paymentId || !amount || !userId) {
//         return res.status(400).json({success:false, message:"Please provide all the fields"});
//     }

//     try{
//         //student ko dhundo
//         const enrolledStudent = await User.findById(userId);
//         await mailSender(
//             enrolledStudent.email,
//             `Payment Recieved`,
//              paymentSuccessEmail(`${enrolledStudent.firstName}`,
//              amount/100,orderId, paymentId)
//         )
//     }
//     catch(error) {
//         console.log("error in sending mail", error)
//         return res.status(500).json({success:false, message:"Could not send email"})
//     }
// }

exports.capturePayment = async (req, res) => {
  //initiate the razorpay order
  //u buy r not an order will initiate whether u will buy or not

  const { courses } = req.body;
  const userId = req.user.id;

  if (courses.length === 0) {
    return res.json({
      success: false,
      message: "Please provide Course Id",
    });
  }

  let totalAmount = 0;

  for (const course_id of courses) {
    let course;
    try {
      console.log("COURSE ID", course_id);
      course = await Course.findById(course_id);
      if (!course) {
        return res.status(200).json({
          success: false,
          message: "Could not find the course",
        });
      }

      const uid = new mongoose.Types.ObjectId(userId);

      if (course.studentsEnrolled.includes(uid)) {
        return res.status(200).json({
          success: false,
          message: "Student is already registered",
        });
      }

      totalAmount += course.price;
    } catch (error) {
      console.log("Error in capturing ", error);
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  //create options mandatory
  const currency = "INR";
  const options = {
    amount: totalAmount * 100,
    currency,
    receipt: Math.random(Date.now()).toString(),
  };

  try {
    const paymentResponse = await instance.orders.create(options);
    console.log(paymentResponse);
    return res.json({
      success: true,
      message: paymentResponse,
      data: paymentResponse,
    });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ success: false, message: "Could not initiate Order" });
  }
};
// enroll the student in the courses
const enrollStudents = async (courses, UserId, res) => {
  if (!courses || !UserId) {
    return res
      .status(400)
      .json({ success: false, message: "Please Provide Course ID and User ID" })
  }
  console.log("Inside student enroll")

  for (const courseId of courses) {
    try {
      // Find the course and enroll the student in it
      const enrolledCourse = await Course.findOneAndUpdate(
        { _id: courseId },
        { $push: { studentsEnrolled: UserId } },
        { new: true }
      )

      if (!enrolledCourse) {
        return res
          .status(500)
          .json({ success: false, error: "Course not found" })
      }
      console.log("Updated course: ", enrolledCourse)

      console.log("Creating courseProgress");

      const CourseProgress = await courseProgress.create({
        courseID: courseId,
        userId: UserId,
        completedVideos: [],
      })
      console.log("Created course Progress",CourseProgress)
      // Find the student and add the course to their list of enrolled courses
      const enrolledStudent = await User.findByIdAndUpdate(
        UserId,
        {
          $push: {
            courses: courseId,
            courseProgress: CourseProgress._id,
          },
        },
        { new: true }
      )

      console.log("Enrolled student update: ", enrolledStudent)
      // Send an email notification to the enrolled student
      const emailResponse = await mailSender(
        enrolledStudent.email,
        `Successfully Enrolled into ${enrolledCourse.courseName}`,
        courseEnrollmentEmail(
          enrolledCourse.courseName,
          `${enrolledStudent.firstName} ${enrolledStudent.lastName}`
        )
      )

      console.log("Email sent successfully: ", emailResponse.response)
      // return res.status(200).json({
      //   success:true,
      //   message:"Enrollement success",
      //   data:enrolledStudent

      // })
    } catch (error) {
      console.log(error)
      return res.status(400).json({ success: false, error: error.message })
    }
  }
}
//Order initiate hogya ab Verify bhi toh krna padega

exports.verifyPayment = async (req, res) => {
  console.log("Inside Verify")
  //oreeder id payment signature
  const razorpay_order_id = req.body?.razorpay_order_id;
  const razorpay_payment_id = req.body?.razorpay_payment_id;
  const razorpay_signature = req.body?.razorpay_signature;
  const courses = req.body?.courses;
  const UserId = req.user.id;
  console.log(UserId,UserId)

  if (
    !razorpay_order_id ||
    !razorpay_payment_id ||
    !razorpay_signature ||
    !courses ||
    !UserId
  ) {
    return res.status(404).json({
      success: false,
      message: "Something is missing",
    });
  }

  let body = razorpay_order_id + "|" + razorpay_payment_id;
  console.log("RazorPay Secret", "uqmJH6hyXAtVxzgmh4NExNIf");
  const expectedSignature = crypto
    .createHmac("sha256", "uqmJH6hyXAtVxzgmh4NExNIf")
    .update(body.toString())
    .digest("hex");
   
    console.log("Checking signature")

  
    if (expectedSignature === razorpay_signature) {
      await enrollStudents(courses, UserId, res)
      return res.status(200).json({ success: true, message: "Payment Verified" })
    }
  
    return res.status(200).json({ success: false, message: "Payment Failed" })

 
};

exports.sendPaymentSuccessEmail = async (req, res) => {
  const { orderId, paymentId, amount } = req.body;

  const userId = req.user.id;

  if (!orderId || !paymentId || !amount || !userId) {
    return res.status(400).json({
      success: false,
      message: "Please provide all the fields",
    });
  }

  try {
    //student ko find kro
    const enrolledStudent = await User.findById(userId);

    await mailSender(
      enrolledStudent.email,
      `Payment Received`,
      paymentSuccessEmail(
        `${enrolledStudent.firstName}`,
        amount / 100,
        orderId,
        paymentId
      )
    );
  } catch (error) {
    console.log("error in sending mail", error);
    return res.status(500).json({
      success: false,
      message: "Could not send email",
    });
  }
};
