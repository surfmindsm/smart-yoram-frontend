# Vercel 프록시 설정 가이드

## 문제
- HTTPS (Vercel) → HTTP (EC2) 연결 시 Mixed Content 에러 발생
- 브라우저가 보안상의 이유로 HTTPS 페이지에서 HTTP API 호출을 차단

## 해결 방법: Vercel Functions 프록시

### 1. 프록시 파일 구조
```
admin-dashboard/
├── api/
│   └── proxy/
│       └── [...path].js  # 모든 API 요청을 프록시
└── src/
    └── services/
        └── api.ts        # 프록시 모드 지원 추가
```

### 2. 환경 변수 설정

#### 개발 환경 (.env)
```
REACT_APP_API_URL=http://localhost:8000/api/v1
```

#### 프로덕션 - 직접 연결 (.env.production)
```
REACT_APP_API_URL=http://3.25.230.187/api/v1
```

#### 프로덕션 - 프록시 사용 (.env.production.proxy)
```
REACT_APP_API_URL=/api/proxy
```

### 3. Vercel 배포

#### 프록시 모드로 배포
```bash
# 프록시 환경 변수 사용
cp .env.production.proxy .env.production

# Git 커밋 및 푸시
git add .
git commit -m "Enable proxy mode for HTTPS"
git push origin main
```

#### Vercel 대시보드에서 환경 변수 설정
1. Vercel 프로젝트 설정 → Environment Variables
2. 추가:
   - Name: `REACT_APP_API_URL`
   - Value: `/api/proxy`
   - Environment: Production

### 4. 작동 원리

1. 프론트엔드가 `/api/proxy/auth/login/access-token` 호출
2. Vercel Functions가 요청을 받음
3. Functions가 `http://3.25.230.187/api/v1/auth/login/access-token`로 프록시
4. EC2 응답을 HTTPS로 클라이언트에 전달

### 5. 장점
- Mixed Content 에러 해결
- EC2에 SSL 설정 불필요
- 추가 도메인 구매 불필요
- 무료로 사용 가능

### 6. 단점
- 약간의 지연 시간 추가 (Vercel → EC2)
- Vercel Functions 사용량 제한 (무료 플랜: 월 100GB)

### 7. 테스트
1. https://smart-yoram-admin.vercel.app 접속
2. 로그인 시도
3. 네트워크 탭에서 `/api/proxy/*` 요청 확인
4. 정상 작동 확인

### 8. 디버깅
- Vercel Functions 로그: Vercel 대시보드 → Functions 탭
- 브라우저 콘솔에서 네트워크 에러 확인
- EC2 Docker 로그 확인: `docker-compose logs -f backend`