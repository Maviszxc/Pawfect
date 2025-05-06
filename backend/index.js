/** @format */

const express = require("express");
const app = express();
const cors = require("cors");
const dotenv = require("dotenv");
const dbConnect = require("./Utilities/databaseUtil");
const userRoutes = require("./Routes/userRoutes");
const petRoutes = require("./Routes/petRoutes");
const adoptionRoutes = require("./Routes/adoptionRoutes");
const adminRoutes = require("./routes/adminRoutes");

dotenv.config();

// Connect to MongoDB
dbConnect();

app.use(express.json());
app.use(cors({ origin: "*" }));

// Routes

app.use("/api/users", userRoutes);
app.use("/api/pets", petRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/adoptions", adoptionRoutes);

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(5000);
