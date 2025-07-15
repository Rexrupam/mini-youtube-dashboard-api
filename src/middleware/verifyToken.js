import jwt from 'jsonwebtoken';

export const verifyToken = (req, res, next) => {
    try {
        const token = req.cookies?.token || req.header("Authorization")?.replace("Bearer ", "")
        console.log("token: ", token)
        if(!token){
            return res.status(401).json({ message: "Unauthorized access" })
        }
        const decodedToken = jwt.verify(token, process.env.key)
                                                           
        req.user = decodedToken
    
        next();
    } catch (error) {
        return res.status(401).json({ message: "Invalid token"})
    }
}