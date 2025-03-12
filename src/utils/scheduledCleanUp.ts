import cron from "node-cron";
import cleanUpTrash from "./cleanUpTrash";

//function to clean up trash on a specified time every day
const scheduledCleanUp = ()=>{

    cron.schedule("0 0 * * *", async ()=>{
        console.log("Scheduled cleaning up of trash...")

        try{
            await cleanUpTrash();
            console.log("Trash clean up complete!");
        }
        catch(err){
            console.log("Error during scheduled cleanup:", err);
        }
    });
}

export default scheduledCleanUp;