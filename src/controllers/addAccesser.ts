import {Request, Response, NextFunction} from "express";
import {createClient} from "@supabase/supabase-js";

import {FileInfo, User, OwnerInfo, AccesserInfo} from "../utils/types";
import AppError from "../utils/AppError";

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

//function to add accesser to share a file
const addAccesser = async (req: Request, res: Response, next: NextFunction)=>{
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
     
      const userId = user.id;

      //extract file name, accesser email and type of permission from request body
      const {fileName, accesserEmail, permissionType}= req.body;

      //fetch file_uuid through file_name from "files" table 
      const {data: fileData, error: fileError} = await supabase
      .from("files")
      .select("file_uuid, file_size")
      .eq("file_name", fileName);

      if(fileError){
        throw new AppError(400, fileError.message);
      }

      //define types for the returned data
      const fileArray: FileInfo[] = fileData as FileInfo[];
      const [file] = fileArray;
      
      //extract file_uuid and file size from the returned data
      const {file_uuid, file_size} = file;

      //fetch accesser's user id through accesser_email from "profiles" table
      const {data: userData, error: userError} = await supabase
      .from("profiles")
      .select("user_id")
      .eq("email", accesserEmail);

      if(userError){
        throw new AppError(400, userError.message);
      }

      //define types for the returned data
      const userArray: User[] = userData as User[];
      const [firstUser] = userArray;

      //extract user id from the returned data
      const {user_id} = firstUser;

      //retrieve owner's email and name from "profiles" table
      const {data: ownerData, error: ownerDataError} = await supabase
      .from("profiles")
      .select("email, full_name")
      .eq("user_id", userId);

      if(ownerDataError){
        throw new AppError(400, ownerDataError.message);
      }

      //define object to store owner's data
      const ownerInfo: OwnerInfo[] = ownerData as OwnerInfo[];
      const [owner] = ownerInfo;

      const {email, full_name} = owner;

      //insert shared file details to the "shared_files" table
      const {data: fileAccessData, error: fileAccessError} = await supabase
      .from("shared_files")
      .insert({
        file_uuid,
        file_name: fileName,
        file_size,
        owner_id: userId, 
        owner_email: email,
        owner_name: full_name,
        accesser_id: user_id,
        accesser_email: accesserEmail,
        permission_type: permissionType
      });
      
      if(fileAccessError){
        throw new AppError(400, fileAccessError.message);
      }

      //retrieve accesser list for the file from "shared_files" table
      const {data: accesserData, error: accesserListError} = await supabase
      .from("shared_files")
      .select("accesser_id, accesser_email, permission_type")
      .eq("file_uuid", file_uuid);

      if(accesserListError){
        throw new AppError(400, accesserListError.message);
      }
      
      //store accesser data in an array and send the data to frontend
      const accesserList: AccesserInfo[] = accesserData as AccesserInfo[];
      res.status(200).json({accesserList, message:"Email added to accesser list!"})
    }
    catch(err){
      next(err);
    }
};

export default addAccesser;