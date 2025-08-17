import React from 'react';
import { BookOpen } from 'lucide-react';
import BaseAITool from './BaseAITool';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

interface SermonInputs {
  title: string;
  scripture: string;
  theme: string;
  targetAudience: string;
  sermonType: string;
  duration: string;
  keyPoints: string;
}

interface SermonInputFormProps {
  onInputChange: (key: string, value: any) => void;
  inputs: SermonInputs;
}

interface BasicSermonInputProps {
  onInputChange: (key: string, value: any) => void;
  inputs: SermonInputs;
}

const BasicSermonInput: React.FC<BasicSermonInputProps> = ({ onInputChange, inputs }) => {
  return (
    <>
      <div>
        <Label htmlFor="scripture">본문 말씀</Label>
        <Input
          id="scripture"
          value={inputs.scripture || ''}
          onChange={(e) => onInputChange('scripture', e.target.value)}
          placeholder="예: 요한복음 3:16, 로마서 8:28"
        />
      </div>

      <div>
        <Label htmlFor="theme">설교 주제</Label>
        <Input
          id="theme"
          value={inputs.theme || ''}
          onChange={(e) => onInputChange('theme', e.target.value)}
          placeholder="설교의 핵심 주제를 입력하세요"
        />
      </div>

      <div>
        <Label htmlFor="targetAudience">대상 회중</Label>
        <Select onValueChange={(value) => onInputChange('targetAudience', value)}>
          <SelectTrigger>
            <SelectValue placeholder="대상 회중을 선택하세요" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="전체교인">전체교인</SelectItem>
            <SelectItem value="청년부">청년부</SelectItem>
            <SelectItem value="장년부">장년부</SelectItem>
            <SelectItem value="학생부">학생부</SelectItem>
            <SelectItem value="어린이">어린이</SelectItem>
            <SelectItem value="새신자">새신자</SelectItem>
            <SelectItem value="전도대상">전도대상</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </>
  );
};

const SermonInputForm: React.FC<SermonInputFormProps> = ({ onInputChange, inputs }) => {
  return (
    <>
      <div>
        <Label htmlFor="title">설교 제목</Label>
        <Input
          id="title"
          value={inputs.title || ''}
          onChange={(e) => onInputChange('title', e.target.value)}
          placeholder="설교 제목을 입력하세요"
        />
      </div>

      <div>
        <Label htmlFor="scripture">본문 말씀</Label>
        <Input
          id="scripture"
          value={inputs.scripture || ''}
          onChange={(e) => onInputChange('scripture', e.target.value)}
          placeholder="예: 요한복음 3:16, 로마서 8:28"
        />
      </div>

      <div>
        <Label htmlFor="theme">설교 주제</Label>
        <Input
          id="theme"
          value={inputs.theme || ''}
          onChange={(e) => onInputChange('theme', e.target.value)}
          placeholder="설교의 핵심 주제를 입력하세요"
        />
      </div>

      <div>
        <Label htmlFor="sermonType">설교 유형</Label>
        <Select onValueChange={(value) => onInputChange('sermonType', value)}>
          <SelectTrigger>
            <SelectValue placeholder="설교 유형을 선택하세요" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="주일예배">주일예배</SelectItem>
            <SelectItem value="수요예배">수요예배</SelectItem>
            <SelectItem value="새벽기도">새벽기도</SelectItem>
            <SelectItem value="금요기도">금요기도</SelectItem>
            <SelectItem value="특별예배">특별예배</SelectItem>
            <SelectItem value="절기예배">절기예배</SelectItem>
            <SelectItem value="전도집회">전도집회</SelectItem>
            <SelectItem value="심방설교">심방설교</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="targetAudience">대상 회중</Label>
        <Select onValueChange={(value) => onInputChange('targetAudience', value)}>
          <SelectTrigger>
            <SelectValue placeholder="대상 회중을 선택하세요" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="전체교인">전체교인</SelectItem>
            <SelectItem value="청년부">청년부</SelectItem>
            <SelectItem value="장년부">장년부</SelectItem>
            <SelectItem value="학생부">학생부</SelectItem>
            <SelectItem value="어린이">어린이</SelectItem>
            <SelectItem value="새신자">새신자</SelectItem>
            <SelectItem value="전도대상">전도대상</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="duration">설교 시간</Label>
        <Select onValueChange={(value) => onInputChange('duration', value)}>
          <SelectTrigger>
            <SelectValue placeholder="설교 시간을 선택하세요" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="10분">10분</SelectItem>
            <SelectItem value="15분">15분</SelectItem>
            <SelectItem value="20분">20분</SelectItem>
            <SelectItem value="25분">25분</SelectItem>
            <SelectItem value="30분">30분</SelectItem>
            <SelectItem value="40분">40분</SelectItem>
            <SelectItem value="50분">50분</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="keyPoints">핵심 메시지 (선택사항)</Label>
        <Textarea
          id="keyPoints"
          value={inputs.keyPoints || ''}
          onChange={(e) => onInputChange('keyPoints', e.target.value)}
          placeholder="설교에서 강조하고 싶은 핵심 포인트들을 입력하세요"
          rows={3}
        />
      </div>
    </>
  );
};

const SermonWriter: React.FC = () => {
  const handleAutoFill = async (basicInfo: SermonInputs): Promise<Partial<SermonInputs>> => {
    // TODO: 실제 API 호출로 대체
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // 기본 정보를 바탕으로 AI가 나머지 필드를 추천
    const suggestions: Partial<SermonInputs> = {};
    
    if (basicInfo.scripture && basicInfo.theme) {
      // 성경 본문과 주제를 기반으로 제목 추천
      const scriptureRef = basicInfo.scripture.split(' ')[0]; // 예: "요한복음"
      suggestions.title = `${basicInfo.theme} - ${scriptureRef}의 교훈`;
      
      // 대상 회중에 따른 설교 유형 추천
      if (basicInfo.targetAudience === '새신자') {
        suggestions.sermonType = '전도집회';
        suggestions.duration = '20분';
      } else if (basicInfo.targetAudience === '어린이') {
        suggestions.sermonType = '주일예배';
        suggestions.duration = '15분';
      } else {
        suggestions.sermonType = '주일예배';
        suggestions.duration = '30분';
      }
      
      // 핵심 메시지 추천
      suggestions.keyPoints = `1. ${basicInfo.theme}의 성경적 의미\n2. 현재 우리 삶에서의 적용\n3. 실천적인 결단과 도전`;
    }
    
    return suggestions;
  };

  const handleGenerate = async (inputs: SermonInputs): Promise<string> => {
    // TODO: 실제 API 호출로 대체
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    return `# ${inputs.title || '설교 제목'}

## 본문: ${inputs.scripture || '성경 구절'}

---

### 서론

오늘 우리가 함께 나눌 하나님의 말씀은 ${inputs.scripture}입니다. 이 말씀을 통해 "${inputs.theme}"에 대해 깊이 묵상해보고자 합니다.

${inputs.targetAudience === '새신자' ? '새로 오신 분들도 쉽게 이해할 수 있도록' : '우리 모두가'} 하나님의 사랑과 은혜를 다시 한번 깨달을 수 있는 시간이 되기를 소망합니다.

### 본론

#### 1. 말씀의 배경
${inputs.scripture}이 기록된 당시의 상황과 배경을 살펴보면...

#### 2. 말씀의 의미
이 말씀이 우리에게 전하고자 하는 핵심 메시지는...

${inputs.keyPoints ? `#### 3. 핵심 적용점\n${inputs.keyPoints.split('\n').map(point => `- ${point}`).join('\n')}` : ''}

#### ${inputs.keyPoints ? '4' : '3'}. 현재적 적용
이 말씀이 오늘을 살아가는 우리에게 주는 교훈과 도전은...

### 결론

결론적으로, 오늘 말씀을 통해 우리는 "${inputs.theme}"에 대한 하나님의 뜻을 깨달았습니다. 

이제 우리가 해야 할 일은 이 말씀을 단순히 듣고 아는 것에 그치지 않고, 삶 속에서 실천하며 살아가는 것입니다.

하나님의 은혜와 사랑이 ${inputs.targetAudience === '전체교인' ? '우리 모든 성도님들' : inputs.targetAudience}과 함께하시기를 축복합니다.

---

*설교 시간: 약 ${inputs.duration || '30분'}*
*대상: ${inputs.targetAudience || '전체교인'}*`;
  };

  return (
    <BaseAITool
      title="설교문 작성 도구"
      description="주제와 성경 구절을 입력하면 설교문 초안을 생성해드립니다."
      icon={BookOpen}
      onGenerate={handleGenerate}
      onAutoFill={handleAutoFill}
      basicFields={<BasicSermonInput onInputChange={() => {}} inputs={{} as SermonInputs} />}
    >
      <SermonInputForm onInputChange={() => {}} inputs={{} as SermonInputs} />
    </BaseAITool>
  );
};

export default SermonWriter;
