import Settings from '../components/Settings';

export default function SettingsPage() {
  return (
    <div>
      <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
        <h2 className="text-base font-bold text-gray-900 dark:text-white">설정</h2>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">앱 환경을 설정합니다</p>
      </div>
      <Settings />
    </div>
  );
}
