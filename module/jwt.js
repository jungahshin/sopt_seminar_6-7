var randtoken = require('rand-token');
const jwt = require('jsonwebtoken');
const secretOrPrivateKey = "jwtSecretKey!";
const options = {
    algorithm: "HS256",
    expiresIn: "1h",
    issuer: "genie"
};
const refreshOptions = {//Refreshoptions????????
    algorithm: "HS256",
    expiresIn: "24h * 14",
    issuer: "genie"
};

module.exports = {
    sign: (user) => {//로그인을 할때에 어차피 id, password는 입력을 하니까 그 외의 부분인 userIdx, name, grade를 토큰으로 만든다.
        const payload = {//payload부분 
            idx: user.idx,//userIdx를 의미
            grade: user.grade,//관리자인지 아닌지를 의미
            name: user.name//사용자의 이름 의미
        };

        const result = {
            token: jwt.sign(payload, secretOrPrivateKey, options),
            refreshToken: randtoken.uid(256)//refresh token까지 같이 준다.-->발급 받은 refresh token은 반드시 db에 저장해야 된다!!!!!
        };
        //refreshToken을 만들 때에도 다른 키를 쓰는게 좋다.

        return result;
    },

    verify: (token) => {
        let decoded;
        try {
            decoded = jwt.verify(token, secretOrPrivateKey);
        } catch (err) {
            if (err.message === 'jwt expired') {//유효기간 만료
                console.log('expired token');
                return -3;
            } else if (err.message === 'invalid token') {//잘못된 token
                console.log('invalid token');
                return -2;
            } else {
                console.log("invalid token");
                return -2;
            }
        }
        return decoded;//error가 없을 시에 decoded로 return을 한다. 
    },

    refresh: (user) => {
        const payload = {
            idx: user.idx,
            grade: user.grade,
            name: user.name
        };
        return jwt.sign(payload, secretOrPrivateKey, options);//새로 발급 받을 때 쓰는 즉, refresh할때 return되는 값이다.
    }

    
};