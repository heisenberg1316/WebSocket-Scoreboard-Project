import express from "express";
import { matchRouter } from "./routes/matches.js";

const app = express();
const port = 8000;

app.use(express.json());
app.use("/matches", matchRouter); 

app.get("/", (req, res) => {
    return res.send("Hello from express server");
})


app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
})