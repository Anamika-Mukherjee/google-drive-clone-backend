import {Request, Response, NextFunction} from "express";
import {createClient} from "@supabase/supabase-js";
import AppError from "../utils/AppError";

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

//function to upload file
const fileUpload = async (req: Request, res: Response, next: NextFunction)=>{
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

      //store user id in an object to be uploaded to database
      const userMetaData = {
        owner_id: userId
      }

     //store file object sent with the request in an object
      const file = req.file;

      if(!file){
        throw new AppError(400, "No file uploaded!");
      }

      //extract file body and other information from file object
      const {size, buffer, originalname} = file;
      const {fileType} = req.body;

      //define a string variable to store the file path to be uploaded to supabase
      const filePath = `${userId}/files/${originalname}`;

      //upload file to supabase with user id and access token
      const { data: uploadData, error: uploadError} = await supabase
      .storage
      .from("file_storage")
      .upload(`user_files/${filePath}`, buffer, {
         contentType: file.mimetype,
         metadata: userMetaData,
         headers: {
           Authorization: `Bearer ${token}`
         }
      });
       
      if(uploadError){
        throw new AppError(500, uploadError.message);
      }

      //extract file id and full path from the data returned by upload api
      const {id, fullPath} = uploadData;

      //insert file information in "files" table
      const {data: filesData, error: filesError} = await supabase
      .from("files")
      .insert({
        file_uuid: id,
        file_path: fullPath,
        file_owner_id: userId,
        file_name: originalname,
        file_type: fileType,
        file_size: size
      })
      .select();

      if(filesError){
        throw new AppError(500, filesError.message);
      }

      //check if user id exists in "user_folders" table
      const {data, error} = await supabase
      .from ("user_folders")
      .select("*")
      .eq("owner_id", userId)

      //if user id does not exist in "user_folders" table, insert new user
      if(!data){
        const {data: foldersData, error: foldersError} = await supabase
        .from("user_folders")
        .insert({
          owner_id: userId
        })

        if(foldersError){
          throw new AppError(500, foldersError.message);
        }
      }
      //send success message in json format
      res.status(200).json({filesData, message: "Successfully uploaded file!"});
    }
    catch(err){
      next(err);
    }
};

export default fileUpload;
