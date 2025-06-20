import mongoose from "mongoose"

const userSchema = new mongoose.Schema({
    customUrl:{
        type: String,
        required: true
    },
    channelId:{
        type: String,
        required: true
     },
    action:{
        type: String,
        required: true
    },
    notes:{
        type: String
     }
}, {
    timestamps: true
})



export const User = mongoose.model('Userschema', userSchema)