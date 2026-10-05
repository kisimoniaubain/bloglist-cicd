export default function Loader({ size = 'md', text = '' }) {
  const sizeMap = { sm: 'w-5 h-5', md: 'w-8 h-8', lg: 'w-12 h-12' };
  return (
    <div className="flex flex-col items-center justify-center gap-3">
      <div className={`${sizeMap[size]} border-3 border-gray-200 border-t-primary-600 rounded-full animate-spin`}
        style={{ borderWidth: 3 }}
      />
      {text && <p className="text-sm text-gray-500">{text}</p>}
    </div>
  );
}
