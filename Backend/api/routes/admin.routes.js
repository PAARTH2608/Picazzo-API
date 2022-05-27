const { adminController } = require("../controllers");

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

router.post("/create-admin", validateUserSignUp, userValidation, (req, res) => {
  adminController.createUser(req, res);
});
router.post(
  "/sign-in-admin",
  validateUserSignIn,
  userValidation,
  (req, res) => {
    adminController.userSignIn(req, res);
  }
);
router.post("/sign-out", isAuth, (req, res) => {
  adminController.signOut(req, res);
});
router.post(
  "/uploadPics",
  isAuth,
  uploads.single("styleImages"),
  (req, res) => {
    adminController.uploadProfile(req, res);
  }
);
router.get("/getpics", isAuth, (req, res) => {
  adminController.getPics(req, res);
});

module.exports = router;
