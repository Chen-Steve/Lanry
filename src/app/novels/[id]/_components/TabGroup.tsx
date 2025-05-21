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
        ? 'bg-accent text-accent-foreground font-medium'
        : 'bg-card hover:bg-accent/50 text-muted-foreground hover:text-foreground'
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