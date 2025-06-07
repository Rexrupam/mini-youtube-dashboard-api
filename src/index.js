import { app } from "./app.js"
import dotenv from "dotenv"
import connectDB from "./db/index.js"

dotenv.config({
    path: './.env'
})


connectDB()
.then(()=>{
    app.listen(process.env.port || 8000, ()=>{
        console.log(`Server is listening on port: ${process.env.port}`)
    })
    
})
.catch((err)=>{
    console.log('MongoDB connection failed',err)
})