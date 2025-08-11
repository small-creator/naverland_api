// /api/auth.js - 사용자 인증 API
export default async function handler(req, res) {
    // CORS 처리
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                error: '이메일을 입력해주세요.'
            });
        }

        // 이메일 유효성 검사
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                error: '올바른 이메일 형식을 입력해주세요.'
            });
        }

        // Airtable에서 사용자 검증
        const airtableResponse = await fetch(
            `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/Users?filterByFormula={Email} = "${email.toLowerCase()}"`,
            {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${process.env.AIRTABLE_ACCESS_TOKEN}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        if (!airtableResponse.ok) {
            console.error('Airtable API 오류:', airtableResponse.status);
            return res.status(500).json({
                success: false,
                error: '인증 서버 오류가 발생했습니다.'
            });
        }

        const data = await airtableResponse.json();

        if (!data.records || data.records.length === 0) {
            return res.status(401).json({
                success: false,
                error: '허용되지 않은 사용자입니다.'
            });
        }

        const userRecord = data.records[0];
        const fields = userRecord.fields;

        if (fields.Status !== 'active') {
            return res.status(401).json({
                success: false,
                error: '비활성화된 사용자입니다.'
            });
        }

        // 성공 응답
        return res.status(200).json({
            success: true,
            user: email.toLowerCase(),
            limits: {
                total: fields.Usage_limit || 100
            },
            recordId: userRecord.id
        });

    } catch (error) {
        console.error('인증 API 오류:', error);
        return res.status(500).json({
            success: false,
            error: '서버 내부 오류가 발생했습니다.'
        });
    }
}