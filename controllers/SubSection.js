const Section = require("../models/Section");
const SubSection = require("../models/SubSection");
const { uploadToCloudinary } = require("../utils/imageUploader");

//video uploader

//create SubSection

// exports.createSubSection = async (req, res) => {
//   try {
//     //fetch data

//     const { sectionId, title,  description } = req.body;

//     //extract video
//     const video = req.files.video; //uploading to cludinary sent as file so have to extract it like this

//     //validation

//     if (!sectionId  || !title ||!video|| !description) {
//       return res.status(400).json({
//         success: false,
//         message: "All Fields are required",
//       });
//     }

//     //upload to cloudinary
//     console.log("Uploadng to cloud")

//     const uploadDetails = await uploadToCloudinary(
//       video,
//       "StudyNotion"
//     );

//     //create a sub-section
// console.log("Creating subSection backend")
//     const SubSectionDetails = await SubSection.create({
//       title: title,
//      // timeDuration: timeDuration,
//       description: description,
//       videoUrl: uploadDetails.secure_url,
//     });

//     //update section with this sub section object id

//     const updatedSection = await Section.findByIdAndUpdate(
//       { _id: sectionId },
//       {
//         $push: {
//           subSection: SubSectionDetails._id,
//         },
//       },
//       { new: true }
//     ).populate('subSection').exec();

//     //use populate
//     //log updated section here after adding populate entry

//     //return res

//     return res.status(200).json({
//       success: true,
//       message: "Sub Section crated successfully",
//      data: updatedSection,
//     });
//   } catch (error) {
//     return res.status(500).json({
//       success: false,
//       message: "Sub Section creation failed",
//       error: error.message,
//     });
//   }
// };
exports.createSubSection = async (req, res) => {
  try {
    // Extract necessary information from the request body
    const { sectionId, title, description } = req.body
    const video = req.files.video

    // Check if all necessary fields are provided
    if (!sectionId || !title || !description || !video) {
      return res
        .status(404)
        .json({ success: false, message: "All Fields are Required" })
    }
    console.log(video)

    // Upload the video file to Cloudinary
    const uploadDetails = await uploadToCloudinary(
      video,
      "StudyNotion"
    )
    console.log(uploadDetails)
    // Create a new sub-section with the necessary information
    const SubSectionDetails = await SubSection.create({
      title: title,
      timeDuration: `${uploadDetails.duration}`,
      description: description,
      videoUrl: uploadDetails.secure_url,
    })

    // Update the corresponding section with the newly created sub-section
    const updatedSection = await Section.findByIdAndUpdate(
      { _id: sectionId },
      { $push: { subSection: SubSectionDetails._id } },
      { new: true }
    ).populate("subSection")

    // Return the updated section in the response
    return res.status(200).json({ success: true, data: updatedSection })
  } catch (error) {
    // Handle any errors that may occur during the process
    console.error("Error creating new sub-section:", error)
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    })
  }
}


//update and delete section HW



exports.updateSubSection = async (req, res) => {
  try {
    const { sectionId,subSectionId, title, description } = req.body
    console.log("finding subsection")
    const subSection = await SubSection.findById(subSectionId)
    console.log("Found Subsction")

    if(!subSection){
      return res.status(404).json({success: false,  message: "SubSection not found" })
    }

    if(title !== undefined){
      subSection.title = title
    }

    if(description !== undefined){
      subSection.description = description
    }

    if(req.files && req.files.video !== undefined){
      const video = req.files.video
      const uploadDetails = await uploadImageToCloudinary( video, process.env.FOLDER_NAME )
      subSection.videoUrl = uploadDetails.secure_url
      subSection.timeDuration = `${uploadDetails.duration}`
    }

    await subSection.save()
    //uiupdate na hone ka reason ye nhi tha 
    console.log("updating Section")
    console.log(sectionId)
    const updatedSection = await Section.findById(sectionId).populate("subSection")
    console.log("section updated")

    return res.json({
      success: true,
      data:updatedSection,
      message: "Section updated successfully",
    })
  }
   catch(error){
    return res.status(500).json({
      success: false,
      message: "An error occurred while updating the section",
      error:error.message
    })
  }
}


exports.deleteSubSection = async (req, res) => {
  try {
    const { subSectionId, sectionId } = req.body
    await Section.findByIdAndUpdate( { _id: sectionId },  {$pull: {subSection: subSectionId,},} )
    
    const subSection = await SubSection.findByIdAndDelete({ _id: subSectionId })

    if(!subSection){
      return res.status(404).json({ success: false, message: "SubSection not found" })
    }

    // ui update nhi hori thi ike karan
    const updatedSection = await Section.findById(sectionId).populate("subSection")

    return res.json({
      success: true,
      data:updatedSection,
      message: "SubSection deleted successfully",
    })
  }
   catch(error) {
    console.error(error)
    return res.status(500).json({
      success: false,
      message: "An error occurred while deleting the SubSection",
    })
  }
}