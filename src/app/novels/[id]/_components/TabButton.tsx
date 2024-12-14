interface TabButtonProps {
  label: string;
  isActive: boolean;
  onClick: () => void;
}

export const TabButton = ({ 
  label, 
  isActive, 
  onClick 
}: TabButtonProps) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 font-medium text-sm whitespace-nowrap transition-colors relative ${
      isActive
        ? 'text-green-600'
        : 'text-gray-600 hover:text-gray-900'
    }`}
  >
    {label}
    {isActive && (
      <div className="absolute bottom-0 left-0 w-full h-0.5 bg-green-600" />
    )}
  </button>
); 