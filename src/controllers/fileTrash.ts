import {Request, Response, NextFunction} from "express";
import {createClient} from "@supabase/supabase-js";

import AppError from "../utils/AppError";
import {FileInfo} from "../utils/types";

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

//function to move file to trash
const fileTrash = async (req: Request, res: Response, next: NextFunction)=>{
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

      //create valid file paths with file name
      const currentFilePath = `${userId}/files/${fileName}`;
      const trashPath = `${userId}/trash/${fileName}`;
      
      //retrieve file information from "files" table
      const {data, error: trashedFileError} = await supabase
      .from("files")
      .select("*")
      .eq("file_path", `file_storage/user_files/${currentFilePath}`);

      if(trashedFileError){
        throw new AppError(400, trashedFileError.message);
      }

      //define types for returned data
      const trashedFileInfo: FileInfo[] = data as FileInfo[] ;
      const [trashedFile] = trashedFileInfo;

      //extract file information from returned file information object
      const {file_uuid, file_name, file_owner_id, file_type, file_size} = trashedFile;
   
      //move file to trash
      const { data: deleteData, error: deleteError } = await supabase
       .storage
       .from("file_storage")
       .move(`user_files/${currentFilePath}`, `user_files/${trashPath}`);

      if(deleteError){
        throw new AppError(400, deleteError.message);
      } 

      //insert trashed file information to "trash_files" table
      const {data: trashFileInfo, error: trashFileError} = await supabase
      .from("trash_files")
      .insert({
           file_uuid,
           file_name, 
           file_path: `file_storage/user_files/${trashPath}`,
           file_owner_id,
           file_type,
           file_size
      })

      if(trashFileError){
        throw new AppError(400, trashFileError.message);
      }

      //delete trashed file information from "files" table
      const {data: deleteFileInfo, error: deleteFileError} = await supabase
      .from("files")
      .delete()
      .eq("file_uuid", file_uuid);

      if(deleteFileError){
        throw new AppError(400, deleteFileError.message);
      }

      res.status(200).json("File moved to trash folder successfully!");
      
    }
    catch(err){
      next(err);
    }
};

export default fileTrash;