interface Tab {
  label: string;
  value: string;
}

interface TabGroupProps {
  tabs: Tab[];
  value: string;
  onChange: (value: string) => void;
}

const TabButton = ({ 
  label, 
  isActive, 
  onClick 
}: { 
  label: string; 
  isActive: boolean; 
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 text-base rounded-md transition-colors whitespace-nowrap ${
      isActive 
        ? 'bg-[#faf7f2] dark:bg-zinc-800 font-medium'
        : 'bg-[#f7f3ec] dark:bg-zinc-800 hover:bg-[#faf7f2] dark:hover:bg-zinc-700'
    }`}
  >
    {label}
  </button>
);

export const TabGroup = ({
  tabs,
  value,
  onChange,
}: TabGroupProps) => {
  return (
    <div className="w-full overflow-x-auto scrollbar-hide">
      <div className="flex gap-1 min-w-max px-1 pb-1">
        {tabs.map((tab) => (
          <TabButton
            key={tab.value}
            label={tab.label}
            isActive={value === tab.value}
            onClick={() => onChange(tab.value)}
          />
        ))}
      </div>
    </div>
  );
}; 