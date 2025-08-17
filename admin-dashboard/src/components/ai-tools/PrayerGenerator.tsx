import React from 'react';
import { Heart } from 'lucide-react';
import BaseAITool from './BaseAITool';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Checkbox } from '../ui/checkbox';

interface PrayerInputs {
  title: string;
  prayerType: string;
  occasion: string;
  duration: string;
  specificRequests: string;
  scriptureReference: string;
  includeElements: string[];
}

interface PrayerInputFormProps {
  onInputChange: (key: string, value: any) => void;
  inputs: PrayerInputs;
}

const PrayerInputForm: React.FC<PrayerInputFormProps> = ({ onInputChange, inputs }) => {
  const prayerElements = [
    { id: 'praise', label: '찬양과 경배' },
    { id: 'confession', label: '회개' },
    { id: 'thanksgiving', label: '감사' },
    { id: 'intercession', label: '중보기도' },
    { id: 'petition', label: '간구' },
    { id: 'blessing', label: '축복' }
  ];

  const handleElementChange = (elementId: string, checked: boolean) => {
    const currentElements = inputs.includeElements || [];
    const newElements = checked 
      ? [...currentElements, elementId]
      : currentElements.filter(id => id !== elementId);
    onInputChange('includeElements', newElements);
  };

  return (
    <>
      <div>
        <Label htmlFor="title">기도 제목</Label>
        <Input
          id="title"
          value={inputs.title || ''}
          onChange={(e) => onInputChange('title', e.target.value)}
          placeholder="기도의 제목을 입력하세요"
        />
      </div>

      <div>
        <Label htmlFor="prayerType">기도 유형</Label>
        <Select onValueChange={(value) => onInputChange('prayerType', value)}>
          <SelectTrigger>
            <SelectValue placeholder="기도 유형을 선택하세요" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="개인기도">개인기도</SelectItem>
            <SelectItem value="공동기도">공동기도</SelectItem>
            <SelectItem value="대표기도">대표기도</SelectItem>
            <SelectItem value="중보기도">중보기도</SelectItem>
            <SelectItem value="치유기도">치유기도</SelectItem>
            <SelectItem value="축복기도">축복기도</SelectItem>
            <SelectItem value="회개기도">회개기도</SelectItem>
            <SelectItem value="감사기도">감사기도</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="occasion">기도 상황/목적</Label>
        <Select onValueChange={(value) => onInputChange('occasion', value)}>
          <SelectTrigger>
            <SelectValue placeholder="기도할 상황이나 목적을 선택하세요" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="주일예배">주일예배</SelectItem>
            <SelectItem value="새벽기도">새벽기도</SelectItem>
            <SelectItem value="수요예배">수요예배</SelectItem>
            <SelectItem value="특별집회">특별집회</SelectItem>
            <SelectItem value="심방기도">심방기도</SelectItem>
            <SelectItem value="병원심방">병원심방</SelectItem>
            <SelectItem value="결혼식">결혼식</SelectItem>
            <SelectItem value="장례식">장례식</SelectItem>
            <SelectItem value="입학/졸업">입학/졸업</SelectItem>
            <SelectItem value="새해">새해</SelectItem>
            <SelectItem value="추수감사절">추수감사절</SelectItem>
            <SelectItem value="부활절">부활절</SelectItem>
            <SelectItem value="성탄절">성탄절</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="duration">기도 길이</Label>
        <Select onValueChange={(value) => onInputChange('duration', value)}>
          <SelectTrigger>
            <SelectValue placeholder="기도 길이를 선택하세요" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="짧은기도">짧은 기도 (1-2분)</SelectItem>
            <SelectItem value="보통기도">보통 기도 (3-5분)</SelectItem>
            <SelectItem value="긴기도">긴 기도 (5-10분)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="scriptureReference">참고 성경구절 (선택사항)</Label>
        <Input
          id="scriptureReference"
          value={inputs.scriptureReference || ''}
          onChange={(e) => onInputChange('scriptureReference', e.target.value)}
          placeholder="예: 시편 23편, 요한복음 3:16"
        />
      </div>

      <div>
        <Label>포함할 기도 요소</Label>
        <div className="grid grid-cols-2 gap-3 mt-2">
          {prayerElements.map((element) => (
            <div key={element.id} className="flex items-center space-x-2">
              <Checkbox
                id={element.id}
                checked={(inputs.includeElements || []).includes(element.id)}
                onCheckedChange={(checked) => handleElementChange(element.id, checked as boolean)}
              />
              <Label htmlFor={element.id} className="text-sm font-normal">
                {element.label}
              </Label>
            </div>
          ))}
        </div>
      </div>

      <div>
        <Label htmlFor="specificRequests">구체적인 기도 제목 (선택사항)</Label>
        <Textarea
          id="specificRequests"
          value={inputs.specificRequests || ''}
          onChange={(e) => onInputChange('specificRequests', e.target.value)}
          placeholder="특별히 기도하고 싶은 내용이나 상황을 구체적으로 적어주세요"
          rows={3}
        />
      </div>
    </>
  );
};

const PrayerGenerator: React.FC = () => {
  const handleGenerate = async (inputs: PrayerInputs): Promise<string> => {
    // TODO: 실제 API 호출로 대체
    await new Promise(resolve => setTimeout(resolve, 2500));
    
    const elementLabels = {
      praise: '찬양과 경배',
      confession: '회개',
      thanksgiving: '감사',
      intercession: '중보기도', 
      petition: '간구',
      blessing: '축복'
    };

    const includeElementsText = (inputs.includeElements || [])
      .map(id => elementLabels[id as keyof typeof elementLabels])
      .join(', ');

    return `# ${inputs.title || '기도'}

---

## 기도의 시작

사랑하는 하나님 아버지,
${inputs.prayerType === '공동기도' ? '우리가 한마음으로 주님 앞에 나아갑니다.' : '주님 앞에 겸손히 나아갑니다.'}

${inputs.scriptureReference ? `주님의 말씀 ${inputs.scriptureReference}을 의지하며 기도드립니다.` : ''}

${inputs.includeElements?.includes('praise') ? `
## 찬양과 경배

주님은 우리의 왕이시며 창조주이십니다. 
천지만물을 지으시고 우리를 사랑으로 만드신 아버지께 찬양과 영광을 올려드립니다.
주님의 거룩하심과 선하심을 찬양합니다.
` : ''}

${inputs.includeElements?.includes('confession') ? `
## 회개

주님 앞에서 우리의 부족함과 죄를 고백합니다.
때로는 주님의 뜻보다 우리의 뜻을 앞세웠고, 
사랑하지 못하고 용서하지 못한 마음들이 있었습니다.
주님의 보혈로 우리를 깨끗게 하시고 용서해 주시옵소서.
` : ''}

${inputs.includeElements?.includes('thanksgiving') ? `
## 감사

${inputs.occasion === '추수감사절' ? '풍성한 열매를 주시고' : '오늘까지 지켜주시고 인도해주신'} 하나님의 은혜에 감사드립니다.
${inputs.prayerType === '공동기도' ? '우리 공동체를' : '저를'} 사랑으로 돌보시고 
필요한 모든 것을 공급해 주신 주님께 진심으로 감사드립니다.
` : ''}

${inputs.specificRequests ? `
## 간구와 중보

${inputs.specificRequests}

이 모든 일들을 주님께서 선하신 뜻대로 인도해 주시옵소서.
` : ''}

${inputs.includeElements?.includes('intercession') ? `
## 중보기도

우리 교회와 목회자들을 위해 기도합니다.
주님의 말씀이 능력 있게 선포되고, 성도들이 믿음 안에서 성장하게 하옵소서.

우리나라와 민족을 위해 기도하며, 
고통받는 이웃들과 어려운 상황에 있는 모든 분들을 위해 기도합니다.
` : ''}

${inputs.includeElements?.includes('blessing') ? `
## 축복

${inputs.occasion === '결혼식' ? '새로운 가정을 이루는 두 사람을 축복하시고' : 
  inputs.occasion === '새해' ? '새로운 한 해를 주님의 은혜로 시작하게 하시고' :
  inputs.prayerType === '공동기도' ? '우리 모든 성도들을' : '저를'} 
주님의 사랑과 평강으로 채워주시옵소서.

주님의 지혜와 능력이 함께하시고, 
범사에 감사하며 기쁨으로 살아가게 하옵소서.
` : ''}

## 기도의 마침

이 모든 기도를 우리 주 예수 그리스도의 이름으로 기도드립니다.

아멘.

---

*기도 유형: ${inputs.prayerType || '개인기도'}*
*상황/목적: ${inputs.occasion || '일반'}*
*포함 요소: ${includeElementsText || '없음'}*`;
  };

  return (
    <BaseAITool
      title="기도문 생성기"
      description="상황과 목적에 맞는 기도문을 자동으로 생성합니다."
      icon={Heart}
      onGenerate={handleGenerate}
    >
      <PrayerInputForm onInputChange={() => {}} inputs={{} as PrayerInputs} />
    </BaseAITool>
  );
};

export default PrayerGenerator;
