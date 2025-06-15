import {Router} from "express"
import { callback,
changeTitle,
deleteComment,
getComment,
getVideos,
login,
postComment, 
replyToComment, 
searchNote, 
userNote } from "../controller/youtube.controller.js";
import { verifyToken } from "../middlewares/verifyToken.js";



const router=Router();

router.route('/login').get(login)
router.route('/google/callback').get(callback)
router.route('/get-video-details').get(getVideos)
router.route('/post-comment').post(verifyToken, postComment)
router.route('/change-title-desc').post(verifyToken,changeTitle)
router.route('/getcomment').get(verifyToken,getComment)
router.route('/delete-comment/:id').delete(verifyToken,deleteComment)
router.route('/reply-to-comment/:id').post(verifyToken,replyToComment)
router.route('/user-note').post(verifyToken,userNote)
router.route('/searchNotes').get(verifyToken, searchNote)
export default router;