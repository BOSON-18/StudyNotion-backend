const mongoose = require('mongoose');
const mailSender = require('../utils/mailSender')

const emailTemplate = (otp) => {
    // Your email template logic here
    return `<p>Your OTP is: ${otp}</p>`;
};

const OTPSchema = new mongoose.Schema({
    email: {
        type: String,
        reqired: true,
    },
    otp: {
        type: String,
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now(),
        expires: 5 * 60,
    }

});

//a function+> to send email

async function sendVerificationEmail(email, otp) {
	// Create a transporter to send emails

	// Define the email options

	// Send the email
	try {
        console.log("Trying to send mail")
		const mailResponse = await mailSender(
			email,//email
			"Verification Email",//title
			emailTemplate(otp)//body for nodemailer
		);
		console.log("Email sent successfully: ", mailResponse);
	} catch (error) {
		console.log("Error occurred while sending email: ", error);
		throw error;
	}
}


OTPSchema.pre("save", async function (next) {

    await sendVerificationEmail(this.email, this.otp);
    //otp model me emial and otp hi hai woh utha rha 
    next();
})



module.exports = mongoose.model("OTP", OTPSchema);
//Database me entry hone se pehle kaam hoga so pre-middleware use hoga