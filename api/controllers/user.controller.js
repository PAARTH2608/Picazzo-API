const jwt = require("jsonwebtoken");
const MongoClient = require("mongodb").MongoClient;
const { User } = require("../models");
const cloudinary = require("../config/imageUpload");

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

// user upload generated image to cloudinary after being processed by the DL model
const uploadProfile = async (req, res) => {
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

    await User.findByIdAndUpdate(
      { _id: user._id },
      {
        $push: {
          images: result.url,
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

// user gets access to the generated images
const getGeneratedPics = async (req, res) => {
  const user = await User.find({ name: req.body.name });
  // console.log(user);
  if (!user) {
    return res
      .status(401)
      .json({ success: false, message: "unauthorized access!" });
  }
  res.json({ success: true, user });
};

// user gets access to styled images on his UI
const getStyledPics = async (req, res) => {
  MongoClient.connect(process.env.MONGO_URI, function (err, client) {
    if (err) throw err;

    var db = client.db("Picazzo");

    db.collection("admins").findOne({}, function (findErr, result) {
      if (findErr) throw findErr;
      const resultImages = result.images;
      res.json({ success: true, resultImages });
      client.close();
    });
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
  uploadProfile,
  getStyledPics,
  getGeneratedPics,
  signOut,
};
