import {createClient} from "@supabase/supabase-js";
import AppError from "./AppError";


const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

//function to permanently delete file
const permanentlyDelete = async (filePath: string)=>{
  try{
      const {error: deleteError} = await supabase
       .storage
       .from("file_storage")
       .remove([filePath]);

      if(deleteError){
         throw new AppError(400, deleteError.message);
      }
      
      console.log("File permanently deleted!");
  }
  catch(err){
     console.log(err);
  }
}

export default permanentlyDelete;