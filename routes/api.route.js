const express = require("express");
const router = express.Router();
const bodyParser = require("body-parser");
const { PrismaClient } = require("@prisma/client");
const { body, validationResult } = require("express-validator");
const prisma = new PrismaClient();
const { google } = require("googleapis");
const nodemailer = require("nodemailer");
const app = express();
app.use(bodyParser.json());
require('dotenv').config();

CLIENT_ID = process.env.CLIENT_ID
CLIENT_SECRET = process.env.CLIENT_SECRET
REDIRECT_URI = process.env.REDIRECT_URI
REFRESH_TOKEN = process.env.REFRESH_TOKEN

const oAuth2Client = new google.auth.OAuth2(CLIENT_ID,CLIENT_SECRET,REDIRECT_URI)
oAuth2Client.setCredentials({refresh_token: REFRESH_TOKEN})

async function sendMail(referrerEmail,referredEmail, referralCode){
  try{
    const accessToken = await oAuth2Client.getAccessToken()
    const transport = nodemailer.createTransport({
      service : 'gmail',
      auth:{
        type: 'OAuth2',
        user: 'hadesaidoneus36@gmail.com',
        clientId: CLIENT_ID,
        clientSecret: CLIENT_SECRET,
        refreshToken: REFRESH_TOKEN,
        accessToken: accessToken
      }
    })

    const mailOptions = {
      from:'hadesaidoneus36@gmail.com',
      to: referredEmail,
      subject: "Your Referral Code",
      text: `Here is your referral code gifted by ${referrerEmail} : ${referralCode}`,
    }

    return transport.sendMail(mailOptions);

  }
  catch{

  }
}


router.post(
  "/referrals",
  [
    body("referrerName").notEmpty().withMessage("Referrer name is required"),
    body("referrerEmail").isEmail().withMessage("Invalid referrer email"),
    body("referredName").notEmpty().withMessage("Referred name is required"),
    body("referredEmail").isEmail().withMessage("Invalid referred email"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const { referrerName, referrerEmail, referredName, referredEmail } =
      req.body;

    try {
      let referrer = await prisma.user.findUnique({
        where: { email: referrerEmail },
      });

      if (!referrer) {
        referrer = await prisma.user.create({
          data: {
            name: referrerName,
            email: referrerEmail,
          },
        });
      }

      let referred = await prisma.user.findUnique({
        where: { email: referredEmail },
      });

      if (!referred) {
        referred = await prisma.user.create({
          data: {
            name: referredName,
            email: referredEmail,
          },
        });
      }

      const referralCode = generateUniqueReferralCode();

      const referral = await prisma.referral.create({
        data: {
          referrerUserId: referrer.id,
          referredUserId: referred.id,
          referralCode: referralCode
        },
      });

      await sendMail(referrerEmail,referredEmail, referralCode);

      res.status(201).json(referral);
    } catch (error) {
      console.error("Error creating referral:", error);
      res.status(500).json({ error: "Failed to create referral." });
    }
  }
);

function generateUniqueReferralCode() {
  return 'REF' + Math.random().toString(36).substring(2, 15).toUpperCase();
}

module.exports = router;
