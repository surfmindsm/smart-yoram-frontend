# Vercel 배포 가이드

## 현재 설정

- **프론트엔드 URL**: https://smart-yoram-admin.vercel.app
- **백엔드 API URL**: http://3.25.230.187/api/v1

## Vercel 환경 변수 설정

1. Vercel 대시보드에 로그인
2. 프로젝트 설정 → Environment Variables
3. 다음 환경 변수 추가:
   ```
   REACT_APP_API_URL = http://3.25.230.187/api/v1
   ```

## 배포 방법

### 방법 1: Git Push (자동 배포)
```bash
git add .
git commit -m "Update API URL for production"
git push origin main
```

### 방법 2: Vercel CLI
```bash
npm i -g vercel
vercel --prod
```

## Mixed Content 문제 해결

HTTPS (Vercel) → HTTP (EC2) 연결로 인한 Mixed Content 에러가 발생할 수 있습니다.

### 해결 방법:

1. **브라우저에서 임시 허용** (개발/테스트용):
   - Chrome: 주소창의 자물쇠 아이콘 클릭 → Site settings → Insecure content → Allow

2. **EC2에 SSL 설정** (권장):
   - EC2에 도메인 연결
   - Let's Encrypt로 SSL 인증서 설정
   - HTTPS로 API 제공

3. **프록시 서버 사용**:
   - Vercel Functions를 이용한 API 프록시
   - `/api/proxy` 엔드포인트 생성

## EC2 백엔드 CORS 설정

EC2에서 다음 스크립트 실행:
```bash
./deploy/update-cors-for-vercel.sh
```

이 스크립트는 백엔드의 CORS 설정에 `https://smart-yoram-admin.vercel.app`를 추가합니다.

## 테스트

1. https://smart-yoram-admin.vercel.app 접속
2. 로그인 시도
3. 브라우저 개발자 도구에서 네트워크 탭 확인
4. API 호출이 정상적으로 이루어지는지 확인

## 문제 해결

### CORS 에러
- EC2 백엔드의 `.env` 파일에서 `BACKEND_CORS_ORIGINS` 확인
- Docker 컨테이너 재시작 필요

### Mixed Content 에러
- 브라우저 콘솔에서 "Mixed Content" 에러 확인
- 위의 해결 방법 참조

### API 연결 실패
- EC2 Security Group에서 80번 포트 확인
- Nginx 프록시 설정 확인
- Docker 컨테이너 상태 확인