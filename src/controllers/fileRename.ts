import {Request, Response, NextFunction} from "express";
import {createClient} from "@supabase/supabase-js";
import AppError from "../utils/AppError";

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

//function to rename file
const fileRename = async (req: Request, res: Response, next: NextFunction)=>{
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

      //store user id in an object
      const userId = user.id;

      //store user id in an object to be uploaded to the database
      const userMetaData = {
        owner_id: userId
      }

      //extract old filename and new filename from request body
      const {oldFileName, newFileName} = req.body;

      //create valid file path with filenames
      const oldFilePath = `${userId}/files/${oldFileName}`;
      const newFilePath = `${userId}/files/${newFileName}`;

      //download the file to be renamed from supabase storage
      const {data: downloadData, error: downloadError} = await supabase
       .storage
       .from("file_storage")
       .download(`user_files/${oldFilePath}`)

      if(downloadError){
        throw new AppError(400, downloadError.message);
      }

      //retrieve file information from "files" table
      const {data, error: fileInfoError} = await supabase
       .from("files")
       .select("*")
       .eq("file_path", `file_storage/user_files/${oldFilePath}`)

      if(fileInfoError){
        throw new AppError(400, fileInfoError.message);
      }

      //define type for returned file information
      type UUID = string
      interface FileInfo{
            file_owner_id: UUID,
            file_type: string,
            file_size: number
      }

      const fileInfoData: FileInfo[] = data as FileInfo[] ;
      const [firstFile] = fileInfoData;

      //extract file information from returned file information object
      const {file_owner_id, file_type, file_size} = firstFile;

      //uploaded the file with new file path
      const {data: renameData, error: renameError} = await supabase
       .storage
       .from("file_storage")
       .upload(`user_files/${newFilePath}`, downloadData, {
          upsert: true,
          contentType: file_type,
          metadata: userMetaData,
          headers:{
            Authorization: `Bearer ${token}`
          }
       });

       if(renameError){
         throw new AppError(400, renameError.message);
       }

       //extract id and fullPath from the renamed file
       const {id, fullPath} = renameData;

       //insert updated file information with the unmodified information in "files" table
       const {data: filesData, error: filesError} = await supabase
        .from("files")
        .insert({
            file_uuid: id,
            file_path: fullPath,
            file_owner_id,
            file_name: newFileName,
            file_type,
            file_size
        })
        .select();

       if(filesError){
          throw new AppError(400, filesError.message);
       }

       //remove the old file from the supabase storage
       const {error: removeError} = await supabase
        .storage
         .from("file_storage")
         .remove([`user_files/${oldFilePath}`]);

        if(removeError){
          throw new AppError(400, removeError.message);
        }

        //send success message in json format
        res.status(200).json({newFileName, message: "File renamed successfully!"});
    }
    catch(err){
      next(err);
    }
};

export default fileRename;