import { useState } from 'react';
import useStore from '../store/useStore';

function formatDate(isoString) {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now - date;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return '오늘';
  if (diffDays === 1) return '어제';
  if (diffDays < 7) return `${diffDays}일 전`;

  return date.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' });
}

function formatTime(isoString) {
  return new Date(isoString).toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function groupByDate(items) {
  const groups = {};
  items.forEach((item) => {
    const key = formatDate(item.timestamp);
    if (!groups[key]) groups[key] = [];
    groups[key].push(item);
  });
  return groups;
}

export default function HistoryList({ onView }) {
  const { history, deleteHistory, toggleStar, showToast } = useStore();
  const [sortBy, setSortBy] = useState('recent'); // 'recent' | 'starred'
  const [expandedId, setExpandedId] = useState(null);

  const sorted = [...history].sort((a, b) => {
    if (sortBy === 'starred') {
      if (a.starred !== b.starred) return a.starred ? -1 : 1;
    }
    return new Date(b.timestamp) - new Date(a.timestamp);
  });

  const grouped = groupByDate(sorted);

  const handleDelete = (id, e) => {
    e.stopPropagation();
    deleteHistory(id);
    showToast('삭제되었습니다.');
  };

  const handleStar = (id, e) => {
    e.stopPropagation();
    toggleStar(id);
  };

  if (history.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <span className="text-5xl mb-4">📭</span>
        <p className="text-gray-500 dark:text-gray-400 font-medium">요약 히스토리가 없습니다</p>
        <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">기사를 요약하면 여기에 저장됩니다</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {/* Sort control */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 dark:border-gray-700">
        <span className="text-xs text-gray-500 dark:text-gray-400 mr-1">정렬:</span>
        {[
          { key: 'recent', label: '최신순' },
          { key: 'starred', label: '즐겨찾기순' },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setSortBy(key)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
              sortBy === key
                ? 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            {label}
          </button>
        ))}
        <span className="ml-auto text-xs text-gray-400">{history.length}개</span>
      </div>

      {/* Groups */}
      {Object.entries(grouped).map(([dateLabel, items]) => (
        <div key={dateLabel}>
          {/* Date header */}
          <div className="sticky top-0 px-4 py-2 bg-gray-50 dark:bg-gray-800/80 backdrop-blur-sm border-b border-gray-100 dark:border-gray-700 z-10">
            <span className="text-xs font-bold text-gray-500 dark:text-gray-400">{dateLabel}</span>
          </div>

          {/* Items */}
          {items.map((item) => {
            const isExpanded = expandedId === item.id;
            return (
              <div
                key={item.id}
                className="border-b border-gray-50 dark:border-gray-700/50 last:border-0"
              >
                <div
                  className="px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/30 cursor-pointer transition-colors"
                  onClick={() => setExpandedId(isExpanded ? null : item.id)}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      {/* Title or snippet */}
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {item.title || item.summary.slice(0, 40) + '...'}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">
                        {item.summary.slice(0, 80)}...
                      </p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-[10px] text-gray-400 dark:text-gray-500">{formatTime(item.timestamp)}</span>
                        {item.type === 'url' && (
                          <span className="text-[10px] px-1.5 py-0.5 bg-blue-50 dark:bg-blue-900/30 text-blue-500 dark:text-blue-400 rounded">URL</span>
                        )}
                        {item.starred && (
                          <span className="text-[10px] px-1.5 py-0.5 bg-yellow-50 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 rounded">즐겨찾기</span>
                        )}
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={(e) => handleStar(item.id, e)}
                        className={`p-1.5 rounded-lg transition-colors ${
                          item.starred
                            ? 'text-yellow-500 bg-yellow-50 dark:bg-yellow-900/30'
                            : 'text-gray-300 dark:text-gray-600 hover:text-yellow-400 hover:bg-yellow-50 dark:hover:bg-yellow-900/20'
                        }`}
                        title="즐겨찾기"
                      >
                        ★
                      </button>
                      <button
                        onClick={() => onView(item)}
                        className="p-1.5 rounded-lg text-gray-400 dark:text-gray-500 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors text-xs"
                        title="보기"
                      >
                        👁
                      </button>
                      <button
                        onClick={(e) => handleDelete(item.id, e)}
                        className="p-1.5 rounded-lg text-gray-400 dark:text-gray-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-xs"
                        title="삭제"
                      >
                        🗑
                      </button>
                    </div>
                  </div>

                  {/* Expanded summary */}
                  {isExpanded && (
                    <div className="mt-3 p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl">
                      <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                        {item.summary}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
