import { NovelCategory } from '@/types/database';
import CategorySelect from './CategorySelect';
import { Icon } from '@iconify/react';
import ChapterEditor from './ChapterEditor';

interface FormData {
  title: string;
  description: string;
  author: string;
  status: 'ONGOING' | 'COMPLETED' | 'HIATUS';
  slug: string;
}

interface NovelFormFieldsProps {
  formData: FormData;
  onFormDataChange: (formData: FormData) => void;
  userRole: string | null;
  editingNovel: {
    id: string;
    categories?: NovelCategory[];
  } | null;
  onCategoriesChange?: (categories: NovelCategory[]) => void;
  section?: 'details' | 'categories';
}

export default function NovelFormFields({
  formData,
  onFormDataChange,
  userRole,
  editingNovel,
  onCategoriesChange,
  section = 'details'
}: NovelFormFieldsProps) {
  if (section === 'categories') {
    if (!editingNovel || !onCategoriesChange) return null;
    
    return (
      <CategorySelect
        novelId={editingNovel.id}
        initialCategories={editingNovel.categories}
        onCategoriesChange={onCategoriesChange}
      />
    );
  }

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    onFormDataChange({
      ...formData,
      [name]: value
    });
  };

  const statusOptions = [
    { value: 'ONGOING', label: 'Ongoing', icon: 'mdi:pencil' },
    { value: 'COMPLETED', label: 'Completed', icon: 'mdi:check-circle' },
    { value: 'HIATUS', label: 'Hiatus', icon: 'mdi:pause-circle' }
  ];

  return (
    <div className="space-y-6">
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
          Title
        </label>
        <div className="relative">
          <Icon icon="mdi:book" className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            id="title"
            type="text"
            name="title"
            placeholder="Enter your novel's title"
            value={formData.title}
            onChange={handleInputChange}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            required
          />
        </div>
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
          Description
        </label>
        <ChapterEditor
          value={formData.description}
          onChange={(value) => onFormDataChange({ ...formData, description: value })}
          authorThoughts=""
          onAuthorThoughtsChange={() => {}}
          className="min-h-[200px]"
        />
      </div>

      {userRole === 'TRANSLATOR' && (
        <div>
          <label htmlFor="author" className="block text-sm font-medium text-gray-700 mb-1">
            Original Author
          </label>
          <div className="relative">
            <Icon icon="mdi:account" className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              id="author"
              type="text"
              name="author"
              placeholder="Enter the original author's name"
              value={formData.author}
              onChange={handleInputChange}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              required
            />
          </div>
        </div>
      )}

      <div>
        <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
          Status
        </label>
        <div className="grid grid-cols-3 gap-4">
          {statusOptions.map(option => (
            <label
              key={option.value}
              className={`
                relative flex items-center justify-center gap-2 p-3 rounded-lg cursor-pointer
                border-2 transition-all duration-200
                ${formData.status === option.value
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 hover:border-blue-200 hover:bg-gray-50'
                }
              `}
            >
              <input
                type="radio"
                name="status"
                value={option.value}
                checked={formData.status === option.value}
                onChange={handleInputChange}
                className="sr-only"
              />
              <Icon icon={option.icon} className="w-5 h-5" />
              <span className="font-medium">{option.label}</span>
              {formData.status === option.value && (
                <Icon
                  icon="mdi:check-circle"
                  className="absolute top-1 right-1 w-4 h-4 text-blue-500"
                />
              )}
            </label>
          ))}
        </div>
      </div>
    </div>
  );
} 