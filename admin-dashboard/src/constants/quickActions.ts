import {
  Users, Building2, Home, Heart, Calculator, HandCoins,
  Clock, FileText, Bell, Info, Calendar
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface QuickAction {
  id: string;
  title: string;
  description: string;
  Icon: LucideIcon;
  link: string;
  color: string;
}

export const AVAILABLE_QUICK_ACTIONS: QuickAction[] = [
  {
    id: 'member-management',
    title: '교인관리',
    description: '교인 정보를 조회하고 관리합니다',
    Icon: Users,
    link: '/member-management',
    color: 'bg-primary-500'
  },
  {
    id: 'organization-management',
    title: '조직관리',
    description: '교회 조직을 관리합니다',
    Icon: Building2,
    link: '/organization-management',
    color: 'bg-blue-500'
  },
  {
    id: 'pastoral-care',
    title: '심방신청관리',
    description: '심방 신청을 관리합니다',
    Icon: Home,
    link: '/pastoral-care',
    color: 'bg-pink-500'
  },
  {
    id: 'prayer-requests',
    title: '중보기도 관리',
    description: '중보기도 요청을 관리합니다',
    Icon: Heart,
    link: '/prayer-requests',
    color: 'bg-red-500'
  },
  {
    id: 'accounting',
    title: '회계관리',
    description: '교회 회계 내역을 관리합니다',
    Icon: Calculator,
    link: '/accounting',
    color: 'bg-green-500'
  },
  {
    id: 'donations',
    title: '헌금관리',
    description: '헌금 내역을 조회하고 관리합니다',
    Icon: HandCoins,
    link: '/donations',
    color: 'bg-yellow-500'
  },
  {
    id: 'service-times',
    title: '예배시간',
    description: '예배 시간을 관리합니다',
    Icon: Clock,
    link: '/service-times',
    color: 'bg-purple-500'
  },
  {
    id: 'bulletins',
    title: '주보관리',
    description: '주보를 작성하고 관리합니다',
    Icon: FileText,
    link: '/bulletins',
    color: 'bg-indigo-500'
  },
  {
    id: 'announcements',
    title: '공지사항',
    description: '교회 공지사항을 관리합니다',
    Icon: Bell,
    link: '/announcements',
    color: 'bg-orange-500'
  },
  {
    id: 'church-info',
    title: '교회정보',
    description: '교회 기본 정보를 관리합니다',
    Icon: Info,
    link: '/church-info',
    color: 'bg-cyan-500'
  },
  {
    id: 'schedule-management',
    title: '일정관리',
    description: '교회 일정을 관리합니다',
    Icon: Calendar,
    link: '/important-dates',
    color: 'bg-teal-500'
  }
];

export const DEFAULT_QUICK_ACTIONS = [
  'member-management',
  'pastoral-care',
  'accounting',
  'donations',
  'bulletins',
  'announcements'
];
