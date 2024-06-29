const cloudinary = require("cloudinary").v2; //! Cloudinary is being required
require("dotenv").config();



exports.cloudinaryConnect = () => {
	try {
		cloudinary.config({
			//!    ########   Configuring the Cloudinary to Upload MEDIA ########
			cloud_name: "dodlkd6ma",
			api_key: "565479327417118",
			api_secret: "NJREHGkYj6sxUCPWJm37JWhIqdA",
		});
	} catch (error) {
		console.log("Cloudinary error",error);
	}
};