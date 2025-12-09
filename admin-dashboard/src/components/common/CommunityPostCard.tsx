/**
 * 커뮤니티 게시글 카드 공통 컴포넌트
 *
 * @description 모든 커뮤니티 게시글에서 사용할 수 있는 공통 카드 컴포넌트입니다.
 * @version 2.0.0
 * @since 2025-09-15
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Eye,
  Heart,
  MessageCircle,
  MapPin,
  Clock,
  User,
  Building
} from 'lucide-react';
import { CommunityBasePost, CommunityModule } from '../../types';
import { getStatusLabel, getStatusClass } from '../../utils/status-mapping';
import { formatCreatedAt } from '../../utils/dateUtils';

interface CommunityPostCardProps {
  post: CommunityBasePost;
  module: CommunityModule;
  showAuthor?: boolean;
  showLocation?: boolean;
  showStats?: boolean;
  showDescription?: boolean;
  className?: string;
  onView?: () => void;
  onLike?: () => void;
  onComment?: () => void;
}

export const CommunityPostCard: React.FC<CommunityPostCardProps> = ({
  post,
  module,
  showAuthor = true,
  showLocation = true,
  showStats = true,
  showDescription = true,
  className = '',
  onView,
  onLike,
  onComment
}) => {
  const navigate = useNavigate();

  const handleCardClick = () => {
    if (onView) {
      onView();
    }
    navigate(getDetailPath(module, post.id));
  };

  const handleLikeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onLike) {
      onLike();
    }
  };

  const handleCommentClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onComment) {
      onComment();
    }
  };

  return (
    <div
      className={`bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow cursor-pointer p-6 ${className}`}
      onClick={handleCardClick}
    >
      {/* 헤더 - 제목과 상태 */}
      <div className="flex items-start justify-between mb-3">
        <h3 className="text-lg font-semibold text-gray-900 line-clamp-2 flex-1 mr-3">
          {post.title}
        </h3>
        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${getStatusClass(post.status)}`}>
          {getStatusLabel(post.status)}
        </span>
      </div>

      {/* 설명 */}
      {showDescription && post.description && (
        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
          {post.description}
        </p>
      )}

      {/* 메타 정보 */}
      <div className="space-y-2 mb-4">
        {/* 작성자 정보 */}
        {showAuthor && (
          <div className="flex items-center text-sm text-gray-600">
            <User className="h-4 w-4 mr-2 text-gray-400" />
            <span className="font-medium">{post.author_name || '익명'}</span>
            {post.church_name && (
              <>
                <span className="mx-2">•</span>
                <Building className="h-4 w-4 mr-1 text-gray-400" />
                <span>{post.church_name}</span>
              </>
            )}
          </div>
        )}

        {/* 위치 정보 */}
        {showLocation && 'location' in post && (post as any).location && (
          <div className="flex items-center text-sm text-gray-600">
            <MapPin className="h-4 w-4 mr-2 text-red-400" />
            <span>{(post as any).location}</span>
          </div>
        )}

        {/* 등록일 */}
        <div className="flex items-center text-sm text-gray-500">
          <Clock className="h-4 w-4 mr-2 text-gray-400" />
          <span>{formatCreatedAt(post.created_at)}</span>
        </div>
      </div>

      {/* 통계 정보 */}
      {showStats && (
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <div className="flex items-center space-x-4 text-sm text-gray-500">
            {/* 조회수 */}
            <div className="flex items-center">
              <Eye className="h-4 w-4 mr-1" />
              <span>{post.view_count || 0}</span>
            </div>

            {/* 좋아요 */}
            <button
              onClick={handleLikeClick}
              className="flex items-center hover:text-red-500 transition-colors"
            >
              <Heart className="h-4 w-4 mr-1" />
              <span>{post.likes || 0}</span>
            </button>

            {/* 댓글 */}
            {post.comments !== undefined && (
              <button
                onClick={handleCommentClick}
                className="flex items-center hover:text-primary-500 transition-colors"
              >
                <MessageCircle className="h-4 w-4 mr-1" />
                <span>{post.comments || 0}</span>
              </button>
            )}
          </div>

          {/* 모듈별 추가 정보 */}
          <div className="text-xs text-gray-400">
            {getModuleLabel(module)}
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * 모듈에 따른 상세 페이지 경로 생성
 */
function getDetailPath(module: CommunityModule, id: number): string {
  const pathMap: Record<CommunityModule, string> = {
    'sharing': `/community/free-sharing/${id}`,
    'request': `/community/item-request/${id}`,
    'offer': `/community/item-sale/${id}`,
    'job-post': `/community/job-posting/${id}`,
    'job-seeker': `/community/job-seeking/${id}`,
    'music-recruitment': `/community/music-team-recruitment/${id}`,
    'music-seeker': `/community/music-team-seeking/${id}`,
    'church-event': `/community/church-events/${id}`,
    'church-news': `/community/church-news/${id}`
  };

  return pathMap[module] || `/community/${module}/${id}`;
}

/**
 * 모듈 라벨 반환
 */
function getModuleLabel(module: CommunityModule): string {
  const labelMap: Record<CommunityModule, string> = {
    'sharing': '무료나눔',
    'request': '물품요청',
    'offer': '물품판매',
    'job-post': '구인공고',
    'job-seeker': '구직신청',
    'music-recruitment': '음악팀모집',
    'music-seeker': '음악팀지원',
    'church-event': '교회행사',
    'church-news': '교회소식'
  };

  return labelMap[module] || module;
}

export default CommunityPostCard;