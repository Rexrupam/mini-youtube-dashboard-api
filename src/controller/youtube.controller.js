import axios from "axios"
import querystring from "querystring"
import jwt from "jsonwebtoken"
const queryParams = querystring.stringify({
  response_type: 'code',
  client_id: process.env.client_Id,
  scope: "openid email profile https://www.googleapis.com/auth/youtube.readonly https://www.googleapis.com/auth/youtube.force-ssl",
  redirect_uri: process.env.redirect_uri,
  access_type: "offline"
})

export const login = async (req, res) => {
  const redirectUrl = `https://accounts.google.com/o/oauth2/v2/auth?${queryParams}`;
  res.redirect(redirectUrl);
}
export const callback = async (req, res) => {
  try {
    const code = req.query.code;
    const tokenResponse = await axios.post('https://oauth2.googleapis.com/token', {
      code,
      client_id: process.env.client_Id,
      client_secret: process.env.client_Secret,
      redirect_uri: process.env.redirect_uri,
      grant_type: 'authorization_code',
    });
    const token = jwt.sign({
      access_token: tokenResponse?.data?.access_token
    },
      process.env.key,
      {
        expiresIn: process.env.expiry
      }
    )
    const options = {
      httpOnly: true,
      secure: true
    }
    return res
      .cookie('token', token, options)
      .status(200)
      .json({ message: "Successfully login with google" })
  } catch (error) {
    const code = error?.tokenResponse?.data?.error?.code;
    const message = error?.tokenResponse?.data?.error?.message
    return res.status(code).json({ message })
  }
}

export const getVideos = async (req, res) => {
  const token = req.user.access_token

  if (!token) {
    return res.status(401).json({ message: "Unauthorised access" })
  }
  try {
    const response = await axios.get('https://www.googleapis.com/youtube/v3/videos',
      {
        headers: {
          Authorization: `Bearer ${token}`
        },
        params: {
          part: 'snippet',
          id: 'BuScJaRZxPg'  //BuScJaRZxPg
        }
      })
    const title = response?.data?.items[0].snippet.title;
    const description = response?.data?.items[0].snippet.description
    return res.status(200).json({ title, description })
  } catch (error) {
    const status = error.response.data.error.code || 500
    const message = error.response.data.error.message || "Internal server error"
    return res.status(status).json({ message })
  }
}

export const postComment = async (req, res) => {
  const token = req.user.access_token
  if (!token) {
    return res.status(401).json({ message: "Unauthorised access" })
  }
  const { comment } = req.body
  if (!comment) {
    return res.status(400).json({ message: "Comment is required" })
  }
  try {
    const response = await axios.post('https://www.googleapis.com/youtube/v3/commentThreads',
      {
        snippet: {
          videoId: "BuScJaRZxPg",
          topLevelComment: {
            snippet: {
              textOriginal: comment
            }
          }
        }
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        params: {
          part: "snippet"
        }
      }
    )
    return res.status(200).json({ message: response.data })
  } catch (error) {
    const status = error?.response?.data?.error.code || 500
    const message = error?.response?.data?.error.message || "Internal server error"
    return res.status(status).json({ message })
  }
}

export const changeTitle = async(req,res)=>{
  const token = req.user.access_token
  if (!token) {
    return res.status(401).json({ message: "Unauthorised access" })
  }
  const { title, description } = req.body
  if(!title || !description){
    return res.status(400).json({message: "title and description is required"})
  }

  try {
    const response_one = await axios.get('https://www.googleapis.com/youtube/v3/videos',
       {
      headers: {
        Authorization: `Bearer ${token}`
      },
      params: {
        part: 'snippet',
        id: 'BuScJaRZxPg'
       }
    }
    )
    const categoryId = response_one?.data?.items[0]?.snippet?.categoryId
    if(!categoryId){
      return res.status(500).json({ message: "Failed to fetch category ID"})
    }
    const response_two = await axios.put('https://www.googleapis.com/youtube/v3/videos',
      {
        id: "BuScJaRZxPg",
        snippet:{
          title: title,
          description: description,
          categoryId: categoryId
        }
      }, 
      {
      headers: {
        Authorization: `Bearer ${token}`
      },
      params: {
        part: 'snippet'
       }
    }
    )
    return res.status(200).json({message: response_two?.data?.snippet})
  } catch (error) {
    console.log(error)
    const status = error?.response?.data?.error.code || 500
    const message = error?.response?.data?.error.message || "Internal server error"
    return res.status(status).json({ message })
  }
}

export const getComment=async(req,res)=>{
  const token = req.user.access_token
  if (!token) {
    return res.status(401).json({ message: "Unauthorised access" })
  }
  try {
    const response = await axios.get('https://www.googleapis.com/youtube/v3/commentThreads',
      {
        headers: {
          Authorization: `Bearer ${token}`
        },
        params: {
           part: 'snippet',
           videoId: 'BuScJaRZxPg'
         }
      }
    )
    const comments = []
    const itemLength = response?.data?.items?.length
    for(let i=0; i<itemLength; i++){
       
        comments.push({
           text: response?.data?.items[i]?.snippet?.topLevelComment?.snippet?.textDisplay,
           id: response?.data?.items[i]?.id
       })
       }
    
      return res.status(200).json({ comments })
  } catch (error) {
    console.log(error)
    const status = error?.response?.data?.error.code || 500
    const message = error?.response?.data?.error.message || "Internal server error"
    return res.status(status).json({ message })
  }
}

export const deleteComment=async(req,res)=>{
  const token = req.user.access_token
  if (!token) {
    return res.status(401).json({ message: "Unauthorised access" })
  }
   const {id}=req.params
   if(!id){
    return res.status(400).json({message: "comment id is required"})
   }
   try {
    const response = await axios.delete('https://www.googleapis.com/youtube/v3/comments',
     {
         headers: {
           Authorization: `Bearer ${token}`
         },
         params: {
            id: id
          }
       }
    )
    return res.status(200).json({message: "comment successfully deleted"})
   } catch (error) {
      console.log(error)
      const status = error?.response?.data?.error.code || 500
      const message = error?.response?.data?.error.message || "Internal server error"
      return res.status(status).json({ message })
   }
}

export const replyToComment=async(req,res)=>{
  const {id}=req.params
  const token = req.user.access_token
  const { reply } = req.body
  if(!reply){
    return res.status(400).json({ message: "Comment reply is not attached" })
  }
  if (!token) {
    return res.status(401).json({ message: "Unauthorised access" })
  }
  if(!id){
    return res.status(400).json({message: "Parent comment id is required"})
  }
  try {
    const response = await axios.post('https://www.googleapis.com/youtube/v3/comments',
      {
        snippet:{
           parentId: id,
           textOriginal: reply
        },
        
      },
      {
           headers: {
             Authorization: `Bearer ${token}`
           },
           params: {
              part: 'snippet'
            }
         }
    )
    return res.status(200).json({message: response.data})
  } catch (error) {
     console.log(error)
      const status = error?.response?.data?.error.code || 500
      const message = error?.response?.data?.error.message || "Internal server error"
      return res.status(status).json({ message })
  }

} 