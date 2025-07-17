import axios from "axios"
import querystring from "querystring"
import jwt from "jsonwebtoken"
import { User } from "../model/userlog.model.js"

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
    const getAccessAndRefreshToken = await axios.post('https://oauth2.googleapis.com/token', {
      code,
      client_id: process.env.client_Id,
      client_secret: process.env.client_Secret,
      redirect_uri: process.env.redirect_uri,
      grant_type: 'authorization_code',
    });
   
    const token = jwt.sign({
      access_token: getAccessAndRefreshToken?.data?.access_token
    },
      process.env.key,
      {
        expiresIn: process.env.expiry
      }
    )
    const getChannelIdAndCustomurl = await axios.get('https://www.googleapis.com/youtube/v3/channels',
      {
        headers: {
          Authorization: `Bearer ${getAccessAndRefreshToken?.data?.access_token}`
        },
        params: {
          part: 'snippet',
          mine: true,
         fields: 'items(id, snippet/customUrl)'
        }
      }
    )
    
    const user = await User.create({
      customUrl: getChannelIdAndCustomurl?.data?.items[0]?.snippet?.customUrl,
      channelId: getChannelIdAndCustomurl?.data?.items[0].id,
      action: "login"
    })
    if(!user){
      return res.status(500).json({ message: "Failed to create database log" })
    }
    const options = {
      httpOnly: true,
      secure: true,
      sameSite: 'None'
    }
    return res
      .cookie('token', token, options)
      .status(200)
      .json({message: "Successfully login"})
  } catch (error) {
    console.log(error)
    const status = error?.response?.data?.error?.code || 500
    const message = error?.response?.data?.error?.message || "Internal server error"
    return res.status(status).json({ message })
  }
}

export const getVideos = async (req, res) => {
  try {
    const getTitleAndDescription = await axios.get('https://www.googleapis.com/youtube/v3/videos',
      {
        params: {
          key: process.env.api_key,
          part: 'snippet',
          id: 'BuScJaRZxPg',   //BuScJaRZxPg
          fields: 'items/snippet(title,description)'
        }
      })

    const title = getTitleAndDescription?.data?.items[0]?.snippet?.title;
    const description = getTitleAndDescription?.data?.items[0]?.snippet?.description
    return res.status(200).json({ title, description })
  } catch (error) {
    console.log(error)
    const status = error?.response?.data?.error?.code || 500
    const message = error?.response?.data?.error?.message || "Internal server error"
    return res.status(status).json({ message })
  }
}

export const postComment = async (req, res) => {
  const token = req.user?.access_token
  if (!token) {
    return res.status(401).json({ message: "Unauthorised access" })
  }
  const { comment } = req.body
  if (!comment) {
    return res.status(400).json({ message: "Comment field is required" })
  }
  
    try {
    const postCommentResponse = await axios.post('https://www.googleapis.com/youtube/v3/commentThreads',
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
          part: "snippet",
          fields: 'snippet/topLevelComment/snippet(textDisplay,authorDisplayName,authorChannelId/value)'
          
        }
      }
    )
    
    const user = await User.create({
         customUrl: postCommentResponse?.data?.snippet?.topLevelComment?.snippet?.authorDisplayName,
         channelId: postCommentResponse?.data?.snippet?.topLevelComment?.snippet?.authorChannelId?.value,
         action: `comment posted - ${postCommentResponse?.data?.snippet?.topLevelComment?.snippet?.textDisplay}` 
    })
    if(!user){
      return res.status(500).json({message: "failed to create database log"})
    }
    return res.status(200).json({ user })
  } catch (error) {
    console.log(error)
    const status = error?.response?.data?.error?.code || 500
    const message = error?.response?.data?.error?.message || "Internal server error"
    return res.status(status).json({ message })
  }
}

export const changeTitle = async (req, res) => {
  const token = req.user?.access_token
  if (!token) {
    return res.status(401).json({ message: "Unauthorised access" })
  }
  const { title, description } = req.body
  if (!title || !description) {
    return res.status(400).json({ message: "title and description are required" })
  }

  try {
      const getCategoryId = await axios.get('https://www.googleapis.com/youtube/v3/videos',
      {
        headers: {
          Authorization: `Bearer ${token}`
        },
        params: {
          part: 'snippet',
          id: 'BuScJaRZxPg',
          fields: 'items/snippet/categoryId'
        }
      }
    )
    const [ changeTitleAndDescription, getChannelIdAndCustomurl ]  = await Promise.all([
      axios.put('https://www.googleapis.com/youtube/v3/videos',
      {
        id: "BuScJaRZxPg",
        snippet: {
          title: title,
          description: description,
          categoryId: getCategoryId?.data?.items[0]?.snippet?.categoryId
        }
      },
      {
        headers: {
          Authorization: `Bearer ${token}`
        },
        params: {
          part: 'snippet',
          fields: 'snippet(title,description)'
        }
      }
    )
  ,
       axios.get('https://www.googleapis.com/youtube/v3/channels',
      {
        headers: {
          Authorization: `Bearer ${token}`
        },
        params: {
          part: 'snippet',
          mine: true,
         fields: 'items(id, snippet/customUrl)'
        }
      }
    )
  ]
)
    const user = await User.create({
        channelId: getChannelIdAndCustomurl?.data?.items[0].id,
        customUrl: getChannelIdAndCustomurl?.data?.items[0].snippet?.customUrl,
        action: `Title and description changed - title - ${changeTitleAndDescription?.data?.snippet?.title}, desc - ${changeTitleAndDescription?.data?.snippet?.description}`
        })

       if(!user){
        return res.status(500).json({ message: "Failed to create database log" })
       }

    return res.status(200).json({ user })
  } catch (error) {
    console.log(error)
    const status = error?.response?.data?.error?.code || 500
    const message = error?.response?.data?.error?.message || "Internal server error"
    return res.status(status).json({ message })
  }
}

export const getComment = async (req, res) => {
  try {
    const response = await axios.get('https://www.googleapis.com/youtube/v3/commentThreads',
      {
          params: {
            key: process.env.api_key,
            part: 'snippet',
            videoId: 'BuScJaRZxPg',
            fields: 'items/snippet(channelId,topLevelComment(id,snippet(textDisplay,authorDisplayName,authorChannelId/value)))',
        }
      }
    )
     const comments = []
     const itemLength = response?.data?.items?.length
     for (let i = 0; i < itemLength; i++) {
         comments.push({
         text: response?.data?.items[i]?.snippet?.topLevelComment?.snippet?.textDisplay,
         id: response?.data?.items[i]?.snippet?.topLevelComment?.id,
         authorDisplayName: response?.data?.items[i]?.snippet?.topLevelComment?.snippet?.authorDisplayName
       })
      
     }
    //response.data.items[i].snippet.topLevelComment.snippet.authorChannelId.value
    //response.data.items[i].snippet.channelId

    return res.status(200).json({ data:comments })
  } catch (error) {
    console.log(error)
    const status = error?.response?.data?.error?.code || 500
    const message = error?.response?.data?.error?.message || "Internal server error"
    return res.status(status).json({ message })
  }
}

export const deleteComment = async (req, res) => {
  const token = req.user?.access_token
  if (!token) {
    return res.status(401).json({ message: "Unauthorised access" })
  }
  const { id: commentId } = req.params
  if (!commentId) {
    return res.status(400).json({ message: "comment id is required" })
  }
  try {
    const [deleteCommentResponse, getChannelIdAndCustomurl] = await Promise.all([
      axios.delete('https://www.googleapis.com/youtube/v3/comments',
      {
        headers: {
          Authorization: `Bearer ${token}`
        },
        params: {
          id: commentId
        }
      }
    ),
      axios.get('https://www.googleapis.com/youtube/v3/channels',
      {
        headers: {
          Authorization: `Bearer ${token}`
        },
        params: {
          part: 'snippet',
          mine: true,
          fields: 'items(id,snippet/customUrl)'
        }
      }
    )
    ])
    const user = await User.create({
      channelId: getChannelIdAndCustomurl?.data?.items[0]?.id,
      customUrl: getChannelIdAndCustomurl?.data?.items[0]?.snippet?.customUrl,
      action: `Comment deleted`
    })
    if(!user){
      return res.status(500).json({ message: "Failed to create database log" })
    }
    return res.status(200).json({ message: "comment deleted successfully", user })
  } catch (error) {
    console.log(error)
    const status = error?.response?.data?.error?.code || 500
    const message = error?.response?.data?.error?.message || "Internal server error"
    return res.status(status).json({ message })
  }
}

export const replyToComment = async (req, res) => {
  const { id } = req.params
  const token = req.user?.access_token
  const { reply } = req.body
  if (!token) {
    return res.status(401).json({ message: "Unauthorised access" })
  }
  if (!reply) {
    return res.status(400).json({ message: "Comment reply is not attached" })
  }
  
  if (!id) {
    return res.status(400).json({ message: "Parent comment id is required" })
  }
  try {
    const replyToCommentResponse = await axios.post('https://www.googleapis.com/youtube/v3/comments',
      {
        snippet: {
          parentId: id,
          textOriginal: reply
        },

      },
      {
        headers: {
          Authorization: `Bearer ${token}`
        },
        params: {
          part: 'snippet',
          fields: "snippet/authorDisplayName, snippet/authorChannelId/value, snippet/textDisplay"
        }
      }
    )
    const user = await User.create({
      channelId: replyToCommentResponse?.data?.snippet?.authorChannelId?.value,
      customUrl: replyToCommentResponse?.data?.snippet?.authorDisplayName,
      action: `Reply to comment - ${replyToCommentResponse?.data?.snippet?.textDisplay}`,
    })
    if(!user){
      return res.status(500).json({ message: "Failed to create database log" })
    }
    return res.status(200).json({ user })
  } catch (error) {
    console.log(error)
    const status = error?.response?.data?.error?.code || 500
    const message = error?.response?.data?.error?.message || "Internal server error"
    return res.status(status).json({ message })
  }

} 

export const userNote = async (req, res) => {
  const token = req.user?.access_token
  if (!token) {
    return res.status(401).json({ message: "Unauthorised access" })
  }
  const { note } = req.body
  if (!note) {
    return res.status(400).json({ message: "Note is required" })
  }

  try {
     const response = await axios.get('https://www.googleapis.com/youtube/v3/channels',
      {
         headers: {
          Authorization: `Bearer ${token}`
        },
        params: {
          part: 'snippet',
          mine: true,
          fields: 'items(id,snippet/customUrl)'
        }
      }
    )
    
    const user = await User.create({
      customUrl: response?.data?.items[0]?.snippet?.customUrl,
      channelId: response?.data.items[0].id,
      action: 'note added',
      note: note
    })

    if(!user){
      return res.status(500).json({ message: "Failed to create database log" })
    }

    return res.status(200).json({ user })

   }catch(error){
      console.log(error)
      const status = error?.response?.data?.error?.code || 500
      const message = error?.response?.data?.error?.message || "Internal server error"
      return res.status(status).json({ message })
    }
}
export const searchNote = async (req, res) => {
  const token = req.user?.access_token
  if (!token) {
    return res.status(401).json({ message: "Unauthorised access" })
  }
  
   
  const { search } = req.body
  if (!search) {
    return res.status(400).json({ message: "Search term is required" })
  }
   
 const getCustomUrl = await axios.get('https://www.googleapis.com/youtube/v3/channels',
      {
        headers: {
          Authorization: `Bearer ${token}`
        },
        params: {
          part: 'snippet',
          mine: true,
          fields: 'items/snippet/customUrl'
        }
      }
    )
  

  const note = await User.find({
  note: { $exists: true, $ne: null },
  customUrl: getCustomUrl?.data?.items[0]?.snippet?.customUrl
  }).select("note -_id")

  if(!note){
    return res.status(404).json({ message: "No notes found" })
  }

   const filteredNotes = note.filter((item) => {
     return item.note.toLowerCase().includes(search.toLowerCase())
  })
  
  return res.status(200).json({ filteredNotes  })
  
}

export const getCustomUrl = async (req, res) => {
  const token = req.user?.access_token
  if (!token) {
    return res.status(401).json({ message: "Unauthorised access" })
  }
  
  try {
    const getCustomUrl = await axios.get('https://www.googleapis.com/youtube/v3/channels',
      {
        headers: {
          Authorization: `Bearer ${token}`
        },
        params: {
          part: 'snippet',
          mine: true,
          fields: 'items/snippet/customUrl'
        }
      }
    )
    return res.status(200).json({ customUrl: getCustomUrl?.data?.items[0]?.snippet?.customUrl })
  } catch (error) {
    
    const status = error?.response?.data?.error?.code || 500
    const message = error?.response?.data?.error?.message || "Internal server error"
    return res.status(status).json({ message })
  }
}