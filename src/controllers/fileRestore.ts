import {Request, Response, NextFunction} from "express";
import {createClient} from "@supabase/supabase-js";

import AppError from "../utils/AppError";
import {FileInfo} from "../utils/types";

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

//function to restore file from trash
const fileRestore = async (req: Request, res: Response, next: NextFunction)=>{
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
      const trashPath = `${userId}/trash/${fileName}`;
      const restoredFilePath = `${userId}/files/${fileName}`;
      
      //retrieve file information from "trash_files" table
      const {data, error: trashedFileError} = await supabase
      .from("trash_files")
      .select("*")
      .eq("file_path", `file_storage/user_files/${trashPath}`);

      if(trashedFileError){
        throw new AppError(400, trashedFileError.message);
      }

      //define types for returned data
      const trashedFileInfo: FileInfo[] = data as FileInfo[] ;
      const [trashFile] = trashedFileInfo;

      //extract file information from returned file information object
      const {file_uuid, file_name, file_owner_id, file_type, file_size} = trashFile;

      //restore file
      const { data: restoreData, error: restoreError } = await supabase
       .storage
       .from("file_storage")
       .move(`user_files/${trashPath}`, `user_files/${restoredFilePath}`, );

      if(restoreError){
        throw new AppError(400, restoreError.message);
      } 

      //insert restored file information to "files" table
      const {data: restoredFileInfo, error: restoredFileError} = await supabase
      .from("files")
      .insert({
           file_uuid,
           file_name, 
           file_path: `file_storage/user_files/${restoredFilePath}`,
           file_owner_id,
           file_type,
           file_size
      })

      if(restoredFileError){
        throw new AppError(400, restoredFileError.message);
      }

      //delete trashed file information from "trash_files" table
      const {data: deleteFileInfo, error: deleteFileError} = await supabase
      .from("trash_files")
      .delete()
      .eq("file_uuid", file_uuid);

      if(deleteFileError){
        throw new AppError(400, deleteFileError.message);
      }

      res.status(200).json({message: "File restored successfully!"});
      
    }
    catch(err){
      next(err);
    }
};

export default fileRestore; 