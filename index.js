const express = require('express');
const connectDB = require('./api/config/connectDB');
const http = require("http");
const cors = require('cors');
const swaggerJsDoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

const swaggerOptions = {
    swaggerDefinition: {
        info: {
            title: "Picazzo API",
            description: "API documentation for Picazzo",
            contact: {
                name: "Paarth"
            },
            servers: ["http://localhost:8001"],
        }
    },
    apis: ["./api/routes/*.js"]
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);

require('dotenv').config();
const app = express();

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));

/**
 * @swagger
 * /api/test:
 * get:
 *  description: Test route
 *  responses:
 *      '200':
 *      description: Testing successful
 */

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
server.listen(PORT, function() {
    console.log(`Server is up on ${PORT}`);
});