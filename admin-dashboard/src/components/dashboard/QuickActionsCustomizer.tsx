import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { Checkbox } from '../ui/checkbox';
import { Badge } from '../ui/badge';
import { GripVertical } from 'lucide-react';
import { AVAILABLE_QUICK_ACTIONS, DEFAULT_QUICK_ACTIONS } from '../../constants/quickActions';

interface QuickActionsCustomizerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedIds: string[];
  onSave: (selectedIds: string[]) => void;
}

const QuickActionsCustomizer: React.FC<QuickActionsCustomizerProps> = ({
  open,
  onOpenChange,
  selectedIds,
  onSave
}) => {
  const [tempSelectedIds, setTempSelectedIds] = useState<string[]>(selectedIds);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  useEffect(() => {
    if (open) {
      setTempSelectedIds(selectedIds);
    }
  }, [open, selectedIds]);

  const handleToggle = (actionId: string) => {
    if (tempSelectedIds.includes(actionId)) {
      setTempSelectedIds(prev => prev.filter(id => id !== actionId));
    } else {
      if (tempSelectedIds.length < 6) {
        setTempSelectedIds(prev => [...prev, actionId]);
      }
    }
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
    setDragOverIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    // 실시간 배열 재정렬
    const newSelectedIds = [...tempSelectedIds];
    const draggedItem = newSelectedIds[draggedIndex];
    newSelectedIds.splice(draggedIndex, 1);
    newSelectedIds.splice(index, 0, draggedItem);

    setTempSelectedIds(newSelectedIds);
    setDraggedIndex(index);
    setDragOverIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleSave = () => {
    onSave(tempSelectedIds);
    onOpenChange(false);
  };

  const handleReset = () => {
    setTempSelectedIds(DEFAULT_QUICK_ACTIONS);
  };

  const selectedActions = tempSelectedIds
    .map(id => AVAILABLE_QUICK_ACTIONS.find(action => action.id === id))
    .filter(action => action !== undefined);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>빠른 작업 커스터마이징</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* 선택된 항목 (최대 6개) */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold">
                선택된 항목 ({tempSelectedIds.length}/6)
              </h3>
              <Button
                variant="outline"
                size="sm"
                onClick={handleReset}
              >
                기본값으로 초기화
              </Button>
            </div>
            
            <div className="space-y-2 min-h-[200px] p-4 bg-muted/50 rounded-lg">
              {selectedActions.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  아래에서 항목을 선택해주세요 (최대 6개)
                </p>
              ) : (
                selectedActions.map((action, index) => {
                  if (!action) return null;
                  const isDragging = draggedIndex === index;

                  return (
                    <div
                      key={action.id}
                      draggable
                      onDragStart={() => handleDragStart(index)}
                      onDragOver={(e) => handleDragOver(e, index)}
                      onDragEnd={handleDragEnd}
                      className={`
                        flex items-center justify-between p-3 bg-background border rounded-lg
                        cursor-move hover:shadow-md transition-all duration-200
                        ${isDragging ? 'opacity-40 scale-[0.98]' : 'opacity-100'}
                      `}
                    >
                      <div className="flex items-center gap-3">
                        <GripVertical className="h-5 w-5 text-muted-foreground" />
                        <action.Icon className={`h-5 w-5 ${action.color.replace('bg-', 'text-')}`} />
                        <div>
                          <p className="font-medium">{action.title}</p>
                          <p className="text-xs text-muted-foreground">{action.description}</p>
                        </div>
                      </div>
                      <Badge variant="secondary">{index + 1}번째</Badge>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* 사용 가능한 모든 항목 */}
          <div>
            <h3 className="text-sm font-semibold mb-3">사용 가능한 항목</h3>
            <div className="grid grid-cols-2 gap-3">
              {AVAILABLE_QUICK_ACTIONS.map((action) => {
                const isSelected = tempSelectedIds.includes(action.id);
                const isDisabled = !isSelected && tempSelectedIds.length >= 6;

                return (
                  <div
                    key={action.id}
                    className={`
                      flex items-start gap-3 p-3 border rounded-lg transition-all
                      ${isSelected ? 'bg-primary/5 border-primary' : 'bg-background'}
                      ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:shadow-sm'}
                    `}
                    onClick={() => !isDisabled && handleToggle(action.id)}
                  >
                    <Checkbox
                      checked={isSelected}
                      disabled={isDisabled}
                      onCheckedChange={() => handleToggle(action.id)}
                      className="mt-0.5"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <action.Icon className={`h-4 w-4 flex-shrink-0 ${action.color.replace('bg-', 'text-')}`} />
                        <p className="font-medium text-sm">{action.title}</p>
                      </div>
                      <p className="text-xs text-muted-foreground">{action.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            취소
          </Button>
          <Button onClick={handleSave}>
            저장
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default QuickActionsCustomizer;
