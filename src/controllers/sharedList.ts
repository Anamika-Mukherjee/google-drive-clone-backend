import {Request, Response, NextFunction} from "express";
import {createClient} from "@supabase/supabase-js";
import AppError from "../utils/AppError";
import {SharedFileInfo} from "../utils/types";

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

//function to retrieve shared file information
const sharedList = async (req: Request, res: Response, next: NextFunction)=>{
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
      
      //supabase api to get shared file data
      const {data: shareData, error: sharedFileError} = await supabase
      .from("shared_files")
      .select("*")
      .eq("accesser_id", userId);
  
      if(sharedFileError){
        throw new AppError(400, sharedFileError.message);
      }
     
      const sharedFileData: SharedFileInfo[] = shareData as SharedFileInfo[];
      const sharedFiles: SharedFileInfo[] = [];
  
      if(sharedFileData){
         sharedFileData.map((file)=>{        
           sharedFiles.push(file);
         })
        
         //generate signed urls for every file shared with the user
         const sharedFilesWithSignedUrls = await Promise.all(sharedFiles.map(async (file) => {
          
          const {owner_id, file_name} = file;
  
          console.log(owner_id, file_name);
          const { data: signedUrl, error: urlError } = await supabase
          .storage
          .from("file_storage")
          .createSignedUrl(`user_files/${owner_id}/files/${file_name}`, 60 * 60);
  
          if(urlError){
            throw new AppError(400, urlError.message);
          }
  
          //return file information with signed url
          return {
            ...file,
            signedUrl: signedUrl || null
          };
        }));

        res.status(200).json({files: sharedFilesWithSignedUrls});

      }
      else{
        res.status(200).json({message: "No files shared with you!"});
      }
    }
    catch(err){
      next(err);
    }
}; 

export default sharedList;