import { useEffect, useState } from 'react';
import { Moon, Sun, Monitor } from 'lucide-react';
import { applyTheme, getInitialTheme } from '../utils/theme';
import { useLanguage } from '../contexts/LanguageContext';

export default function Settings() {
  const [theme, setTheme] = useState('light');
  const [storageStatus, setStorageStatus] = useState({
    activeMode: 'checking',
    provider: 'checking',
    ready: false,
    missingVars: [],
  });
  const { language, setLanguage, languages, t } = useLanguage();

  useEffect(() => {
    const initial = getInitialTheme();
    setTheme(initial);
    applyTheme(initial);
  }, []);

  useEffect(() => {
    let cancelled = false;

    fetch('/api/storage/status')
      .then((response) => response.json())
      .then((payload) => {
        if (cancelled) {
          return;
        }

        setStorageStatus({
          activeMode: String(payload?.activeMode || 'unknown').toLowerCase(),
          provider: String(payload?.provider || 'unknown').toLowerCase(),
          ready: Boolean(payload?.ready),
          missingVars: Array.isArray(payload?.missingVars) ? payload.missingVars : [],
        });
      })
      .catch(() => {
        if (!cancelled) {
          setStorageStatus({
            activeMode: 'offline',
            provider: 'unknown',
            ready: false,
            missingVars: [],
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const setAppTheme = (value) => {
    setTheme(value);
    applyTheme(value);
  };

  const options = [
    {
      id: 'light',
      icon: Sun,
      label: t('common.lightMode', 'Light Mode'),
      desc: 'Bright interface for daytime browsing.',
    },
    {
      id: 'dark',
      icon: Moon,
      label: t('common.darkMode', 'Dark Mode'),
      desc: 'Softer interface for low-light usage.',
    },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{t('common.settings', 'Settings')}</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">{t('common.customizeExperience', 'Customize your app experience.')}</p>
      </div>

      <section className="card p-6 space-y-4">
        <h2 className="font-semibold text-gray-900 dark:text-gray-100">Storage Provider Status</h2>
        <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
          <p><strong>Configured provider:</strong> {storageStatus.provider}</p>
          <p><strong>Active mode:</strong> {storageStatus.activeMode}</p>
          <p>
            <strong>Ready:</strong>{' '}
            <span
              className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold ${
                storageStatus.ready
                  ? 'border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                  : 'border-[#b45309] bg-[#b45309] text-white dark:border-[#b45309] dark:bg-[#b45309] dark:text-white'
              }`}
            >
              {storageStatus.ready ? 'Ready' : 'Needs configuration'}
            </span>
          </p>
          {storageStatus.missingVars.length > 0 ? (
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Missing env vars: {storageStatus.missingVars.join(', ')}
            </p>
          ) : null}
        </div>
      </section>

      <section className="card p-6 space-y-4">
        <h2 className="font-semibold text-gray-900 dark:text-gray-100">{t('common.language', 'Language')}</h2>
        <div className="grid sm:grid-cols-3 gap-3">
          {languages.map((lang) => (
            <button
              key={lang.code}
              type="button"
              onClick={() => setLanguage(lang.code)}
              className={`text-left rounded-xl border px-4 py-3 transition-all ${
                language === lang.code
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 dark:border-primary-400'
                  : 'border-gray-200 dark:border-gray-700 hover:border-primary-300'
              }`}
            >
              <p className="font-medium text-gray-900 dark:text-gray-100">{lang.label}</p>
            </button>
          ))}
        </div>
      </section>

      <section className="card p-6 space-y-5">
        <div className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
          <Monitor size={18} />
          <h2 className="font-semibold">{t('common.appearance', 'Appearance')}</h2>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          {options.map(({ id, icon: Icon, label, desc }) => (
            <button
              key={id}
              type="button"
              onClick={() => setAppTheme(id)}
              className={`text-left rounded-2xl border p-4 transition-all ${
                theme === id
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 dark:border-primary-400'
                  : 'border-gray-200 dark:border-gray-700 hover:border-primary-300'
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <Icon size={16} className="text-primary-600 dark:text-primary-400" />
                <span className="font-semibold text-gray-900 dark:text-gray-100">{label}</span>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">{desc}</p>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}

