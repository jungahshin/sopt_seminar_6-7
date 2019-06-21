//6번째 page
//토큰- 사용자 정보가 필요할 때 사용-->로그인, 댓글 작성, 좋아요에서 사용자 정보 필요!
var express = require('express');
var router = express.Router();
const crypto = require('crypto-promise');
const util = require('../../module/utils');
const statusCode = require('../../module/statusCode');
const resMessage = require('../../module/responseMessage');
const db = require('../../module/pool');
const upload = require('../../config/multer');//post할때 필요
const moment = require('moment');
const jwt = require('jsonwebtoken');
const secretOrPrivateKey = "jwtSecretKey!";//sercret key

//댓글 작성	/comment	POST
//body-content, images, webtoon_each_idx
//header-token
//userIdx, webtoon_each_idx는 client한테 받아서 넣는 것!
//댓글 작성할 때에 header부분에 로그인 할때 발급받은 토큰 넣어서 post해야 됨!!
router.post('/', upload.single('images'), async(req, res) => {//각 회차 each_idx를 받아서 그에 맞는 comment작성
    //토큰 해독
    try {
        const decodedToken = jwt.verify(req.headers.token, secretOrPrivateKey);//반드시 secretOrPrivateKey를 써줘야 verify를 할 수 있다.
        console.log(decodedToken);
        const insertCommentQuery = 'INSERT INTO comment (userIdx, content, images, writetime, webtoon_each_idx) VALUES (?, ?, ?, ?, ?)';
        const images = req.file.location;
        const writetime = moment().format("YYYY-MM-DD HH:mm:ss");
        const insertCommentResult = await db.queryParam_Parse(insertCommentQuery, [decodedToken.idx, req.body.content, images, writetime, req.body.webtoon_each_idx]);
        if (insertCommentResult.length == 0) {
            res.status(200).send(util.successFalse(statusCode.DB_ERROR, resMessage.COMMENT_INSERT_FAIL));
        } else {
            res.status(200).send(util.successTrue(statusCode.OK, resMessage.COMMENT_INSERT_SUCCESS));
        }
    } catch (err) {
        console.log(err);
    }
});

//댓글 보기	/comment/:epindex	GET ---> 5번째 페이지에서 하트 누르면 실행됨.
//images, userId, writetime(먼저 쓴 순서대로-ASC), content
//client가 webtoon_each_idx를 줘야해!!
router.get('/:epidx', async(req, res)=>{//회차에 따라 댓글을 보여준다.
    const getEpisodeCommentQuery = 'SELECT c.images, u.id, c.writetime, c.content FROM comment AS c JOIN user AS u ON c.userIdx = u.userIdx WHERE webtoon_each_idx =? ORDER BY writetime ASC';//댓글은 오래된 순으로 보여준다.
    const getEpisodeCommentResult = await db.queryParam_Parse(getEpisodeCommentQuery,[req.params.epidx]);
    if (getEpisodeCommentResult.length == 0) { 
        res.status(200).send(util.successFalse(statusCode.DB_ERROR, resMessage.COMMENT_SELECT_FAIL));
    } else {
        res.status(200).send(util.successTrue(statusCode.OK, resMessage.COMMENT_SELECT_SUCCESS, getEpisodeCommentResult));
    }
});

module.exports = router;