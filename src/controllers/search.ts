import {Request, Response, NextFunction} from "express";
import {createClient} from "@supabase/supabase-js";
import db from "../utils/db";
import fileSearch from "../utils/searchQueries";
import { FileInfo, SearchFileInfo, SearchFileData} from "../utils/types";

import AppError from "../utils/AppError";

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

//function to search file
const search = async (req: Request, res: Response, next: NextFunction)=>{
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
 
      //extract query string, number of pages and limit from req.query
      const {query, page = 1, limit = 10} = req.query;

      //check if query string is available and in correct type
      if(typeof query !== "string"){
       throw new AppError(400, "Search query is required and must be a string!");
      }

      //calculate offset for limiting displayed result
      const offset = (Number(page)-1) * Number(limit);

      //full text search api
      const results: SearchFileInfo[] = await db.any(
        fileSearch(query, Number(limit), offset),[query]
      );

      if(!results){
        throw new AppError(400, "Error generating search result!");
      }   

      //declare an array to store resulting file information
      const searchFileDetails: SearchFileData[] = [];

      if(results.length > 0){
           //if files returned in the results, map through each file
           await Promise.all(results.map(async (file)=>{
              
              //retrieve file data for each file from "files" table
               const {data: searchData, error: searchError} = await supabase
               .from("files")
               .select("*")
               .eq("file_uuid", file.file_uuid);

               if(searchError){
                throw new AppError(400, searchError.message);
               }
                
               //set correct types for returned data
               const searchDataArray : FileInfo[] = searchData as FileInfo[];
               const [searchFile] = searchDataArray;

               //push file data retrieved from results into the array
               const {file_uuid, file_name, created_at, file_size, file_type} = searchFile;
               searchFileDetails.push({file_uuid, file_name, created_at, file_size, file_type});

            }));

            //send the file information array to frontend
            res.status(200).json(searchFileDetails);     
      }
      else{
        //if no files match the query, return with a message
        res.status(200).json({message: "No results found!"});
      }
     
   }
   catch(err){
    next(err);
   }
};

export default search;