const { userController } = require("../controllers");
const router = require("express").Router();
const { isAuth } = require("../middlewares/auth");
const {
  validateUserSignUp,
  userValidation,
  validateUserSignIn,
} = require("../middlewares/validation/user");

const multer = require("multer");
const storage = multer.diskStorage({});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image")) {
    cb(null, true);
  } else {
    cb("invalid image file!", false);
  }
};
const uploads = multer({ storage, fileFilter });

router.post("/create-user", validateUserSignUp, userValidation, (req, res) => {
  userController.createUser(req, res);
});
router.post("/sign-in", validateUserSignIn, userValidation, (req, res) => {
  userController.userSignIn(req, res);
});
router.post("/sign-out", isAuth, (req, res) => {
  userController.signOut(req, res);
});
router.post(
  "/applystyle",
  isAuth,
  // uploads.single("generatedImage"),
  (req, res) => {
    userController.applyStyles(req, res);
  }
);
router.get("/getgeneratedpics", isAuth, (req, res) => {
  userController.getGeneratedPics(req, res);
});
router.get("/getstyledpics", isAuth, (req, res) => {
  userController.getStyledPics(req, res);
});
router.post("/likeImage", isAuth, (req, res) => {
  userController.likeImage(req, res);
});
router.post("/unlikeImage", isAuth, (req, res) => {
  userController.unLikeImage(req, res);
});
router.post("/follow", isAuth, (req, res) => {
  userController.addFollowers(req, res);
});
router.post("/unfollow", isAuth, (req, res) => {
  userController.removeFollowers(req, res);
});

module.exports = router;
