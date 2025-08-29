// 교회 데이터를 사용자 친화적으로 포맷팅하는 유틸리티

export function formatChurchData(data: any[]): string {
  if (!data || data.length === 0) {
    return '조회된 데이터가 없습니다.';
  }

  try {
    // 데이터 타입별 포맷팅
    const formattedSections: string[] = [];

    data.forEach((item, index) => {
      if (typeof item === 'object' && item !== null) {
        // 성도 정보 포맷팅
        if (item.name || item.member_name) {
          const memberInfo = formatMemberInfo(item);
          if (memberInfo) formattedSections.push(memberInfo);
        }
        // 심방 정보 포맷팅
        else if (item.visit_date || item.pastoral_visit_date) {
          const visitInfo = formatVisitInfo(item);
          if (visitInfo) formattedSections.push(visitInfo);
        }
        // 기도 요청 포맷팅
        else if (item.prayer_request || item.request_content) {
          const prayerInfo = formatPrayerInfo(item);
          if (prayerInfo) formattedSections.push(prayerInfo);
        }
        // 공지사항 포맷팅
        else if (item.title || item.announcement_title) {
          const announcementInfo = formatAnnouncementInfo(item);
          if (announcementInfo) formattedSections.push(announcementInfo);
        }
        // 출석 정보 포맷팅
        else if (item.attendance_date || item.service_date) {
          const attendanceInfo = formatAttendanceInfo(item);
          if (attendanceInfo) formattedSections.push(attendanceInfo);
        }
        // 일반 객체 포맷팅
        else {
          const genericInfo = formatGenericObject(item, index);
          if (genericInfo) formattedSections.push(genericInfo);
        }
      } else {
        // 단순 값 포맷팅
        formattedSections.push(`📋 **항목 ${index + 1}**: ${String(item)}`);
      }
    });

    return formattedSections.join('\n\n');
  } catch (error) {
    console.error('교회 데이터 포맷팅 오류:', error);
    return `조회된 데이터 (${data.length}개 항목):\n\n${JSON.stringify(data, null, 2)}`;
  }
}

function formatMemberInfo(item: any): string {
  const sections: string[] = [];
  
  sections.push(`👤 **성도 정보**`);
  
  if (item.name || item.member_name) {
    sections.push(`• 이름: ${item.name || item.member_name}`);
  }
  
  if (item.phone || item.phone_number) {
    sections.push(`• 연락처: ${item.phone || item.phone_number}`);
  }
  
  if (item.address) {
    sections.push(`• 주소: ${item.address}`);
  }
  
  if (item.birth_date || item.birthday) {
    sections.push(`• 생년월일: ${item.birth_date || item.birthday}`);
  }
  
  if (item.position || item.church_position) {
    sections.push(`• 직분: ${item.position || item.church_position}`);
  }
  
  if (item.department || item.ministry) {
    sections.push(`• 소속: ${item.department || item.ministry}`);
  }
  
  return sections.join('\n');
}

function formatVisitInfo(item: any): string {
  const sections: string[] = [];
  
  sections.push(`🏠 **심방 정보**`);
  
  if (item.visit_date || item.pastoral_visit_date) {
    sections.push(`• 심방 날짜: ${item.visit_date || item.pastoral_visit_date}`);
  }
  
  if (item.member_name || item.visited_member) {
    sections.push(`• 심방 대상: ${item.member_name || item.visited_member}`);
  }
  
  if (item.pastor_name || item.visiting_pastor) {
    sections.push(`• 심방 목사: ${item.pastor_name || item.visiting_pastor}`);
  }
  
  if (item.visit_purpose || item.purpose) {
    sections.push(`• 심방 목적: ${item.visit_purpose || item.purpose}`);
  }
  
  if (item.visit_notes || item.notes) {
    sections.push(`• 심방 내용: ${item.visit_notes || item.notes}`);
  }
  
  return sections.join('\n');
}

function formatPrayerInfo(item: any): string {
  const sections: string[] = [];
  
  sections.push(`🙏 **기도 요청**`);
  
  if (item.requester_name || item.member_name) {
    sections.push(`• 요청자: ${item.requester_name || item.member_name}`);
  }
  
  if (item.prayer_request || item.request_content) {
    sections.push(`• 기도 제목: ${item.prayer_request || item.request_content}`);
  }
  
  if (item.request_date || item.created_date) {
    sections.push(`• 요청일: ${item.request_date || item.created_date}`);
  }
  
  if (item.prayer_type || item.category) {
    sections.push(`• 분류: ${item.prayer_type || item.category}`);
  }
  
  if (item.status) {
    sections.push(`• 상태: ${item.status}`);
  }
  
  return sections.join('\n');
}

function formatAnnouncementInfo(item: any): string {
  const sections: string[] = [];
  
  sections.push(`📢 **공지사항**`);
  
  if (item.title || item.announcement_title) {
    sections.push(`• 제목: ${item.title || item.announcement_title}`);
  }
  
  if (item.content || item.announcement_content) {
    const content = (item.content || item.announcement_content).slice(0, 100);
    sections.push(`• 내용: ${content}${content.length >= 100 ? '...' : ''}`);
  }
  
  if (item.announcement_date || item.created_date) {
    sections.push(`• 공지일: ${item.announcement_date || item.created_date}`);
  }
  
  if (item.category) {
    sections.push(`• 분류: ${item.category}`);
  }
  
  if (item.is_important || item.priority) {
    sections.push(`• 중요도: ${item.is_important ? '중요' : '일반'}`);
  }
  
  return sections.join('\n');
}

function formatAttendanceInfo(item: any): string {
  const sections: string[] = [];
  
  sections.push(`📊 **출석 정보**`);
  
  if (item.service_date || item.attendance_date) {
    sections.push(`• 예배일: ${item.service_date || item.attendance_date}`);
  }
  
  if (item.service_type) {
    sections.push(`• 예배 구분: ${item.service_type}`);
  }
  
  if (item.total_attendance || item.attendance_count) {
    sections.push(`• 총 출석: ${item.total_attendance || item.attendance_count}명`);
  }
  
  if (item.adult_count) {
    sections.push(`• 성인: ${item.adult_count}명`);
  }
  
  if (item.youth_count) {
    sections.push(`• 청년: ${item.youth_count}명`);
  }
  
  if (item.children_count) {
    sections.push(`• 어린이: ${item.children_count}명`);
  }
  
  return sections.join('\n');
}

function formatGenericObject(item: any, index: number): string {
  const sections: string[] = [];
  
  sections.push(`📋 **데이터 ${index + 1}**`);
  
  Object.entries(item).forEach(([key, value]) => {
    if (value !== null && value !== undefined && String(value).trim() !== '') {
      // 키를 한글로 변환
      const koreanKey = translateKeyToKorean(key);
      sections.push(`• ${koreanKey}: ${String(value)}`);
    }
  });
  
  return sections.join('\n');
}

function translateKeyToKorean(key: string): string {
  const translations: { [key: string]: string } = {
    'id': 'ID',
    'name': '이름',
    'member_name': '성도명',
    'phone': '연락처',
    'phone_number': '전화번호',
    'address': '주소',
    'birth_date': '생년월일',
    'birthday': '생일',
    'position': '직분',
    'church_position': '교회직분',
    'department': '부서',
    'ministry': '사역',
    'visit_date': '심방일',
    'pastoral_visit_date': '목회심방일',
    'pastor_name': '목사명',
    'visit_purpose': '심방목적',
    'visit_notes': '심방내용',
    'prayer_request': '기도요청',
    'request_content': '요청내용',
    'request_date': '요청일',
    'prayer_type': '기도분류',
    'title': '제목',
    'content': '내용',
    'announcement_date': '공지일',
    'created_date': '생성일',
    'category': '분류',
    'is_important': '중요여부',
    'service_date': '예배일',
    'attendance_date': '출석일',
    'service_type': '예배구분',
    'total_attendance': '총출석',
    'attendance_count': '출석수',
    'adult_count': '성인수',
    'youth_count': '청년수',
    'children_count': '어린이수',
    'status': '상태'
  };
  
  return translations[key] || key;
}