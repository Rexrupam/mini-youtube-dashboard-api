GET /healthCheck
    
    Description: Health check endpoint to verify server status.

    response:
        - Returns a simple message indicating the server is running.

GET /login

    Description: Initiates user login (could redirect to Google login).

    response:
        - Redirects to Google OAuth login page


GET /google/callback

    Description: Callback endpoint for Google OAuth login.

    response:
        - Returns a token for authenticated users and token is stored in the browser cookie.
        - Finally returns the action log saved in the database.


GET /get-video-details

    Description: Fetch details of videos.

    response:
        - Returns video details - title, description

POST /change-title-desc

    Description: Change the title and description of the video.

    Auth: ✅ Requires token

    body:
        {
            "title": "Video Title",
            "description": "video description"
        }
    
    Response:
        - Returns the action log saved in the database.

POST /post-comment

    Description: Post a comment on the video.

    Auth: ✅ Requires token

    body:
        {
            "comment": "Your comment here"
        }
    
    Response:
        - Returns the action log saved in the database.
GET /get-comments

    Description: Fetch comments for the video.

    response:
        - Returns an array of comments on the video.
        - Includes comment ID, Youtube customUrl, and comment text

DELETE /delete-comment/{commentId}

    Description: Delete a comment on the video.

    Auth: ✅ Requires token

    parameters:
        - commentId: ID of the comment to delete

    
    Response:
        - Returns the action log saved in the database.


POST /reply-to-comment/{commentId}

    Description: Reply to a comment on the video.

    Auth: ✅ Requires token

    parameters:
        - commentId: ID of the comment to reply to

    body:
        {
            "reply": "Your reply here"
        }

    Response:
        - Returns the action log saved in the database.

POST /user-note

    Description: Create a user note for improving the video.

    Auth: ✅ Requires token

    body:
        {
            "note": "Your note here"
        }
    
    Response:
        - Returns the action log saved in the database.

GET /searchNotes

    Description: Search for user notes.         

    Auth: ✅ Requires token

    body:
        {
            "search": "Search term"
        }
    
    Response:
        - Returns an array of user notes matching the search term.

