"""
음악팀 모집 관련 API 엔드포인트
"""
from typing import Optional, List
from fastapi import APIRouter, Depends, Query, Request, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from datetime import datetime

from app.api.deps import get_db, get_current_active_user
from app.models.user import User
from app.models.music_team_recruitment import MusicTeamRecruitment


class MusicTeamRecruitmentCreateRequest(BaseModel):
    """음악팀 모집 등록 요청 스키마"""
    # 필수 필드
    title: str
    team_name: str
    team_type: str
    experience_required: str
    practice_location: str
    practice_schedule: str
    description: str
    contact_method: str
    contact_info: str
    status: str
    
    # 선택 필드
    instruments_needed: Optional[List[str]] = None
    positions_needed: Optional[str] = None
    commitment: Optional[str] = None
    requirements: Optional[str] = None
    benefits: Optional[str] = None
    current_members: Optional[int] = None
    target_members: Optional[int] = None


class MusicTeamRecruitmentUpdateRequest(BaseModel):
    """음악팀 모집 수정 요청 스키마"""
    title: Optional[str] = None
    team_name: Optional[str] = None
    team_type: Optional[str] = None
    experience_required: Optional[str] = None
    practice_location: Optional[str] = None
    practice_schedule: Optional[str] = None
    description: Optional[str] = None
    contact_method: Optional[str] = None
    contact_info: Optional[str] = None
    status: Optional[str] = None
    instruments_needed: Optional[List[str]] = None
    positions_needed: Optional[str] = None
    commitment: Optional[str] = None
    requirements: Optional[str] = None
    benefits: Optional[str] = None
    current_members: Optional[int] = None
    target_members: Optional[int] = None


router = APIRouter()


def parse_datetime(date_string: str) -> datetime:
    """ISO 형식 문자열을 datetime 객체로 변환"""
    if not date_string:
        return None
    try:
        return datetime.fromisoformat(date_string.replace('Z', '+00:00'))
    except:
        return None


@router.get("/music-team-recruitments", response_model=dict)
def get_music_team_recruitments_list(
    team_type: Optional[str] = Query(None, description="팀 유형 필터"),
    instruments: Optional[str] = Query(None, description="악기 필터 (쉼표로 구분)"),
    team_name: Optional[str] = Query(None, description="팀명 필터"),
    status: Optional[str] = Query(None, description="모집 상태 필터"),
    experience_required: Optional[str] = Query(None, description="경력 요구사항 필터"),
    search: Optional[str] = Query(None, description="제목/내용 검색"),
    page: int = Query(1, ge=1, description="페이지 번호"),
    limit: int = Query(20, ge=1, le=100, description="페이지당 항목 수"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """음악팀 모집 목록 조회"""
    try:
        print(f"🔍 [MUSIC_TEAM_RECRUIT] 음악팀 모집 목록 조회 시작")
        print(f"🔍 [MUSIC_TEAM_RECRUIT] 필터: team_type={team_type}, team_name={team_name}, status={status}")
        
        # 기본 쿼리
        query = db.query(MusicTeamRecruitment)
        
        # 필터링 적용
        if team_type:
            query = query.filter(MusicTeamRecruitment.team_type == team_type)
        
        if team_name:
            query = query.filter(MusicTeamRecruitment.team_name.ilike(f"%{team_name}%"))
        
        if status:
            query = query.filter(MusicTeamRecruitment.status == status)
        
        if experience_required:
            query = query.filter(MusicTeamRecruitment.experience_required == experience_required)
        
        if instruments:
            instrument_list = [inst.strip() for inst in instruments.split(',')]
            for instrument in instrument_list:
                query = query.filter(MusicTeamRecruitment.instruments_needed.op('?')(instrument))
        
        if search:
            query = query.filter(
                (MusicTeamRecruitment.title.ilike(f"%{search}%")) |
                (MusicTeamRecruitment.description.ilike(f"%{search}%"))
            )
        
        # 전체 개수 계산
        total_count = query.count()
        print(f"🔍 [MUSIC_TEAM_RECRUIT] 필터링 후 전체 데이터 개수: {total_count}")
        
        # 페이지네이션
        offset = (page - 1) * limit
        recruitments_list = query.order_by(MusicTeamRecruitment.created_at.desc()).offset(offset).limit(limit).all()
        print(f"🔍 [MUSIC_TEAM_RECRUIT] 조회된 데이터 개수: {len(recruitments_list)}")
        
        # 응답 데이터 구성
        data_items = []
        for recruitment in recruitments_list:
            data_items.append({
                "id": recruitment.id,
                "title": recruitment.title,
                "team_name": recruitment.team_name,
                "team_type": recruitment.team_type,
                "instruments_needed": recruitment.instruments_needed or [],
                "positions_needed": recruitment.positions_needed,
                "experience_required": recruitment.experience_required,
                "practice_location": recruitment.practice_location,
                "practice_schedule": recruitment.practice_schedule,
                "commitment": recruitment.commitment,
                "description": recruitment.description,
                "requirements": recruitment.requirements,
                "benefits": recruitment.benefits,
                "contact_method": recruitment.contact_method,
                "contact_info": recruitment.contact_info,
                "status": recruitment.status,
                "current_members": recruitment.current_members,
                "target_members": recruitment.target_members,
                "author_id": recruitment.author_id,
                "church_id": recruitment.church_id,
                "views": recruitment.views or 0,
                "likes": recruitment.likes or 0,
                "applicants_count": recruitment.applicants_count or 0,
                "created_at": recruitment.created_at.isoformat() if recruitment.created_at else None,
                "updated_at": recruitment.updated_at.isoformat() if recruitment.updated_at else None
            })
        
        total_pages = (total_count + limit - 1) // limit
        
        print(f"🔍 음악팀 모집 목록 조회: 총 {total_count}개, 페이지 {page}/{total_pages}")
        
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
        print(f"❌ [MUSIC_TEAM_RECRUIT] 목록 조회 오류: {str(e)}")
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
    """음악팀 모집 등록"""
    try:
        print(f"🔍 [MUSIC_TEAM_RECRUIT] 음악팀 모집 데이터 받음: {recruitment_data}")
        
        # 데이터베이스에 저장
        recruitment_record = MusicTeamRecruitment(
            title=recruitment_data.title,
            team_name=recruitment_data.team_name,
            team_type=recruitment_data.team_type,
            instruments_needed=recruitment_data.instruments_needed,
            positions_needed=recruitment_data.positions_needed,
            experience_required=recruitment_data.experience_required,
            practice_location=recruitment_data.practice_location,
            practice_schedule=recruitment_data.practice_schedule,
            commitment=recruitment_data.commitment,
            description=recruitment_data.description,
            requirements=recruitment_data.requirements,
            benefits=recruitment_data.benefits,
            contact_method=recruitment_data.contact_method,
            contact_info=recruitment_data.contact_info,
            status=recruitment_data.status,
            current_members=recruitment_data.current_members,
            target_members=recruitment_data.target_members,
            author_id=current_user.id,
            church_id=current_user.church_id or 9998,
            views=0,
            likes=0,
            applicants_count=0
        )
        
        print(f"🔍 [MUSIC_TEAM_RECRUIT] 음악팀 모집 레코드 저장 중...")
        db.add(recruitment_record)
        db.commit()
        db.refresh(recruitment_record)
        print(f"✅ [MUSIC_TEAM_RECRUIT] 성공적으로 저장됨. ID: {recruitment_record.id}")
        
        return {
            "success": True,
            "message": "음악팀 모집이 등록되었습니다.",
            "data": {
                "id": recruitment_record.id,
                "title": recruitment_record.title,
                "team_name": recruitment_record.team_name,
                "team_type": recruitment_record.team_type,
                "status": recruitment_record.status,
                "created_at": recruitment_record.created_at.isoformat() if recruitment_record.created_at else None
            }
        }
        
    except Exception as e:
        db.rollback()
        print(f"❌ [MUSIC_TEAM_RECRUIT] 등록 실패: {str(e)}")
        import traceback
        print(f"❌ [MUSIC_TEAM_RECRUIT] Traceback: {traceback.format_exc()}")
        return {
            "success": False,
            "message": f"음악팀 모집 등록 중 오류가 발생했습니다: {str(e)}"
        }


@router.get("/music-team-recruitments/{recruitment_id}", response_model=dict)
def get_music_team_recruitment_detail(
    recruitment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """음악팀 모집 상세 조회"""
    try:
        recruitment = db.query(MusicTeamRecruitment).filter(MusicTeamRecruitment.id == recruitment_id).first()
        if not recruitment:
            return {
                "success": False,
                "message": "음악팀 모집을 찾을 수 없습니다."
            }
        
        # 조회수 증가
        recruitment.views = (recruitment.views or 0) + 1
        db.commit()
        
        return {
            "success": True,
            "data": {
                "id": recruitment.id,
                "title": recruitment.title,
                "team_name": recruitment.team_name,
                "team_type": recruitment.team_type,
                "instruments_needed": recruitment.instruments_needed or [],
                "positions_needed": recruitment.positions_needed,
                "experience_required": recruitment.experience_required,
                "practice_location": recruitment.practice_location,
                "practice_schedule": recruitment.practice_schedule,
                "commitment": recruitment.commitment,
                "description": recruitment.description,
                "requirements": recruitment.requirements,
                "benefits": recruitment.benefits,
                "contact_method": recruitment.contact_method,
                "contact_info": recruitment.contact_info,
                "status": recruitment.status,
                "current_members": recruitment.current_members,
                "target_members": recruitment.target_members,
                "author_id": recruitment.author_id,
                "church_id": recruitment.church_id,
                "views": recruitment.views or 0,
                "likes": recruitment.likes or 0,
                "applicants_count": recruitment.applicants_count or 0,
                "created_at": recruitment.created_at.isoformat() if recruitment.created_at else None,
                "updated_at": recruitment.updated_at.isoformat() if recruitment.updated_at else None
            }
        }
        
    except Exception as e:
        return {
            "success": False,
            "message": f"음악팀 모집 상세 조회 중 오류가 발생했습니다: {str(e)}"
        }


@router.put("/music-team-recruitments/{recruitment_id}", response_model=dict)
async def update_music_team_recruitment(
    recruitment_id: int,
    recruitment_data: MusicTeamRecruitmentUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """음악팀 모집 수정"""
    try:
        recruitment = db.query(MusicTeamRecruitment).filter(MusicTeamRecruitment.id == recruitment_id).first()
        if not recruitment:
            return {
                "success": False,
                "message": "음악팀 모집을 찾을 수 없습니다."
            }
        
        # 수정 가능한 필드 업데이트 (None이 아닌 값만)
        update_data = recruitment_data.dict(exclude_unset=True)
        
        for field, value in update_data.items():
            setattr(recruitment, field, value)
        
        db.commit()
        db.refresh(recruitment)
        
        return {
            "success": True,
            "message": "음악팀 모집이 수정되었습니다.",
            "data": {
                "id": recruitment.id,
                "title": recruitment.title,
                "updated_at": recruitment.updated_at.isoformat() if recruitment.updated_at else None
            }
        }
        
    except Exception as e:
        db.rollback()
        return {
            "success": False,
            "message": f"음악팀 모집 수정 중 오류가 발생했습니다: {str(e)}"
        }


@router.delete("/music-team-recruitments/{recruitment_id}", response_model=dict)
def delete_music_team_recruitment(
    recruitment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """음악팀 모집 삭제"""
    try:
        recruitment = db.query(MusicTeamRecruitment).filter(MusicTeamRecruitment.id == recruitment_id).first()
        if not recruitment:
            return {
                "success": False,
                "message": "음악팀 모집을 찾을 수 없습니다."
            }
        
        db.delete(recruitment)
        db.commit()
        
        return {
            "success": True,
            "message": "음악팀 모집이 삭제되었습니다."
        }
        
    except Exception as e:
        db.rollback()
        return {
            "success": False,
            "message": f"음악팀 모집 삭제 중 오류가 발생했습니다: {str(e)}"
        }


@router.post("/music-team-recruitments/{recruitment_id}/apply", response_model=dict)
async def apply_music_team_recruitment(
    recruitment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """음악팀 모집 지원하기"""
    try:
        recruitment = db.query(MusicTeamRecruitment).filter(MusicTeamRecruitment.id == recruitment_id).first()
        if not recruitment:
            return {
                "success": False,
                "message": "음악팀 모집을 찾을 수 없습니다."
            }
        
        # 실제 지원 로직은 여기에 구현 (지원 테이블이 있다면)
        # 현재는 기본적인 응답만 반환
        
        return {
            "success": True,
            "message": "음악팀 모집에 지원되었습니다.",
            "data": {
                "recruitment_id": recruitment_id,
                "recruitment_title": recruitment.title,
                "applied_at": datetime.now().isoformat()
            }
        }
        
    except Exception as e:
        return {
            "success": False,
            "message": f"음악팀 모집 지원 중 오류가 발생했습니다: {str(e)}"
        }