const express = require("express");
const app = express();
const cors = require("cors");
const path = require("path");

const books = require("./routes/book");

app.use(cors());
app.use(express.json());
app.use("/images", express.static(path.join(__dirname, "images")));

app.use("/api/v1/books", books);

const users = require("./routes/user");
app.use("/api/v1/users", users);

const orders = require("./routes/order");
app.use("/api/v1/orders", orders);

module.exports = app;
