import React from 'react';
import { DeleteConfirmModal as DeleteConfirmModalType } from '../../types/chat';

interface DeleteConfirmModalProps {
  modal: DeleteConfirmModalType;
  onClose: () => void;
  onConfirm: () => void;
  isDeleting?: boolean;
  deleteProgress?: { current: number; total: number; currentTitle: string };
}

const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  modal,
  onClose,
  onConfirm,
  isDeleting = false,
  deleteProgress
}) => {
  if (!modal.isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">
          채팅을 삭제하시겠습니까?
        </h3>
        <p className="text-gray-600 mb-2">
          "{modal.chatTitle}" 채팅이 영구적으로 삭제됩니다.
        </p>
        <p className="text-sm text-gray-500 mb-6">
          {isDeleting ? '삭제 중입니다... 잠시만 기다려주세요.' : '이 작업은 되돌릴 수 없습니다. 정말로 삭제하시겠습니까?'}
        </p>
        
        {isDeleting && deleteProgress && deleteProgress.total > 0 && (
          <div className="mb-6 space-y-3">
            {/* 진행률 바 */}
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className="bg-red-500 h-3 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${Math.min((deleteProgress.current / deleteProgress.total) * 100, 100)}%` }}
              ></div>
            </div>
            
            {/* 진행률 텍스트 */}
            <div className="text-center space-y-2">
              <div className="text-sm font-medium text-gray-700">
                {deleteProgress.current} / {deleteProgress.total} 완료
                <span className="ml-2 text-red-600">
                  ({Math.round((deleteProgress.current / deleteProgress.total) * 100)}%)
                </span>
              </div>
              
              {/* 현재 삭제 중인 채팅 제목 */}
              {deleteProgress.currentTitle && deleteProgress.current < deleteProgress.total && (
                <div className="text-xs text-gray-500 truncate max-w-sm mx-auto">
                  삭제 중: "{deleteProgress.currentTitle}"
                </div>
              )}
              
              {/* 완료 메시지 */}
              {deleteProgress.current >= deleteProgress.total && (
                <div className="text-sm text-green-600 font-medium">
                  ✅ 모든 채팅 삭제 완료!
                </div>
              )}
            </div>
          </div>
        )}
        
        {isDeleting && (!deleteProgress || deleteProgress.total === 0) && (
          <div className="flex justify-center mb-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
          </div>
        )}
        
        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            disabled={isDeleting}
            className={`px-4 py-2 rounded-md transition-colors ${
              isDeleting 
                ? 'text-gray-400 bg-gray-100 cursor-not-allowed' 
                : 'text-gray-700 bg-gray-100 hover:bg-gray-200'
            }`}
          >
            취소
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className={`px-4 py-2 text-white rounded-md transition-colors flex items-center justify-center space-x-2 min-w-[80px] ${
              isDeleting 
                ? 'bg-red-400 cursor-not-allowed' 
                : 'bg-red-600 hover:bg-red-700'
            }`}
          >
            {isDeleting && (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-1"></div>
            )}
            <span>{isDeleting ? '삭제 중...' : '삭제'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmModal;
