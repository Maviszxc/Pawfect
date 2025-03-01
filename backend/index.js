/** @format */

const express = require("express");

const databaseUtil = require("./Utilities/databaseUtil");
const cors = require("cors");

const userRoutes = require("./Routes/userRoutes");

const app = express();

databaseUtil();

app.use(express.json());
app.use(cors({ origin: "*" }));

// APIs

app.use("/api/users", userRoutes);

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(5000);
