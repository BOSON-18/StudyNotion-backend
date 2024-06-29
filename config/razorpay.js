const Razorpay= require("razorpay");
const dotenv= require("dotenv");
dotenv.config();

exports.instance= new Razorpay({
    key_id:"rzp_test_e00kJWXEKBYJWu",
    key_secret: "uqmJH6hyXAtVxzgmh4NExNIf",

})