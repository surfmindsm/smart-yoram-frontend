import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FileText, 
  Megaphone, 
  BookOpen, 
  Heart, 
  Calendar, 
  UserCheck,
  PenTool,
  MessageSquare
} from 'lucide-react';
import { Button } from './ui/button';

interface AITool {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  category: string;
}

const AITools: React.FC = () => {
  const navigate = useNavigate();

  const aiTools: AITool[] = [
    {
      id: 'sermon-writer',
      title: '설교문 작성 도구',
      description: '주제와 성경 구절을 입력하면 설교문 초안을 생성해드립니다.',
      icon: BookOpen,
      category: '예배'
    },
    {
      id: 'prayer-generator',
      title: '기도문 생성기',
      description: '상황과 목적에 맞는 기도문을 자동으로 생성합니다.',
      icon: Heart,
      category: '예배'
    },
    {
      id: 'announcement-writer',
      title: '공지사항 작성 도구',
      description: '교회 행사나 소식을 위한 공지사항을 작성해드립니다.',
      icon: Megaphone,
      category: '행정'
    },
    {
      id: 'bulletin-content',
      title: '주보 콘텐츠 생성',
      description: '주보에 들어갈 다양한 콘텐츠를 생성합니다.',
      icon: FileText,
      category: '예배'
    },
    {
      id: 'pastoral-report',
      title: '심방 보고서 작성',
      description: '심방 내용을 정리하여 체계적인 보고서를 작성합니다.',
      icon: UserCheck,
      category: '목양'
    },
    {
      id: 'event-planner',
      title: '교회 행사 기획서',
      description: '교회 행사 기획을 위한 상세한 계획서를 생성합니다.',
      icon: Calendar,
      category: '행정'
    },
    {
      id: 'letter-writer',
      title: '교회 편지 작성',
      description: '교인들에게 보낼 편지나 안내문을 작성해드립니다.',
      icon: PenTool,
      category: '소통'
    },
    {
      id: 'counseling-notes',
      title: '상담 기록 정리',
      description: '상담 내용을 체계적으로 정리하고 요약합니다.',
      icon: MessageSquare,
      category: '목양'
    }
  ];

  const categories = ['전체', ...Array.from(new Set(aiTools.map(tool => tool.category)))];
  const [selectedCategory, setSelectedCategory] = React.useState('전체');

  const filteredTools = selectedCategory === '전체' 
    ? aiTools 
    : aiTools.filter(tool => tool.category === selectedCategory);

  const handleToolClick = (toolId: string) => {
    navigate(`/ai-tools/${toolId}`);
  };

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">AI Tools</h1>
        <p className="text-slate-600">
          다양한 AI 도구를 활용하여 교회 업무를 효율적으로 처리하세요.
        </p>
      </div>

      {/* 카테고리 필터 */}
      <div className="mb-6">
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </Button>
          ))}
        </div>
      </div>

      {/* 도구 카드 그리드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredTools.map((tool) => {
          const IconComponent = tool.icon;
          return (
            <div
              key={tool.id}
              className="bg-white rounded-lg border border-slate-200 p-6 hover:shadow-md transition-shadow cursor-pointer group"
              onClick={() => handleToolClick(tool.id)}
            >
              <div className="flex items-center mb-4">
                <div className="p-2 bg-sky-50 rounded-lg mr-3 group-hover:bg-sky-100 transition-colors">
                  <IconComponent className="h-6 w-6 text-sky-600" />
                </div>
                <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-full">
                  {tool.category}
                </span>
              </div>
              
              <h3 className="text-lg font-semibold text-slate-900 mb-2 group-hover:text-sky-700 transition-colors">
                {tool.title}
              </h3>
              
              <p className="text-slate-600 text-sm leading-relaxed">
                {tool.description}
              </p>
              
              <div className="mt-4 pt-4 border-t border-slate-100">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="w-full text-sky-600 hover:text-sky-700 hover:bg-sky-50"
                >
                  도구 사용하기 →
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {filteredTools.length === 0 && (
        <div className="text-center py-12">
          <p className="text-slate-500">선택한 카테고리에 해당하는 도구가 없습니다.</p>
        </div>
      )}
    </div>
  );
};

export default AITools;
