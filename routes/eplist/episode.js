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

//4번째 page
//웹툰회차별정보	/eplist/:wtidx	GET
//each_thumbnail, each_title, each_views, each_writetime
router.get('/:userIdx/:wtidx', async(req, res)=>{//웹툰별 회차 정보들(client에게 webtoon_all_idx의 값을 받아야함)
    const getEpisodeQuery = 'SELECT each_thumbnail, each_title, each_views, each_writetime, webtoon_each_idx FROM webtoon_each WHERE webtoon_all_idx=? ORDER BY each_writetime DESC';//회차 순서대로 select한다.
    const getEpisodeResult = await db.queryParam_Parse(getEpisodeQuery,[req.params.wtidx]);
    if (getEpisodeResult.length == 0) { 
        res.status(200).send(util.successFalse(statusCode.DB_ERROR, resMessage.EPISODE_SELECT_FAIL));
    } else {
        const getLikeQuery = 'SELECT like_idx FROM `like` WHERE userIdx = ? AND webtoon_all_idx = ?';
        const getLikeResult = await db.queryParam_Parse(getLikeQuery,[req.params.userIdx, req.params.wtidx]);
        if (getLikeResult.length == 0) {//하트 비우기-->응답 "0"
            getEpisodeResult.push('0');
            res.status(200).send(util.successTrue(statusCode.OK, resMessage.NO_LIKE, getEpisodeResult));//select 실패
        } else {//하트 채우기-->응답 "1"
            getEpisodeResult.push('1');
            res.status(200).send(util.successTrue(statusCode.OK, resMessage.YES_LIKE, getEpisodeResult));//select 성공
        }
    }
});

//하트를 누르면 like수 증가 ------>4번째 페이지에서 하트를 누르면 실행됨.
//어떤 웹툰인지 webtoon_all_idx를 클라이언트한테 받아야함.
//like table--userIdx, webtoon_each_idx (좋아요를 누른 회차만 저장해놓는다)
//body- webtoon_all_idx
//header-token
router.post('/like', async(req, res) => {
    try {
        const decodedToken = jwt.verify(req.headers.token, secretOrPrivateKey);//반드시 secretOrPrivateKey를 써줘야 verify를 할 수 있다.
        console.log(decodedToken);
        const getLikeQuery = 'SELECT like_idx FROM `like` WHERE userIdx = ? AND webtoon_all_idx = ?';
        const getLikeResult = await db.queryParam_Parse(getLikeQuery,[decodedToken.idx, req.body.webtoon_all_idx]);
        if (getLikeResult.length == 0) { //하트 누르기
            const insertLikeQuery = 'INSERT INTO `like` (webtoon_all_idx, userIdx) VALUES (?, ?)';
            const insertLikeResult  = await db.queryParam_Parse(insertLikeQuery, [req.body.webtoon_all_idx, decodedToken.idx]);
            if (insertLikeResult .length == 0) {
                res.status(200).send(util.successFalse(statusCode.DB_ERROR, resMessage.LIKE_INSERT_FAIL));//insert 실패
            } else {
                //like table insert 성공했으면
                //전체 webtoon_all table의 like도 증가
                const getLikeQuery = 'SELECT `like` FROM webtoon_all WHERE webtoon_all_idx = ?';
                const getLikeResult = await db.queryParam_Parse(getLikeQuery,[req.body.webtoon_all_idx]);
                if (getLikeResult.length == 0) { 
                    res.status(200).send(util.successFalse(statusCode.DB_ERROR, resMessage.LIKE_SELECT_FAIL));//like select 실패
                } else {
                    //res.status(200).send(util.successTrue(statusCode.OK, resMessage.LIKE_SELECT_SUCCESS, getLikeResult));//like값 select성공
                    const like_plus = parseInt(getLikeResult[0]['like']) + 1;//like값 +1 
                    console.log(like_plus);
                    const updateLikeQuery = 'UPDATE webtoon_all SET `like` = ? WHERE webtoon_all_idx = ?';//다시 수정한 like값 table에 넣어줌
                    const updateLikeResult = await db.queryParam_Parse(updateLikeQuery, [like_plus, req.body.webtoon_all_idx]);
                    if (updateLikeResult.length == 0) {
                        res.status(200).send(util.successFalse(statusCode.DB_ERROR, resMessage.LIKE_UPDATE_FAIL));//like select 성공했으나 update 실패
                    } else {
                        res.status(200).send(util.successTrue(statusCode.OK, resMessage.LIKE_UPDATE_SUCCESS, 1));//like select 성공 & update 성공-->응답 "1"
                    }
                }
                //res.status(200).send(util.successTrue(statusCode.OK, resMessage.LIKE_INSERT_SUCCESS, insertLikeResult));//insert 성공
            }
        } else {//하트 비우기
            //res.status(200).send(util.successTrue(statusCode.OK, resMessage.LIKE_SELECT_SUCCESS, getLikeResult));//like값 select성공
            const deleteLikeQuery = 'DELETE FROM `like` WHERE userIdx = ? AND webtoon_all_idx = ?';
            const deleteLikeResult = await db.queryParam_Parse(deleteLikeQuery,[decodedToken.idx, req.body.webtoon_all_idx]);
            if (deleteLikeResult.length == 0) {
                res.status(200).send(util.successFalse(statusCode.DB_ERROR, resMessage.LIKE_DELETE_FAIL));//delte 실패
            } else {
                //전체 webtoon_all table의 like도 감소
                const getLikeQuery = 'SELECT `like` FROM webtoon_all WHERE webtoon_all_idx = ?';
                const getLikeResult = await db.queryParam_Parse(getLikeQuery,[req.body.webtoon_all_idx]);
                if (getLikeResult.length == 0) { 
                    res.status(200).send(util.successFalse(statusCode.DB_ERROR, resMessage.LIKE_SELECT_FAIL));//like select 실패
                } else {
                    //res.status(200).send(util.successTrue(statusCode.OK, resMessage.LIKE_SELECT_SUCCESS, getLikeResult));//like값 select성공
                    const like_plus = parseInt(getLikeResult[0]['like']) - 1;//like값 +1 
                    //console.log(like_plus);
                    const updateLikeQuery = 'UPDATE webtoon_all SET `like` = ? WHERE webtoon_all_idx = ?';//다시 수정한 like값 table에 넣어줌
                    const updateLikeResult = await db.queryParam_Parse(updateLikeQuery, [like_plus, req.body.webtoon_all_idx]);
                    if (updateLikeResult.length == 0) {
                        res.status(200).send(util.successFalse(statusCode.DB_ERROR, resMessage.LIKE_UPDATE_FAIL));//like select 성공했으나 update 실패
                    } else {
                        res.status(200).send(util.successTrue(statusCode.OK, resMessage.LIKE_UPDATE_SUCCESS, 0));//like select 성공 & update 성공-->응답 "0"
                    }
                }
                //res.status(200).send(util.successTrue(statusCode.OK, resMessage.LIKE_UPDATE_SUCCESS, updateLikeResult));//delete 성공
            }
        }
    } catch (err) {
        console.log(err);
    }
});

 
//webtoon_each table 채우기
//post
//body-each_thumbnail, each_title, webtoon_all_idx
router.post('/', upload.single('each_thumbnail'), async(req, res) => {
    const insertEpisodeQuery = 'INSERT INTO webtoon_each (each_thumbnail, each_title, each_views, each_writetime, webtoon_all_idx) VALUES (?, ?, ?, ?, ?)';
    const each_thumbnail = req.file.location;
    const each_writetime = moment().format("YYYY-MM-DD HH:mm:ss");
    const each_views = 0;
    const insertEpisodeResult = await db.queryParam_Parse(insertEpisodeQuery, [each_thumbnail, req.body.each_title, each_views, each_writetime, req.body.webtoon_all_idx]);
    if (insertEpisodeResult.length == 0) {
        res.status(200).send(util.successFalse(statusCode.DB_ERROR, resMessage.EPISODE_INSERT_FAIL));
    } else {
        res.status(200).send(util.successTrue(statusCode.OK, resMessage.EPISODE_INSERT_SUCCESS, insertEpisodeResult['insertId']));
    }
});

//5번째 page
//웹툰회차별이미지	/eplist/images/:epidx	GET
router.get('/images/:epidx', async(req, res)=>{//회차별 사진들(client에게 webtoon_each_idx값을 받아야함), 사진은 여러 장!
    const getEpisodeImageQuery = 'SELECT img_url, img_idx FROM images WHERE webtoon_each_idx=? ORDER BY img_idx ASC';//회차의 사진을 select한다.
    const getEpisodeImageResult = await db.queryParam_Parse(getEpisodeImageQuery,[req.params.epidx]);
    if (getEpisodeImageResult.length == 0) { 
        res.status(200).send(util.successFalse(statusCode.DB_ERROR, resMessage.EPISODE_IMAGES_SELECT_FAIL));
    } else {
        res.status(200).send(util.successTrue(statusCode.OK, resMessage.EPISODE_IMAGES_SELECT_SUCCESS, getEpisodeImageResult));
    }
});


//images table 채우기
//post
//body-img_url, webtoon_each_idx
//webtoon_each_idx를 클라이언트한테 받아야 함!
router.post('/images', upload.single('img_url'), async(req, res) => {
    const insertImagesQuery = 'INSERT INTO images (img_url, webtoon_each_idx) VALUES (?, ?)';
    const img_url = req.file.location;
    const insertImagesResult = await db.queryParam_Parse(insertImagesQuery, [img_url, req.body.webtoon_each_idx]);
    if (insertImagesResult.length == 0) {
        res.status(200).send(util.successFalse(statusCode.DB_ERROR, resMessage.IMAGES_INSERT_FAIL));
    } else {
        res.status(200).send(util.successTrue(statusCode.OK, resMessage.IMAGES_INSERT_SUCCESS, insertImagesResult['insertId']));
    }
});


//회차를 클릭하면 해당 회차의 조회수인 each_views 증가!!
//어떤 회차인지 클라이언트한테 webtoon_each_idx를 받아야 함!
router.get('/views/:epidx', async(req, res) => {
    const getViewsQuery = 'SELECT each_views FROM webtoon_each WHERE webtoon_each_idx = ?';
    const getViewsResult = await db.queryParam_Parse(getViewsQuery,[req.params.epidx]);
    if (getViewsResult.length == 0) { 
        res.status(200).send(util.successFalse(statusCode.DB_ERROR, resMessage.VIEWS_SELECT_FAIL));//each_views select 실패
    } else {
        //res.status(200).send(util.successTrue(statusCode.OK, resMessage.LIKE_SELECT_SUCCESS, getLikeResult));//like값 select성공
        const views_plus = parseInt(getViewsResult[0]['each_views'])+ 1;//each_views값 +1 
        const updateViewsQuery = 'UPDATE webtoon_each SET each_views = ? WHERE webtoon_each_idx = ?';//다시 수정한 like값 table에 넣어줌
        const updateViewsResult = await db.queryParam_Parse(updateViewsQuery, [views_plus, req.params.epidx]);
        if (updateViewsResult.length == 0) {
            res.status(200).send(util.successFalse(statusCode.DB_ERROR, resMessage.VIEWS_UPDATE_FAIL));//each_views select 성공했으나 update 실패
        } else {
            res.status(200).send(util.successTrue(statusCode.OK, resMessage.VIEWS_UPDATE_SUCCESS));//each_veiws select 성공 & update 성공
        }
    }
});

module.exports = router;