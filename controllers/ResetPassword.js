const User = require("../models/User");
const mailSender = require("../utils/mailSender");
const bcrypt = require("bcrypt")
const crypto = require("crypto")



//reset Password Token

exports.resetPasswordToken = async (req, res) => {

    try {
        //get email from req body
        const email = req.body.email;

        //check user for this email || emai validation

        const user = await User.findOne({ email: email });
        console.log(user)
        if (!user) {
            return res.status(501).json({
                success: false,
                message: "Your email is not registered with us"
            })
        }
        //generate token

        const token =  crypto.randomBytes(20).toString("hex");
        //update user by adding token and expiration time
        const updatedDetails = await User.findOneAndUpdate({ email: email },
            {
                token: token,
                resetPasswordExpires: Date.now() + 5 * 60 * 1000
            },
            { new: true });

            console.log("Updated Details0",updatedDetails)


        //generate link

        const url = `http:localhost:5173/update-password/${token}`;//token se alg alg link banegi us link se diff user pasword change krega

        //send mail containing the url
        await mailSender(email,
            "Password Reset Link",
            `Your Link for email verification is ${url}. Please click this url to reset your password.`)

        //return response

        return res.json({
            success: true,
            message: "Email sent successfully , please check email and change password"
        })
    }
    catch (error) {
        console.log(error);
        return res.status(501).json({
            success: false,
            message: "Something went wrong",
            error:error.message
        })
    }
}




//reset Passowrd

exports.resetPassword = async (req, res) => {
    try {
        //data fetch
        const { password, confirmPassword, token } = req.body;//token ye frontend me daala hai body me url se

        //validation
        if (password !== confirmPassword) {
            return res.json({
                success: false,
                message: "Password not matching"
            });
        }

        //get user details from db using token
        const userDetails = await User.findOne({ token: token });
        //if no token- invalid token
        if (!userDetails) {
            return res.json({
                success: false,
                message: "Token is invalid"
            });
        }
        //token time check

        if (userDetails.resetPasswordExpires < Date.now()) {
            return res.json({
                success: false,
                message: "Token is expired, please regenerate your token"
            })
        }

        //hash password
        const hashedPassword = await bcrypt.hash(password, 10);


        //update password
        await User.findOneAndUpdate(
            { token: token },
            { password: hashedPassword },
            { new: true },
        )
        //return response

        return res.json({
            success: true,
            message: "Password reset successfully",

        })
    }

    catch (error) {

        return res.json({
            success: false,
            message: "Password update failed please try again"
        })

    }
}