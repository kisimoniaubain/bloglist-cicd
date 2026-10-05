export default function BrandLogo({
  theme = 'light',
  compact = false,
  iconOnly = false,
  homeClassName,
}) {
  const isAuto = theme === 'auto';
  const isDark = theme === 'dark';
  const textPrimary = isAuto ? 'text-gray-900 dark:text-white' : (isDark ? 'text-white' : 'text-gray-900');
  const textAccent = homeClassName || (isAuto ? 'text-[#b45309] dark:text-[#b45309]' : (isDark ? 'text-[#b45309]' : 'text-[#b45309]'));
  const iconContainer = isAuto
    ? 'bg-gradient-to-br from-[#b45309] to-orange-500 dark:from-[#b45309] dark:to-orange-600'
    : (isDark
      ? 'bg-gradient-to-br from-[#b45309] to-orange-600'
      : 'bg-gradient-to-br from-[#b45309] to-orange-500');
  const subtitleClass = isAuto ? 'text-gray-500 dark:text-gray-400' : (isDark ? 'text-gray-400' : 'text-gray-500');

  return (
    <div className="flex items-center gap-2.5">
      <div className={`rounded-xl flex items-center justify-center ${iconContainer} ${compact ? 'w-9 h-9' : 'w-10 h-10'}`}>
        <svg
          viewBox="0 0 64 64"
          className={compact ? 'w-5 h-5' : 'w-6 h-6'}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path d="M10 37C10 30.3726 15.3726 25 22 25H42C48.6274 25 54 30.3726 54 37V44H10V37Z" fill="white" fillOpacity="0.95"/>
          <rect x="12" y="42" width="4" height="10" rx="2" fill="white"/>
          <rect x="48" y="42" width="4" height="10" rx="2" fill="white"/>
          <rect x="20" y="20" width="24" height="8" rx="4" fill="white" fillOpacity="0.95"/>
          <path d="M14 36V33C14 30.7909 15.7909 29 18 29H24C26.2091 29 28 30.7909 28 33V36" stroke="#C2410C" strokeWidth="2"/>
          <path d="M36 36V33C36 30.7909 37.7909 29 40 29H46C48.2091 29 50 30.7909 50 33V36" stroke="#C2410C" strokeWidth="2"/>
        </svg>
      </div>

      {!iconOnly && (
        <div className="leading-tight">
          <p className={`font-extrabold tracking-tight ${compact ? 'text-lg' : 'text-xl'} ${textPrimary}`}>
            Soldy
            <span className={`${textAccent}`}>Home</span>
          </p>
          {!compact && <p className={`text-[10px] uppercase tracking-[0.2em] ${subtitleClass}`}>Furniture Studio</p>}
        </div>
      )}
    </div>
  );
}

