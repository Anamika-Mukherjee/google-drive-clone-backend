import {Request, Response, NextFunction} from "express";
import {createClient} from "@supabase/supabase-js";
import {AccesserInfo} from "../utils/types";
import AppError from "../utils/AppError";

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

//function to retrieve accesser information for shared files
const accesserList = async (req: Request, res: Response, next: NextFunction)=>{
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
  
      //extract file name, accesser email and type of permission from request body
      const {fileId}= req.body;
  
      //fetch file_uuid through file_name from "files" table 
      const {data: accesserData, error: accesserError} = await supabase
      .from("shared_files")
      .select("accesser_id, accesser_email, permission_type")
      .eq("file_uuid", fileId);
  
      if(accesserError){
        throw new AppError(400, accesserError.message);
      }
  
      //define types for the returned data
      const accesserList: AccesserInfo[] = accesserData as AccesserInfo[];
      
      //if accesser list has accesser information, send to frontend, else return with a message  
      if(accesserList.length > 0){
        res.status(200).json({accesserList})
      }
      else{
        res.status(200).json({message: "No accessers!"})
      }
   
    }
    catch(err){
      next(err);
    }
};

export default accesserList;