//회원가입
//jwt 필요 없음
var express = require('express');
var router = express.Router();
const crypto = require('crypto-promise');
const util = require('../../module/utils');
const statusCode = require('../../module/statusCode');
const resMessage = require('../../module/responseMessage');
const db = require('../../module/pool');

//body-id, name, password
router.post('/', async (req, res) => {
    const selectIdQuery = 'SELECT id FROM user WHERE id = ?'
    const selectIdResult = await db.queryParam_Parse(selectIdQuery, req.body.id);
    const signupQuery = 'INSERT INTO user (id,name,password,salt) VALUES (?, ?, ?, ?)';


    if(selectIdResult[0] == null) {  //아이디 중복 없음
        const buf= await crypto.randomBytes(64);
        const salt = buf.toString('base64');
        const hashedPw = await crypto.pbkdf2(req.body.password.toString(), salt, 1000, 32, 'SHA512');
        const signupResult = await db.queryParam_Parse(signupQuery, [req.body.id, req.body.name, hashedPw.toString('base64'), salt]);
        if (!signupResult) {
            //console.log("멤버십 조회 실패");
            res.status(200).send(util.successFalse(statusCode.DB_ERROR, resMessage.USER_INSERT_FAIL));
        } else {  
            //console.log("멤버십 삽입 성공");
            res.status(200).send(util.successTrue(statusCode.OK, resMessage.USER_INSERT_SUCCESS));
        }
    } else {
        console.log("중복된 ID가 있습니다.");
        res.status(200).send(util.successFalse(statusCode.OK, resMessage.SIGNUP_FAIL));
    }
});

module.exports = router;
