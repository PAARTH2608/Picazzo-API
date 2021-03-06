const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const { Admin } = require("../models");
const cloudinary = require("../config/imageUpload");
const Image = require("../models/image.model");

// creating new admin
const createUser = async (req, res) => {
  const { name, email, password } = req.body;
  const isNewUser = await Admin.isThisEmailInUse(email);
  if (!isNewUser)
    return res.json({
      success: false,
      message: "This email is already in use, try sign-in",
    });
  const user = await Admin({
    name,
    email,
    password,
  });
  await user.save();
  res.json({ success: true, user });
};

// sign-in new admin
const userSignIn = async (req, res) => {
  const { email, password } = req.body;

  const user = await Admin.findOne({ email });

  if (!user)
    return res.json({
      success: false,
      message: "user not found, with the given email!",
    });

  const isMatch = await user.comparePassword(password);
  if (!isMatch)
    return res.json({
      success: false,
      message: "email / password does not match!",
    });

  const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
    expiresIn: "1d",
  });

  let oldTokens = user.tokens || [];

  if (oldTokens.length) {
    oldTokens = oldTokens.filter((t) => {
      const timeDiff = (Date.now() - parseInt(t.signedAt)) / 1000;
      if (timeDiff < 86400) {
        return t;
      }
    });
  }

  await Admin.findByIdAndUpdate(user._id, {
    tokens: [...oldTokens, { token, signedAt: Date.now().toString() }],
  });

  const userInfo = {
    fullname: user.name,
    email: user.email,
    image: user.image ? user.image : "",
  };

  res.json({ success: true, user: userInfo, token });
};

// admin upload pics to cloudinary (these are styled pics)
const uploadStyledPics = async (req, res) => {
  const { user } = req;
  if (!user)
    return res
      .status(401)
      .json({ success: false, message: "unauthorized access!" });

  try {
    const result = await cloudinary.uploader.upload(req.file.path, {
      public_id: `${user._id}_${Math.random()}_profile`,
      width: 500,
      height: 500,
      crop: "fill",
    });
    const image = new Image({
      _id: new mongoose.Types.ObjectId(),
      url: result.url,
      likes: req.body.likes,
      user: user._id,
      imageType: "styled",
    });
    image.save();

    await Admin.findByIdAndUpdate(
      { _id: user._id },
      {
        $push: {
          images: { _id: image._id },
        },
      }
    );
    res
      .status(201)
      .json({ success: true, message: "Your image has been saved to our db!" });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "server error, try after some time" });
    console.log("Error while uploading profile image", error.message);
  }
};

// admin gets the access of the styled pics
const getPics = async (req, res) => {
  const admin = await Admin.find({ name: req.body.name }).populate("images");
  if (!admin) {
    return res
      .status(401)
      .json({ success: false, message: "unauthorized access!" });
  }
  res.json({ success: true, admin });
};

// sign-out route for admin
const signOut = async (req, res) => {
  if (req.headers && req.headers.authorization) {
    const token = req.headers.authorization.split(" ")[1];
    if (!token) {
      return res
        .status(401)
        .json({ success: false, message: "Authorization fail!" });
    }

    const tokens = req.user.tokens;

    const newTokens = tokens.filter((t) => t.token !== token);

    await Admin.findByIdAndUpdate(req.user._id, { tokens: newTokens });
    res.json({ success: true, message: "Sign out successfully!" });
  }
};

module.exports = {
  createUser,
  userSignIn,
  uploadStyledPics,
  getPics,
  signOut,
};
