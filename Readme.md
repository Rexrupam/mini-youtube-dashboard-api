GET /login

    Description: Initiates user login (could redirect to Google login).


GET /google/callback

    Description: Callback endpoint for Google OAuth login.


GET /get-video-details

    Description: Fetch details of videos.

POST /change-title-desc

    Description: Change the title and description of the video.

    Auth: ✅ Requires token

POST /post-comment

    Description: Post a comment on the video.

    Auth: ✅ Requires token

POST /change-title-desc

    Description: Change the title and description of the video.

    Auth: ✅ Requires token

POST /post-comment

    Description: Post a comment on the video.

    Auth: ✅ Requires token

GET /get-comments

    Description: Fetch comments for the video.

    Auth: ✅ Requires token

DELETE /delete-comment/{commentId}

    Description: Delete a comment on the video.

    Auth: ✅ Requires token

POST /reply-to-comment/{commentId}

    Description: Reply to a comment on the video.

    Auth: ✅ Requires token

POST /user-note

    Description: Create a user note for improving the video.

    Auth: ✅ Requires token

GET /searchNotes

    Description: Search for user notes.         

    Auth: ✅ Requires token