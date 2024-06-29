

const nodemailer = require("nodemailer");
const dotenv = require("dotenv").config()

const mailSender = async (email, title, body) => {
    try{
            let transporter = nodemailer.createTransport({
                host:"smtp.gmail.com",
                auth:{
        //             user: 'thomas43@ethereal.email',
        // pass: '3GStta4qvEtmw9vSP4'
        user:"studynotion54@gmail.com",
        pass:"pjfk ykzh fjlb bfuj"
                }
            })
            console.log("Creating info")

console.log("Sedning email")
            let info = await transporter.sendMail({
                from: 'StudyNotion || CodeHelp - by Babbar',
                to:`${email}`,
                subject: `${title}`,
                html: `${body}`,
            })
            console.log("Infgo",info);
            return info;
    }
    catch(error) {
        console.log(error.message);
    }
}


module.exports = mailSender;