import {Request, Response, NextFunction} from "express";
import {createClient} from "@supabase/supabase-js";
import AppError from "../utils/AppError";
import {FileInfo} from "../utils/types";

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

//function to get sorting options
const getSortOptions = (sortBy: string)=>{
    let orderByCol = "name";
    let ascending = true;
  
    switch(sortBy){
  
     case "name-asc": 
        orderByCol = "file_name";
        ascending = true;
        break;
  
     case "name-desc": 
        orderByCol = "file_name";
        ascending = false;
        break;
  
     case "date-asc": 
        orderByCol = "created_at";
        ascending = true;
        break;
  
     case "date-desc": 
        orderByCol = "created_at";
        ascending = false;
        break;
  
     case "size-asc": 
        orderByCol = "file_size";
        ascending = true;
        break;
  
     case "size-desc": 
        orderByCol = "file_size";
        ascending = false;
        break;   
    }
  
    const sortOptions = {orderByCol, ascending};
    return sortOptions;
};

//function to retrieve file information based on file type
const fileListType = async (req: Request, res: Response, next: NextFunction)=>{
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

      //extract file type and sorting option from request body
      const {fileType, sortBy} = req.body;

      //convert the sorting option from getSortOptions() function so that it can be sent with supabase api
      const sortOptions = getSortOptions(sortBy);
      
      //extract orderby and ascending information from sort options
      const {orderByCol, ascending} = sortOptions;

      //api to get file information with requested sorting option for "media" files
      if(fileType === "media"){
        const {data: fileListData, error: fileListError} = await supabase
        .from("files")
        .select("*")
        .eq("file_owner_id", userId)
        .in("file_type", ["audio", "video"])
        .order(orderByCol, {ascending});

        if(fileListError){
          throw new AppError(400, fileListError.message);
        }

        if(fileListData.length > 0){
          const fileListArray : FileInfo[] = fileListData as FileInfo[];

          //generate signed urls for all "media" files
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

          //send file information to frontend
          res.status(200).json({files: filesWithSignedUrls});
        }
        else{
          res.status(200).json("No files uploaded");
        }
      }

      //api to get file information with requested sorting option for all other file types
      else{
        const {data: fileListData, error: fileListError} = await supabase
        .from("files")
        .select("*")
        .eq("file_owner_id", userId)
        .eq("file_type", fileType)
        .order(orderByCol, {ascending});
  
        if(fileListError){
          throw new AppError(400, fileListError.message);
        }
       
        if(fileListData.length > 0){
          const fileListArray : FileInfo[] = fileListData as FileInfo[];

          //generate signed urls for file types other than media files
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
          }));

          //send file information to frontend
          res.status(200).json({files: filesWithSignedUrls});
        } 
        else{
          res.status(200).json({message: "No files uploaded"});
        }
      }
    }
    catch(err){
      next(err);
    }
};

export default fileListType;