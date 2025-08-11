// /api/usage.js - 사용량 관리 API
export default async function handler(req, res) {
    // CORS 처리
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        if (req.method === 'GET') {
            // 사용량 조회
            return await handleGetUsage(req, res);
        } else if (req.method === 'POST') {
            // 사용량 기록
            return await handleRecordUsage(req, res);
        } else {
            return res.status(405).json({ error: 'Method not allowed' });
        }
    } catch (error) {
        console.error('사용량 API 오류:', error);
        return res.status(500).json({
            success: false,
            error: '서버 내부 오류가 발생했습니다.'
        });
    }
}

// 사용량 조회
async function handleGetUsage(req, res) {
    const { email, recordId } = req.query;

    if (!email || !recordId) {
        return res.status(400).json({
            success: false,
            error: '필수 파라미터가 누락되었습니다.'
        });
    }

    try {
        // Users 테이블에서 현재 사용량 확인
        const response = await fetch(
            `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/Users/${recordId}`,
            {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${process.env.AIRTABLE_ACCESS_TOKEN}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        if (!response.ok) {
            console.error('Airtable 사용량 조회 오류:', response.status);
            return res.status(500).json({
                success: false,
                error: '사용량을 확인할 수 없습니다.'
            });
        }

        const userData = await response.json();
        const totalUsage = userData.fields.Total_Usage || 0;
        const usageLimit = userData.fields.Usage_limit || 100;

        return res.status(200).json({
            success: true,
            usage: {
                total: totalUsage,
                limit: usageLimit,
                remaining: usageLimit - totalUsage,
                canUse: totalUsage < usageLimit
            }
        });

    } catch (error) {
        console.error('사용량 조회 실패:', error);
        return res.status(500).json({
            success: false,
            error: '사용량 조회 중 오류가 발생했습니다.'
        });
    }
}

// 사용량 기록
async function handleRecordUsage(req, res) {
    const { email, recordId, articleNumber } = req.body;

    if (!email || !recordId || !articleNumber) {
        return res.status(400).json({
            success: false,
            error: '필수 데이터가 누락되었습니다.'
        });
    }

    try {
        // 1. 현재 사용량 확인
        const currentUsageResponse = await fetch(
            `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/Users/${recordId}`,
            {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${process.env.AIRTABLE_ACCESS_TOKEN}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        if (!currentUsageResponse.ok) {
            return res.status(500).json({
                success: false,
                error: '사용량 확인 실패'
            });
        }

        const userData = await currentUsageResponse.json();
        const currentTotal = userData.fields.Total_Usage || 0;
        const usageLimit = userData.fields.Usage_limit || 100;

        // 2. 사용량 제한 확인
        if (currentTotal >= usageLimit) {
            return res.status(403).json({
                success: false,
                error: `사용 한도(${usageLimit}회)를 초과했습니다.`,
                usage: {
                    total: currentTotal,
                    limit: usageLimit,
                    remaining: 0
                }
            });
        }

        const newTotal = currentTotal + 1;
        const today = new Date().toISOString().split('T')[0];

        // 3. Users 테이블 업데이트
        const updateResponse = await fetch(
            `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/Users/${recordId}`,
            {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${process.env.AIRTABLE_ACCESS_TOKEN}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    fields: {
                        Total_Usage: newTotal,
                        Last_Used: today
                    }
                })
            }
        );

        if (!updateResponse.ok) {
            console.error('사용량 업데이트 실패:', updateResponse.status);
            return res.status(500).json({
                success: false,
                error: '사용량 업데이트 실패'
            });
        }

        // 4. Usage_Log 테이블에 로그 기록
        const logResponse = await fetch(
            `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/Usage_Log`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${process.env.AIRTABLE_ACCESS_TOKEN}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    records: [{
                        fields: {
                            Log_ID: `LOG_${Date.now()}`,
                            User: [recordId],
                            Date: today,
                            Article_Number: articleNumber.toString(),
                            Total_Count: newTotal
                        }
                    }]
                })
            }
        );

        if (!logResponse.ok) {
            console.error('로그 기록 실패:', logResponse.status);
            // 로그 실패는 치명적이지 않으므로 계속 진행
        }

        return res.status(200).json({
            success: true,
            message: '사용량이 기록되었습니다.',
            usage: {
                total: newTotal,
                limit: usageLimit,
                remaining: usageLimit - newTotal
            }
        });

    } catch (error) {
        console.error('사용량 기록 실패:', error);
        return res.status(500).json({
            success: false,
            error: '사용량 기록 중 오류가 발생했습니다.'
        });
    }
}