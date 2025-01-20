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
    className={`px-3 py-1.5 font-medium text-sm transition-colors whitespace-nowrap
      ${isActive 
        ? 'text-primary border-b-2 border-primary' 
        : 'text-muted-foreground hover:text-foreground'
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
    <div className="flex overflow-x-auto scrollbar-hide border-b border-border mb-4">
      <div className="flex min-w-full sm:min-w-0 gap-2">
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