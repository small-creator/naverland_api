// /api/hello.js - 테스트용 API
module.exports = async function handler(req, res) {
    // CORS 처리
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    return res.status(200).json({
        message: '🚀 나버랜드 API 서버가 정상 작동중입니다!',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
};