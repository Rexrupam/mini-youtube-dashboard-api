import mongoose from "mongoose"
import { db_name } from "../utils/constants.js"


const connectDB=async()=>{
    try {
        await mongoose.connect(`${process.env.mongo_uri}/${db_name}`)
        console.log("database connected successfully")
    } catch (error) {
        console.log("database connection failed", error)
    }
}

export default connectDB;