import mongoose from 'mongoose';

const UserlogSchema = new mongoose.Schema({
    customUrl:{
        type: String,
        required: true
    },
    channelId:{
        type: String,
        required: true
    },
    action:{
        type: String
    },
    note:{
        type: String
    }
}, {timestamps: true})

export const User = mongoose.model('User', UserlogSchema)