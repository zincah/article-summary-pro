import useStore from '../store/useStore';

const NAV_ITEMS = [
  { key: 'main', label: '홈', icon: HomeIcon },
  { key: 'history', label: '히스토리', icon: HistoryIcon },
  { key: 'settings', label: '설정', icon: SettingsIcon },
];

function HomeIcon({ active }) {
  return (
    <svg viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" className="w-6 h-6">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  );
}

function HistoryIcon({ active }) {
  return (
    <svg viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" className="w-6 h-6">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function SettingsIcon({ active }) {
  return (
    <svg viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" className="w-6 h-6">
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function Toast({ message, type }) {
  const bgColor =
    type === 'error'
      ? 'bg-red-500'
      : type === 'warning'
      ? 'bg-yellow-500'
      : 'bg-green-500';

  return (
    <div className={`toast-enter flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-white text-sm font-medium ${bgColor}`}>
      {type === 'error' ? '✕' : type === 'warning' ? '⚠' : '✓'}
      <span>{message}</span>
    </div>
  );
}

export default function Layout({ children }) {
  const { currentPage, setCurrentPage, toasts } = useStore();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center">
      {/* App container */}
      <div className="w-full max-w-[480px] min-h-screen bg-white dark:bg-gray-800 flex flex-col relative shadow-xl">
        {/* Header */}
        <header className="sticky top-0 z-10 bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">📰</span>
            <div>
              <h1 className="text-base font-bold text-gray-900 dark:text-white leading-tight">
                ArticleSummary Pro
              </h1>
              <p className="text-xs text-gray-400 dark:text-gray-500">AI 기사 요약 서비스</p>
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto pb-20">
          {children}
        </main>

        {/* Bottom navigation */}
        <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700 flex z-10">
          {NAV_ITEMS.map(({ key, label, icon: Icon }) => {
            const active = currentPage === key;
            return (
              <button
                key={key}
                onClick={() => setCurrentPage(key)}
                className={`flex-1 flex flex-col items-center gap-1 py-2.5 transition-colors ${
                  active
                    ? 'text-indigo-600 dark:text-indigo-400'
                    : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
                }`}
              >
                <Icon active={active} />
                <span className="text-[10px] font-medium">{label}</span>
              </button>
            );
          })}
        </nav>

        {/* Toast notifications */}
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 w-full max-w-[440px] px-4 flex flex-col gap-2 z-50 pointer-events-none">
          {toasts.map((toast) => (
            <Toast key={toast.id} message={toast.message} type={toast.type} />
          ))}
        </div>
      </div>
    </div>
  );
}
