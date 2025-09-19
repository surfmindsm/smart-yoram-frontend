# 🚨 긴급 DB 스키마 수정 요청

## 문제 상황
GPT 설정에서 API 키를 저장했지만, DB에서 **6자로 잘려서 저장**되고 있습니다.

### 현재 문제
```
🔍 API 키 상세 정보: {
  hasApiKey: true, 
  keyLength: 6,           // ❌ 6자만 저장됨
  keyPrefix: 'sk-...',    // ❌ 뒤가 잘림
  keyType: 'string', 
  isActive: true
}
```

정상적인 OpenAI API 키 길이: **51-64자**
현재 DB 저장 길이: **6자**

## 필요한 DB 스키마 수정

### 1. GPT 설정 테이블 (추정)
```sql
-- 현재 (추정)
ALTER TABLE church_configs 
ALTER COLUMN api_key TYPE VARCHAR(255);

-- 또는
ALTER TABLE gpt_configs 
ALTER COLUMN api_key TYPE VARCHAR(255);

-- 또는 해당 테이블명으로
ALTER TABLE [테이블명] 
ALTER COLUMN api_key TYPE VARCHAR(255);
```

### 2. 관련 테이블 확인 필요
- `church_configs` 테이블의 `gpt_api_key` 필드
- `gpt_configs` 테이블의 `api_key` 필드
- 기타 GPT 설정 관련 테이블

## 수정 후 작업

1. **DB 스키마 수정 완료**
2. **기존 잘린 데이터 삭제/초기화**
3. **GPT 설정 화면에서 API 키 재입력**
4. **테스트 확인**

## 에러 로그
```
❌ GPT API 상세 오류: {
  status: 401, 
  statusText: '', 
  error: '{"error": {"message": "Incorrect API key provided", "code": "invalid_api_key"}}', 
  apiKey: '***-...'
}
```

## 우선순위
🔥 **긴급** - AI 채팅 기능이 완전히 작동하지 않음

## 담당자
백엔드 개발팀

---
**생성일**: 2025-08-21
**작성자**: 프론트엔드 팀
