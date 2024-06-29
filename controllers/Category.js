const Category = require("../models/Category");
const User = require("../models/User");
function getRandomInt(max) {
  return Math.floor(Math.random() * max);
}
//create a Category handler function

exports.createCategory = async (req, res) => {
  try {
    //fetch data
    const { name, description } = req.body;

    //validation
    if (!name || !description) {
      return res.status(400).json({
        success: false,
        message: "All Fields are required",
      });
    }

    //create entry in db

    const CategoryDetails = await Category.create({
      name: name,
      description: description,
    });
    console.log(CategoryDetails);

    return res.status(200).json({
      success: true,
      message: "Category created successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

//getAllCategorys hndlerfuncion

exports.showAllCategories = async (req, res) => {
  try {
    const allCategory = await Category.find(
      {},
      { name: true, description: true,course:true }
    ); //koi searching criteia nhi but make sure it contains name and description
    console.log(allCategory)

    return res.json({
      success: true,
      message: "All Category returned successfully",
     data: allCategory,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

//category pageDetails

exports.categoryPageDetails = async (req, res) => {
  try {
    //get category id
    const { categoryId } = req.body;
    //fetch all courses of the category
    const selectedCategory = await Category.findById(categoryId)
      ?.populate({
        path: "course",
        match: { status: "Published" },
       //  populate:"ratingAndReviews"
      })
      .exec();

    //validation
    if (!selectedCategory) {
      return res.status(404).json({
        success: false,
        message: "Course not found ",
      });
    }

    if (selectedCategory.course.length === 0) {
      console.log("No COurses found for this cattegory");

      return res.status(404).json({
        success: false,
        message: "No courses found for the selected category",
      });
    }

    //get course for different categories i.e all except selected
    const categoriesExceptSelected = await Category.find({
      _id: { $ne: categoryId },
    });
    let differentCategory = await Category.findOne(
      categoriesExceptSelected[getRandomInt(categoriesExceptSelected.length)]
        ._id
    )
      .populate({
        path: "course",
        match: { status: "Published" },
      })
      .exec();
    //get topselling courses
    //ye Hw hai

    //top selling courses across categories

    const allCategories = await Category.find()
      .populate({
        path: "course",
        match: { status: "Published" },
        populate: {
          path: "instructor",
        },
      })
      .exec();

    //return response
    const allCourses = allCategories.flatMap((category) => category.course)
      const mostSellingCourses = allCourses
        .sort((a, b) => b.sold - a.sold)
        .slice(0, 10)
       // console.log("mostSellingCourses COURSE", mostSellingCourses)
      res.status(200).json({
        success: true,
        data: {
          selectedCategory,
          differentCategory,
          mostSellingCourses,
        },
      })
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
