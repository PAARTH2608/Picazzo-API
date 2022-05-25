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

const PORT = process.env.PORT || 8002;

app.listen(8001, function() {
    console.log(`Server is up on ${PORT}`);
});

// const server = http.createServer(app);
// server.listen(PORT, () => `Server running on PORT ${PORT}`);