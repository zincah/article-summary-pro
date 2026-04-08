import { useState } from 'react';
import useStore from '../store/useStore';
import HistoryList from '../components/HistoryList';
import SummaryResult from '../components/SummaryResult';

export default function HistoryPage() {
  const { setSummaryResult, setStreamingText } = useStore();
  const [viewingItem, setViewingItem] = useState(null);

  const handleView = (item) => {
    setViewingItem(item);
  };

  const handleBack = () => {
    setViewingItem(null);
  };

  if (viewingItem) {
    return (
      <div className="p-4">
        <SummaryResult
          result={{
            summary: viewingItem.summary,
            originalText: viewingItem.originalText,
            title: viewingItem.title,
          }}
          streamingText={viewingItem.summary}
          isStreaming={false}
          onRegenerate={() => {}}
          onBack={handleBack}
        />
      </div>
    );
  }

  return (
    <div>
      <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
        <h2 className="text-base font-bold text-gray-900 dark:text-white">요약 히스토리</h2>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">이전에 요약한 기사 목록</p>
      </div>
      <HistoryList onView={handleView} />
    </div>
  );
}
