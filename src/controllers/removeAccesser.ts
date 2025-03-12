import {Request, Response, NextFunction} from "express";
import {createClient} from "@supabase/supabase-js";
import {FileInfo, User, AccesserInfo} from "../utils/types";
import AppError from "../utils/AppError";

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

//function to remove accesser from a shared file
const removeAccesser = async (req: Request, res: Response, next: NextFunction)=>{
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
      const {fileName, accesserEmail} = req.body;
  
      //fetch file_uuid through file_name from "files" table 
      const {data: fileData, error: fileError} = await supabase
      .from("files")
      .select("file_uuid")
      .eq("file_name", fileName);
  
      if(fileError){
        throw new AppError(400, fileError.message);
      }
  
      //store returned data in an object
      const fileArray: FileInfo[] = fileData as FileInfo[];
      const [file] = fileArray;
      
      //extract file_uuid from the returned data
      const {file_uuid} = file;
  
      //fetch accesser's user id through accesser_email from "profiles" table
      const {data: userData, error: userError} = await supabase
      .from("profiles")
      .select("user_id")
      .eq("email", accesserEmail);
  
      if(userError){
        throw new AppError(400, userError.message);
      }
  
      //store returned data in an object
      const userArray: User[] = userData as User[];
      const [firstUser] = userArray;
  
      //extract user id from the returned data
      const {user_id} = firstUser;
  
      //remove the accesser from the "shared_files" table
      const {error: deleteAccesserError} = await supabase
      .from("shared_files")
      .delete()
      .eq("file_uuid", file_uuid)
      .eq("accesser_id", user_id);
      
      if(deleteAccesserError){
        throw new AppError(400, deleteAccesserError.message);
      }
  
      //retrieve updated accesser list from "shared_files" table
      const {data: accesserData, error: accesserListError} = await supabase
      .from("shared_files")
      .select("accesser_id, accesser_email, permission_type")
      .eq("file_uuid", file_uuid);
  
      if(accesserListError){
        throw new AppError(400, accesserListError.message);
      }
  
      //store accesser list in an array and send it back to frontend
      const accesserList: AccesserInfo[] = accesserData as AccesserInfo[];
      if(accesserList.length > 0){
        res.status(200).json({accesserList, message: "Accesser removed successfully!"});
      }
      else{
        res.status(200).json("No accesser for the file!");
      }
    }
    catch(err){
      next(err);
    }
};

export default removeAccesser;