import {Request, Response, NextFunction} from "express";
import {createClient} from "@supabase/supabase-js";
import AppError from "../utils/AppError";
import {FileInfo} from "../utils/types";

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

//function to retrieve file information
const fileList = async (req: Request, res: Response, next: NextFunction)=>{
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

      const {data: fileListData, error: fileListError} = await supabase
      .from("files")
      .select("*")
      .eq("file_owner_id", userId);

      if(fileListError){
        throw new AppError(400, fileListError.message);
      }
      
      const fileListArray : FileInfo[] = fileListData as FileInfo[];

      //generate signed urls for every file owned by the user
      const filesWithSignedUrls = await Promise.all(fileListArray.map(async (file) => {
        const { data: signedUrl, error: urlError } = await supabase
          .storage
          .from("file_storage")
          .createSignedUrl(`user_files/${userId}/files/${file.file_name}`, 60 * 60);

          if(urlError){
            throw new AppError(400, urlError.message);
          }

          //return file information with signed url
          return {
            ...file,
            signedUrl: signedUrl || null
          };
        }
      ));
      res.status(200).json({files: filesWithSignedUrls});
    }
    catch(err){
      next(err);
    }
};

export default fileList;
