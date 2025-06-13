import express from "express";
import cors from "cors";
import session from "./routes/session.js";

const PORT = process.env.PORT || 5050;
const app = express();

app.use(cors());
app.use(express.json());
app.use("/session", session);

// Lancer le serveuyr express
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});