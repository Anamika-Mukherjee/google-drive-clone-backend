import pgPromise from "pg-promise";
import AppError from "./AppError";

const dbConnUrl = process.env.SUPABASE_CONN_URL;

if(!dbConnUrl){
    throw new AppError(500, "Database Connection URL is missing!");
}

const pgp = pgPromise();

const db = pgp(dbConnUrl);

export default db;

