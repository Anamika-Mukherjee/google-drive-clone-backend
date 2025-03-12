import {Request, Response, NextFunction} from "express";
import {createClient} from "@supabase/supabase-js";
import AppError from "../utils/AppError";
import permanentlyDelete from "../utils/permanentlyDelete";

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

//function to delete file permanently
const fileDelete = async (req: Request, res: Response, next: NextFunction)=>{
    try{
        //retrieve access token from request header
        const token = req.headers["authorization"]?.split(" ")[1];

        if (!(token)) {
          throw new AppError(401, "No token provided!");
        }
  
        //retrieve user information from supabase using the token
        const { data: { user }, error: tokenError } = await supabase.auth.getUser(token);

        if (tokenError || !user) {
          throw new AppError(401, "Invalid or expired token!");
        }

        //store user id in a variable
        const userId = user.id;

        //extract file name from request body
        const {fileName} = req.body;

        //create valid file path with file name
        const trashPath = `user_files/${userId}/trash/${fileName}`;

        //delete file permanently
        await permanentlyDelete(trashPath);

        res.status(200).json("File permanently deleted!");

    }
    catch(err){
         next(err);
    }
};

export default fileDelete;