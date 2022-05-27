const express = require('express');
const path = require('path');
const connectDB = require('./api/config/connectDB');
const cors = require('cors');
require('dotenv').config();

const app = express();

connectDB();

const router = require('./api/routes');

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api', router);

app.use(function (err, req, res, next) {
	res.status(err.status || 404).send("route doesn't exist");
});

// ---------deployment
const __dirname1 = path.resolve();

if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname1, "/frontend/build")));

  app.get("*", (req, res) =>
    res.sendFile(path.resolve(__dirname1, "frontend", "build", "index.html"))
  );
} else {
  app.get("/", (req, res) => {
    res.send("API is running..");
  });
}
// 

const PORT = process.env.PORT || 8002;

app.listen(8001, function() {
    console.log(`Server is up on ${PORT}`);
});