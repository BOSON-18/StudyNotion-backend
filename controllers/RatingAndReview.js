const RatingAndReview = require("../models/RatingAndReview");
const Course = require("../models/Course");

//create Rating

exports.createRating = async (req, res) => {
    try {

        //get user id 

        const userId = req.user.id;
        //fetch data from req body
        const { rating, review, courseId } = req.body;
        //check if user is enrolled or not
        const courseDetails = await Course.findOne(
            {
                _id: courseId,
                studentsEnrolled: { $elemMatch: { $eq: userId } }
            }
        )

        if (!courseDetails) {

            return res.status(404).json({
                success: false,
                message: "Student is not enrolled"
            })
        };

        //check if any previous review
        const alreadyReviewed = await RatingAndReview.findOne({
            user: userId,
            course: courseId,
        });

        if (alreadyReviewed) {
            return res.status(403).json({
                success: false,
                message: "Course is already reviwed by the user"
            });
        }
        //create rating

        const ratingReview = await RatingAndReview.create({
            rating, review,
            course: courseId,
            user: userId
        });
        
        //add it to course (update)

        const updatedCourseDetails = await Course.findByIdAndUpdate(courseId,
            {
                $push: {
                    ratingAndReview: ratingReview._id//coz mongoose . id type object
                }
            },
            { new: true });


        console.log(updatedCourseDetails);


        //return response


        return res.status(200).json({
            success: true,
            message: "Rating Review created Successfully",
            ratingReview
        });


    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message

        })
    }
}






//getAverageRating

exports.getAverageRating = async (req, res) => {

    try {

        //course id fech kro
        const courseId = req.body.courseId;
        //calculate avg rating

        const result = await RatingAndReview.aggregate([
            {
                $match: {
                    course: new mongoose.Types.ObjectId(courseId),
                },
            },
            {
                $group: {
                    _id: null,//jitne bhi entries aayi thi single group me add kr diya
                    averageRating: { $avg: "$rating" }//documentation se dekho mongo DB
                }
            }
        ])
        //return rating
        if (result.length > 0) {
            return res.status(200).json({
                success: true,
                averageRating: result[0].averageRating,//average array op me deta 
            })
        }

        //if no rating

        return res.status(200).json({
            success: true,
            message: "Average Rating is 0 , no ratings given till now",
            averageRating: 0
        })


    }
    catch (error) {

        return res.status(500).json({
            success: false,
            message: error.message

        })

    }
}


//get all ratingAnd Reviews

exports.getAllRating = async (req, res) => {
    try {

        //HW COURSE ID KE ACCORDING SARI RATING LEKE ANI
        const courseId = req.body.courseId;
        const allReviews = await RatingAndReview.find({ _id: courseId }).sort({ rating: "descending" }).populate({
            path: "user",
            populate: "firstName lastName email image"
        })
            .populate({
                path: "course",
                populate: "courseName"
            }).exec();


        return res.status(200).json({
            success: true,
            messge: "All reviews fetchde successfully",
            data: allReviews
        });

    }
    catch (error) {


        return res.status(500).json({
            success: false,
            message: error.message

        })
    }
}