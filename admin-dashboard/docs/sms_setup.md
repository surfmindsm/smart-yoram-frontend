# SMS 초대 기능 설정 가이드

## 개요
교인 관리 시스템에서 SMS 초대 기능을 사용하기 위한 네이버 클라우드 플랫폼 설정 가이드입니다.

## 필요한 환경변수

Supabase Edge Function에서 다음 환경변수들이 설정되어야 합니다:

### 1. 네이버 클라우드 플랫폼 SMS API 설정
```bash
# Access Key ID
NCP_ACCESS_KEY=your_access_key_here

# Secret Key
NCP_SECRET_KEY=your_secret_key_here

# 발신번호 (교회 대표 전화번호)
SMS_FROM_NUMBER=02-1234-5678
```

### 2. 서비스 정보
- **Service ID**: `ncp:sms:kr:358279546766:yoram`
- **API 엔드포인트**: `https://sens.apigw.ntruss.com/sms/v2/services/{serviceId}/messages`

## 환경변수 설정 방법

### Supabase 프로젝트에서 설정:
1. Supabase Dashboard → Settings → Edge Functions
2. Environment Variables 섹션에서 추가:
   - `NCP_ACCESS_KEY`: 네이버 클라우드 Access Key
   - `NCP_SECRET_KEY`: 네이버 클라우드 Secret Key
   - `SMS_FROM_NUMBER`: 발신 전화번호

### 로컬 개발 환경에서 설정:
```bash
# supabase/functions/send-sms/.env 파일 생성
NCP_ACCESS_KEY=your_access_key_here
NCP_SECRET_KEY=your_secret_key_here
SMS_FROM_NUMBER=02-1234-5678
```

## SMS 메시지 형식

SMS는 90byte 이내로 다음과 같은 형식으로 발송됩니다:

```
[요람교회] 앱계정 생성
ID: 010-1234-5678
PW: Ab12cD34
앱: bit.ly/church-app
```

## Edge Function 배포

SMS 기능을 사용하려면 Edge Function을 배포해야 합니다:

```bash
# SMS Edge Function 배포
supabase functions deploy send-sms

# 또는 모든 함수 배포
npm run supabase:functions:deploy
```

## 사용 방법

1. **교인 관리 페이지**에서 교인 상세 정보 보기
2. **"초대"** 버튼 클릭
3. 확인 대화상자에서 **"확인"** 클릭
4. SMS 발송 완료 후 임시 비밀번호 표시

## 주의사항

- 발신번호는 네이버 클라우드에서 사전 등록되어야 합니다
- 하루 발송 제한량을 확인하고 사용하세요
- 임시 비밀번호는 8자리 (대소문자+숫자 조합)로 자동 생성됩니다
- SMS 발송 상태는 members 테이블의 `invitation_status` 컬럼에서 확인 가능합니다

## 데이터베이스 변경사항

Members 테이블에 다음 컬럼들이 추가되었습니다:

- `invited_at`: SMS 초대 발송 시간
- `invitation_status`: 초대 상태 ('pending', 'sent', 'failed')
- `temporary_password`: 임시 비밀번호

## 문제 해결

### 발송 실패 시 확인사항:
1. 환경변수가 올바르게 설정되었는지 확인
2. 네이버 클라우드 API 키가 유효한지 확인
3. 발신번호가 등록되어 있는지 확인
4. Edge Function이 배포되었는지 확인