const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const imageSchema = new mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  url: {
    type: String,
    required: true,
  },
  likes: {
    type: Number,
    default: 0,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
});

let Image = mongoose.model("Image", imageSchema);

module.exports = Image;
