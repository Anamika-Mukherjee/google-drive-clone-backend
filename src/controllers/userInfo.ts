import {Request, Response, NextFunction} from "express";
import {createClient} from "@supabase/supabase-js";

import AppError from "../utils/AppError";
import {User} from "../utils/types";

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

//function to retrieve user information 
const userInfo = async (req: Request, res: Response, next: NextFunction)=>{
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

        //store user id in an object
        const userId = user.id;

        //get user data from "profiles" table
        const {data: profileData, error: profileError} = await supabase
        .from("profiles")
        .select("user_id, email, full_name")
        .eq("user_id", userId)
      
        if(profileError){
            throw new AppError(500, profileError.message);
        }

        //send back profile data
        if(profileData){
            const profileArray : User[] = profileData as User[];
            const [userProfile] = profileArray;
            const {user_id, email, full_name} = userProfile;
            res.status(200).json({user_id, email, full_name});
        }
    }
    catch(err){
        next(err);
    }
};

export default userInfo;