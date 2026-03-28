interface WikiInfoboxProps {
  infobox: Record<string, string>;
  displayName: string;
  avatarUrl: string | null;
  accentColor: string;
}

export function WikiInfobox({ infobox, displayName, avatarUrl, accentColor }: WikiInfoboxProps) {
  const entries = Object.entries(infobox);

  return (
    <table
      className="mb-4 w-full border border-collapse border-[#a2a9b1] md:float-right md:ml-5 md:w-[280px]"
      style={{ fontSize: '14px' }}
    >
      {/* Header */}
      <caption
        className="border border-[#a2a9b1] bg-[#cee0f2] px-3 py-2 text-center text-base font-bold"
        style={{ fontFamily: 'sans-serif', captionSide: 'top' }}
      >
        {displayName}
      </caption>

      <tbody>
        {/* Avatar */}
        {avatarUrl && (
          <tr>
            <td colSpan={2} className="border border-[#a2a9b1] p-2 text-center">
              <img
                src={avatarUrl}
                alt={displayName}
                width={200}
                height={200}
                className="mx-auto h-[200px] w-[200px] object-cover"
              />
              <p
                className="mt-1 text-xs text-[#54595d]"
                style={{ fontFamily: 'sans-serif' }}
              >
                {displayName}
              </p>
            </td>
          </tr>
        )}

        {/* Key-value rows */}
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
