//로그인
var express = require('express');
var router = express.Router();
const crypto = require('crypto-promise');
const util = require('../../module/utils');
const statusCode = require('../../module/statusCode');
const resMessage = require('../../module/responseMessage');
const db = require('../../module/pool');
const jwtUtils = require('../../module/jwt');


//body-id, password
router.post('/', async(req, res) => {
    if (req.body.idx === null || !req.body.grade || !req.body.name) {//하나라도 값이 비어있으면 안된다.
        res.status(statusCode.OK).send(util.successFalse(statusCode.BAD_REQUEST, resMessage.NULL_VALUE));
    } else {
        const selectIdQuery = 'SELECT * FROM user WHERE id = ?'
        const selectIdResult = await db.queryParam_Parse(selectIdQuery, req.body.id);
    
        if(selectIdResult[0]==null){
            //console.log("ID가 존재하지 않거나 비밀번호가 일치하지 않습니다._id없음");
            res.status(200).send(util.successFalse(statusCode.OK, resMessage.NO_USER));
        }else{
            const salt= selectIdResult[0].salt;
            const hashedEnterPw= await crypto.pbkdf2(req.body.password.toString(),salt,1000, 32, 'SHA512');
            
            if(selectIdResult[0].password==hashedEnterPw.toString('base64')){
                //console.log("게시물 조회 성공");
                const tokens = jwtUtils.sign(req.body);//token을 만들면 refresh token도 같이 날아온다-->그러면 반드시 db에 저장해 놓아야 한다. 
                //발급받은 refreshToken을 user DB에 저장해줘야함 (지금은 생략)
                //클라이언트에게 refreshToken을 안전한 저장소에 저장해달라고 설명
                res.status(200).send(util.successTrue(statusCode.OK, resMessage.LOGIN_SUCCESS,tokens)); //data로 userIdx찍어줌.
            }else{
                //console.log("ID가 존재하지 않거나 비밀번호가 일치하지 않습니다._비밀번호 없음");
                res.status(200).send(util.successFalse(statusCode.OK, resMessage.MISS_MATCH_PW));
            }
        }
        //res.status(statusCode.OK).send(utils.successTrue(statusCode.OK, resMessage.CREATE_TOKEN, tokens));
    }
});

module.exports = router;
