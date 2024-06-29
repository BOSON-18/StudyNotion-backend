const User = require("../models/User");
const OTP = require("../models/Otp");
const otpGenerator = require("otp-generator");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const mailSender = require("../utils/mailSender");
const Profile = require("../models/Profile");
require("dotenv").config();

// Send OTP
exports.sendOTP = async (req, res) => {
  try {
    // Fetch email from req ki body
    const { email } = req.body;

    // Check if user already exists
    const checkUserPresent = await User.findOne({ email });

    // If user found
    if (checkUserPresent) {
      return res.status(400).json({
        success: false,
        message: "Email Already Registered",
      });
    }

    // Generate OTP
    var otp = otpGenerator.generate(6, {
      upperCaseAlphabet: false,
      lowerCaseAlphabet: false,
      specialChars: false,
      number: true,
    });

    console.log("OTP generated: ", otp);

    // Check OTP uniqueness
    let result = await OTP.findOne({ otp });

    while (result) {
      otp = otpGenerator.generate(6, {
        upperCaseAlphabet: false,
        lowerCaseAlphabet: false,
        specialChars: false,
        number: true,
      });
      console.log("OTP GENERATED: ", otp);
    }

    const otpPayload = { email, otp };

    // Create an entry in DB for OTP
    const otpBody = await OTP.create(otpPayload);
    console.log("OTP BODY",otpBody);

    // Return response successfully
   return  res.status(200).json({
      success: true,
      message: "OTP sent successfully",
      otp: otpPayload.otp,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Failure in sending OTP",
      error:error.message
    });
  }
};

exports.signUp = async (req, res) => {
  try {
    // Data fetch from request ki body
    const {
      firstName,
      lastName,
      email,
      password,
      confirmPassword,
      accountType,
      contactNumber,
      otp,
    } = req.body;

    // Validate krdo
    if (
      !firstName ||
      !lastName ||
      !email ||
      !password ||
      !confirmPassword ||
      !otp
    ) {
      return res.status(403).json({
        success: false,
        message: "All fields are required",
      });
    }

    // Match both password (pass, confirm pass)
    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Password and confirm password do not match",
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User already registered",
      });
    }
    console.log(existingUser);

    // Find the most recent OTP sent to the user
    const recentOtp = await OTP.find({ email })
      .sort({ createdAt: -1 })
      .limit(1);

    console.log("Recent Otp",recentOtp);

    // Validate OTP
    if (recentOtp.length === 0) {
      // OTP NOT FOUND
      return res.status(400).json({
        success: false,
        message: "OTP Not Found",
      });
    } else if (otp !== recentOtp[0].otp) {
      return res.status(500).json({
        success: false,
        message: "Invalid OTP Entered",
      });
    }

    // Hashing password
    const hashedpassword = await bcrypt.hash(password, 10);

    // Entry created in Db
    const ProfileDetails = await Profile.create({
      gender: null,
      dateOfBirth: null,
      about: null,
      contactNumber: null,
    });
    console.log("ProfileDetails");

    const user = await User.create({
      firstName,
      lastName,
      email,
      password: hashedpassword,
      contactNumber,
      accountType,
      additionalDetails: ProfileDetails._id,
      image: `https://api.dicebear.com/7.x/initials/svg?seed=${firstName}${lastName}`,
      
      
    });

    console.log(`User image: ${user.image}`);
    console.log(user.token)

    // Return res
    return res.status(200).json({
      success: true,
      user,
      message: "User is Registered Successfully",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Sign Up failed .User cannot be registered ",
    });
  }
};

//lOGIN

exports.login = async (req, res) => {
  try {
    //get data from req body
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(403).json({
        success: false,
        error: "Please provide an Email and Password",
      });
    }

    //Check if user registered?

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({
        success: false,
        error: "User not registered",
      });
    }

    //generate Token JWT , after matching password

    if (await bcrypt.compare(password, user.password)) {
      const payload = {
        email: user.email,
        id: user.id,
        accountType: user.accountType,
      };
      const token = jwt.sign(payload,"clumsy", {
        expiresIn:"24h",
      });
      console.log("Login token",token)

      user.token = token; //abhi bhi to object nhi likhenge
      user.password = undefined;

      //create cookie and send response
      const options = {
        expires: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        httpOnly: true,
      };
      console.log("User TOken",user.token)

      res.cookie("token", token, options).status(200).json({
        success: true,
        token,
        user,
        message: "Logged in successfully",
      });
    } else {
      return res.status(401).json({
        success: false,
        error: "Invalid Password",
      });
    }
  } catch (error) {
    console.log(error);

    return res.status(400).json({
      success: false,
      message: "Login Failure Please try again",
      error:error.message
    });
  }
};

//change passwrod

//HOME WORK
exports.changePassword = async (req, res) => {
  try {
    //get data from req body
    const { email, password } = req.body;
    //get oldPassword,newPassword,confirmnewPassowrd
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found, please enter valid email",
      });
    }
    const oldPassword = user.password;

    const isSame = await bcrypt.compare(oldPassword, newPassword);

    if (isSame) {
      return res.status(401).json({
        success: false,
        message: "Password is in use",
      });
    }

    const newPassword = await bcrypt.hash(password, 10);
    password = undefined;

    const updatedUser = await User.findOneAndUpdate(
      { email: email },
      { $set: { password: newPassword } },
      { new: true }
    );

    console.log(updatedUser);

    try {
      const mailResponse = await mailSender(
        email, //email
        "Verification Email", //title
        `<p>Your Password has been changed successfully</p>` //body for nodemailer
      );
      console.log("Email sent successfully: ", mailResponse.response);
    } catch (error) {
      console.log("Error occurred while sending email: ", error);
      throw error;
    }

    return res.status(200).json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Something Went Wrong Please try Again",
    });
  }

  //validation

  //update pswrd in DB
  //send mail password change
  //return response
};
