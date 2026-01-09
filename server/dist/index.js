import express from "express";
import cors from "cors";
const app = express();
app.use(cors());
app.get("/", (req, res) => {
    res.json({
        data: "data returned",
    });
});
app.listen(5050, () => {
    console.log("server running on the port 5050");
});
