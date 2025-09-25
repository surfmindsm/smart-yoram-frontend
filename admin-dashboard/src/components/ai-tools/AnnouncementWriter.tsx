import React from 'react';
import { Megaphone } from 'lucide-react';
import BaseAITool from './BaseAITool';
import { Input } from "@/components/ui3";
import { Label } from "@/components/ui3";
import { Textarea } from "@/components/ui3";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui3";
import { Checkbox } from "@/components/ui3";
import { generateAIToolContent, generateAutoFillSuggestions } from '../../services/aiToolsService';

interface AnnouncementInputs {
  title: string;
  category: string;
  eventDate: string;
  eventTime: string;
  location: string;
  description: string;
  targetAudience: string;
  registrationRequired: boolean;
  contactInfo: string;
  deadline: string;
  tone: string;
}

interface AnnouncementInputFormProps {
  onInputChange: (key: string, value: any) => void;
  inputs: AnnouncementInputs;
}

interface BasicAnnouncementInputProps {
  onInputChange: (key: string, value: any) => void;
  inputs: AnnouncementInputs;
}

const BasicAnnouncementInput: React.FC<BasicAnnouncementInputProps> = ({ onInputChange, inputs }) => {
  return (
    <>
      <div>
        <Label htmlFor="category">카테고리</Label>
        <Select onValueChange={(value) => onInputChange('category', value)}>
          <SelectTrigger>
            <SelectValue placeholder="공지사항 카테고리를 선택하세요" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="예배안내">예배안내</SelectItem>
            <SelectItem value="교육프로그램">교육프로그램</SelectItem>
            <SelectItem value="행사안내">행사안내</SelectItem>
            <SelectItem value="봉사활동">봉사활동</SelectItem>
            <SelectItem value="선교소식">선교소식</SelectItem>
            <SelectItem value="교회소식">교회소식</SelectItem>
            <SelectItem value="시설관련">시설관련</SelectItem>
            <SelectItem value="특별모임">특별모임</SelectItem>
            <SelectItem value="사랑의실천">사랑의실천</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="eventDate">행사 날짜</Label>
          <Input
            id="eventDate"
            type="date"
            value={inputs.eventDate || ''}
            onChange={(e) => onInputChange('eventDate', e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="eventTime">행사 시간</Label>
          <Input
            id="eventTime"
            type="time"
            value={inputs.eventTime || ''}
            onChange={(e) => onInputChange('eventTime', e.target.value)}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="description">행사 설명</Label>
        <Textarea
          id="description"
          value={inputs.description || ''}
          onChange={(e) => onInputChange('description', e.target.value)}
          placeholder="행사나 공지에 대한 간단한 설명을 입력하세요"
          rows={2}
        />
      </div>
    </>
  );
};

const AnnouncementInputForm: React.FC<AnnouncementInputFormProps> = ({ onInputChange, inputs }) => {
  return (
    <>
      <div>
        <Label htmlFor="title">공지사항 제목</Label>
        <Input
          id="title"
          value={inputs.title || ''}
          onChange={(e) => onInputChange('title', e.target.value)}
          placeholder="공지사항 제목을 입력하세요"
        />
      </div>

      <div>
        <Label htmlFor="category">카테고리</Label>
        <Select onValueChange={(value) => onInputChange('category', value)}>
          <SelectTrigger>
            <SelectValue placeholder="공지사항 카테고리를 선택하세요" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="예배안내">예배안내</SelectItem>
            <SelectItem value="교육프로그램">교육프로그램</SelectItem>
            <SelectItem value="행사안내">행사안내</SelectItem>
            <SelectItem value="봉사활동">봉사활동</SelectItem>
            <SelectItem value="선교소식">선교소식</SelectItem>
            <SelectItem value="교회소식">교회소식</SelectItem>
            <SelectItem value="시설관련">시설관련</SelectItem>
            <SelectItem value="특별모임">특별모임</SelectItem>
            <SelectItem value="사랑의실천">사랑의실천</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="eventDate">행사 날짜</Label>
          <Input
            id="eventDate"
            type="date"
            value={inputs.eventDate || ''}
            onChange={(e) => onInputChange('eventDate', e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="eventTime">행사 시간</Label>
          <Input
            id="eventTime"
            type="time"
            value={inputs.eventTime || ''}
            onChange={(e) => onInputChange('eventTime', e.target.value)}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="location">장소</Label>
        <Input
          id="location"
          value={inputs.location || ''}
          onChange={(e) => onInputChange('location', e.target.value)}
          placeholder="행사 장소를 입력하세요"
        />
      </div>

      <div>
        <Label htmlFor="targetAudience">대상</Label>
        <Select onValueChange={(value) => onInputChange('targetAudience', value)}>
          <SelectTrigger>
            <SelectValue placeholder="대상을 선택하세요" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="전체교인">전체교인</SelectItem>
            <SelectItem value="청년부">청년부</SelectItem>
            <SelectItem value="장년부">장년부</SelectItem>
            <SelectItem value="학생부">학생부</SelectItem>
            <SelectItem value="어린이부">어린이부</SelectItem>
            <SelectItem value="새신자">새신자</SelectItem>
            <SelectItem value="봉사자">봉사자</SelectItem>
            <SelectItem value="리더십">리더십</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="tone">공지 톤앤매너</Label>
        <Select onValueChange={(value) => onInputChange('tone', value)}>
          <SelectTrigger>
            <SelectValue placeholder="공지사항의 톤을 선택하세요" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="공식적">공식적/격식있게</SelectItem>
            <SelectItem value="친근한">친근하고 따뜻하게</SelectItem>
            <SelectItem value="긴급한">긴급하고 중요하게</SelectItem>
            <SelectItem value="축하하는">축하하고 기쁘게</SelectItem>
            <SelectItem value="안내하는">안내하고 설명하는</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="description">행사 설명</Label>
        <Textarea
          id="description"
          value={inputs.description || ''}
          onChange={(e) => onInputChange('description', e.target.value)}
          placeholder="행사나 공지에 대한 자세한 설명을 입력하세요"
          rows={4}
        />
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="registrationRequired"
          checked={inputs.registrationRequired || false}
          onCheckedChange={(checked) => onInputChange('registrationRequired', checked)}
        />
        <Label htmlFor="registrationRequired">
          사전 신청/등록이 필요합니다
        </Label>
      </div>

      {inputs.registrationRequired && (
        <div>
          <Label htmlFor="deadline">신청 마감일</Label>
          <Input
            id="deadline"
            type="date"
            value={inputs.deadline || ''}
            onChange={(e) => onInputChange('deadline', e.target.value)}
          />
        </div>
      )}

      <div>
        <Label htmlFor="contactInfo">문의처 (선택사항)</Label>
        <Input
          id="contactInfo"
          value={inputs.contactInfo || ''}
          onChange={(e) => onInputChange('contactInfo', e.target.value)}
          placeholder="담당자명, 연락처 등"
        />
      </div>
    </>
  );
};

const AnnouncementWriter: React.FC = () => {
  const handleAutoFill = async (basicInfo: AnnouncementInputs): Promise<Partial<AnnouncementInputs>> => {
    try {
      // 실제 AI API 호출
      const suggestions = await generateAutoFillSuggestions('announcement-writer', basicInfo);
      return suggestions;
    } catch (error) {
      console.error('공지사항 자동 입력 실패:', error);
      
      // 폴백: 기본 로직
      const suggestions: Partial<AnnouncementInputs> = {};
      
      if (basicInfo.category && basicInfo.description) {
        if (basicInfo.category === '행사안내') {
          suggestions.title = `${basicInfo.description} 안내`;
          suggestions.targetAudience = '전체교인';
          suggestions.tone = '안내하는';
        } else {
          suggestions.title = basicInfo.description;
          suggestions.targetAudience = '전체교인';
          suggestions.tone = '안내하는';
        }
      }
      
      return suggestions;
    }
  };

  const handleGenerate = async (inputs: AnnouncementInputs): Promise<string> => {
    try {
      // 실제 AI API 호출
      const generatedContent = await generateAIToolContent('announcement-writer', inputs);
      return generatedContent;
    } catch (error) {
      console.error('공지사항 생성 실패:', error);
      
      // 폴백: 기본 템플릿
      const formatDate = (dateStr: string) => {
      if (!dateStr) return '';
      const date = new Date(dateStr);
      return `${date.getMonth() + 1}월 ${date.getDate()}일`;
    };

    const formatTime = (timeStr: string) => {
      if (!timeStr) return '';
      const [hour, minute] = timeStr.split(':');
      const hourNum = parseInt(hour);
      const period = hourNum >= 12 ? '오후' : '오전';
      const displayHour = hourNum > 12 ? hourNum - 12 : hourNum === 0 ? 12 : hourNum;
      return `${period} ${displayHour}:${minute}`;
    };

    const getTonePrefix = (tone: string) => {
      switch (tone) {
        case '친근한': return '사랑하는 성도 여러분,';
        case '긴급한': return '【긴급 공지】';
        case '축하하는': return '🎉 기쁜 소식입니다!';
        case '안내하는': return '안내 말씀드립니다.';
        default: return '공지 말씀드립니다.';
      }
    };

    return `# ${inputs.title}

---

## ${getTonePrefix(inputs.tone || '공식적')}

${inputs.description}

### 📅 행사 정보
- **일시**: ${formatDate(inputs.eventDate)} ${formatTime(inputs.eventTime)}
- **장소**: ${inputs.location || '교회 내'}
- **대상**: ${inputs.targetAudience || '전체교인'}

${inputs.registrationRequired ? `
### ✅ 참가 신청
- **신청 마감**: ${formatDate(inputs.deadline)}
- 사전 신청이 필요하니 기한 내에 신청해 주시기 바랍니다.
${inputs.contactInfo ? `- **문의처**: ${inputs.contactInfo}` : ''}
` : inputs.contactInfo ? `
### 📞 문의처
${inputs.contactInfo}
` : ''}

${inputs.tone === '축하하는' ? `
함께 기쁨을 나누는 시간이 되기를 소망합니다.` : 
inputs.tone === '긴급한' ? `
중요한 사안이니 많은 관심과 참여 부탁드립니다.` :
inputs.tone === '친근한' ? `
성도 여러분의 많은 관심과 참여를 부탁드립니다. 감사합니다.` :
`
여러분의 많은 참여를 부탁드립니다.`}

---

*카테고리: ${inputs.category}*
*작성일: ${new Date().toLocaleDateString('ko-KR')}*

⚠️ AI 서비스 연결 오류로 인해 기본 템플릿을 표시했습니다.`;
    }
  };

  return (
    <BaseAITool
      title="공지사항 작성 도구"
      description="교회 행사나 소식을 위한 공지사항을 작성해드립니다."
      icon={Megaphone}
      onGenerate={handleGenerate}
      onAutoFill={handleAutoFill}
      basicFields={<BasicAnnouncementInput onInputChange={() => {}} inputs={{} as AnnouncementInputs} />}
    >
      <AnnouncementInputForm onInputChange={() => {}} inputs={{} as AnnouncementInputs} />
    </BaseAITool>
  );
};

export default AnnouncementWriter;
