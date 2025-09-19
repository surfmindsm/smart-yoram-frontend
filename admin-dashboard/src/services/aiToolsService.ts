// AI Tools 전용 실제 AI API 호출 서비스
// 기존 agentService.ts의 AI 호출 구조를 활용

interface AIToolsAPIResponse {
  content: string;
  tokensUsed?: number;
}

// Edge Function을 통한 AI Tools 콘텐츠 생성
export const generateAIToolContent = async (
  toolType: string,
  inputs: any
): Promise<string> => {
  try {

    // 도구별 프롬프트 생성
    const prompt = createToolPrompt(toolType, inputs);
    
    // Edge Function 호출 제거됨 - 중복 AI 응답 생성 방지
    throw new Error('AI Tools Edge Function 호출이 제거되었습니다');
    
  } catch (error) {
    console.error(`❌ AI Tools ${toolType} 생성 실패:`, error);
    
    // 폴백: 직접 OpenAI API 호출
    try {
      return await callOpenAIDirectly(toolType, inputs);
    } catch (fallbackError) {
      console.error('❌ OpenAI 직접 호출도 실패:', fallbackError);
      throw new Error(`AI 콘텐츠 생성 실패: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
};

// 직접 OpenAI API 호출 (폴백용)
const callOpenAIDirectly = async (toolType: string, inputs: any): Promise<string> => {
  const apiKey = process.env.REACT_APP_OPENAI_API_KEY;
  if (!apiKey || apiKey === 'sk-proj-...') {
    throw new Error('OpenAI API 키가 설정되지 않았습니다.');
  }

  const prompt = createToolPrompt(toolType, inputs);
  
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: '당신은 교회 사역을 돕는 전문 AI 어시스턴트입니다. 정확하고 유용한 콘텐츠를 생성해주세요.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 2000,
      temperature: 0.7
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('🚨 OpenAI API 오류:', response.status, errorText);
    throw new Error(`OpenAI API 호출 실패: ${response.status}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
};

// AI 자동 입력 기능
export const generateAutoFillSuggestions = async (
  toolType: string,
  basicInputs: any
): Promise<any> => {
  try {

    const prompt = createAutoFillPrompt(toolType, basicInputs);
    
    // Edge Function 호출 제거됨 - 중복 AI 응답 생성 방지
    throw new Error('AutoFill Edge Function 호출이 제거되었습니다');
    
  } catch (error) {
    console.error(`❌ AI 자동 입력 실패:`, error);
    
    // 폴백: 간단한 로직 기반 추천
    return getBasicAutoFillSuggestions(toolType, basicInputs);
  }
};

// 도구별 프롬프트 생성
const createToolPrompt = (toolType: string, inputs: any): string => {
  switch (toolType) {
    case 'sermon-writer':
      return `다음 정보를 바탕으로 설교문을 작성해주세요:

제목: ${inputs.title || ''}
본문: ${inputs.scripture || ''}
주제: ${inputs.theme || ''}
대상: ${inputs.targetAudience || '전체교인'}
설교 유형: ${inputs.sermonType || '주일예배'}
시간: ${inputs.duration || '30분'}
핵심 메시지: ${inputs.keyPoints || ''}

완전한 설교문을 작성해주세요. 서론, 본론, 결론 구조로 구성하고, 실제 설교에서 사용할 수 있도록 상세하게 작성해주세요.`;

    case 'prayer-generator':
      return `다음 정보를 바탕으로 기도문을 작성해주세요:

제목: ${inputs.title || ''}
기도 유형: ${inputs.prayerType || ''}
상황/목적: ${inputs.occasion || ''}
길이: ${inputs.duration || ''}
성경 구절: ${inputs.scriptureReference || ''}
포함 요소: ${(inputs.includeElements || []).join(', ')}
구체적 요청: ${inputs.specificRequests || ''}

정중하고 경건한 기도문을 작성해주세요. 상황에 맞는 적절한 내용으로 구성해주세요.`;

    case 'announcement-writer':
      return `다음 정보를 바탕으로 교회 공지사항을 작성해주세요:

제목: ${inputs.title || ''}
카테고리: ${inputs.category || ''}
행사 날짜: ${inputs.eventDate || ''}
행사 시간: ${inputs.eventTime || ''}
장소: ${inputs.location || ''}
대상: ${inputs.targetAudience || ''}
설명: ${inputs.description || ''}
톤: ${inputs.tone || '안내하는'}
신청 필요: ${inputs.registrationRequired ? '예' : '아니오'}
마감일: ${inputs.deadline || ''}
문의처: ${inputs.contactInfo || ''}

공지사항을 명확하고 친근하게 작성해주세요. 필요한 정보를 모두 포함하되 읽기 쉽게 구성해주세요.`;

    case 'bulletin-content':
      return `다음 정보를 바탕으로 주보 콘텐츠를 작성해주세요:

날짜: ${inputs.date || ''}
절기: ${inputs.season || ''}
설교 제목: ${inputs.sermonTitle || ''}
설교 본문: ${inputs.sermonScripture || ''}
설교자: ${inputs.preacher || ''}
찬송가: ${inputs.worship?.hymns || ''}
특별 행사: ${inputs.specialEvents || ''}
공지사항: ${inputs.announcements || ''}

주보에 적합한 형식으로 전체 콘텐츠를 구성해주세요. 예배 순서, 공지사항, 기도 제목 등을 포함해주세요.`;

    default:
      return `${toolType} 도구를 위한 콘텐츠를 생성해주세요. 입력 정보: ${JSON.stringify(inputs)}`;
  }
};

// 자동 입력용 프롬프트 생성
const createAutoFillPrompt = (toolType: string, basicInputs: any): string => {
  return `다음 기본 정보를 바탕으로 ${toolType}에 필요한 나머지 필드들을 추천해주세요:

기본 입력: ${JSON.stringify(basicInputs)}

JSON 형식으로만 응답해주세요. 추천할 수 있는 필드들의 값을 제안해주세요.`;
};

// 자동 입력 응답 파싱
const parseAutoFillResponse = (response: string): any => {
  try {
    // JSON 부분 추출 시도
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    // JSON 형식이 아닌 경우 기본값 반환
    return {};
  } catch (error) {
    console.warn('자동 입력 응답 파싱 실패:', error);
    return {};
  }
};

// 기본 자동 입력 추천 (폴백용)
const getBasicAutoFillSuggestions = (toolType: string, basicInputs: any): any => {
  switch (toolType) {
    case 'sermon-writer':
      return {
        title: `${basicInputs.theme || '하나님의 사랑'}에 대한 설교`,
        sermonType: '주일예배',
        duration: '30분'
      };
    case 'prayer-generator':
      return {
        title: `${basicInputs.occasion || '예배'}를 위한 기도`,
        includeElements: ['praise', 'thanksgiving']
      };
    case 'announcement-writer':
      return {
        title: basicInputs.description || '교회 안내',
        targetAudience: '전체교인',
        tone: '안내하는'
      };
    default:
      return {};
  }
};
