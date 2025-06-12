import jwt from "jsonwebtoken"
export const verifyToken = async(req,res,next)=>{
  try {
    const token = req.cookies.token || req.header("Authorization")?.replace("Bearer ", "")
    console.log("Token:", token)
    if(!token){
      return res.status(401).json({message: "Unauthorised access"})
    }
    const user = jwt.verify(token, process.env.key)
    req.user = user
    
    next()
  } catch (error) {
    return res.status(401).json({message: error})
  }
}