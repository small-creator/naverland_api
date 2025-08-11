# 🚀 나버랜드 익스텐션 Vercel API

네이버 부동산 익스텐션용 백엔드 API 서버

## 📋 배포 가이드

### 1. Vercel 계정 준비
1. [vercel.com](https://vercel.com)에서 GitHub 계정으로 로그인
2. 무료 플랜으로 충분합니다

### 2. 배포 방법

#### 방법 A: GitHub 연동 (추천)
1. 이 폴더를 GitHub 리포지토리에 업로드
2. Vercel에서 "New Project" 클릭
3. GitHub 리포지토리 선택
4. 자동 배포 완료

#### 방법 B: Vercel CLI
```bash
# 1. Vercel CLI 설치
npm i -g vercel

# 2. 프로젝트 폴더에서 배포
cd naverland_api
vercel --prod

# 3. 질문에 답변
# - Framework preset: Other
# - Build and Output Settings: 기본값 사용
```

### 3. 환경 변수 설정

배포 후 Vercel 대시보드에서 환경 변수 설정:

1. **Settings** → **Environment Variables**
2. 다음 변수 추가:
   ```
   AIRTABLE_ACCESS_TOKEN = patB1CfM4LIw8TTBV.4be06d0ba37dc97c628a6b500271a704ab2df2a8887aee24e3950a6407b93a6e
   AIRTABLE_BASE_ID = appu5XhuYX1a2eEKy
   ```
3. **Save** 클릭
4. **Redeploy** 버튼으로 재배포

### 4. API 테스트

배포 완료 후 API 엔드포인트 테스트:

```bash
# 인증 테스트
curl -X POST https://your-project.vercel.app/api/auth \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'

# 사용량 조회 테스트
curl https://your-project.vercel.app/api/usage?email=test@example.com&recordId=recXXXXX
```

## 📁 프로젝트 구조

```
naverland_api/
├── api/
│   ├── auth.js          # 사용자 인증 API
│   └── usage.js         # 사용량 관리 API
├── package.json         # 의존성 관리
├── vercel.json          # Vercel 설정
└── README.md           # 이 파일
```

## 🔗 API 엔드포인트

### POST /api/auth
사용자 인증

**Request:**
```json
{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "user": "user@example.com",
  "limits": {"total": 100},
  "recordId": "recXXXXXXXXXXXXXX"
}
```

### GET /api/usage
사용량 조회

**Parameters:**
- `email`: 사용자 이메일
- `recordId`: Airtable 레코드 ID

**Response:**
```json
{
  "success": true,
  "usage": {
    "total": 5,
    "limit": 100,
    "remaining": 95,
    "canUse": true
  }
}
```

### POST /api/usage
사용량 기록

**Request:**
```json
{
  "email": "user@example.com",
  "recordId": "recXXXXXXXXXXXXXX",
  "articleNumber": "2542953875"
}
```

**Response:**
```json
{
  "success": true,
  "message": "사용량이 기록되었습니다.",
  "usage": {
    "total": 6,
    "limit": 100,
    "remaining": 94
  }
}
```

## 🔐 보안 특징

- ✅ **토큰 완전 숨김**: Airtable 토큰이 서버에만 존재
- ✅ **CORS 설정**: Chrome 익스텐션에서만 접근 가능
- ✅ **환경 변수**: 민감한 정보는 환경 변수로 관리
- ✅ **입력 검증**: 모든 API 입력값 유효성 검사

## 🚀 배포 완료 후

1. 배포된 URL을 익스텐션의 `vercel-api-manager.js`에 업데이트
2. 익스텐션 새로고침
3. 테스트 및 사용자 배포