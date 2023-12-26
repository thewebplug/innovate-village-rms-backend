import crypto from "crypto";
import { promisify } from "util";
import jwt from "jsonwebtoken";
// const customId = require('custom-id')

import User from "../models/userModel.js";
import catchAsync from "../utils/catchAsync.js";
// const { verify } = require('hcaptcha')

// import {
//   encryptToken,
//   compareToken,
//   encryptFee,
//   decryptFee,
// } from "../utils/encryptData";
import TrailManager from "./trailController.js";

// const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
// const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;
// const twilioClient = require("twilio")(twilioAccountSid, twilioAuthToken);

const capitalizeFirstLetter = (string) => {
  return string.charAt(0).toUpperCase() + string.slice(1);
};

const signToken = (
  id,
  email,
  lastLoginDate
) => {
  return jwt.sign(
    {
      id,
     email,
      lastLoginDate,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN,
    }
  );
};

const createSendToken = (user, statusCode, req, res) => {
  const token = signToken(
    user._id,
    user.email,
    user.lastLoginDate
  );

//   res.cookie("jwt", token, {
//     expires: new Date(
//       Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
//     ),
//     httpOnly: true,
//   });

  user.password = undefined;
  // const {
  //   interests,
  // } = user

  res.status(statusCode).json({
    status: "success",
    token,
    // interests,
  });
};

export const checkCorrectPassword = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user._id).select("+password");

  if (
    !user ||
    !(await user.comparePassword(req.body.password, user.password))
  ) {
    res.status(401).json({
      status: "fail",
      message: "Incorrect email or password",
    });
  } else {
    return res.status(200).json({
      status: "success",
    });
  }
});

// Register/Signup User

export const register = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({
      status: "fail",
      message: "Please provide necessary Information",
    });
  }

  const existingEmail = await User.findOne({ email });

  if (existingEmail) {
    res.json({
      status: "fail",
      message: "Email already exists. Please use another",
    });
  }

  const newUser = await User.create({
    email,
    password,
  });

  TrailManager(newUser._id, `registered as a ${newUser.role}`, "success");

  res.status(200).json({
    status: "success",
    message:
      "Account Created Successfully. To login, activate account from your email",
  });

  //   try {

  //     twilioClient.messages
  //       .create({
  //         body: `Hello ${newUser.firstName}, Your Activation token for tinkoko.com is ${otp}. It is valid for 10 mins`,
  //         from: "Tinkoko",
  //         to: `+${newUser.countryCode}${newUser.phone}`,
  //       })
  //       .then((message) => {
  //         res.status(200).json({
  //           status: "success",
  //           message: "OTP sent successfully",
  //         });
  //       });

  //     await new Email(newUser, otp).sendEmailVerification();

  //     createSendToken(newUser, 200, req, res);

  //   } catch (error) {
  //     await User.findByIdAndDelete(newUser._id);

  //     res.status(400).json({
  //       status: "fail",
  //       message: "Account not successfully created. Please try again",
  //     });
  //   }
});

// Login User
export const login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({
      status: "fail",
      message: "Please provide email and password",
    });
  }

  const user = await User.findOne({
        email: email.toLowerCase(),
  }).select("+password");

  if (!user || !(await user.comparePassword(password, user.password))) {
    res.status(401).json({
      status: "fail",
      message: "Incorrect email or password",
    });
  } else {
    user.lastLoginDate = Date.now();
    await user.save();
    createSendToken(user, 200, req, res);
    TrailManager(user._id, "Logged in", "success");
  }
});

// Logout User
export const logout = (req, res) => {
  res.cookie("jwt", "loggedout", {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });

  res.status(200).json({ status: "success" });
};

// PROTECT ROUTE
export const protect = catchAsync(async (req, res, next) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }
  if (!token) {
    res.status(401).json({
      status: "fail",
      message: "You are not logged in! Please log in to get access.",
    });
  }
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    res.status(401).json({
      status: "fail",
      message: "The user belonging to this token does no longer exist.",
    });
  }
  if (currentUser.changePasswordAfter(decoded.iat)) {
    res.status(401).json({
      status: "fail",
      message: "User recently changed password! Please log in again.",
    });
  }
  req.user = currentUser;
  res.locals.user = currentUser;
  next();
});

// Restrict Access
export const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        status: "fail",
        message: "You do not have permission to perform this action",
      });
    }

    next();
  };
};

// Forgot Password
export const forgotPassword = catchAsync(async (req, res, next) => {
  // const user = await User.findOne({ $or: [{ email }, { username: email }] })

  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    res.status(404).json({
      status: "fail",
      message: "There is no user with email address.",
    });
  }

  const resetToken = user.createToken("reset");
  await user.save({ validateBeforeSave: false });

  try {
    let resetURL;

    if (process.env.NODE_ENV === "development") {
      resetURL = `http://localhost:3000/reset-password/${resetToken}`;
    } else if (process.env.NODE_ENV === "production") {
      resetURL = `https://www.tinkoko.com/reset-password/${resetToken}`;
    }
    // const resetURL = `${req.protocol}://${req.get(
    //   'host'
    // )}/reset-password/${resetToken}`
    await new Email(user, resetURL).sendPasswordReset();

    res.status(200).json({
      status: "success",
      message: "Token sent to email!",
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });
    res.status(500).json({
      status: "fail",
      message: "There was an error sending the email. Try again later!",
    });
  }
});

// Reset password
export const resetPassword = catchAsync(async (req, res, next) => {
  const hashedToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  if (!user) {
    res.status(400).json({
      status: "fail",
      message: "Token is invalid or has expired",
    });
  }
  user.password = req.body.password;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  res.status(200).json("success");
  // createSendToken(user, 200, req, res)
});

// Update password
export const updatePassword = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user.id).select("+password");

  if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
    res.status(401).json({
      status: "fail",
      message: "Your current password is wrong.",
    });
  }

  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();

  createSendToken(user, 200, req, res);
});

// export const createOTP = catchAsync(async (req, res) => {
//   const otp = Math.floor(Math.random() * (999999 - 100000) + 100000).toString();

//   const hashedOtp = await encryptToken(otp);

//   const user = await User.findById(req.user._id);

//   if (!user) {
//     res.status(404).json({
//         status: "fail",
//         message: "No user found",
//       });
//   }

//   user.otpToken = hashedOtp;
//   user.otpExpires = Date.now() + 5 * 60 * 1000;

//   await user.save();

//   twilioClient.messages
//     .create({
//       body: `Do not share this code with anyone. Your OTP is ${otp}, valid for 5mins`,
//       from: "Tinkoko",
//       to: `+${user.countryCode}${user.phone}`,
//     })
//     .then((message) => {
//       res.status(200).json({
//         status: "success",
//         message: "OTP sent successfully",
//       });
//     });
//   // console.log('ERROR', error)
// });
