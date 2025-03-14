import "dotenv/config";
import express, { Request, Response, NextFunction } from "express";
import bodyParser from "body-parser";
import cors from "cors";
import AppError from "./src/utils/AppError";
import authRoutes from "./src/routes/authRoutes";
import uploadRoutes from "./src/routes/uploadRoutes";
import updateRoutes from "./src/routes/renameRoutes";
import deleteRoutes from "./src/routes/deleteRoutes";
import restoreRoutes from "./src/routes/restoreRoutes";
import shareRoutes from "./src/routes/shareRoutes";
import dashboardRoutes from "./src/routes/userInfoRoutes";
import searchRoutes from "./src/routes/searchRoutes";
import fileListRoutes from "./src/routes/fileInfoRoutes";
import fileEditRoutes from "./src/routes/fileEditRoutes";
import scheduledCleanUp from "./src/utils/scheduledCleanUp";

const app = express();
const port = process.env.PORT || 5000;

scheduledCleanUp();

app.use(express.json());
app.use(bodyParser.urlencoded({extended: false}));

const allowedUrls = [process.env.FRONTEND_URL];

const corsOptions = {
    origin: (origin: string | undefined, callback: (err: Error | null, allow: boolean)=> void) =>{
        if(allowedUrls.indexOf(origin) !== -1 || !origin){
            callback(null, true);
        }
        else{
            callback(new Error("Not allowed by CORS!"), false);
        }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"]
}

app.use(cors(corsOptions));
app.options('*', cors()); 

process.on("uncaughtException", (err) => {
    console.error("Uncaught Exception:", err);
    process.exit(1);  
});

app.use("/auth", authRoutes);
app.use("/user", uploadRoutes);
app.use("/user", updateRoutes);
app.use("/user", deleteRoutes);
app.use("/user", restoreRoutes);
app.use("/user", shareRoutes);
app.use("/user", dashboardRoutes);
app.use("/", searchRoutes);
app.use("/user", fileListRoutes);
app.use("/user", fileEditRoutes);

app.get("/", async (req: Request, res: Response)=>{
    res.status(200).json("Server is Live");
});

app.get("/health", async (req: Request, res: Response)=>{
    res.status(200).json("Ok");
});

app.use((error: AppError, req: Request, res: Response, next: NextFunction)=>{
    const {statusCode = 500, message = "Something went wrong!"} = error;
    res.status(statusCode).json({error: true, message: message});
});

app.listen(port, ()=>{
    console.log(`Server running at port ${port}`);
})