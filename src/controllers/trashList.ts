import {Request, Response, NextFunction} from "express";
import {createClient} from "@supabase/supabase-js";

import AppError from "../utils/AppError";
import {FileInfo} from "../utils/types";

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

//function to retrieve trash file information 
const trashList = async (req: Request, res: Response, next: NextFunction)=>{
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
      
      const {data: trashData, error: trashError} = await supabase
      .from("trash_files")
      .select("*")
      .eq("file_owner_id", userId);
  
      if(trashError){
        throw new AppError(400, trashError.message);
      }
  
      const trashFileData: FileInfo[] = trashData as FileInfo[];
  
      const trashFiles: FileInfo[] = [];
  
      if(trashFileData){
         trashFileData.map((file)=>{        
           trashFiles.push(file);
         })
         res.status(200).json({files: trashFiles});
      }        
      
      else{
        res.status(200).json("No files in trash!");
      }
    }
    catch(err){
      next(err);
    }
};

export default trashList;