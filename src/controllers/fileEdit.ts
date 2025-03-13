import {Request, Response, NextFunction} from "express";
import {createClient} from "@supabase/supabase-js";
import AppError from "../utils/AppError";

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

//function to edit file
const editFile = async (req: Request, res: Response, next: NextFunction)=>{
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

      //extract file name and owner id from the request body
      const {fileName, owner_id} = req.body;
      
      //retrieve shared file information from "shared_files" table
      const {data: editData, error: editFileError} = await supabase
      .from("shared_files")
      .select("*")
      .eq("accesser_id", userId)
      .eq("file_name", fileName)
      .eq("owner_id", owner_id)
      .eq("permission_type", "edit");
  
      if(editFileError){
        throw new AppError(400, editFileError.message);
      }
  
      if(editData.length === 0){
         res.json("Not allowed to edit file!");
      }
  
      //generate signed url to edit file
      const {data: signedUploadUrl, error: signedUrlError} = await supabase
      .storage
      .from("file_storage")
      .createSignedUploadUrl(`user_files/${owner_id}/files/${fileName}`, {
        upsert: true
      })
  
      if(signedUrlError){
        throw new AppError(400, signedUrlError.message);
      }

      //send url data to frontend
      res.status(200).json({signedUploadUrl, message: "Signed upload URL generated successfully!"});
    }
    catch(err){
      next(err);
    }
};

//function to upload file to edit an existing file
const uploadEdit = async (req: Request, res: Response, next: NextFunction)=>{
    try{
      //retrieve access token from request header
      const accessToken = req.headers["authorization"]?.split(" ")[1];
  
      if (!(accessToken)) {
        throw new AppError(401, "No token provided!");
      }
  
      //retrieve user information from supabase using the token
      const { data: { user }, error: tokenError } = await supabase.auth.getUser(accessToken);
  
      if (tokenError || !user) {
        throw new AppError(401, "Invalid or expired token!");
      }
  
      //extract token and path provided with signedUploadUrl from the request body
      const {token, path} = req.body;
     
      //store file object sent with the request in an object
      const file = req.file;

      if(!file){
        throw new AppError(400, "No file uploaded!");
      }

      //extract file body and other information from file object
      const {buffer} = file;     
  
      //upload file to supabase
      const {data: uploadToUrl, error: uploadToUrlError} = await supabase
      .storage
      .from("file_storage")
      .uploadToSignedUrl(path, token, buffer, {
        upsert: true
      });
  
      if(uploadToUrlError){
        throw new AppError(400, uploadToUrlError.message);
      }

      res.status(200).json({message: "Successfully edited file!"});
    }
    catch(err){
      next(err);
    }
};

export {editFile, uploadEdit};
