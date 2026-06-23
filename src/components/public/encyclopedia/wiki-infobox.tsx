interface WikiInfoboxProps {
  infobox: Record<string, string>;
  displayName: string;
  avatarUrl: string | null;
  accentColor: string;
}

export function WikiInfobox({
  infobox,
  displayName,
  avatarUrl,
  accentColor,
}: WikiInfoboxProps) {
  const entries = Object.entries(infobox);

  return (
    <table
      className="mb-5 w-full border-collapse border border-[#a2a9b1] bg-white shadow-sm md:float-right md:ml-6 md:w-[300px]"
      style={{ fontSize: '14px' }}
    >
      <caption
        className="border border-[#a2a9b1] px-3 py-3 text-center text-base font-bold text-karte-text"
        style={{
          fontFamily: 'sans-serif',
          captionSide: 'top',
          background: `linear-gradient(135deg, ${accentColor}, #38598f)`,
        }}
      >
        {displayName}
      </caption>

      <tbody>
        {avatarUrl && (
          <tr>
            <td
              colSpan={2}
              className="border border-[#a2a9b1] bg-[#f8f9fa] p-3 text-center"
            >
              <img
                src={avatarUrl}
                alt={displayName}
                width={200}
                height={200}
                className="mx-auto h-[210px] w-[210px] border border-[#c8ccd1] object-cover"
              />
              <p
                className="mt-2 text-xs text-[#54595d]"
                style={{ fontFamily: 'sans-serif' }}
              >
                {displayName}
              </p>
            </td>
          </tr>
        )}

        {entries.map(([label, value], i) => (
          <tr key={label}>
            <th
              className="border border-[#a2a9b1] px-3 py-1.5 text-left align-top text-sm font-semibold whitespace-nowrap"
              style={{
                fontFamily: 'sans-serif',
                color: '#202122',
                backgroundColor: i % 2 === 0 ? '#f8f9fa' : '#ffffff',
              }}
            >
              {label}
            </th>
            <td
              className="border border-[#a2a9b1] px-3 py-1.5 text-sm"
              style={{
                fontFamily: 'sans-serif',
                color: '#202122',
                backgroundColor: i % 2 === 0 ? '#f8f9fa' : '#ffffff',
              }}
            >
              {value}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
