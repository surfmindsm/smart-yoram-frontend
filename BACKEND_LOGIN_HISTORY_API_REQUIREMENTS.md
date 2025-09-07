# 로그인 기록 API 구현 요청서

## 개요
교회 관리 시스템의 보안 강화를 위해 사용자 로그인 기록 추적 및 조회 API 구현이 필요합니다.

## 1. API 엔드포인트 요구사항

### 1.1 최근 로그인 기록 조회
```
GET /api/auth/login-history/recent
```

**응답 예시:**
```json
{
  "id": 123,
  "timestamp": "2025-09-07T10:30:00Z",
  "ip_address": "192.168.1.100",
  "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
  "location": "서울, 한국",
  "device_info": "Windows PC - Chrome"
}
```

### 1.2 로그인 기록 목록 조회
```
GET /api/auth/login-history
```

**쿼리 파라미터:**
- `page`: 페이지 번호 (기본값: 1)
- `limit`: 페이지당 항목 수 (기본값: 20)
- `start_date`: 조회 시작일 (YYYY-MM-DD)
- `end_date`: 조회 종료일 (YYYY-MM-DD)

**응답 예시:**
```json
{
  "records": [
    {
      "id": 123,
      "timestamp": "2025-09-07T10:30:00Z",
      "ip_address": "192.168.1.100",
      "user_agent": "Mozilla/5.0...",
      "location": "서울, 한국",
      "device_info": "Windows PC - Chrome",
      "status": "성공"
    }
  ],
  "pagination": {
    "total": 150,
    "page": 1,
    "limit": 20,
    "total_pages": 8
  }
}
```

### 1.3 로그인 이벤트 기록
```
POST /api/auth/login-history
```

**요청 본문:**
```json
{
  "user_id": 1,
  "ip_address": "192.168.1.100",
  "user_agent": "Mozilla/5.0...",
  "status": "성공", // "성공", "실패", "잠금"
  "failure_reason": null // 실패시에만: "잘못된 비밀번호", "존재하지 않는 사용자" 등
}
```

## 2. 데이터베이스 스키마

### login_history 테이블
```sql
CREATE TABLE login_history (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  ip_address VARCHAR(45) NOT NULL,
  user_agent TEXT,
  location VARCHAR(100),
  device_info VARCHAR(200),
  status ENUM('성공', '실패', '잠금') NOT NULL,
  failure_reason VARCHAR(200),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user_timestamp (user_id, timestamp DESC),
  INDEX idx_timestamp (timestamp DESC),
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

## 3. 보안 요구사항

### 3.1 접근 권한
- 사용자는 본인의 로그인 기록만 조회 가능
- 관리자는 모든 사용자의 로그인 기록 조회 가능

### 3.2 IP 주소 처리
- 실제 클라이언트 IP 수집 (프록시/로드밸런서 고려)
- IP 기반 위치 정보 제공 (선택사항)

### 3.3 데이터 보존
- 로그인 기록은 최소 1년간 보존
- 개인정보보호법에 따른 데이터 처리 방침 준수

## 4. 구현 우선순위

### 우선순위 1 (즉시 구현 필요)
1. 로그인 성공 시 기록 저장
2. 최근 로그인 기록 조회 API
3. 기본 로그인 기록 목록 조회 API

### 우선순위 2 (1주일 내)
1. 로그인 실패 기록
2. IP 기반 위치 정보
3. 디바이스 정보 파싱

## 5. 테스트 케이스

### 5.1 기능 테스트
- [ ] 로그인 성공 시 기록 저장 확인
- [ ] 로그인 실패 시 기록 저장 확인
- [ ] 최근 로그인 기록 정확한 조회
- [ ] 페이지네이션 동작 확인
- [ ] 날짜 범위 필터링 동작 확인

### 5.2 보안 테스트
- [ ] 다른 사용자의 기록 접근 차단 확인
- [ ] SQL 인젝션 방어 확인
- [ ] API 인증 토큰 검증 확인

### 5.3 성능 테스트
- [ ] 대량 데이터 조회 성능 (10만건 이상)
- [ ] 동시 접속 로그 기록 처리
- [ ] 인덱스 효율성 검증

## 6. 모니터링 및 알림

### 6.1 이상 접속 감지
- 단시간 내 다수 실패 로그인
- 새로운 IP/위치에서의 접속
- 비정상적인 시간대 접속

### 6.2 알림 기준
- 5회 연속 로그인 실패 시 계정 임시 잠금
- 관리자에게 보안 이벤트 알림

## 7. 예상 일정
- **API 개발**: 2-3일
- **테스트 및 검증**: 1-2일
- **배포 및 모니터링 설정**: 1일

**총 예상 기간: 4-6일**

---

**문의사항이나 추가 요구사항이 있으시면 언제든 연락 부탁드립니다.**