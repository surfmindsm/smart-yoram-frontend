"""
행사팀 모집 관련 API 엔드포인트
"""
from typing import Optional, List
from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.api.deps import get_db, get_current_active_user
from app.models.user import User
from app.models.music_team_recruitment import MusicTeamRecruitment


class MusicTeamRecruitmentCreateRequest(BaseModel):
    """행사팀 모집 등록 요청 스키마"""
    # 기본 정보 (필수)
    title: str  # 모집 제목 (필수)
    church_name: str  # 교회명 (필수) 
    recruitment_type: str  # 행사 유형 (필수) - 주일예배, 수요예배, 새벽예배, 특별예배, 부흥회, 찬양집회, 결혼식, 장례식, 수련회, 콘서트, 기타
    
    # 모집 상세 (필수)
    instruments: List[str]  # 모집 악기/포지션 배열 (필수) - 피아노, 키보드, 오르간, 기타, 일렉기타, 베이스, 드럼, 바이올린, 첼로, 플룻, 색소폰, 트럼펫, 보컬, 기타
    schedule: Optional[str] = None  # 일정 정보 - "행사일: YYYY-MM-DD, 리허설: 매주 토요일 오후 2시" 형태
    location: Optional[str] = None  # 장소
    
    # 상세 내용
    description: Optional[str] = None  # 상세 설명
    requirements: Optional[str] = None  # 자격 요건 - 쉼표로 구분된 문자열
    compensation: Optional[str] = None  # 보상/사례비
    
    # 연락처 정보 (분리된 형태)
    contact_phone: str  # 담당자 연락처 (필수) - 전화번호
    contact_email: Optional[str] = None  # 이메일 (선택)
    
    # 상태
    status: Optional[str] = "open"  # 기본값: 'open' (모집중)
    applications: Optional[int] = 0  # 지원자 수 (기본값: 0)


class MusicTeamRecruitmentResponse(BaseModel):
    """행사팀 모집 응답 스키마"""
    id: int
    title: str
    church_name: str
    recruitment_type: str
    instruments: List[str]
    schedule: Optional[str]
    location: Optional[str]
    description: Optional[str]
    requirements: Optional[str]
    compensation: Optional[str]
    contact_phone: str
    contact_email: Optional[str]
    contact_info: Optional[str]  # 백워드 호환성
    status: str
    applications: int
    views: int
    likes: int
    created_at: str
    updated_at: Optional[str]
    author_id: int
    user_name: str
    church_id: int


router = APIRouter()


def parse_contact_info(contact_info: str) -> tuple[str, str]:
    """연락처 정보를 전화번호와 이메일로 분리"""
    phone = ""
    email = ""
    
    if contact_info:
        parts = contact_info.split(" | ")
        for part in parts:
            if part.startswith("전화: "):
                phone = part.replace("전화: ", "")
            elif part.startswith("이메일: "):
                email = part.replace("이메일: ", "")
    
    return phone, email


def parse_instruments(instruments_str: str) -> List[str]:
    """악기 문자열을 배열로 변환"""
    if not instruments_str:
        return []
    return [instrument.strip() for instrument in instruments_str.split(",") if instrument.strip()]


@router.get("/music-team-recruitments", response_model=dict)
def get_music_team_recruitments_list(
    recruitment_type: Optional[str] = Query(None, description="모집 유형 필터"),
    instruments: Optional[str] = Query(None, description="악기 필터"),
    status: Optional[str] = Query(None, description="상태 필터"),
    search: Optional[str] = Query(None, description="제목/내용 검색"),
    page: int = Query(1, ge=1, description="페이지 번호"),
    limit: int = Query(20, ge=1, le=100, description="페이지당 항목 수"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """행사팀 모집 목록 조회 - 실제 데이터베이스에서 조회"""
    try:
        print(f"🔍 [MUSIC_TEAM_RECRUITMENTS] 행사팀 모집 목록 조회 시작")
        print(f"🔍 [MUSIC_TEAM_RECRUITMENTS] 필터: recruitment_type={recruitment_type}, instruments={instruments}, status={status}")
        
        # 기본 쿼리 - User 테이블과 LEFT JOIN
        query = db.query(MusicTeamRecruitment, User.full_name).outerjoin(
            User, MusicTeamRecruitment.author_id == User.id
        )
        
        # 필터링 적용
        if status and status != 'all':
            query = query.filter(MusicTeamRecruitment.status == status)
            print(f"🔍 [MUSIC_TEAM_RECRUITMENTS] 상태 필터 적용: {status}")
        
        if recruitment_type:
            query = query.filter(MusicTeamRecruitment.recruitment_type == recruitment_type)
            print(f"🔍 [MUSIC_TEAM_RECRUITMENTS] 모집 유형 필터 적용: {recruitment_type}")
        
        if instruments:
            # 악기 필터링 - JSON 배열 검색
            query = query.filter(MusicTeamRecruitment.instruments.contains(instruments))
            print(f"🔍 [MUSIC_TEAM_RECRUITMENTS] 악기 필터 적용: {instruments}")
        
        if search:
            query = query.filter(
                (MusicTeamRecruitment.title.ilike(f"%{search}%")) |
                (MusicTeamRecruitment.description.ilike(f"%{search}%")) |
                (MusicTeamRecruitment.church_name.ilike(f"%{search}%"))
            )
        
        # 전체 개수 계산
        total_count = query.count()
        print(f"🔍 [MUSIC_TEAM_RECRUITMENTS] 필터링 후 전체 데이터 개수: {total_count}")
        
        # 페이지네이션
        offset = (page - 1) * limit
        recruitments_list = query.order_by(MusicTeamRecruitment.created_at.desc()).offset(offset).limit(limit).all()
        print(f"🔍 [MUSIC_TEAM_RECRUITMENTS] 조회된 데이터 개수: {len(recruitments_list)}")
        
        # 응답 데이터 구성
        data_items = []
        for recruitment, user_full_name in recruitments_list:
            # 연락처 정보를 전화번호와 이메일로 분리
            contact_phone, contact_email = parse_contact_info(recruitment.contact_info or "")
            
            # 악기 리스트 파싱
            instruments_list = parse_instruments(recruitment.instruments or "")
            
            data_items.append({
                "id": recruitment.id,
                "title": recruitment.title,
                "church_name": recruitment.church_name,
                "recruitment_type": recruitment.recruitment_type,
                "instruments": instruments_list,
                "schedule": recruitment.schedule,
                "location": recruitment.location,
                "description": recruitment.description,
                "requirements": recruitment.requirements,
                "compensation": recruitment.compensation,
                "contact_phone": contact_phone,
                "contact_email": contact_email,
                "contact_info": recruitment.contact_info,  # 백워드 호환성
                "status": recruitment.status,
                "applications": recruitment.applications or 0,
                "views": recruitment.views or 0,
                "likes": recruitment.likes or 0,
                "created_at": recruitment.created_at.isoformat() if recruitment.created_at else None,
                "updated_at": recruitment.updated_at.isoformat() if recruitment.updated_at else None,
                "author_id": recruitment.author_id,
                "user_name": user_full_name or "익명",
                "church_id": recruitment.church_id
            })
        
        total_pages = (total_count + limit - 1) // limit
        
        print(f"🔍 행사팀 모집 목록 조회: 총 {total_count}개, 페이지 {page}/{total_pages}")
        
        return {
            "success": True,
            "data": data_items,
            "pagination": {
                "current_page": page,
                "total_pages": total_pages,
                "total_count": total_count,
                "per_page": limit,
                "has_next": page < total_pages,
                "has_prev": page > 1
            }
        }
        
    except Exception as e:
        # 에러가 발생해도 기본 구조는 유지
        print(f"❌ [MUSIC_TEAM_RECRUITMENTS] 오류: {str(e)}")
        return {
            "success": True,
            "data": [],
            "pagination": {
                "current_page": page,
                "total_pages": 0,
                "total_count": 0,
                "per_page": limit,
                "has_next": False,
                "has_prev": False
            }
        }


@router.post("/music-team-recruitments", response_model=dict)
async def create_music_team_recruitment(
    request: Request,
    recruitment_data: MusicTeamRecruitmentCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """행사팀 모집 등록 - 실제 데이터베이스 저장"""
    try:
        print(f"🔍 [MUSIC_TEAM_RECRUITMENT] Music team recruitment data received: {recruitment_data}")
        print(f"🔍 [MUSIC_TEAM_RECRUITMENT] User ID: {current_user.id}, Church ID: {current_user.church_id}")
        print(f"🔍 [MUSIC_TEAM_RECRUITMENT] User name: {current_user.full_name}")
        
        # contact_info를 phone과 email 조합으로 생성
        contact_parts = [f"전화: {recruitment_data.contact_phone}"]
        if recruitment_data.contact_email:
            contact_parts.append(f"이메일: {recruitment_data.contact_email}")
        combined_contact_info = " | ".join(contact_parts)
        
        # 악기 배열을 쉼표로 구분된 문자열로 변환
        instruments_str = ", ".join(recruitment_data.instruments) if recruitment_data.instruments else ""
        
        recruitment_record = MusicTeamRecruitment(
            title=recruitment_data.title,
            church_name=recruitment_data.church_name,
            recruitment_type=recruitment_data.recruitment_type,
            instruments=instruments_str,  # 문자열로 저장
            schedule=recruitment_data.schedule,
            location=recruitment_data.location,
            description=recruitment_data.description,
            requirements=recruitment_data.requirements,
            compensation=recruitment_data.compensation,
            contact_info=combined_contact_info,  # 조합된 연락처 정보
            status=recruitment_data.status or "open",
            applications=recruitment_data.applications or 0,
            author_id=current_user.id,
            church_id=current_user.church_id or 9998,  # 커뮤니티 기본값
            views=0,
            likes=0
        )
        
        print(f"🔍 [MUSIC_TEAM_RECRUITMENT] About to save music team recruitment record...")
        db.add(recruitment_record)
        db.commit()
        db.refresh(recruitment_record)
        print(f"✅ [MUSIC_TEAM_RECRUITMENT] Successfully saved music team recruitment with ID: {recruitment_record.id}")
        
        # 저장 후 검증 - 실제로 DB에서 다시 조회
        saved_record = db.query(MusicTeamRecruitment).filter(MusicTeamRecruitment.id == recruitment_record.id).first()
        if saved_record:
            print(f"✅ [MUSIC_TEAM_RECRUITMENT] Verification successful: Record exists in DB with ID {saved_record.id}")
        else:
            print(f"❌ [MUSIC_TEAM_RECRUITMENT] Verification failed: Record not found in DB!")
        
        # 악기 리스트로 다시 파싱
        instruments_list = parse_instruments(recruitment_record.instruments or "")
        
        return {
            "success": True,
            "message": "행사팀 모집이 등록되었습니다.",
            "data": {
                "id": recruitment_record.id,
                "title": recruitment_record.title,
                "church_name": recruitment_record.church_name,
                "recruitment_type": recruitment_record.recruitment_type,
                "instruments": instruments_list,
                "schedule": recruitment_record.schedule,
                "location": recruitment_record.location,
                "description": recruitment_record.description,
                "requirements": recruitment_record.requirements,
                "compensation": recruitment_record.compensation,
                "contact_phone": recruitment_data.contact_phone,
                "contact_email": recruitment_data.contact_email,
                "contact_info": recruitment_record.contact_info,  # 백워드 호환성
                "status": recruitment_record.status,
                "applications": recruitment_record.applications,
                "views": recruitment_record.views,
                "likes": recruitment_record.likes,
                "author_id": recruitment_record.author_id,
                "user_name": current_user.full_name or "익명",
                "church_id": recruitment_record.church_id,
                "created_at": recruitment_record.created_at.isoformat() if recruitment_record.created_at else None
            }
        }
        
    except Exception as e:
        db.rollback()
        print(f"❌ [MUSIC_TEAM_RECRUITMENT] 행사팀 모집 등록 실패: {str(e)}")
        import traceback
        print(f"❌ [MUSIC_TEAM_RECRUITMENT] Traceback: {traceback.format_exc()}")
        return {
            "success": False,
            "message": f"행사팀 모집 등록 중 오류가 발생했습니다: {str(e)}"
        }


@router.get("/music-team-recruitments/{recruitment_id}", response_model=dict)
def get_music_team_recruitment_detail(
    recruitment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """행사팀 모집 상세 조회 - 실제 데이터베이스에서 조회"""
    try:
        recruitment = db.query(MusicTeamRecruitment).filter(MusicTeamRecruitment.id == recruitment_id).first()
        if not recruitment:
            return {
                "success": False,
                "message": "행사팀 모집을 찾을 수 없습니다."
            }
        
        # 조회수 증가
        recruitment.views = (recruitment.views or 0) + 1
        db.commit()
        
        # 연락처 정보를 전화번호와 이메일로 분리
        contact_phone, contact_email = parse_contact_info(recruitment.contact_info or "")
        
        # 악기 리스트 파싱
        instruments_list = parse_instruments(recruitment.instruments or "")
        
        # 작성자 정보 조회
        author = db.query(User).filter(User.id == recruitment.author_id).first()
        author_name = author.full_name if author else "익명"
        
        return {
            "success": True,
            "data": {
                "id": recruitment.id,
                "title": recruitment.title,
                "church_name": recruitment.church_name,
                "recruitment_type": recruitment.recruitment_type,
                "instruments": instruments_list,
                "schedule": recruitment.schedule,
                "location": recruitment.location,
                "description": recruitment.description,
                "requirements": recruitment.requirements,
                "compensation": recruitment.compensation,
                "contact_phone": contact_phone,
                "contact_email": contact_email,
                "contact_info": recruitment.contact_info,  # 백워드 호환성
                "status": recruitment.status,
                "applications": recruitment.applications or 0,
                "views": recruitment.views or 0,
                "likes": recruitment.likes or 0,
                "created_at": recruitment.created_at.isoformat() if recruitment.created_at else None,
                "updated_at": recruitment.updated_at.isoformat() if recruitment.updated_at else None,
                "author_id": recruitment.author_id,
                "user_name": author_name,
                "church_id": recruitment.church_id
            }
        }
        
    except Exception as e:
        return {
            "success": False,
            "message": f"행사팀 모집 상세 조회 중 오류가 발생했습니다: {str(e)}"
        }


@router.put("/music-team-recruitments/{recruitment_id}", response_model=dict)
async def update_music_team_recruitment(
    recruitment_id: int,
    recruitment_data: MusicTeamRecruitmentCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """행사팀 모집 수정"""
    try:
        recruitment = db.query(MusicTeamRecruitment).filter(MusicTeamRecruitment.id == recruitment_id).first()
        if not recruitment:
            return {
                "success": False,
                "message": "행사팀 모집을 찾을 수 없습니다."
            }
        
        # 작성자만 수정 가능
        if recruitment.author_id != current_user.id:
            return {
                "success": False,
                "message": "수정 권한이 없습니다."
            }
        
        # contact_info를 phone과 email 조합으로 생성
        contact_parts = [f"전화: {recruitment_data.contact_phone}"]
        if recruitment_data.contact_email:
            contact_parts.append(f"이메일: {recruitment_data.contact_email}")
        combined_contact_info = " | ".join(contact_parts)
        
        # 악기 배열을 쉼표로 구분된 문자열로 변환
        instruments_str = ", ".join(recruitment_data.instruments) if recruitment_data.instruments else ""
        
        # 데이터 업데이트
        recruitment.title = recruitment_data.title
        recruitment.church_name = recruitment_data.church_name
        recruitment.recruitment_type = recruitment_data.recruitment_type
        recruitment.instruments = instruments_str
        recruitment.schedule = recruitment_data.schedule
        recruitment.location = recruitment_data.location
        recruitment.description = recruitment_data.description
        recruitment.requirements = recruitment_data.requirements
        recruitment.compensation = recruitment_data.compensation
        recruitment.contact_info = combined_contact_info
        recruitment.status = recruitment_data.status or "open"
        
        db.commit()
        
        return {
            "success": True,
            "message": "행사팀 모집이 수정되었습니다."
        }
        
    except Exception as e:
        db.rollback()
        return {
            "success": False,
            "message": f"행사팀 모집 수정 중 오류가 발생했습니다: {str(e)}"
        }


@router.delete("/music-team-recruitments/{recruitment_id}", response_model=dict)
def delete_music_team_recruitment(
    recruitment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """행사팀 모집 삭제"""
    try:
        recruitment = db.query(MusicTeamRecruitment).filter(MusicTeamRecruitment.id == recruitment_id).first()
        if not recruitment:
            return {
                "success": False,
                "message": "행사팀 모집을 찾을 수 없습니다."
            }
        
        # 작성자만 삭제 가능
        if recruitment.author_id != current_user.id:
            return {
                "success": False,
                "message": "삭제 권한이 없습니다."
            }
        
        db.delete(recruitment)
        db.commit()
        
        return {
            "success": True,
            "message": "행사팀 모집이 삭제되었습니다."
        }
        
    except Exception as e:
        db.rollback()
        return {
            "success": False,
            "message": f"행사팀 모집 삭제 중 오류가 발생했습니다: {str(e)}"
        }


@router.post("/music-team-recruitments/{recruitment_id}/apply", response_model=dict)
async def apply_music_team_recruitment(
    recruitment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """행사팀 모집 지원하기"""
    try:
        recruitment = db.query(MusicTeamRecruitment).filter(MusicTeamRecruitment.id == recruitment_id).first()
        if not recruitment:
            return {
                "success": False,
                "message": "행사팀 모집을 찾을 수 없습니다."
            }
        
        if recruitment.status != "open":
            return {
                "success": False,
                "message": "현재 모집이 마감되었습니다."
            }
        
        # 지원자 수 증가
        recruitment.applications = (recruitment.applications or 0) + 1
        db.commit()
        
        return {
            "success": True,
            "message": "지원이 완료되었습니다."
        }
        
    except Exception as e:
        db.rollback()
        return {
            "success": False,
            "message": f"지원 중 오류가 발생했습니다: {str(e)}"
        }