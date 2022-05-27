const express = require('express');
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
// port added dynamically
const PORT = process.env.PORT || 8002;
const server = http.createServer(app);
server.listen(8001, function() {
    console.log(`Server is up on ${PORT}`);
});