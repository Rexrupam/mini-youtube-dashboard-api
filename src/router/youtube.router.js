import {Router} from "express"
import { callback, changeTitle, getVideos, login, postComment } from "../controller/youtube.controller.js";
import { verifyToken } from "../middlewares/verifyToken.js";


const router=Router();

router.route('/login').get(login)
router.route('/google/callback').get(callback)
router.route('/getvideo').get(verifyToken,getVideos)
router.route('/post-comment').post(verifyToken, postComment)
router.route('/change-title').post(verifyToken,changeTitle)
export default router;