const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const MongoClient = require("mongodb").MongoClient;
const { User } = require("../models");
const cloudinary = require("../config/imageUpload");
const Image = require("../models/image.model");
const deepai = require("deepai");

require("dotenv").config();
deepai.setApiKey(process.env.DEEPAI_API_KEY);

// creating new user
const createUser = async (req, res) => {
  const { name, email, password } = req.body;
  const isNewUser = await User.isThisEmailInUse(email);
  if (!isNewUser)
    return res.json({
      success: false,
      message: "This email is already in use, try sign-in",
    });
  const user = await User({
    name,
    email,
    password,
  });
  await user.save();
  res.json({ success: true, user });
};

// sign-in new user
const userSignIn = async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });

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

  await User.findByIdAndUpdate(user._id, {
    tokens: [...oldTokens, { token, signedAt: Date.now().toString() }],
  });

  const userInfo = {
    fullname: user.name,
    email: user.email,
    images: user.images ? user.images : "",
  };

  res.json({ success: true, user: userInfo, token });
};

// user send the link of style and content images, gets the styled image
const applyStyles = async (req, res) => {
  const { user } = req;
  if (!user)
    return res
      .status(401)
      .json({ success: false, message: "unauthorized access!" });

  try {
    const styledObj = await deepai.callStandardApi("fast-style-transfer", {
      content: req.body.content_image,
      style: req.body.style_image,
    });
    const result = await cloudinary.uploader.upload(styledObj.output_url, {
      public_id: `${user._id}_${styledObj.id}`,
      width: 500,
      height: 500,
      crop: "fill",
    });
    const image = new Image({
      _id: new mongoose.Types.ObjectId(),
      url: result.url,
      likes: req.body.likes,
      user: user._id,
      imageType: "generated",
    });
    image.save();
    await User.findByIdAndUpdate(
      { _id: user._id },
      {
        $push: {
          images: { _id: image._id },
        },
      }
    );
    res.status(201).json({
      success: true,
      message: "Your image has been saved to our db!",
      url: image.url,
    });
    // res.json({ success: true, url: styledObj.output_url, id: styledObj.id });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "server error, try after some time" });
  }
};
// user gets access to the generated images
const getGeneratedPics = async (req, res) => {
  const user = await User.find({ email: req.body.email }).populate("images");
  try {
    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: "unauthorized access!" });
    }
    res.json({ success: true, user });
  } catch (err) {
    res
      .status(500)
      .json({ success: false, message: "server error, try after some time" });
  }
};

// user gets access to styled images on his UI
const getStyledPics = async (req, res) => {
  try {
    const images = await Image.find({imageType:"styled"}) ;
    if (!images) {
      return res
        .status(401)
        .json({ success: false, message: "unauthorized access!" });
    }
    res.json({ success: true, images });
  } catch (err) {
    res
      .status(500)
      .json({ success: false, message: "server error, try after some time" });
  }
};

const likeImage = async (req, res) => {
  const { imageId } = req.body;
  const image = await Image.findById(imageId);
  if (!image)
    return res.json({
      success: false,
      message: "image not found, with the given id!",
    });
  const likes = image.likes || [];
  const isLiked = likes.includes(req.user._id);
  if (isLiked) {
    return res.json({
      success: false,
      message: "you have already liked this image",
    });
  }
  likes.push(req.user._id);
  await Image.findByIdAndUpdate(imageId, { likes });
  res.json({
    success: true,
    message: "image liked successfully!",
    totalLikes: likes.length,
  });
};

const unLikeImage = async (req, res) => {
  const { imageId } = req.body;
  const image = await Image.findById(imageId);
  if (!image)
    return res.json({
      success: false,
      message: "image not found, with the given id!",
    });
  const likes = image.likes || [];
  const isLiked = likes.includes(req.user._id);
  if (!isLiked) {
    return res.json({
      success: false,
      message: "you have not liked this image",
    });
  }
  likes.splice(likes.indexOf(req.user._id), 1);
  await Image.findByIdAndUpdate(imageId, { likes });
  res.json({
    success: true,
    message: "image unliked successfully!",
    totalLikes: likes.length,
  });
};

const addFollowers = async (req, res) => {
  const { userId } = req.body;
  const user = await User.findById(userId);
  if (!user)
    return res.json({
      success: false,
      message: "user not found, with the given id!",
    });
  const followers = user.followers || [];
  const isFollowed = followers.includes(req.user._id);
  if (isFollowed) {
    return res.json({
      success: false,
      message: "you have already followed this user",
    });
  }
  followers.push(req.user._id);
  await User.findByIdAndUpdate(userId, { followers });
  res.json({
    success: true,
    message: "user followed successfully!",
    totalFollowers: followers.length,
  });
};

const removeFollowers = async (req, res) => {
  const { userId } = req.body;
  const user = await User.findById(userId);
  if (!user)
    return res.json({
      success: false,
      message: "user not found, with the given id!",
    });
  const followers = user.followers || [];
  const isFollowed = followers.includes(req.user._id);
  if (!isFollowed) {
    return res.json({
      success: false,
      message: "you have not followed this user",
    });
  }
  followers.splice(followers.indexOf(req.user._id), 1);
  await User.findByIdAndUpdate(userId, { followers });
  res.json({
    success: true,
    message: "user unfollowed successfully!",
    totalFollowers: followers.length,
  });
};

// user sign-out
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

    await User.findByIdAndUpdate(req.user._id, { tokens: newTokens });
    res.json({ success: true, message: "Sign out successfully!" });
  }
};
module.exports = {
  createUser,
  userSignIn,
  getStyledPics,
  getGeneratedPics,
  likeImage,
  unLikeImage,
  addFollowers,
  removeFollowers,
  signOut,
  applyStyles,
};
