import { useState, useRef } from 'react';
import useStore from '../store/useStore';
import InputForm from '../components/InputForm';
import SummaryResult from '../components/SummaryResult';

export default function MainPage() {
  const {
    isLoading, setIsLoading,
    streamingText, setStreamingText, appendStreamingText,
    summaryResult, setSummaryResult,
    statusMessage, setStatusMessage,
    error, setError,
    clearSummary,
    addHistory,
    showToast,
    history,
    setCurrentPage,
  } = useStore();

  const [phase, setPhase] = useState('input'); // 'input' | 'loading' | 'result'
  const [lastRequest, setLastRequest] = useState(null);
  const abortRef = useRef(null);

  async function runSummarize({ type, content, length, tone }) {
    // Cancel any ongoing request
    if (abortRef.current) {
      abortRef.current.abort();
    }
    abortRef.current = new AbortController();

    clearSummary();
    setIsLoading(true);
    setPhase('loading');
    setLastRequest({ type, content, length, tone });

    let titleAccum = '';
    let originalTextAccum = '';
    let summaryAccum = '';

    try {
      const API_BASE = import.meta.env.VITE_API_BASE_URL || '';
      const response = await fetch(`${API_BASE}/api/summarize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, content, length, tone }),
        signal: abortRef.current.signal,
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `HTTP ${response.status}`);
      }

      setPhase('result');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop(); // Keep incomplete line

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const jsonStr = line.slice(6).trim();
          if (!jsonStr) continue;

          try {
            const event = JSON.parse(jsonStr);

            if (event.type === 'status') {
              setStatusMessage(event.message);
            } else if (event.type === 'title') {
              titleAccum = event.title;
            } else if (event.type === 'originalText') {
              originalTextAccum = event.text;
            } else if (event.type === 'delta') {
              summaryAccum += event.text;
              appendStreamingText(event.text);
            } else if (event.type === 'done') {
              const finalResult = {
                summary: summaryAccum,
                originalText: originalTextAccum,
                title: titleAccum,
              };
              setSummaryResult(finalResult);
              setIsLoading(false);
              setStatusMessage('');

              // Save to history
              // text 타입은 content === originalText이므로 originalText는 저장하지 않음
              addHistory({
                type,
                content: type === 'url' ? content : null,
                summary: summaryAccum,
                originalText: type === 'url' ? originalTextAccum : null,
                title: titleAccum || summaryAccum.slice(0, 30),
                length,
                tone,
              });
              showToast('요약이 저장되었습니다.');
            } else if (event.type === 'error') {
              throw new Error(event.message);
            }
          } catch (parseErr) {
            if (parseErr.message !== 'Unexpected end of JSON input') {
              console.error('SSE parse error:', parseErr);
            }
          }
        }
      }
    } catch (err) {
      if (err.name === 'AbortError') return;
      console.error('Summarize error:', err);
      setError(err.message || '요약 중 오류가 발생했습니다.');
      setIsLoading(false);
      setPhase('result');
    }
  }

  const handleRegenerate = ({ length, tone }) => {
    if (!lastRequest) return;
    runSummarize({ ...lastRequest, length, tone });
  };

  const handleBack = () => {
    clearSummary();
    setPhase('input');
  };

  // Get 2 recent history items for the input page
  const recentHistory = history.slice(0, 2);

  return (
    <div className="flex flex-col">
      {phase === 'input' && (
        <div className="p-4 flex flex-col gap-5">
          <InputForm onSummarize={runSummarize} />

          {/* Recent history preview */}
          {recentHistory.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">최근 요약</p>
                <button
                  onClick={() => setCurrentPage('history')}
                  className="text-xs text-indigo-500 dark:text-indigo-400 hover:text-indigo-700"
                >
                  전체 보기 →
                </button>
              </div>
              <div className="flex flex-col gap-2">
                {recentHistory.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-start gap-3 p-3 rounded-xl bg-white dark:bg-gray-700/50 border border-gray-100 dark:border-gray-700 hover:border-indigo-200 dark:hover:border-indigo-700 cursor-pointer transition-all"
                    onClick={() => {
                      setSummaryResult({
                        summary: item.summary,
                        originalText: item.originalText,
                        title: item.title,
                      });
                      setStreamingText(item.summary);
                      setLastRequest({
                        type: item.type,
                        content: item.content,
                        length: item.length || 'medium',
                        tone: item.tone || 'neutral',
                      });
                      setPhase('result');
                    }}
                  >
                    <span className="text-lg shrink-0">{item.type === 'url' ? '🔗' : '📝'}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-800 dark:text-gray-200 truncate">
                        {item.title || item.summary.slice(0, 30) + '...'}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 line-clamp-1">
                        {item.summary.slice(0, 60)}...
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {phase === 'loading' && (
        <div className="flex flex-col items-center justify-center py-20 gap-5">
          {/* Spinner */}
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 border-4 border-indigo-100 dark:border-indigo-900/30 rounded-full" />
            <div className="absolute inset-0 border-4 border-indigo-500 rounded-full border-t-transparent animate-spin" />
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
              {statusMessage || 'AI가 요약 중입니다...'}
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">잠시만 기다려주세요</p>
          </div>
          <button
            onClick={() => {
              abortRef.current?.abort();
              handleBack();
            }}
            className="flex items-center gap-2 px-5 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-semibold transition-colors active:scale-[0.98]"
          >
            <span>⏹</span>
            <span>요약 중지</span>
          </button>
        </div>
      )}

      {phase === 'result' && (
        <div className="p-4">
          {error ? (
            <div className="flex flex-col items-center gap-4 py-10">
              <span className="text-4xl">⚠️</span>
              <p className="text-sm font-medium text-red-600 dark:text-red-400 text-center">{error}</p>
              <button
                onClick={handleBack}
                className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700"
              >
                다시 시도
              </button>
            </div>
          ) : (
            <SummaryResult
              result={summaryResult}
              streamingText={streamingText}
              isStreaming={isLoading}
              onRegenerate={handleRegenerate}
              onBack={handleBack}
              onStop={() => {
                abortRef.current?.abort();
                setIsLoading(false);
              }}
            />
          )}
        </div>
      )}
    </div>
  );
}
