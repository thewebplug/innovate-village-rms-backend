import mongoose from "mongoose";
const { ObjectId } = mongoose

const trailSchema = new mongoose.Schema({
  actor: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
  },
  action: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    required: true,
  },
  time: {
    type: Date,
    default: Date.now(),
    required: true,
  },
})

const Trail = mongoose.model('Trail', trailSchema)
export default Trail;
