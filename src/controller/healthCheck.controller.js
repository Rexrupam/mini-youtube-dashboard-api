export const healthCheck=async(req,res)=>{
    return res.status(200).json({message: 'Ok'})
}