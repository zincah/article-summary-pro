import useStore from '../store/useStore';

const LENGTH_OPTIONS = [
  { value: 'short', label: '짧음', desc: '3문장 이내' },
  { value: 'medium', label: '중간', desc: '5-7문장' },
  { value: 'long', label: '길음', desc: '10문장 이내' },
];

const TONE_OPTIONS = [
  { value: 'neutral', label: '중립', desc: '중립적이고 객관적인' },
  { value: 'professional', label: '전문', desc: '전문적이고 분석적인' },
  { value: 'easy', label: '쉬움', desc: '쉽고 친근한' },
];

function SettingRow({ label, description, children }) {
  return (
    <div className="flex items-center justify-between py-4 border-b border-gray-100 dark:border-gray-700 last:border-0">
      <div className="flex-1 mr-4">
        <p className="text-sm font-medium text-gray-900 dark:text-white">{label}</p>
        {description && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{description}</p>
        )}
      </div>
      {children}
    </div>
  );
}

function SelectGroup({ options, value, onChange }) {
  return (
    <div className="flex gap-1">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          title={opt.desc}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
            value === opt.value
              ? 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-300 dark:border-indigo-600 text-indigo-700 dark:text-indigo-300'
              : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-500'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

export default function Settings() {
  const { settings, updateSettings, clearAllHistory, history, showToast } = useStore();

  const handleClearHistory = () => {
    if (history.length === 0) {
      showToast('삭제할 히스토리가 없습니다.', 'warning');
      return;
    }
    if (window.confirm(`히스토리 ${history.length}개를 모두 삭제하시겠습니까?`)) {
      clearAllHistory();
      showToast('히스토리가 삭제되었습니다.');
    }
  };

  return (
    <div className="flex flex-col">
      {/* Section: Summary defaults */}
      <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800/50">
        <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">요약 기본값</p>
      </div>
      <div className="px-4 bg-white dark:bg-gray-800">
        <SettingRow label="기본 요약 길이" description="새 요약 시 기본으로 선택될 길이">
          <SelectGroup
            options={LENGTH_OPTIONS}
            value={settings.defaultLength}
            onChange={(v) => updateSettings({ defaultLength: v })}
          />
        </SettingRow>
        <SettingRow label="기본 요약 톤" description="새 요약 시 기본으로 선택될 톤">
          <SelectGroup
            options={TONE_OPTIONS}
            value={settings.defaultTone}
            onChange={(v) => updateSettings({ defaultTone: v })}
          />
        </SettingRow>
      </div>

      {/* Section: Display */}
      <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800/50 mt-4">
        <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">화면 설정</p>
      </div>
      <div className="px-4 bg-white dark:bg-gray-800">
        <SettingRow label="다크모드" description="어두운 테마로 전환합니다">
          <button
            onClick={() => updateSettings({ darkMode: !settings.darkMode })}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
              settings.darkMode ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-gray-600'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${
                settings.darkMode ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </SettingRow>
      </div>

      {/* Section: Data */}
      <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800/50 mt-4">
        <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">데이터 관리</p>
      </div>
      <div className="px-4 bg-white dark:bg-gray-800">
        <SettingRow
          label="히스토리 전체 삭제"
          description={`저장된 요약 ${history.length}개를 모두 삭제합니다`}
        >
          <button
            onClick={handleClearHistory}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800/40 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
          >
            삭제
          </button>
        </SettingRow>
      </div>

      {/* App info */}
      <div className="px-4 py-6 mt-4 text-center">
        <p className="text-xs text-gray-400 dark:text-gray-500">ArticleSummary Pro v1.0</p>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Powered by Claude AI (claude-sonnet-4-6)</p>
      </div>
    </div>
  );
}
