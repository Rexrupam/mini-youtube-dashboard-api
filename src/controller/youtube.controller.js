import axios from "axios"
import querystring from "querystring"
import jwt from "jsonwebtoken"
import { User } from "../models/userlog.model.js"

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
    if(tokenResponse?.data?.error){
      const code = tokenResponse?.data?.error.code || 500
      const message = tokenResponse?.data?.error.message || "Internal server error"
      return res.status(code).json({message})
    }
    const token = jwt.sign({
      access_token: tokenResponse?.data?.access_token
    },
      process.env.key,
      {
        expiresIn: process.env.expiry
      }
    )
    const response = await axios.get('https://www.googleapis.com/youtube/v3/channels',
      {
        headers: {
          Authorization: `Bearer ${tokenResponse?.data?.access_token}`
        },
        params: {
          part: 'snippet',
          mine: true,
          fields: 'items(id,snippet/customUrl)'
        }
      }
    )
    if(response?.data?.error){
      const status = response?.data?.error.code || 500
      const message = response?.data?.error.message || "Internal server error"
      return res.status(status).json({ message })
    }
    const user = await User.create({
        customeUrl: response?.data?.items[0]?.snippet?.customUrl,
         channelId: response?.data.items[0].id,
         action: "login"

    })
    const options = {
      httpOnly: true,
      secure: true,
      sameSite: 'None'
    }
    return res
      .cookie('token', token, options)
      .status(200)
      .send('hello world')
      //.redirect('http://127.0.0.1:5500?login=success')
  } catch (error) {
    console.log(error)
    return res.status(500).send('Internal server error')
  }
}

export const getVideos = async (req, res) => {
  try {
    const response = await axios.get('https://www.googleapis.com/youtube/v3/videos',
      {
        params: {
          key: process.env.api_key,
          part: 'snippet',
          id: 'BuScJaRZxPg',   //BuScJaRZxPg
          fields: 'items/snippet(title,description)'
        }
      })
    if(response?.data?.error){
      const status = response?.data?.error.code || 500
      const message = response?.data?.error.message || "Internal server error"
      return res.status(status).json({ message })
    }
    const title = response?.data?.items[0]?.snippet?.title;
    const description = response?.data?.items[0]?.snippet?.description
    return res.status(200).json({ title, description })
  } catch (error) {
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
     const response1 = await axios.get('https://www.googleapis.com/youtube/v3/channels',
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
    if(response1?.data?.error){
      const status = response1?.data?.error.code || 500
      const message = response1?.data?.error.message || "Internal server error"
      return res.status(status).json({ message })
    }
    const response2 = await axios.post('https://www.googleapis.com/youtube/v3/commentThreads',
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
          fields: 'snippet/topLevelComment/snippet/textDisplay'
          
        }
      }
    )
    if(response2.data?.error){
      const code = response2?.data?.error?.code || 500
      const message = response2?.data?.error?.message || "Internal server error"
      return res.status(code).json({ message })
    }
    const user = await User.create({
        customeUrl: response1?.data?.items[0]?.snippet?.customUrl,
         channelId: response1?.data.items[0].id,
         action: `comment posted - ${response2.data.snippet.topLevelComment.snippet.textDisplay}` 
    })
    if(!user){
      return res.status(500).json({message: "failed to create database log"})
    }
    return res.status(200).json({ user })
  } catch (error) {
    console.log(error)
    return res.status(500).send("Internal server error")
  }
}

export const changeTitle = async (req, res) => {
  const token = req.user?.access_token
  if (!token) {
    return res.status(401).json({ message: "Unauthorised access" })
  }
  const { title, description } = req.body
  if (!title || !description) {
    return res.status(400).json({ message: "title and description is required" })
  }

  try {
      const response1 = await axios.get('https://www.googleapis.com/youtube/v3/videos',
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
    if(response1?.data?.error){
      console.log(response1?.data?.error)
      const code = response1?.data?.error?.code || 500
      const message = response1?.data?.error?.message || "Internal server error"
      return res.status(code).json({message})
    }
    const categoryId = response1?.data?.items[0]?.snippet?.categoryId
    if (!categoryId) {
      return res.status(500).json({ message: "Failed to fetch category ID" })
    }
    const response2 = await axios.put('https://www.googleapis.com/youtube/v3/videos',
      {
        id: "BuScJaRZxPg",
        snippet: {
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
          part: 'snippet',
          fields: 'snippet(title,description)'
        }
      }
    )
    if(response2?.data?.error){
      console.log(response2?.data?.error)
      const code = response2?.data?.error?.code || 500
      const message = response2?.data?.error?.message || "Internal server error"
      return res.status(code).json({message})
    }
    const response3 = await axios.get('https://www.googleapis.com/youtube/v3/channels',
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
    if(response3?.data?.error){
      console.log(response3?.data?.error)
      const code = response3?.data?.error?.code || 500
      const message = response3?.data?.error?.message || "Internal server error"
      return res.status(code).json({message})
    }
     const user = await User.create({
       customeUrl: response3?.data?.items[0]?.snippet?.customUrl,
       channelId: response3?.data?.items[0].id,
       action: `Title and description changed - title - ${response2?.data?.snippet?.title}, desc - ${response2?.data?.snippet?.description}`
     })

     if(!user){
      return res.status(500).json({ message: "Failed to create database log" })
     }

    return res.status(200).json({ user })
  } catch (error) {
    console.log(error)
    return res.status(500).send("Internal server error")
  }
}

export const getComment = async (req, res) => {
  const token = req.user?.access_token
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
          videoId: 'BuScJaRZxPg',
          fields: 'items(snippet/topLevelComment(id,snippet/textDisplay))'
        }
      }
    )
    if(response?.data?.error){
      const status = response?.data?.error?.code || 500
      const message = response?.data?.error?.message || "Internal server error"
      return res.status(status).json({ message })
    }
    const comments = []
    const itemLength = response?.data?.items?.length
    for (let i = 0; i < itemLength; i++) {
        comments.push({
        text: response?.data?.items[i]?.snippet?.topLevelComment?.snippet?.textDisplay,
        id: response?.data?.items[i]?.snippet?.topLevelComment?.id
      })
    }

    return res.status(200).json({ comments })
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
  const { id } = req.params
  if (!id) {
    return res.status(400).json({ message: "comment id is required" })
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
    if(response?.data?.error){
      const code = response?.data?.error?.code || 500
      const message = response?.data?.error?.message || "Internal server error"
      return res.status(code).json({ message })
    }
    return res.status(200).json({ message: "comment successfully deleted" })
  } catch (error) {
    console.log(error)
    const status = error?.response?.data?.error.code || 500
    const message = error?.response?.data?.error.message || "Internal server error"
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
    const response = await axios.post('https://www.googleapis.com/youtube/v3/comments',
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
          fields: "snippet/textDisplay"
        }
      }
    )
    if(response?.data?.error){
      const code = response?.data?.error?.code || 500
      const message = response?.data?.error?.message || "Internal server error"
      return res.status(code).json({ message })
    }
    return res.status(200).json({ message: response?.data })
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
    if(response?.data?.error){
      const status = response?.data?.error.code || 500
      const message = response?.data?.error.message || "Internal server error"
      return res.status(status).json({ message })
    }
    const user = await User.create({
      customeUrl: response?.data?.items[0]?.snippet?.customUrl,
      channelId: response?.data.items[0].id,
      action: 'note added',
      notes: note
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
  

  
  const note = await User.find({notes: { $exists: true, $ne: null }})
  if(!note){
    return res.status(404).json({ message: "No notes found" })
  }

  const filteredNotes = note.filter((item) => {
    return item.notes.toLowerCase().includes(search.toLowerCase())
  })
  return res.status(200).json({ filteredNotes  })
  
}