import { useState } from 'react';
import useStore from '../store/useStore';

const LENGTH_OPTIONS = [
  { value: 'short', label: '짧음' },
  { value: 'medium', label: '중간' },
  { value: 'long', label: '길음' },
];

const TONE_OPTIONS = [
  { value: 'neutral', label: '중립' },
  { value: 'professional', label: '전문' },
  { value: 'easy', label: '쉬움' },
];

export default function SummaryResult({ result, streamingText, isStreaming, onRegenerate, onBack, onStop }) {
  const { showToast } = useStore();
  const [showFullOriginal, setShowFullOriginal] = useState(false);
  const [regenLength, setRegenLength] = useState('medium');
  const [regenTone, setRegenTone] = useState('neutral');

  const summaryText = isStreaming ? streamingText : result?.summary || streamingText;
  const originalText = result?.originalText || '';
  const title = result?.title || '';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(summaryText);
      showToast('클립보드에 복사되었습니다!');
    } catch {
      showToast('복사에 실패했습니다.', 'error');
    }
  };

  const previewLength = 300;
  const showToggle = originalText.length > previewLength;
  const displayOriginal = showFullOriginal
    ? originalText
    : originalText.slice(0, previewLength) + (showToggle ? '...' : '');

  return (
    <div className="flex flex-col gap-4 animate-slide-up">
      {/* Status badge */}
      <div className="flex items-center gap-2">
        {isStreaming ? (
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full text-xs font-medium">
              <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse" />
              요약 중...
            </span>
            <button
              onClick={onStop}
              className="flex items-center gap-1 px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded-full text-xs font-semibold transition-colors active:scale-[0.98]"
            >
              <span>⏹</span>
              <span>중지</span>
            </button>
          </div>
        ) : (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full text-xs font-medium">
            <span>✓</span>
            요약 완료
          </span>
        )}
        <button
          onClick={onBack}
          className="ml-auto text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 flex items-center gap-1"
        >
          ← 새 요약
        </button>
      </div>

      {/* Title */}
      {title && (
        <h2 className="text-base font-bold text-gray-900 dark:text-white leading-snug">
          {title}
        </h2>
      )}

      {/* Summary card */}
      <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-2xl p-4 border border-indigo-100 dark:border-indigo-800/30">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400">
            <span>✨</span>
            <span>AI 요약</span>
          </div>
          {!isStreaming && summaryText && (
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 text-xs text-indigo-500 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
            >
              <span>📋</span>
              <span>복사</span>
            </button>
          )}
        </div>
        <p className={`text-sm text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-wrap ${isStreaming ? 'typing-cursor' : ''}`}>
          {summaryText || ' '}
        </p>
      </div>

      {/* Regenerate options */}
      {!isStreaming && (
        <div className="bg-white dark:bg-gray-700/50 rounded-2xl p-4 border border-gray-100 dark:border-gray-700">
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-3">다시 생성 옵션</p>
          <div className="grid grid-cols-2 gap-3 mb-3">
            {/* Length select */}
            <div>
              <label className="text-xs text-gray-400 dark:text-gray-500 mb-1 block">길이</label>
              <div className="flex gap-1">
                {LENGTH_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setRegenLength(opt.value)}
                    className={`flex-1 py-1 rounded-lg text-xs font-medium border transition-all ${
                      regenLength === opt.value
                        ? 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-300 dark:border-indigo-600 text-indigo-700 dark:text-indigo-300'
                        : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
            {/* Tone select */}
            <div>
              <label className="text-xs text-gray-400 dark:text-gray-500 mb-1 block">톤</label>
              <div className="flex gap-1">
                {TONE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setRegenTone(opt.value)}
                    className={`flex-1 py-1 rounded-lg text-xs font-medium border transition-all ${
                      regenTone === opt.value
                        ? 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-300 dark:border-indigo-600 text-indigo-700 dark:text-indigo-300'
                        : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <button
            onClick={() => onRegenerate({ length: regenLength, tone: regenTone })}
            className="w-full py-2.5 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-semibold hover:bg-gray-700 dark:hover:bg-gray-100 transition-colors active:scale-[0.98]"
          >
            🔄 다시 생성
          </button>
        </div>
      )}

      {/* Original text */}
      {originalText && (
        <div className="bg-white dark:bg-gray-700/50 rounded-2xl p-4 border border-gray-100 dark:border-gray-700">
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">원문</p>
          <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
            {displayOriginal}
          </p>
          {showToggle && (
            <button
              onClick={() => setShowFullOriginal(!showFullOriginal)}
              className="mt-2 text-xs text-indigo-500 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium"
            >
              {showFullOriginal ? '▲ 접기' : '▼ 전체 보기'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
