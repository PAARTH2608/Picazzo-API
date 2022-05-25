const router = require("express").Router();
const { testController } = require("../controllers");

router.get("/", (req, res) => {
  testController.TestController(req, res);
});

module.exports = router;
