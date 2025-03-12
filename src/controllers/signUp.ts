import {Request, Response, NextFunction} from "express";
import {createClient} from "@supabase/supabase-js";
import AppError from "../utils/AppError";

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

//function to sign up user
const signUp = async (req: Request, res: Response, next: NextFunction)=>{
    try{
        const {fullName, email, password} = req.body;

        // check if user sent all data
        if(!(fullName && email && password)){
            throw new AppError(401, "All fields are required!");
        }

        // supabase api for sign up
        const { data: userData, error: signUpError } = await supabase.auth.signUp({
           email,
           password
        });

        // check if user already exists
        if(signUpError && signUpError.code === "user_already_exists"){
            throw new AppError(401, "User already exists!");
        }
        
        //check for other errors
        else if(signUpError){
            throw new AppError(500, signUpError.message);
        }

        
        //if signed up, update profiles table
        else if(userData.user && userData.user.id){
           
            const {data: profileData, error: profileError} = await supabase
            .from("profiles")
            .insert({
                user_id: userData.user?.id,
                email,
                full_name: fullName  
            })
            .select();
         
            if(profileError){
                throw new AppError(500, profileError.message);
            }
            if(profileData){

                //get session information
                const { data: { session }, error } = await supabase.auth.getSession();
                
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

                //send access token retrieved from session
                res.status(200).json({accessToken: session.access_token, message: "Signed In successfully!"}); 
            }
        }
    }
    catch(err){
        next(err);
    }
};

export default signUp;