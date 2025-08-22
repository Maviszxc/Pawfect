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

// Serve static files from uploads directory
app.use('/uploads', express.static('uploads'));

// Routes
app.use("/api/users", userRoutes);
app.use("/api/pets", petRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/adoptions", adoptionRoutes);

app.get("/", (req, res) => {
  res.send("Hello World!");
});

const PORT = process.env.PORT || 5003;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
