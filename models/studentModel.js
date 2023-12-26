import mongoose from "mongoose";

const studentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please provide your name!"],
  },
  studentId: {
    type: String,
    unique: true,
    required: [true, "Student ID not generated"],
  },
  level: {
    type: String,
    enum: ["primary", "secondary"],
    required: [true, "Please select a level"],
  },
  email: {
    type: String,
    required: [true, "Please provide your email"],
    unique: true,
    lowercase: true,
    trim: true,
  },
  studentClass: {
    type: String,
    required: [true, "Please select a class"],
  },
  profilePicture: {
    type: Object,
    required: [true, "Please upload studet's profile photo"],
  }
},
{
    timestamps: true,
  }
);

const Student = mongoose.model('Student', studentSchema)

export default Student;
