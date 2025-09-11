import { PostTypeConfig } from './CommunityPostForm';

// 폼 타입 정의
export type FormType = 'common' | 'custom';

// 커뮤니티 타입별 폼 매핑
export const FORM_TYPE_MAPPING = {
  // 공통 폼 사용 (기본 필드로 충분한 타입들)
  'free-sharing': 'common' as FormType,
  'item-request': 'common' as FormType,
  'sharing-offer': 'common' as FormType,
  'job-posting': 'common' as FormType,
  'job-seeking': 'common' as FormType,
  'music-team-recruit': 'common' as FormType,
  'music-team-seeking': 'common' as FormType,
  
  // 전용 폼 필요 (복잡한 UI/UX가 필요한 타입들)
  'church-events': 'custom' as FormType,
  'prayer-requests': 'custom' as FormType,
  'community-announcements': 'custom' as FormType
} as const;

// 공통 폼 사용 가능한 타입들
export const COMMON_FORM_TYPES = Object.entries(FORM_TYPE_MAPPING)
  .filter(([, formType]) => formType === 'common')
  .map(([type]) => type);

// 전용 폼이 필요한 타입들
export const CUSTOM_FORM_TYPES = Object.entries(FORM_TYPE_MAPPING)
  .filter(([, formType]) => formType === 'custom')
  .map(([type]) => type);

// 이메일 유효성 검사 함수
const validateEmail = (email: string) => {
  if (!email) return null; // 선택 필드인 경우
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return '올바른 이메일 형식을 입력해주세요.';
  }
  return null;
};

// 무료 나눔 설정
export const freeSharingConfig: PostTypeConfig = {
  type: 'free-sharing',
  title: '무료 나눔 등록',
  submitEndpoint: '/community/sharing',
  successMessage: '무료 나눔이 성공적으로 등록되었습니다!',
  listPath: '/community/free-sharing',
  fields: [
    {
      key: 'images',
      label: '상품이미지',
      type: 'images',
      required: true
    },
    {
      key: 'category',
      label: '카테고리',
      type: 'select',
      required: true,
      options: [
        { value: '가구', label: '가구' },
        { value: '의류', label: '의류' },
        { value: '도서', label: '도서' },
        { value: '전자제품', label: '전자제품' },
        { value: '생활용품', label: '생활용품' },
        { value: '기타', label: '기타' }
      ]
    },
    {
      key: 'title',
      label: '제목',
      type: 'text',
      placeholder: '나눔할 물품의 제목을 입력해주세요',
      required: true,
      maxLength: 100
    },
    {
      key: 'description',
      label: '설명',
      type: 'textarea',
      placeholder: '나눔할 물품에 대한 상세한 설명을 입력해주세요',
      required: true,
      maxLength: 1000
    },
    {
      key: 'condition',
      label: '상태',
      type: 'select',
      required: true,
      options: [
        { value: '양호', label: '양호' },
        { value: '보통', label: '보통' },
        { value: '사용감있음', label: '사용감있음' }
      ]
    },
    {
      key: 'church',
      label: '교회명',
      type: 'text',
      placeholder: '소속 교회명을 입력해주세요',
      required: true,
      maxLength: 50
    },
    {
      key: 'location',
      label: '지역',
      type: 'text',
      placeholder: '거래 희망 지역을 입력해주세요',
      required: true,
      maxLength: 50
    },
    {
      key: 'contactInfo',
      label: '연락처',
      type: 'tel',
      placeholder: '연락 가능한 전화번호를 입력해주세요',
      required: true
    },
    {
      key: 'email',
      label: '이메일',
      type: 'email',
      placeholder: '이메일 주소를 입력해주세요 (선택사항)',
      required: false,
      validation: validateEmail
    }
  ]
};

// 물품 요청 설정
export const itemRequestConfig: PostTypeConfig = {
  type: 'item-request',
  title: '물품 구매 요청',
  submitEndpoint: '/community/request',
  successMessage: '물품 구매 요청이 성공적으로 등록되었습니다!',
  listPath: '/community/item-request',
  fields: [
    {
      key: 'category',
      label: '카테고리',
      type: 'select',
      required: true,
      options: [
        { value: '가구', label: '가구' },
        { value: '의류', label: '의류' },
        { value: '도서', label: '도서' },
        { value: '전자제품', label: '전자제품' },
        { value: '생활용품', label: '생활용품' },
        { value: '기타', label: '기타' }
      ]
    },
    {
      key: 'title',
      label: '제목',
      type: 'text',
      placeholder: '구매하고 싶은 물품의 제목을 입력해주세요',
      required: true,
      maxLength: 100
    },
    {
      key: 'description',
      label: '상세 설명',
      type: 'textarea',
      placeholder: '원하는 물품의 조건, 상태, 용도 등을 자세히 설명해주세요',
      required: true,
      maxLength: 1000
    },
    {
      key: 'priceRange',
      label: '희망 가격대',
      type: 'text',
      placeholder: '예: 5만원~10만원, 10만원 이하, 협의 가능',
      required: true,
      maxLength: 50
    },
    {
      key: 'neededDate',
      label: '구매 희망일',
      type: 'date',
      required: false
    },
    {
      key: 'church',
      label: '교회명',
      type: 'text',
      placeholder: '소속 교회명을 입력해주세요',
      required: true,
      maxLength: 50
    },
    {
      key: 'location',
      label: '거래 희망 지역',
      type: 'text',
      placeholder: '거래 가능한 지역을 입력해주세요',
      required: true,
      maxLength: 50
    },
    {
      key: 'contactInfo',
      label: '연락처',
      type: 'tel',
      placeholder: '연락 가능한 전화번호를 입력해주세요',
      required: true
    },
    {
      key: 'email',
      label: '이메일',
      type: 'email',
      placeholder: '이메일 주소를 입력해주세요 (선택사항)',
      required: false,
      validation: validateEmail
    },
    {
      key: 'images',
      label: '참고이미지',
      type: 'images',
      required: false
    }
  ]
};

// 나눔 제공 설정 (중고 물품 판매)
export const sharingOfferConfig: PostTypeConfig = {
  type: 'sharing-offer',
  title: '중고 물품 판매 등록',
  submitEndpoint: '/community/offer',
  successMessage: '중고 물품 판매가 성공적으로 등록되었습니다!',
  listPath: '/community/sharing-offer',
  fields: [
    {
      key: 'images',
      label: '상품 이미지',
      type: 'images',
      required: true
    },
    {
      key: 'category',
      label: '카테고리',
      type: 'select',
      required: true,
      options: [
        { value: '가구', label: '가구' },
        { value: '의류', label: '의류' },
        { value: '도서', label: '도서' },
        { value: '전자제품', label: '전자제품' },
        { value: '생활용품', label: '생활용품' },
        { value: '악기', label: '악기' },
        { value: '기타', label: '기타' }
      ]
    },
    {
      key: 'title',
      label: '제목',
      type: 'text',
      placeholder: '판매할 물품의 제목을 입력해주세요',
      required: true,
      maxLength: 100
    },
    {
      key: 'description',
      label: '상품 설명',
      type: 'textarea',
      placeholder: '물품의 상태, 사용 기간, 특징 등을 자세히 설명해주세요',
      required: true,
      maxLength: 1000
    },
    {
      key: 'condition',
      label: '상품 상태',
      type: 'select',
      required: true,
      options: [
        { value: '새 제품', label: '새 제품' },
        { value: '양호', label: '양호' },
        { value: '보통', label: '보통' },
        { value: '사용감있음', label: '사용감있음' }
      ]
    },
    {
      key: 'price',
      label: '판매 가격',
      type: 'text',
      placeholder: '예: 50,000원, 5만원, 협의 가능',
      required: true,
      maxLength: 50
    },
    {
      key: 'purchaseDate',
      label: '구매 시기',
      type: 'text',
      placeholder: '예: 2023년 3월, 작년, 6개월 전',
      required: false,
      maxLength: 50
    },
    {
      key: 'church',
      label: '교회명',
      type: 'text',
      placeholder: '소속 교회명을 입력해주세요',
      required: true,
      maxLength: 50
    },
    {
      key: 'location',
      label: '거래 지역',
      type: 'text',
      placeholder: '거래 가능한 지역을 입력해주세요',
      required: true,
      maxLength: 50
    },
    {
      key: 'contactInfo',
      label: '연락처',
      type: 'tel',
      placeholder: '연락 가능한 전화번호를 입력해주세요',
      required: true
    },
    {
      key: 'email',
      label: '이메일',
      type: 'email',
      placeholder: '이메일 주소를 입력해주세요 (선택사항)',
      required: false,
      validation: validateEmail
    }
  ]
};

// 구인 공고 설정
export const jobPostingConfig: PostTypeConfig = {
  type: 'job-posting',
  title: '구인 공고 등록',
  submitEndpoint: '/community/job-posting',
  successMessage: '구인 공고가 성공적으로 등록되었습니다!',
  listPath: '/community/job-posting',
  fields: [
    {
      key: 'images',
      label: '회사/교회 이미지',
      type: 'images',
      required: false
    },
    {
      key: 'jobType',
      label: '직종',
      type: 'select',
      required: true,
      options: [
        { value: '사무직', label: '사무직' },
        { value: '교육', label: '교육' },
        { value: '사역', label: '사역' },
        { value: '음악', label: '음악' },
        { value: '디자인', label: '디자인' },
        { value: '기술', label: '기술' },
        { value: '서비스', label: '서비스' },
        { value: '기타', label: '기타' }
      ]
    },
    {
      key: 'title',
      label: '제목',
      type: 'text',
      placeholder: '채용공고 제목을 입력해주세요',
      required: true,
      maxLength: 100
    },
    {
      key: 'description',
      label: '업무 내용',
      type: 'textarea',
      placeholder: '담당하게 될 업무에 대해 상세히 설명해주세요',
      required: true,
      maxLength: 1000
    },
    {
      key: 'requirements',
      label: '지원 자격',
      type: 'textarea',
      placeholder: '필요한 경력, 학력, 기술 등을 입력해주세요',
      required: true,
      maxLength: 500
    },
    {
      key: 'salary',
      label: '급여',
      type: 'text',
      placeholder: '급여 수준을 입력해주세요 (예: 협의, 200만원~)',
      required: true,
      maxLength: 50
    },
    {
      key: 'workType',
      label: '근무형태',
      type: 'select',
      required: true,
      options: [
        { value: '정규직', label: '정규직' },
        { value: '계약직', label: '계약직' },
        { value: '파트타임', label: '파트타임' },
        { value: '프리랜서', label: '프리랜서' }
      ]
    },
    {
      key: 'deadline',
      label: '마감일',
      type: 'date',
      required: true
    },
    {
      key: 'church',
      label: '교회/회사명',
      type: 'text',
      placeholder: '채용하는 교회나 회사명을 입력해주세요',
      required: true,
      maxLength: 50
    },
    {
      key: 'location',
      label: '근무 지역',
      type: 'text',
      placeholder: '근무할 지역을 입력해주세요',
      required: true,
      maxLength: 50
    },
    {
      key: 'contactInfo',
      label: '연락처',
      type: 'tel',
      placeholder: '채용 담당자 연락처를 입력해주세요',
      required: true
    },
    {
      key: 'email',
      label: '이메일',
      type: 'email',
      placeholder: '채용 담당자 이메일을 입력해주세요',
      required: true,
      validation: validateEmail
    }
  ]
};

// 구직 신청 설정
export const jobSeekingConfig: PostTypeConfig = {
  type: 'job-seeking',
  title: '구직 신청 등록',
  submitEndpoint: '/community/job-seeking',
  successMessage: '구직 신청이 성공적으로 등록되었습니다!',
  listPath: '/community/job-seeking',
  fields: [
    {
      key: 'images',
      label: '포트폴리오 이미지',
      type: 'images',
      required: false
    },
    {
      key: 'jobType',
      label: '희망 직종',
      type: 'select',
      required: true,
      options: [
        { value: '사무직', label: '사무직' },
        { value: '교육', label: '교육' },
        { value: '사역', label: '사역' },
        { value: '음악', label: '음악' },
        { value: '디자인', label: '디자인' },
        { value: '기술', label: '기술' },
        { value: '서비스', label: '서비스' },
        { value: '기타', label: '기타' }
      ]
    },
    {
      key: 'title',
      label: '제목',
      type: 'text',
      placeholder: '구직 신청 제목을 입력해주세요',
      required: true,
      maxLength: 100
    },
    {
      key: 'description',
      label: '자기소개',
      type: 'textarea',
      placeholder: '본인에 대해 소개하고 어떤 일을 하고 싶은지 설명해주세요',
      required: true,
      maxLength: 1000
    },
    {
      key: 'experience',
      label: '경력/경험',
      type: 'textarea',
      placeholder: '관련 경력이나 경험을 구체적으로 설명해주세요',
      required: true,
      maxLength: 500
    },
    {
      key: 'skills',
      label: '보유 기술',
      type: 'textarea',
      placeholder: '보유하고 있는 기술이나 능력을 나열해주세요',
      required: false,
      maxLength: 300
    },
    {
      key: 'workType',
      label: '희망 근무형태',
      type: 'select',
      required: true,
      options: [
        { value: '정규직', label: '정규직' },
        { value: '계약직', label: '계약직' },
        { value: '파트타임', label: '파트타임' },
        { value: '프리랜서', label: '프리랜서' }
      ]
    },
    {
      key: 'church',
      label: '교회명',
      type: 'text',
      placeholder: '소속 교회명을 입력해주세요',
      required: true,
      maxLength: 50
    },
    {
      key: 'location',
      label: '희망 지역',
      type: 'text',
      placeholder: '근무 희망 지역을 입력해주세요',
      required: true,
      maxLength: 50
    },
    {
      key: 'contactInfo',
      label: '연락처',
      type: 'tel',
      placeholder: '연락 가능한 전화번호를 입력해주세요',
      required: true
    },
    {
      key: 'email',
      label: '이메일',
      type: 'email',
      placeholder: '이메일 주소를 입력해주세요',
      required: true,
      validation: validateEmail
    }
  ]
};

// 음악팀 모집 설정
export const musicTeamRecruitConfig: PostTypeConfig = {
  type: 'music-team-recruit',
  title: '음악팀 모집 등록',
  submitEndpoint: '/community/music-recruit',
  successMessage: '음악팀 모집이 성공적으로 등록되었습니다!',
  listPath: '/community/music-team-recruit',
  fields: [
    {
      key: 'images',
      label: '팀/교회 이미지',
      type: 'images',
      required: false
    },
    {
      key: 'instrument',
      label: '모집 파트',
      type: 'select',
      required: true,
      options: [
        { value: '보컬', label: '보컬' },
        { value: '기타', label: '기타' },
        { value: '베이스', label: '베이스' },
        { value: '드럼', label: '드럼' },
        { value: '키보드', label: '키보드' },
        { value: '바이올린', label: '바이올린' },
        { value: '첼로', label: '첼로' },
        { value: '관악기', label: '관악기' },
        { value: '기타', label: '기타' }
      ]
    },
    {
      key: 'title',
      label: '제목',
      type: 'text',
      placeholder: '음악팀 모집 제목을 입력해주세요',
      required: true,
      maxLength: 100
    },
    {
      key: 'description',
      label: '설명',
      type: 'textarea',
      placeholder: '음악팀과 모집하는 파트에 대해 자세히 설명해주세요',
      required: true,
      maxLength: 1000
    },
    {
      key: 'requirements',
      label: '지원 자격',
      type: 'textarea',
      placeholder: '필요한 실력이나 경험, 조건 등을 입력해주세요',
      required: true,
      maxLength: 500
    },
    {
      key: 'schedule',
      label: '연습 일정',
      type: 'text',
      placeholder: '연습 요일과 시간을 입력해주세요',
      required: true,
      maxLength: 100
    },
    {
      key: 'church',
      label: '교회명',
      type: 'text',
      placeholder: '소속 교회명을 입력해주세요',
      required: true,
      maxLength: 50
    },
    {
      key: 'location',
      label: '연습 장소',
      type: 'text',
      placeholder: '연습하는 지역이나 장소를 입력해주세요',
      required: true,
      maxLength: 50
    },
    {
      key: 'contactInfo',
      label: '연락처',
      type: 'tel',
      placeholder: '연락 가능한 전화번호를 입력해주세요',
      required: true
    },
    {
      key: 'email',
      label: '이메일',
      type: 'email',
      placeholder: '이메일 주소를 입력해주세요 (선택사항)',
      required: false,
      validation: validateEmail
    }
  ]
};

// 음악팀 참여 설정
export const musicTeamSeekingConfig: PostTypeConfig = {
  type: 'music-team-seeking',
  title: '음악팀 참여 신청',
  submitEndpoint: '/community/music-seeking',
  successMessage: '음악팀 참여 신청이 성공적으로 등록되었습니다!',
  listPath: '/community/music-team-seeking',
  fields: [
    {
      key: 'images',
      label: '연주 이미지',
      type: 'images',
      required: false
    },
    {
      key: 'instrument',
      label: '전공 파트',
      type: 'select',
      required: true,
      options: [
        { value: '보컬', label: '보컬' },
        { value: '기타', label: '기타' },
        { value: '베이스', label: '베이스' },
        { value: '드럼', label: '드럼' },
        { value: '키보드', label: '키보드' },
        { value: '바이올린', label: '바이올린' },
        { value: '첼로', label: '첼로' },
        { value: '관악기', label: '관악기' },
        { value: '기타', label: '기타' }
      ]
    },
    {
      key: 'title',
      label: '제목',
      type: 'text',
      placeholder: '음악팀 참여 신청 제목을 입력해주세요',
      required: true,
      maxLength: 100
    },
    {
      key: 'description',
      label: '자기소개',
      type: 'textarea',
      placeholder: '본인의 음악적 배경과 경험을 소개해주세요',
      required: true,
      maxLength: 1000
    },
    {
      key: 'experience',
      label: '연주 경험',
      type: 'textarea',
      placeholder: '연주 경험이나 참여했던 팀에 대해 설명해주세요',
      required: true,
      maxLength: 500
    },
    {
      key: 'availableTime',
      label: '가능한 시간',
      type: 'text',
      placeholder: '연습 가능한 요일과 시간대를 입력해주세요',
      required: true,
      maxLength: 100
    },
    {
      key: 'church',
      label: '교회명',
      type: 'text',
      placeholder: '소속 교회명을 입력해주세요',
      required: true,
      maxLength: 50
    },
    {
      key: 'location',
      label: '활동 희망 지역',
      type: 'text',
      placeholder: '음악팀 활동 희망 지역을 입력해주세요',
      required: true,
      maxLength: 50
    },
    {
      key: 'contactInfo',
      label: '연락처',
      type: 'tel',
      placeholder: '연락 가능한 전화번호를 입력해주세요',
      required: true
    },
    {
      key: 'email',
      label: '이메일',
      type: 'email',
      placeholder: '이메일 주소를 입력해주세요 (선택사항)',
      required: false,
      validation: validateEmail
    }
  ]
};

// 교회 행사 설정
export const churchEventsConfig: PostTypeConfig = {
  type: 'church-events',
  title: '교회 행사 등록',
  submitEndpoint: '/community/events',
  successMessage: '교회 행사가 성공적으로 등록되었습니다!',
  listPath: '/community/church-events',
  fields: [
    {
      key: 'images',
      label: '행사 이미지',
      type: 'images',
      required: false
    },
    {
      key: 'eventType',
      label: '행사 유형',
      type: 'select',
      required: true,
      options: [
        { value: '예배', label: '예배' },
        { value: '집회', label: '집회' },
        { value: '세미나', label: '세미나' },
        { value: '콘서트', label: '콘서트' },
        { value: '봉사활동', label: '봉사활동' },
        { value: '친교활동', label: '친교활동' },
        { value: '기타', label: '기타' }
      ]
    },
    {
      key: 'title',
      label: '제목',
      type: 'text',
      placeholder: '행사 제목을 입력해주세요',
      required: true,
      maxLength: 100
    },
    {
      key: 'description',
      label: '행사 내용',
      type: 'textarea',
      placeholder: '행사에 대한 상세한 내용을 입력해주세요',
      required: true,
      maxLength: 1000
    },
    {
      key: 'eventDate',
      label: '행사 날짜',
      type: 'date',
      required: true
    },
    {
      key: 'eventTime',
      label: '행사 시간',
      type: 'time',
      required: true
    },
    {
      key: 'duration',
      label: '소요 시간',
      type: 'text',
      placeholder: '예상 소요 시간을 입력해주세요 (예: 2시간)',
      required: false,
      maxLength: 50
    },
    {
      key: 'church',
      label: '주최 교회',
      type: 'text',
      placeholder: '행사를 주최하는 교회명을 입력해주세요',
      required: true,
      maxLength: 50
    },
    {
      key: 'location',
      label: '행사 장소',
      type: 'text',
      placeholder: '행사가 열리는 장소를 입력해주세요',
      required: true,
      maxLength: 100
    },
    {
      key: 'fee',
      label: '참가비',
      type: 'text',
      placeholder: '참가비를 입력해주세요 (무료인 경우 "무료")',
      required: false,
      maxLength: 50
    },
    {
      key: 'contactInfo',
      label: '문의 연락처',
      type: 'tel',
      placeholder: '문의 가능한 연락처를 입력해주세요',
      required: true
    },
    {
      key: 'email',
      label: '문의 이메일',
      type: 'email',
      placeholder: '문의 이메일을 입력해주세요 (선택사항)',
      required: false,
      validation: validateEmail
    }
  ]
};

// 공통 폼 설정들만 분리 (common form types만)
export const commonFormConfigs = {
  'free-sharing': freeSharingConfig,
  'item-request': itemRequestConfig,
  'sharing-offer': sharingOfferConfig,
  'job-posting': jobPostingConfig,
  'job-seeking': jobSeekingConfig,
  'music-team-recruit': musicTeamRecruitConfig,
  'music-team-seeking': musicTeamSeekingConfig
};

// 전용 폼 설정들 (custom form types - 참고용으로만 유지)
export const customFormConfigs = {
  'church-events': churchEventsConfig
};

// 모든 설정을 내보내기 (하위 호환성 유지)
export const postConfigs = {
  ...commonFormConfigs,
  ...customFormConfigs
};

// 폼 타입 체크 유틸리티 함수들
export const isCommonFormType = (type: string): boolean => {
  return COMMON_FORM_TYPES.includes(type);
};

export const isCustomFormType = (type: string): boolean => {
  return CUSTOM_FORM_TYPES.includes(type);
};

export const getFormType = (type: string): FormType => {
  return FORM_TYPE_MAPPING[type as keyof typeof FORM_TYPE_MAPPING] || 'common';
};

// 공통 폼 설정 가져오기
export const getCommonFormConfig = (type: string): PostTypeConfig | null => {
  return commonFormConfigs[type as keyof typeof commonFormConfigs] || null;
};

// 등록 버튼 클릭 시 올바른 페이지로 라우팅하는 함수
export const getCreatePagePath = (type: string): string => {
  const formType = getFormType(type);
  
  if (formType === 'common') {
    return `/community/${type}/create`;
  } else {
    // 전용 폼의 경우 별도 경로 사용
    switch (type) {
      case 'church-events':
        return `/community/church-events/create-custom`;
      case 'prayer-requests':
        return `/community/prayer-requests/create-custom`;
      default:
        return `/community/${type}/create`;
    }
  }
};