# 🚨 백엔드 긴급 문제 해결 요청

## 📋 상황 요약

**GPT API 키 만료로 인한 채팅 기능 중단**
- 발생 시간: 2025-08-12 20:30
- 상태: **AI 채팅 기능 완전 중단 (500 Internal Server Error)**
- 원인: **기존 GPT API 키 삭제됨**

**추가 문제: 커밋 이후 프론트엔드 연결 실패**
- 커밋: `e4eb31bf33813856dd68f7bb908e40c0904d7812`, `2965af83f6bb3059ba105043ed1bc744c6b641d3`
- 현재 시간: 2025-01-12 18:54
- 상태: **원래 정상 작동하던 API가 접근 불가 상태**

---

## 🔥 발생 중인 오류들

### 1. **🚨 GPT API 키 만료 (최우선 해결)**
```
POST https://api.surfmind-team.com/api/v1/chat/messages 500 (Internal Server Error)
```
**원인:** 기존 GPT API 키가 삭제되어 OpenAI API 호출 실패

**즉시 조치 필요:**
```
새로운 GPT API 키로 환경변수 업데이트:
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
```

### 2. **CORS 정책 오류**
```
Access to XMLHttpRequest at 'https://api.surfmind-team.com/api/v1/auth/login/access-token' 
from origin 'http://localhost:3000' has been blocked by CORS policy: 
No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

### 2. **네트워크 연결 실패**
```
Failed to load resource: net::ERR_FAILED
- https://api.surfmind-team.com/api/v1/agents/
- https://api.surfmind-team.com/api/v1/auth/login/access-token
- https://api.surfmind-team.com/api/v1/church/gpt-config
- https://api.surfmind-team.com/api/v1/analytics/usage
```

### 3. **모든 API 엔드포인트 접근 불가**
- 로그인 API: `/auth/login/access-token`
- AI 에이전트 API: `/agents/`
- 분석 API: `/analytics/usage`
- 교회 설정 API: `/church/gpt-config`

---

## ✅ 즉시 확인 사항

### **1. 서버 실행 상태 확인**
```bash
# 서버 상태 체크
curl -I https://api.surfmind-team.com/health
curl -I https://api.surfmind-team.com/api/v1/health

# 응답 예상:
# HTTP/1.1 200 OK
# 또는 다른 정상 응답 코드
```

### **2. CORS 설정 확인**
**FastAPI main.py 또는 app.py에서 다음 설정이 유지되어 있는지 확인:**

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",           # 개발 환경
        "https://your-frontend-domain.com" # 운영 환경
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### **3. 최근 커밋 변경사항 검토**
**다음 파일들에서 변경된 내용 확인:**
- `main.py` 또는 `app.py` (CORS 설정)
- `requirements.txt` (새로운 의존성)
- `.env` 또는 환경변수 설정
- Docker 관련 설정 (docker-compose.yml, Dockerfile)

---

## 🔍 상세 디버깅 가이드

### **1. 로컬 서버 실행 테스트**
```bash
# 백엔드 서버 로컬 실행
uvicorn main:app --host 0.0.0.0 --port 8000 --reload

# 실행 후 로그에서 오류 메시지 확인
# 특히 다음과 같은 오류들:
# - ImportError
# - ModuleNotFoundError  
# - Database connection errors
# - Environment variable missing
```

### **2. 새로 추가된 의존성 확인**
**심방 신청/중보 기도 기능으로 인한 새로운 패키지들:**
```bash
# 의존성 설치 확인
pip install -r requirements.txt

# 또는 새로 추가된 패키지들 개별 설치
pip install sqlalchemy-utils  # 예시
pip install python-multipart  # 예시
```

### **3. 데이터베이스 마이그레이션 확인**
```bash
# Alembic 마이그레이션 상태 확인
alembic current
alembic history

# 새로운 테이블 생성 확인
# - pastoral_care_requests
# - prayer_requests  
# - prayer_participations
# - ai_agents 테이블의 church_data_sources 컬럼
```

### **4. 환경변수 확인**
**다음 환경변수들이 설정되어 있는지 확인:**
```bash
# 데이터베이스 연결
DATABASE_URL=postgresql://...

# 기타 필요한 환경변수들
SECRET_KEY=...
CORS_ORIGINS=http://localhost:3000,https://...
```

---

## 🚀 예상 해결 방법들

### **방법 1: CORS 설정 복구**
```python
# main.py에 다음 코드 추가/확인
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 임시로 모든 출처 허용 (개발용)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### **방법 2: 서버 재시작**
```bash
# 서버 프로세스 완전 종료 후 재시작
pkill -f uvicorn
uvicorn main:app --host 0.0.0.0 --port 8000
```

### **방법 3: 의존성 재설치**
```bash
# 가상환경 재생성
rm -rf venv
python -m venv venv
source venv/bin/activate  # Linux/Mac
pip install -r requirements.txt
```

### **방법 4: 임시 롤백 (긴급 시)**
```bash
# 이전 작동 버전으로 롤백
git log --oneline -10  # 최근 커밋 확인
git revert HEAD~2      # 최근 2개 커밋 되돌리기
# 또는
git reset --hard [이전_정상_커밋_해시]
```

---

## 📱 프론트엔드 상황

### **✅ 프론트엔드 구현 완료 사항**
1. **AI 에이전트 교회 데이터 소스 확장**
   - `pastoral_care_requests` (심방 신청) 추가
   - `prayer_requests` (중보 기도 요청) 추가

2. **새로운 API 서비스 구현**
   - `pastoralCareService`: 심방 신청 관리 API
   - `prayerRequestService`: 중보 기도 요청 API

3. **UI 업데이트 완료**
   - AI 에이전트 생성 시 새로운 데이터 소스 선택 가능
   - 심방 신청 관리 화면 API 연동
   - 중보 기도 요청 관리 화면 API 연동

### **⏳ 대기 중인 상황**
- **백엔드 서버 연결 복구 대기 중**
- 모든 프론트엔드 기능이 준비되어 있음
- 서버 문제만 해결되면 즉시 정상 작동 가능

---

## 🎯 우선순위 작업

### **1순위 (즉시 해결)**
- [ ] **GPT API 키 업데이트** (새로운 키로 교체)
- [ ] CORS 설정 확인 및 복구
- [ ] 서버 실행 상태 점검
- [ ] 기본 API 엔드포인트 접근 가능 확인
- [ ] **AI 에이전트 실제 데이터 연동 구현** (신규 추가)

### **2순위 (기능 확인)**
- [ ] 새로운 테이블 생성 확인
- [ ] AI 에이전트 API 업데이트 확인
- [ ] 심방 신청/중보 기도 API 엔드포인트 추가 확인

### **3순위 (최적화)**
- [ ] 에러 핸들링 개선
- [ ] 로깅 설정 추가
- [ ] 성능 최적화

---

## 📞 연락 사항

**문제 해결 후 확인 요청:**
1. 서버 정상 실행 확인
2. `http://localhost:3000` 에서 로그인 테스트
3. AI 에이전트 생성 시 새로운 데이터 소스 선택 테스트

**긴급 상황 시:**
- 임시 롤백 후 단계별 커밋 재적용 고려
- 개발 환경 전용 CORS 설정 임시 적용

---

---

## 🤖 **새로 발견된 문제: AI 에이전트 실제 데이터 연동 실패**

### **문제 상황**
- **에이전트**: "교인 명부를 조회합니다" (ID: 10)
- **질문**: "우리 교회 총 몇 명이지?"
- **실제 데이터**: 교인 100명 등록됨
- **AI 답변**: 0명이라고 잘못 응답

### **원인 분석**
**AI 에이전트가 `church_data_sources` 설정을 무시하고 실제 데이터베이스를 조회하지 않음**

### **💡 간단한 해결 방법 (기존 API 활용)**

**기존에 이미 구현된 API들을 재사용하면 됩니다!**
- `/members/` → 교인 데이터 조회
- `/announcements/` → 공지사항 조회
- `/attendances/` → 출석 현황 조회
- `/pastoral-care/requests` → 심방 신청 조회
- `/prayer-requests` → 중보 기도 요청 조회

#### **1. 채팅 메시지 처리 시 기존 API 호출**
```python
# /api/v1/chat/messages 엔드포인트에서 기존 API 로직 재사용
async def get_agent_context_data(agent_id: int, church_id: int) -> dict:
    """에이전트의 데이터 소스 설정에 따라 실제 교회 데이터 조회"""
    
    agent = await get_agent_by_id(agent_id)
    context_data = {}
    
    if not agent.church_data_sources:
        return context_data
    
    # 🔥 기존 API 로직 재사용 (DB 직접 쿼리 대신)
    
    # 교인 현황 데이터
    if "member_status" in agent.church_data_sources:
        # 기존 /members/ API 로직 재사용
        members = await get_members_for_church(church_id)  # 기존 함수 활용
        context_data["members"] = {
            "total_count": len(members),
            "active_count": len([m for m in members if m.status == 'active']),
            "male_count": len([m for m in members if m.gender == 'male']),
            "female_count": len([m for m in members if m.gender == 'female'])
        }
    
    # 출석 현황 데이터  
    if "attendance" in agent.church_data_sources:
        # 기존 /attendances/ API 로직 재사용
        attendances = await get_attendances_for_church(church_id, limit=10)  # 기존 함수 활용
        if attendances:
            total_attendance = sum([a.attendance_count for a in attendances])
            context_data["attendance"] = {
                "average": total_attendance // len(attendances),
                "recent_services": len(attendances)
            }
    
    # 공지사항 데이터
    if "announcements" in agent.church_data_sources:
        # 기존 /announcements/ API 로직 재사용
        announcements = await get_announcements_for_church(church_id, limit=5)  # 기존 함수 활용
        context_data["announcements"] = [
            {
                "title": ann.title,
                "content": ann.content[:200] + "..." if len(ann.content) > 200 else ann.content,
                "category": ann.category
            }
            for ann in announcements
        ]
    
    # 심방 신청 데이터 
    if "pastoral_care_requests" in agent.church_data_sources:
        # 기존 /pastoral-care/requests API 로직 재사용
        pastoral_requests = await get_pastoral_care_requests_for_church(church_id, limit=5)
        context_data["pastoral_care"] = {
            "pending_count": len([r for r in pastoral_requests if r.status == 'pending']),
            "recent_requests": pastoral_requests[:3]
        }
    
    # 중보 기도 요청 데이터
    if "prayer_requests" in agent.church_data_sources:
        # 기존 /prayer-requests API 로직 재사용  
        prayer_requests = await get_prayer_requests_for_church(church_id, limit=5)
        context_data["prayer_requests"] = {
            "active_count": len([r for r in prayer_requests if r.status == 'active']),
            "recent_requests": prayer_requests[:3]
        }
    
    return context_data
```

#### **2. 채팅 메시지 처리 API 수정**
```python
# /api/v1/chat/messages 엔드포인트 수정
@router.post("/messages")
async def send_chat_message(
    message_data: MessageCreate,
    current_user: User = Depends(get_current_user)
):
    try:
        # 기존 로직...
        
        # 🔥 새로 추가: 에이전트 실제 데이터 조회
        context_data = await get_agent_context_data(
            message_data.agent_id, 
            current_user.church_id
        )
        
        # 🔥 기존 API 데이터를 GPT 프롬프트에 포함
        system_prompt = f"""
당신은 {agent.name}입니다.
{agent.detailed_description}

다음은 현재 우리 교회의 실제 데이터입니다:
"""
        
        if context_data.get("members"):
            members = context_data["members"]
            system_prompt += f"- 총 교인 수: {members['total_count']}명\n"
            system_prompt += f"- 활동 교인: {members['active_count']}명\n"
            system_prompt += f"- 남성: {members['male_count']}명, 여성: {members['female_count']}명\n"
            
        if context_data.get("attendance"):
            att = context_data["attendance"]
            system_prompt += f"- 최근 평균 출석: {att['average']}명\n"
            
        if context_data.get("announcements"):
            system_prompt += "- 최근 공지사항:\n"
            for ann in context_data["announcements"]:
                system_prompt += f"  * [{ann['category']}] {ann['title']}\n"
                
        if context_data.get("pastoral_care"):
            pc = context_data["pastoral_care"]
            system_prompt += f"- 대기 중인 심방 신청: {pc['pending_count']}건\n"
            
        if context_data.get("prayer_requests"):
            pr = context_data["prayer_requests"]
            system_prompt += f"- 활성 기도 요청: {pr['active_count']}건\n"
        
        system_prompt += """
위의 실제 데이터를 기반으로 정확하고 구체적인 답변을 제공하세요.
데이터가 없는 경우에만 일반적인 답변을 하세요.
"""
        
        # OpenAI API 호출
        response = await openai_client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": message_data.content}
            ]
        )
        
        # 나머지 로직...
        
    except Exception as e:
        logger.error(f"Chat message error: {e}")
        raise HTTPException(status_code=500, detail="메시지 처리 실패")
```

#### **3. 데이터베이스 스키마 확인**
다음 테이블들이 존재하는지 확인하고 없으면 생성:
```sql
-- 교인 테이블
CREATE TABLE IF NOT EXISTS church_members (
    id INTEGER PRIMARY KEY,
    church_id INTEGER NOT NULL,
    name VARCHAR(100) NOT NULL,
    gender VARCHAR(10),
    status VARCHAR(20) DEFAULT 'active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 예배 서비스 테이블  
CREATE TABLE IF NOT EXISTS worship_services (
    id INTEGER PRIMARY KEY,
    church_id INTEGER NOT NULL,
    date DATE NOT NULL,
    time TIME,
    title VARCHAR(200),
    preacher VARCHAR(100),
    attendance_count INTEGER DEFAULT 0
);
```

### **테스트 방법**
1. 위 코드 구현 후 서버 재시작
2. 프론트엔드에서 "교인 명부를 조회합니다" 에이전트로 채팅
3. "우리 교회 총 몇 명이지?" 질문
4. **기대 결과**: "현재 우리 교회에는 총 100명의 교인이 등록되어 있습니다."

---

**⚡ 중요: 원래 정상 작동하던 시스템이므로, 최근 커밋에서 변경된 부분만 집중적으로 확인하면 빠른 해결 가능할 것으로 예상됩니다.**
