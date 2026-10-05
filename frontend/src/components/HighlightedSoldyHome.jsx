export default function HighlightedSoldyHome({ text, homeClassName = 'text-[#b45309]' }) {
  const parts = String(text || '').split(/(SoldyHome)/gi);

  return (
    <>
      {parts.map((part, index) => {
        if (part.toLowerCase() !== 'soldyhome') {
          return <span key={`txt-${index}`}>{part}</span>;
        }

        return (
          <span key={`brand-${index}`}>
            Soldy<span className={homeClassName}>Home</span>
          </span>
        );
      })}
    </>
  );
}

