import { useState, useRef, useEffect } from 'react';
import useStore from '../store/useStore';

const LENGTH_OPTIONS = [
  { value: 'short', label: '짧음', desc: '3문장' },
  { value: 'medium', label: '중간', desc: '5-7문장' },
  { value: 'long', label: '길음', desc: '10문장' },
];

const TONE_OPTIONS = [
  { value: 'neutral', label: '중립', desc: '객관적' },
  { value: 'professional', label: '전문', desc: '분석적' },
  { value: 'easy', label: '쉬움', desc: '친근' },
];

export default function InputForm({ onSummarize }) {
  const { settings } = useStore();
  const [tab, setTab] = useState('url');
  const [urlInput, setUrlInput] = useState('');
  const [textInput, setTextInput] = useState('');
  const [length, setLength] = useState(settings.defaultLength || 'medium');
  const [tone, setTone] = useState(settings.defaultTone || 'neutral');
  const [urlError, setUrlError] = useState('');
  const textareaRef = useRef(null);

  // Update defaults when settings change
  useEffect(() => {
    setLength(settings.defaultLength || 'medium');
    setTone(settings.defaultTone || 'neutral');
  }, [settings.defaultLength, settings.defaultTone]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const content = tab === 'url' ? urlInput.trim() : textInput.trim();
    if (!content) return;

    if (tab === 'url') {
      if (!content.startsWith('http://') && !content.startsWith('https://')) {
        setUrlError('올바른 URL 형식이 아닙니다. (예: https://...)');
        return;
      }
      setUrlError('');
    }

    onSummarize({ type: tab, content, length, tone });
  };

  const handleUrlChange = (e) => {
    setUrlInput(e.target.value);
    if (urlError) setUrlError('');
  };

  const isValid = tab === 'url'
    ? urlInput.trim().length > 0
    : textInput.trim().length > 10;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {/* Tab Toggle */}
      <div className="flex rounded-xl bg-gray-100 dark:bg-gray-700 p-1 gap-1">
        {[
          { key: 'url', label: 'URL 입력', icon: '🔗' },
          { key: 'text', label: '텍스트 입력', icon: '📝' },
        ].map(({ key, label, icon }) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
              tab === key
                ? 'bg-white dark:bg-gray-600 text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }`}
          >
            <span>{icon}</span>
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* Input area */}
      {tab === 'url' ? (
        <div className="flex flex-col gap-1">
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg">🔗</div>
            <input
              type="text"
              value={urlInput}
              onChange={handleUrlChange}
              placeholder="https://... 기사 URL을 입력하세요"
              className={`w-full pl-10 pr-4 py-3.5 rounded-xl border bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent text-sm transition-all ${
                urlError
                  ? 'border-red-400 focus:ring-red-400'
                  : 'border-gray-200 dark:border-gray-600 focus:ring-indigo-400'
              }`}
            />
          </div>
          {urlError && (
            <p className="text-red-500 text-xs px-1">{urlError}</p>
          )}
        </div>
      ) : (
        <div className="relative">
          <textarea
            ref={textareaRef}
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            placeholder="기사 내용을 직접 붙여넣기 하세요..."
            rows={6}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent text-sm resize-none transition-all"
          />
          <div className="absolute bottom-2.5 right-3 text-xs text-gray-400">
            {textInput.length.toLocaleString()}자
          </div>
        </div>
      )}

      {/* Options */}
      <div className="grid grid-cols-2 gap-3">
        {/* Length */}
        <div>
          <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5 block">
            요약 길이
          </label>
          <div className="flex gap-1">
            {LENGTH_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setLength(opt.value)}
                className={`flex-1 py-1.5 px-1 rounded-lg text-xs font-medium border transition-all ${
                  length === opt.value
                    ? 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-300 dark:border-indigo-600 text-indigo-700 dark:text-indigo-300'
                    : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:border-gray-300'
                }`}
              >
                <div>{opt.label}</div>
                <div className="text-[10px] opacity-70">{opt.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Tone */}
        <div>
          <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5 block">
            요약 톤
          </label>
          <div className="flex gap-1">
            {TONE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setTone(opt.value)}
                className={`flex-1 py-1.5 px-1 rounded-lg text-xs font-medium border transition-all ${
                  tone === opt.value
                    ? 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-300 dark:border-indigo-600 text-indigo-700 dark:text-indigo-300'
                    : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:border-gray-300'
                }`}
              >
                <div>{opt.label}</div>
                <div className="text-[10px] opacity-70">{opt.desc}</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Submit button */}
      <button
        type="submit"
        disabled={!isValid}
        className={`w-full py-3.5 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
          isValid
            ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-200 dark:shadow-indigo-900/30 active:scale-[0.98]'
            : 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
        }`}
      >
        <span>✨</span>
        <span>AI 요약 생성</span>
      </button>
    </form>
  );
}
