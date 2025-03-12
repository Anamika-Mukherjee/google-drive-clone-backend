import {Request, Response, NextFunction} from "express";
import {createClient} from "@supabase/supabase-js";
import AppError from "../utils/AppError";

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

//function to sign out user
const signOut = async (req: Request, res: Response, next: NextFunction)=>{
    try{ 
     
     //supabase api for signout
     let { error } = await supabase.auth.signOut();
 
     if(error){
         throw new AppError(500, error.message);
     }
     else{
         res.status(200).json("Successfully Signed Out!");
     }
    }
    catch(err){
     next(err);
    }
};

export default signOut;