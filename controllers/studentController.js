import { nanoid } from "nanoid";
import Student from '../models/studentModel.js'
import catchAsync from "../utils/catchAsync.js";
import  crypto  from 'crypto';



export const register = catchAsync(async (req, res) => {
  const { name, level, email, studentClass, profilePicture } = req.body;

  if (!name || !level || !email || !studentClass || !profilePicture) {
    return next(new AppError("Please provide necessary Information", 400));
  }

  const existingEmail = await Student.findOne({ email });

  if (existingEmail) {
    res.json({
      status: "fail",
      message: `Student email already exists. Please use another`,
    });
  }

  const id = parseInt(crypto.randomBytes(4).toString('hex'), 16) 
  .toString()
  .slice(0,7); 
console.log('id', id);
  const studentId = `HK${id}`;

  const newStudent = await Student.create({
    name,
    studentId,
    level,
    email,
    studentClass,
    profilePicture
  });

  res.status(200).json({
    status: "success",
    message:
      "Student Registered successfully",
  });
});
