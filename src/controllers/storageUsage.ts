import {Request, Response, NextFunction} from "express";
import {createClient} from "@supabase/supabase-js";
import AppError from "../utils/AppError";

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

//function to get storage information 
const storageUsage = async (req: Request, res: Response, next: NextFunction)=>{
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
  
      //get usage data on the basis of file type
      const {data: usageData, error: usageError} = await supabase
        .rpc("size_by_file_type", { auth_user_id: userId});
  
        if(usageError){
          throw new AppError(400, usageError.message);
        }
  
        res.status(200).json({usageData});
  
    } 
    catch(err){
       next(err);
    }
};

export default storageUsage;