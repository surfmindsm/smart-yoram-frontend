# 행사 소식 (Church News) API 요청 문서

## 개요
교회 행사 소식 관리를 위한 백엔드 API 개발 요청서입니다.

## 데이터 모델

### ChurchNews 모델

```python
class ChurchNews(Base):
    __tablename__ = "church_news"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False, index=True)  # 제목
    content = Column(Text, nullable=False)  # 내용
    category = Column(String(50), nullable=False, index=True)  # 카테고리
    priority = Column(Enum('urgent', 'important', 'normal'), default='normal', index=True)  # 우선순위
    
    # 행사 정보
    event_date = Column(Date, nullable=True)  # 행사일
    event_time = Column(Time, nullable=True)  # 행사 시간
    location = Column(String(255), nullable=True)  # 장소
    organizer = Column(String(100), nullable=False)  # 주최자/부서
    target_audience = Column(String(100), nullable=True)  # 대상
    participation_fee = Column(String(50), nullable=True)  # 참가비
    
    # 신청 관련
    registration_required = Column(Boolean, default=False)  # 사전 신청 필요 여부
    registration_deadline = Column(Date, nullable=True)  # 신청 마감일
    
    # 연락처 정보
    contact_person = Column(String(100), nullable=True)  # 담당자
    contact_phone = Column(String(20), nullable=True)  # 연락처
    contact_email = Column(String(100), nullable=True)  # 이메일
    
    # 상태 관리
    status = Column(Enum('active', 'completed', 'cancelled'), default='active', index=True)  # 상태
    
    # 메타데이터
    views = Column(Integer, default=0)  # 조회수
    likes = Column(Integer, default=0)  # 좋아요
    comments_count = Column(Integer, default=0)  # 댓글 수
    
    # 태그 (JSON 배열)
    tags = Column(JSON, nullable=True)  # ["찬양", "연합", "특별행사"]
    
    # 이미지 (JSON 배열)
    images = Column(JSON, nullable=True)  # ["image1.jpg", "image2.jpg"]
    
    # 공통 필드
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # 작성자 정보
    author_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    church_id = Column(Integer, ForeignKey("churches.id"), nullable=True)
    
    # 관계
    author = relationship("User", back_populates="church_news")
    church = relationship("Church", back_populates="church_news")
```

## API 엔드포인트

### 1. 행사 소식 목록 조회
```http
GET /api/v1/community/church-news
```

**Query Parameters:**
- `page` (int, optional): 페이지 번호 (기본값: 1)
- `limit` (int, optional): 페이지당 개수 (기본값: 20, 최대: 100)
- `category` (string, optional): 카테고리 필터
- `priority` (string, optional): 우선순위 필터 (urgent, important, normal)
- `status` (string, optional): 상태 필터 (active, completed, cancelled)
- `search` (string, optional): 제목, 내용, 주최자 검색
- `event_date_from` (date, optional): 행사일 시작 범위
- `event_date_to` (date, optional): 행사일 끝 범위

**Response:**
```json
{
  "items": [
    {
      "id": 1,
      "title": "2024년 교회 연합 찬양제 개최",
      "content": "오는 12월 15일, 서울 지역 교회들이 연합하여...",
      "category": "연합행사",
      "priority": "important",
      "event_date": "2024-12-15",
      "location": "서울 잠실체육관",
      "organizer": "서울교회연합회",
      "status": "active",
      "views": 245,
      "likes": 18,
      "comments_count": 7,
      "tags": ["찬양", "연합", "특별행사"],
      "images": ["image1.jpg"],
      "created_at": "2024-11-15T09:00:00Z",
      "updated_at": "2024-11-15T09:00:00Z",
      "author": {
        "id": 1,
        "name": "김목사",
        "church_name": "서울중앙교회"
      }
    }
  ],
  "total": 50,
  "page": 1,
  "pages": 3,
  "limit": 20
}
```

### 2. 행사 소식 상세 조회
```http
GET /api/v1/community/church-news/{id}
```

**Response:**
```json
{
  "id": 1,
  "title": "2024년 교회 연합 찬양제 개최",
  "content": "오는 12월 15일, 서울 지역 교회들이 연합하여 큰 찬양제를 개최합니다...",
  "category": "연합행사",
  "priority": "important",
  "event_date": "2024-12-15",
  "location": "서울 잠실체육관",
  "organizer": "서울교회연합회",
  "status": "active",
  "views": 246,  // 조회 시 자동 증가
  "likes": 18,
  "comments_count": 7,
  "tags": ["찬양", "연합", "특별행사"],
  "images": ["image1.jpg", "image2.jpg"],
  "created_at": "2024-11-15T09:00:00Z",
  "updated_at": "2024-11-15T09:00:00Z",
  "author": {
    "id": 1,
    "name": "김목사",
    "church_name": "서울중앙교회",
    "contact_phone": "010-1234-5678",
    "contact_email": "pastor@church.com"
  }
}
```

### 3. 행사 소식 등록
```http
POST /api/v1/community/church-news
Authorization: Bearer {access_token}
```

**Request Body:**
```json
{
  "title": "2024년 교회 연합 찬양제 개최",
  "content": "오는 12월 15일, 서울 지역 교회들이 연합하여...",
  "category": "연합행사",
  "priority": "important",
  "event_date": "2024-12-15",  // optional
  "location": "서울 잠실체육관",  // optional
  "organizer": "서울교회연합회",
  "status": "active",
  "tags": ["찬양", "연합", "특별행사"],  // optional
  "images": ["image1.jpg"]  // optional
}
```

**Response:**
```json
{
  "id": 1,
  "title": "2024년 교회 연합 찬양제 개최",
  "message": "행사 소식이 성공적으로 등록되었습니다."
}
```

### 4. 행사 소식 수정
```http
PUT /api/v1/community/church-news/{id}
Authorization: Bearer {access_token}
```

**Request Body:** (등록과 동일)

### 5. 행사 소식 삭제
```http
DELETE /api/v1/community/church-news/{id}
Authorization: Bearer {access_token}
```

### 6. 좋아요 토글
```http
POST /api/v1/community/church-news/{id}/like
Authorization: Bearer {access_token}
```

**Response:**
```json
{
  "liked": true,
  "likes_count": 19
}
```

## 카테고리 목록

### 예배/집회 관련
- `특별예배`: 특별예배/연합예배
- `부흥회`: 부흥회/말씀집회  
- `기도회`: 기도회/철야기도회
- `성례식`: 성찬식/세례식

### 교육/양육 행사
- `성경공부`: 성경공부/제자훈련
- `세미나`: 세미나/워크숍
- `수련회`: 수련회/성경학교
- `신앙강좌`: 신앙강좌/성경퀴즈

### 친교/봉사 행사
- `친교행사`: 바자회/플리마켓
- `체육행사`: 야유회/체육대회
- `봉사활동`: 지역봉사/선교행사
- `전도행사`: 전도집회/노방전도

### 문화/미디어 행사
- `찬양행사`: 찬양집회/음악회
- `공연행사`: 연극/뮤지컬
- `미디어행사`: 방송/음향 박람회
- `전시행사`: 영상/사진 전시

### 기타 공동체 행사
- `창립기념`: 창립기념행사
- `절기행사`: 절기행사(성탄/부활절)
- `예식행사`: 결혼예배/장례예배
- `리더십`: 리더십수련회/임직식
- `기타`: 기타 행사

## 우선순위 시스템

- `urgent`: 긴급 - 당일이나 임박한 중요 공지
- `important`: 중요 - 미리 알려야 할 중요한 행사
- `normal`: 일반 - 일반적인 행사 소식

## 권한 관리

### 등록/수정/삭제 권한
- 관리자: 모든 행사 소식 관리 가능
- 목회자: 자신이 작성한 소식 및 자신의 교회 소식 관리 가능
- 일반 사용자: 자신이 작성한 소식만 관리 가능

### 조회 권한
- 모든 사용자: 모든 행사 소식 조회 가능

## 추가 기능

### 1. 알림 시스템 (추후 구현)
- 긴급 소식 등록 시 푸시 알림
- 관심 카테고리 소식 알림

### 2. 댓글 시스템 (추후 구현)
- 행사 소식에 대한 댓글 기능
- 문의 및 질문 가능

### 3. 첨부 파일 (추후 구현)
- 이미지 외 PDF 등 문서 첨부
- 행사 포스터 등 이미지 업로드

## 데이터 변환 규칙

### Backend → Frontend
```python
def transform_church_news_for_frontend(news):
    return {
        "id": news.id,
        "title": news.title,
        "content": news.content,
        "category": news.category,
        "priority": news.priority,
        "eventDate": news.event_date.isoformat() if news.event_date else None,
        "location": news.location,
        "organizer": news.organizer,
        "status": news.status,
        "views": news.views,
        "likes": news.likes,
        "comments": news.comments_count,
        "tags": news.tags or [],
        "images": news.images or [],
        "createdAt": news.created_at.isoformat() + "Z" if news.created_at else None,
        "updatedAt": news.updated_at.isoformat() + "Z" if news.updated_at else None,
        "author": news.author.name if news.author else "익명",
        "churchName": news.church.name if news.church else None
    }
```

### Frontend → Backend
- camelCase → snake_case 변환
- 날짜 문자열 → Date 객체 변환
- 빈 배열 → None 변환 (tags, images)

## 검색 및 필터링

### 전문 검색 (Full-text Search)
- 제목, 내용, 주최자에서 검색
- PostgreSQL의 full-text search 기능 활용

### 인덱스 최적화
```sql
-- 성능 최적화를 위한 인덱스
CREATE INDEX idx_church_news_category ON church_news(category);
CREATE INDEX idx_church_news_priority ON church_news(priority);
CREATE INDEX idx_church_news_status ON church_news(status);
CREATE INDEX idx_church_news_event_date ON church_news(event_date);
CREATE INDEX idx_church_news_created_at ON church_news(created_at);
```

## 오류 처리

### 일반적인 HTTP 상태 코드
- `200`: 성공
- `201`: 생성 성공
- `400`: 잘못된 요청 (필수 필드 누락 등)
- `401`: 인증 실패
- `403`: 권한 없음
- `404`: 리소스 없음
- `500`: 서버 오류

### 오류 응답 형식
```json
{
  "error": "VALIDATION_ERROR",
  "message": "제목은 필수 입력 항목입니다.",
  "details": {
    "field": "title",
    "code": "REQUIRED"
  }
}
```