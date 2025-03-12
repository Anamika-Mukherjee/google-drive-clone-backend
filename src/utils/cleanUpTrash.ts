import {createClient} from "@supabase/supabase-js";
import AppError from "../utils/AppError";
import permanentlyDelete from "./permanentlyDelete";


const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

//function to clean up trash automatically after a specified period of time
const cleanUpTrash = async ()=>{
  try{

     //list first 100 files in "trash" folder ordered by the time they were stored in trash 
     const {data: listData, error: listError} = await supabase
     .storage
     .from("file_storage")
     .list("trash", {
         limit: 100,
         sortBy: {column: "updated_at", order: "asc"}
     })
     
     if(listError){
         throw new AppError(400, listError.message);
     }
     
     //set expiration period for the files to remain in trash
     const expirationPeriod = 1000 * 60 * 60 * 24 * 7;

     //store the current time in a variable
     const currentTime = Date.now();

     
     for(let file of listData){

         //retrieve file path and the time they were stored in trash for all listed files
         const {data, error} = await supabase
         .from("trash_files")
         .select("file_path, created_at")
         .eq("file_uuid", file.id);

         if(error){
             throw new AppError(400, error.message);
         }

         //define type for returned file information
         type UUID = string
         interface FileInfo{
            file_path: string, 
            created_at: Date
         }

         const listedFileInfo: FileInfo[] = data as FileInfo[] ;
         const [firstFile] = listedFileInfo;

         //calculate file age from the time it was stored in trash
         const fileAge = currentTime - new Date(firstFile.created_at).getTime();

         //permanently delete file if age exceeds expiration period
         if(fileAge > expirationPeriod){
            await permanentlyDelete(firstFile.file_path);
         }
     }
   }
   catch(err){
     console.log(err);
   }
}

export default cleanUpTrash;