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
      .cookie('accessToken', tokenResponse?.data?.access_token, options)
      .cookie('token', token, options)
      .status(200)
      .json({ message: "Successfully login with google" })
  } catch (error) {
    return res.status(error?.tokenResponse?.data?.error?.code).json({ error: error?.tokenResponse?.data?.error?.message })
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
          part: 'snippet,contentDetails',
          id: 'BuScJaRZxPg'  //BuScJaRZxPg
        }
      })
    const videoTitle = response?.data?.items[0].snippet.title;
    const videoDetails = response?.data?.items[0].contentDetails
    return res.status(200).json({ videoTitle, videoDetails })
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
   //PUT https://www.googleapis.com/youtube/v3/videos - To update title
   //https://www.googleapis.com/youtube/v3/videoCategories - To get category ID
  const token = req.user.access_token
  if (!token) {
    return res.status(401).json({ message: "Unauthorised access" })
  }
  const { title } = req.body
  if(!title){
    return res.status(400).json({message: "title is required"})
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