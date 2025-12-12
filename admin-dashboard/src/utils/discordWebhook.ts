/**
 * 디스코드 웹훅 유틸리티
 * 교회 및 커뮤니티 가입 신청 알림을 디스코드로 전송
 */

// 웹훅 URL을 환경변수에서 가져옴
const DISCORD_WEBHOOK_URL = process.env.REACT_APP_DISCORD_WEBHOOK_URL;

/**
 * 디스코드 임베드 색상
 */
const COLORS = {
  CHURCH_APPLICATION: 0x5865F2, // Discord Blurple
  COMMUNITY_APPLICATION: 0x57F287, // Green
  APPROVED: 0x57F287, // Green
  REJECTED: 0xED4245, // Red
  INFO: 0x3498DB, // Blue
} as const;

/**
 * 디스코드 웹훅 메시지 전송 인터페이스
 */
interface DiscordWebhookMessage {
  content?: string;
  embeds?: DiscordEmbed[];
  username?: string;
  avatar_url?: string;
}

interface DiscordEmbed {
  title?: string;
  description?: string;
  color?: number;
  fields?: DiscordEmbedField[];
  footer?: {
    text?: string;
  };
  timestamp?: string;
}

interface DiscordEmbedField {
  name: string;
  value: string;
  inline?: boolean;
}

/**
 * 디스코드 웹훅으로 메시지 전송
 */
async function sendWebhookMessage(message: DiscordWebhookMessage): Promise<void> {
  if (!DISCORD_WEBHOOK_URL) {
    console.warn('⚠️ 디스코드 웹훅 URL이 설정되지 않았습니다. 환경변수 REACT_APP_DISCORD_WEBHOOK_URL을 설정해주세요.');
    return;
  }

  try {
    const response = await fetch(DISCORD_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });

    if (!response.ok) {
      console.error('❌ 디스코드 웹훅 전송 실패:', response.status, response.statusText);
    } else {
      console.log('✅ 디스코드 알림 전송 완료');
    }
  } catch (error) {
    console.error('❌ 디스코드 웹훅 전송 중 오류:', error);
  }
}

/**
 * 교회 가입 신청 알림
 */
export async function notifyChurchApplication(data: {
  church_name: string;
  pastor_name: string;
  admin_name: string;
  email: string;
  phone: string;
  address: string;
  description: string;
  denomination?: string;
  application_id?: number;
}): Promise<void> {
  const embed: DiscordEmbed = {
    title: '🏛️ 새로운 교회 가입 신청',
    description: '새로운 교회에서 가입 신청을 했습니다.',
    color: COLORS.CHURCH_APPLICATION,
    fields: [
      {
        name: '교회명',
        value: data.church_name,
        inline: true,
      },
      {
        name: '담임목사',
        value: data.pastor_name,
        inline: true,
      },
      {
        name: '관리자명',
        value: data.admin_name,
        inline: true,
      },
      {
        name: '이메일',
        value: data.email,
        inline: true,
      },
      {
        name: '전화번호',
        value: data.phone,
        inline: true,
      },
      ...(data.denomination ? [{
        name: '교단',
        value: data.denomination,
        inline: true,
      }] : []),
      {
        name: '주소',
        value: data.address,
        inline: false,
      },
      {
        name: '교회 소개',
        value: data.description.length > 200 ? data.description.substring(0, 200) + '...' : data.description,
        inline: false,
      },
    ],
    footer: {
      text: data.application_id ? `신청 ID: ${data.application_id}` : '처리 대기 중',
    },
    timestamp: new Date().toISOString(),
  };

  await sendWebhookMessage({
    username: 'ChurchRound 가입 알림',
    embeds: [embed],
  });
}

/**
 * 교회 신청 승인 알림
 */
export async function notifyChurchApproval(data: {
  church_name: string;
  pastor_name: string;
  email: string;
  denomination?: string;
  application_id: number;
}): Promise<void> {
  const embed: DiscordEmbed = {
    title: '✅ 교회 가입 승인 완료',
    description: '교회 가입 신청이 승인되었습니다.',
    color: COLORS.APPROVED,
    fields: [
      {
        name: '교회명',
        value: data.church_name,
        inline: true,
      },
      {
        name: '담임목사',
        value: data.pastor_name,
        inline: true,
      },
      {
        name: '이메일',
        value: data.email,
        inline: true,
      },
      ...(data.denomination ? [{
        name: '교단',
        value: data.denomination,
        inline: true,
      }] : []),
    ],
    footer: {
      text: `신청 ID: ${data.application_id}`,
    },
    timestamp: new Date().toISOString(),
  };

  await sendWebhookMessage({
    username: 'ChurchRound 승인 알림',
    embeds: [embed],
  });
}

/**
 * 커뮤니티 회원 가입 신청 알림
 */
export async function notifyCommunityApplication(data: {
  applicant_type: string;
  organization_name: string;
  contact_person: string;
  email: string;
  phone: string;
  description: string;
  application_id?: number;
}): Promise<void> {
  // 신청자 타입을 한글로 변환
  const applicantTypeKorean: { [key: string]: string } = {
    'company': '기업',
    'individual': '개인',
    'musician': '음악인',
    'minister': '사역자',
    'organization': '단체',
    'church_admin': '교회 관리자',
    'other': '기타',
  };

  const embed: DiscordEmbed = {
    title: '🌐 새로운 커뮤니티 회원 가입 신청',
    description: '새로운 회원이 커뮤니티 가입을 신청했습니다.',
    color: COLORS.COMMUNITY_APPLICATION,
    fields: [
      {
        name: '신청자 유형',
        value: applicantTypeKorean[data.applicant_type] || data.applicant_type,
        inline: true,
      },
      {
        name: '단체/조직명',
        value: data.organization_name,
        inline: true,
      },
      {
        name: '담당자명',
        value: data.contact_person,
        inline: true,
      },
      {
        name: '이메일',
        value: data.email,
        inline: true,
      },
      {
        name: '전화번호',
        value: data.phone,
        inline: true,
      },
      {
        name: '상세 설명',
        value: data.description.length > 200 ? data.description.substring(0, 200) + '...' : data.description,
        inline: false,
      },
    ],
    footer: {
      text: data.application_id ? `신청 ID: ${data.application_id}` : '처리 대기 중',
    },
    timestamp: new Date().toISOString(),
  };

  await sendWebhookMessage({
    username: 'ChurchRound 가입 알림',
    embeds: [embed],
  });
}

/**
 * 커뮤니티 회원 승인 알림
 */
export async function notifyCommunityApproval(data: {
  organization_name: string;
  contact_person: string;
  email: string;
  application_id: number;
}): Promise<void> {
  const embed: DiscordEmbed = {
    title: '✅ 커뮤니티 회원 가입 승인 완료',
    description: '커뮤니티 회원 가입 신청이 승인되었습니다.',
    color: COLORS.APPROVED,
    fields: [
      {
        name: '단체/조직명',
        value: data.organization_name,
        inline: true,
      },
      {
        name: '담당자명',
        value: data.contact_person,
        inline: true,
      },
      {
        name: '이메일',
        value: data.email,
        inline: true,
      },
    ],
    footer: {
      text: `신청 ID: ${data.application_id}`,
    },
    timestamp: new Date().toISOString(),
  };

  await sendWebhookMessage({
    username: 'ChurchRound 승인 알림',
    embeds: [embed],
  });
}
