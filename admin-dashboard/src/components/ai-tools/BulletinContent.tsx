import React from 'react';
import { FileText } from 'lucide-react';
import BaseAITool from './BaseAITool';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Checkbox } from '../ui/checkbox';

interface BulletinInputs {
  date: string;
  season: string;
  sermonTitle: string;
  sermonScripture: string;
  preacher: string;
  specialEvents: string;
  announcements: string;
  worship: {
    callToWorship: boolean;
    hymns: string;
    offertory: boolean;
    communion: boolean;
  };
  prayers: {
    pastoral: boolean;
    congregation: boolean;
    intercession: boolean;
  };
  additionalSections: string[];
}

interface BulletinInputFormProps {
  onInputChange: (key: string, value: any) => void;
  inputs: BulletinInputs;
}

const BulletinInputForm: React.FC<BulletinInputFormProps> = ({ onInputChange, inputs }) => {
  const sectionOptions = [
    { id: 'birthdays', label: '생일자 축하' },
    { id: 'visitors', label: '새가족 소개' },
    { id: 'mission', label: '선교 소식' },
    { id: 'ministries', label: '사역 안내' },
    { id: 'prayer-list', label: '기도 제목' },
    { id: 'testimonies', label: '간증' }
  ];

  const handleWorshipChange = (key: string, value: boolean) => {
    onInputChange('worship', { ...(inputs.worship || {}), [key]: value });
  };

  const handlePrayerChange = (key: string, value: boolean) => {
    onInputChange('prayers', { ...(inputs.prayers || {}), [key]: value });
  };

  const handleSectionChange = (sectionId: string, checked: boolean) => {
    const currentSections = inputs.additionalSections || [];
    const newSections = checked 
      ? [...currentSections, sectionId]
      : currentSections.filter(id => id !== sectionId);
    onInputChange('additionalSections', newSections);
  };

  return (
    <>
      <div>
        <Label htmlFor="date">예배 날짜</Label>
        <Input
          id="date"
          type="date"
          value={inputs.date || ''}
          onChange={(e) => onInputChange('date', e.target.value)}
        />
      </div>

      <div>
        <Label htmlFor="season">교회력/절기</Label>
        <Select onValueChange={(value) => onInputChange('season', value)}>
          <SelectTrigger>
            <SelectValue placeholder="해당하는 절기를 선택하세요" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="일반">일반</SelectItem>
            <SelectItem value="대림절">대림절</SelectItem>
            <SelectItem value="성탄절">성탄절</SelectItem>
            <SelectItem value="신정">신정</SelectItem>
            <SelectItem value="사순절">사순절</SelectItem>
            <SelectItem value="부활절">부활절</SelectItem>
            <SelectItem value="성령강림절">성령강림절</SelectItem>
            <SelectItem value="추수감사절">추수감사절</SelectItem>
            <SelectItem value="종교개혁주일">종교개혁주일</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="sermonTitle">설교 제목</Label>
        <Input
          id="sermonTitle"
          value={inputs.sermonTitle || ''}
          onChange={(e) => onInputChange('sermonTitle', e.target.value)}
          placeholder="설교 제목을 입력하세요"
        />
      </div>

      <div>
        <Label htmlFor="sermonScripture">설교 본문</Label>
        <Input
          id="sermonScripture"
          value={inputs.sermonScripture || ''}
          onChange={(e) => onInputChange('sermonScripture', e.target.value)}
          placeholder="예: 마태복음 5:3-12"
        />
      </div>

      <div>
        <Label htmlFor="preacher">설교자</Label>
        <Input
          id="preacher"
          value={inputs.preacher || ''}
          onChange={(e) => onInputChange('preacher', e.target.value)}
          placeholder="설교자명을 입력하세요"
        />
      </div>

      <div>
        <Label htmlFor="hymns">찬송가 번호</Label>
        <Input
          id="hymns"
          value={inputs.worship?.hymns || ''}
          onChange={(e) => onInputChange('worship', { ...(inputs.worship || {}), hymns: e.target.value })}
          placeholder="예: 1장, 23장, 456장"
        />
      </div>

      <div>
        <Label>예배 순서</Label>
        <div className="grid grid-cols-2 gap-3 mt-2">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="callToWorship"
              checked={inputs.worship?.callToWorship || false}
              onCheckedChange={(checked) => handleWorshipChange('callToWorship', checked as boolean)}
            />
            <Label htmlFor="callToWorship" className="text-sm font-normal">
              예배로의 부름
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="offertory"
              checked={inputs.worship?.offertory || false}
              onCheckedChange={(checked) => handleWorshipChange('offertory', checked as boolean)}
            />
            <Label htmlFor="offertory" className="text-sm font-normal">
              헌금
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="communion"
              checked={inputs.worship?.communion || false}
              onCheckedChange={(checked) => handleWorshipChange('communion', checked as boolean)}
            />
            <Label htmlFor="communion" className="text-sm font-normal">
              성찬식
            </Label>
          </div>
        </div>
      </div>

      <div>
        <Label>기도 시간</Label>
        <div className="grid grid-cols-2 gap-3 mt-2">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="pastoral"
              checked={inputs.prayers?.pastoral || false}
              onCheckedChange={(checked) => handlePrayerChange('pastoral', checked as boolean)}
            />
            <Label htmlFor="pastoral" className="text-sm font-normal">
              목회기도
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="congregation"
              checked={inputs.prayers?.congregation || false}
              onCheckedChange={(checked) => handlePrayerChange('congregation', checked as boolean)}
            />
            <Label htmlFor="congregation" className="text-sm font-normal">
              회중기도
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="intercession"
              checked={inputs.prayers?.intercession || false}
              onCheckedChange={(checked) => handlePrayerChange('intercession', checked as boolean)}
            />
            <Label htmlFor="intercession" className="text-sm font-normal">
              중보기도
            </Label>
          </div>
        </div>
      </div>

      <div>
        <Label>추가 섹션</Label>
        <div className="grid grid-cols-2 gap-3 mt-2">
          {sectionOptions.map((section) => (
            <div key={section.id} className="flex items-center space-x-2">
              <Checkbox
                id={section.id}
                checked={(inputs.additionalSections || []).includes(section.id)}
                onCheckedChange={(checked) => handleSectionChange(section.id, checked as boolean)}
              />
              <Label htmlFor={section.id} className="text-sm font-normal">
                {section.label}
              </Label>
            </div>
          ))}
        </div>
      </div>

      <div>
        <Label htmlFor="specialEvents">특별 행사/안내</Label>
        <Textarea
          id="specialEvents"
          value={inputs.specialEvents || ''}
          onChange={(e) => onInputChange('specialEvents', e.target.value)}
          placeholder="특별한 행사나 안내사항이 있으면 입력하세요"
          rows={2}
        />
      </div>

      <div>
        <Label htmlFor="announcements">주요 공지사항</Label>
        <Textarea
          id="announcements"
          value={inputs.announcements || ''}
          onChange={(e) => onInputChange('announcements', e.target.value)}
          placeholder="주보에 포함할 주요 공지사항을 입력하세요"
          rows={3}
        />
      </div>
    </>
  );
};

const BulletinContent: React.FC = () => {
  const handleGenerate = async (inputs: BulletinInputs): Promise<string> => {
    // TODO: 실제 API 호출로 대체
    await new Promise(resolve => setTimeout(resolve, 2500));
    
    const formatDate = (dateStr: string) => {
      if (!dateStr) return '';
      const date = new Date(dateStr);
      return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`;
    };

    const getDayOfWeek = (dateStr: string) => {
      if (!dateStr) return '';
      const days = ['일', '월', '화', '수', '목', '금', '토'];
      const date = new Date(dateStr);
      return days[date.getDay()];
    };

    return `# 주 보
## ${formatDate(inputs.date)} ${getDayOfWeek(inputs.date)}요일 ${inputs.season !== '일반' ? `(${inputs.season})` : ''}

---

## 📖 오늘의 말씀

**"${inputs.sermonTitle}"**
*${inputs.sermonScripture}*
설교자: ${inputs.preacher}

---

## 🎵 예배 순서

${inputs.worship?.callToWorship ? '**예배로의 부름**\n' : ''}
**찬양과 경배**
${inputs.worship?.hymns ? `찬송가: ${inputs.worship.hymns}` : ''}

${inputs.prayers?.pastoral ? '**목회기도**\n' : ''}
${inputs.prayers?.congregation ? '**회중기도**\n' : ''}

**말씀 선포**
${inputs.sermonTitle} (${inputs.sermonScripture})

${inputs.prayers?.intercession ? '**중보기도**\n' : ''}
${inputs.worship?.offertory ? '**헌금**\n' : ''}
${inputs.worship?.communion ? '**성찬식**\n' : ''}

**축도**

---

${inputs.announcements ? `## 📢 주요 공지사항

${inputs.announcements}

---
` : ''}

${inputs.specialEvents ? `## 🎉 특별 행사

${inputs.specialEvents}

---
` : ''}

${(inputs.additionalSections || []).includes('visitors') ? `## 🤝 새가족을 환영합니다

오늘 처음 우리 교회에 오신 새가족 여러분을 진심으로 환영합니다.
하나님의 사랑과 은혜가 함께하시기를 축복합니다.

---
` : ''}

${(inputs.additionalSections || []).includes('birthdays') ? `## 🎂 생일 축하

이번 주 생일을 맞으신 성도님들을 축하드립니다.
하나님의 축복이 가득한 새로운 한 해 되시기를 기도합니다.

---
` : ''}

${(inputs.additionalSections || []).includes('prayer-list') ? `## 🙏 함께 기도해요

**감사 제목**
- 

**기도 제목**
- 

---
` : ''}

${(inputs.additionalSections || []).includes('mission') ? `## 🌍 선교 소식

우리 교회가 후원하는 선교사님들과 선교지를 위해 기도해주세요.

---
` : ''}

${(inputs.additionalSections || []).includes('ministries') ? `## ⛪ 사역 안내

**교육부**
- 

**청년부**
- 

**장년부**
- 

---
` : ''}

## 💌 마침 인사

${inputs.season === '성탄절' ? '임마누엘의 하나님께서 여러분과 함께하시기를 축복합니다.' :
  inputs.season === '부활절' ? '부활하신 주님의 능력과 소망이 여러분과 함께하시기를 축복합니다.' :
  inputs.season === '추수감사절' ? '하나님의 풍성한 은혜에 감사하며, 더욱 큰 축복이 여러분과 함께하시기를 기도합니다.' :
  '하나님의 사랑과 은혜가 여러분과 함께하시고, 한 주간 평안하시기를 축복합니다.'}

---

*${formatDate(inputs.date)} 주보 | ${inputs.preacher} 목사*`;
  };

  return (
    <BaseAITool
      title="주보 콘텐츠 생성"
      description="주보에 들어갈 다양한 콘텐츠를 생성합니다."
      icon={FileText}
      onGenerate={handleGenerate}
    >
      <BulletinInputForm onInputChange={() => {}} inputs={{} as BulletinInputs} />
    </BaseAITool>
  );
};

export default BulletinContent;
