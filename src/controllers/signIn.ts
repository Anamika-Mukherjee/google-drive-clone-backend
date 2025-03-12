import {Request, Response, NextFunction} from "express";
import {createClient} from "@supabase/supabase-js";
import AppError from "../utils/AppError";

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

//function to sign in user
const signIn = async (req: Request, res: Response, next: NextFunction)=>{
    try{
       
        const {email, password} = req.body;

        // check if user sent all data
        if(!(email && password)){
            throw new AppError(401, "All fields are required!");
        }

        // supabase api for sign in
        const { data: userData, error: signInError } = await supabase.auth.signInWithPassword({
            email,
            password
        });
  
        //check for authentication errors
        if(signInError && signInError.code === "invalid_credentials"){
            throw new AppError(401, "Invalid email or password");
        }

        if(signInError){
            throw new AppError(500, signInError.message);
        }

        // check if user does not exist
        if(!userData){
            throw new AppError(404, "User does not exist!");
        } 

        //get session information
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if(!session){
            throw new AppError(400, "Session not established!");
        }
         
        else if(!session.access_token){
            throw new AppError(400, "Token not available!");
        }
        
        //set session data with access token and refresh token to automatically refresh expired session
        const { data: setSessionData, error: setSessionError } = await supabase.auth.setSession({
            access_token: session.access_token,
            refresh_token: session.refresh_token
          })

        if(setSessionError){
            throw new AppError(400, "Could not set session!");
        }
        
        //send access token and refresh token retrieved from session
        res.status(200).json({accessToken: session.access_token, message: "Signed In successfully!"});           
        
    }
    catch(err){
        next(err);
    }
};

export default signIn;