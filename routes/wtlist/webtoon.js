var express = require('express');
var router = express.Router();
const crypto = require('crypto-promise');
const util = require('../../module/utils');
const statusCode = require('../../module/statusCode');
const resMessage = require('../../module/responseMessage');
const db = require('../../module/pool');
const upload = require('../../config/multer');//post할때 필요
const moment = require('moment');

//3번째 page
//웹툰리스트	/wtlist/:wtindex	GET
//전체 웹툰의 리스트 불러오기
//default - /wtlist   인기순	GET
router.get('/', async(req, res)=>{//인기순
    const getAllWebtoonQuery = 'SELECT webtoon_all_idx, thumbnail, title, `like`, author FROM webtoon_all WHERE complete=0 ORDER BY `like` DESC';//like 많은 순으로 select한다.
    const getAllWebtoonResult = await db.queryParam_None(getAllWebtoonQuery);
    if (getAllWebtoonResult.length == 0) { 
        res.status(200).send(util.successFalse(statusCode.DB_ERROR, resMessage.ALL_WEBTOON_SELECT_FAIL));
    } else {
        res.status(200).send(util.successTrue(statusCode.OK, resMessage.ALL_WEBTOON_SELECT_SUCCESS, getAllWebtoonResult));
    }
});

///wtlist/0     인기순	GET
///wtlist/1     신작	GET
///wtlist/2     완결	GET
//webtoon_all_idx, thumbnail, title, like, author 
router.get('/:flag', async(req, res)=>{
    if(req.params.flag == 0){//인기순
        const getPopularWebtoonQuery = 'SELECT webtoon_all_idx, thumbnail, title, `like`, author FROM webtoon_all WHERE complete=0 ORDER BY `like` DESC';//like 많은 순으로 select한다.
        const getPopularWebtoonResult = await db.queryParam_None(getPopularWebtoonQuery);
        if (getPopularWebtoonResult.length == 0) { 
            res.status(200).send(util.successFalse(statusCode.DB_ERROR, resMessage.POPULAR_SORT_FAIL));
        } else {
            res.status(200).send(util.successTrue(statusCode.OK, resMessage.POPULAR_SORT_SUCCESS, getPopularWebtoonResult));
        }
    }
    else if(req.params.flag== 1){//신작
        const getNewWebtoonQuery = 'SELECT webtoon_all_idx, thumbnail, title, `like`, author FROM webtoon_all WHERE complete=0 ORDER BY writetime DESC';//writetime 최신순으로 select한다.
        const getNewWebtoonResult = await db.queryParam_None(getNewWebtoonQuery);
        if (getNewWebtoonResult.length == 0) { 
            res.status(200).send(util.successFalse(statusCode.DB_ERROR, resMessage.NEW_SELECT_FAIL));
        } else {
            res.status(200).send(util.successTrue(statusCode.OK, resMessage.NEW_SELECT_SUCCESS, getNewWebtoonResult));
        }
    }
    else if(req.params.flag == 2){//완결(complete = 1)
        const getCompleteWebtoonQuery = 'SELECT webtoon_all_idx, thumbnail, title, `like`, author FROM webtoon_all WHERE complete = 1';//complete가 1인 웹툰을 select한다.
        const getCompleteWebtoonResult = await db.queryParam_None(getCompleteWebtoonQuery);
        if (getCompleteWebtoonResult.length == 0) { 
            res.status(200).send(util.successFalse(statusCode.DB_ERROR, resMessage.COMPLETE_SELECT_FAIL));
        } else {
            res.status(200).send(util.successTrue(statusCode.OK, resMessage.COMPLETE_SELECT_SUCCESS, getCompleteWebtoonResult));
        }
    }
});

//webtoon_all table 채우기
//post
//body-thumbnail, title, author, complete
router.post('/', upload.single('thumbnail'), async(req, res) => {
    const insertWebtoonQuery = 'INSERT INTO webtoon_all (thumbnail, title, author, `like`, complete, writetime) VALUES (?, ?, ?, ?, ?, ?)';
    const thumbnail = req.file.location;
    const like = 0;
    const writetime = moment().format("YYYY-MM-DD HH:mm:ss");
    const insertWebtoonResult  = await db.queryParam_Parse(insertWebtoonQuery, [thumbnail, req.body.title, req.body.author, like, req.body.complete, writetime]);
    if (insertWebtoonResult .length == 0) {
        res.status(200).send(util.successFalse(statusCode.DB_ERROR, resMessage.EPISODE_INSERT_FAIL));
    } else {
        res.status(200).send(util.successTrue(statusCode.OK, resMessage.EPISODE_INSERT_SUCCESS, insertWebtoonResult['insertId']));
    }
});

router.post('/banner', upload.array('banner'), async(req, res) => {
    const banner = req.files;
    const banner_final=[];
    for (let i = 0; i < banner.length; i++) {
        banner_final.push(banner[i].location);//여러개의 파일일 경우 imgs[i].loaction으로 경로 접근(그래서 콘솔창에 img의 url이 img수 만큼 뜬다)
    }
    res.status(200).send(util.successTrue(statusCode.OK, resMessage.BANNER_SUCCESS, banner_final));
});

module.exports = router;