import { useState, useRef, useEffect } from 'react';
import { Icon } from '@iconify/react';
import { toast } from 'sonner';
import supabase from '@/lib/supabaseClient';
import { uploadImage } from '@/services/uploadService';

interface NovelCharacter {
  id: string;
  name: string;
  role: string;
  imageUrl: string;
  description?: string | null;
  orderIndex: number;
}

interface CharacterManagementProps {
  novelId: string;
  characters: NovelCharacter[];
  onCharactersUpdate: (characters: NovelCharacter[]) => void;
}

export const CharacterManagement = ({
  novelId,
  characters,
  onCharactersUpdate,
}: CharacterManagementProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [editingCharacter, setEditingCharacter] = useState<NovelCharacter | null>(null);
  const [localCharacters, setLocalCharacters] = useState<NovelCharacter[]>(characters);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Keep local state in sync with props
  useEffect(() => {
    setLocalCharacters(characters);
  }, [characters]);

  const handleImageUpload = async (file: File) => {
    if (!file) return null;
    setIsUploading(true);
    try {
      // Use Supabase storage directly; default bucket 'novel-covers' is fine for small images too
      const url = await uploadImage(file, null, 'novel-covers');
      return url;
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to upload image');
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const handleAddCharacter = async (characterData: Omit<NovelCharacter, 'id' | 'orderIndex'>) => {
    try {
      const id = crypto.randomUUID();
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from('novel_characters')
        .insert({
          id,
          name: characterData.name,
          role: characterData.role,
          image_url: characterData.imageUrl,
          description: characterData.description,
          novel_id: novelId,
          order_index: localCharacters.length,
          created_at: now,
          updated_at: now,
        })
        .select()
        .single();

      if (error) throw error;

      const newCharacter = {
        id: data.id,
        name: data.name,
        role: data.role,
        imageUrl: data.image_url,
        description: data.description,
        orderIndex: data.order_index,
      };

      const updatedCharacters = [...localCharacters, newCharacter];
      setLocalCharacters(updatedCharacters);
      onCharactersUpdate(updatedCharacters);
      toast.success('Character added successfully');
    } catch (error) {
      console.error('Error adding character:', error);
      toast.error('Failed to add character');
    }
  };

  const handleUpdateCharacter = async (character: NovelCharacter) => {
    try {
      const { error } = await supabase
        .from('novel_characters')
        .update({
          name: character.name,
          role: character.role,
          image_url: character.imageUrl,
          description: character.description,
          order_index: character.orderIndex,
        })
        .eq('id', character.id);

      if (error) throw error;

      const updatedCharacters = localCharacters.map(c => 
        c.id === character.id ? character : c
      );
      setLocalCharacters(updatedCharacters);
      onCharactersUpdate(updatedCharacters);
      toast.success('Character updated successfully');
    } catch (error) {
      console.error('Error updating character:', error);
      toast.error('Failed to update character');
    }
  };

  const handleDeleteCharacter = async (characterId: string) => {
    try {
      const { error } = await supabase
        .from('novel_characters')
        .delete()
        .eq('id', characterId);

      if (error) throw error;

      const updatedCharacters = localCharacters.filter(c => c.id !== characterId);
      setLocalCharacters(updatedCharacters);
      onCharactersUpdate(updatedCharacters);
      toast.success('Character deleted successfully');
    } catch (error) {
      console.error('Error deleting character:', error);
      toast.error('Failed to delete character');
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const resetForm = () => {
    setEditingCharacter(null);
    setPreviewImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
          Characters
        </h2>
        <button
          onClick={() => setEditingCharacter({ id: '', name: '', role: '', imageUrl: '', orderIndex: localCharacters.length })}
          className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/30"
        >
          <Icon icon="mdi:plus" className="text-lg" />
          Add Character
        </button>
      </div>

      {/* Character list */}
      <div className="grid gap-4">
        {localCharacters.map((character) => (
          <div
            key={character.id}
            className="flex items-center gap-4 p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
          >
            <div className="w-16 h-16 relative rounded-lg overflow-hidden flex-shrink-0">
              <img
                src={character.imageUrl}
                alt={character.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-grow">
              <h3 className="font-medium text-gray-900 dark:text-gray-100">
                {character.name}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {character.role}
              </p>
              {character.description && (
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-500 line-clamp-2">
                  {character.description}
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setEditingCharacter(character)}
                aria-label={`Edit ${character.name}`}
                className="p-2 text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/30 rounded-full"
              >
                <Icon icon="mdi:pencil" className="text-xl" />
              </button>
              <button
                onClick={() => handleDeleteCharacter(character.id)}
                aria-label={`Delete ${character.name}`}
                className="p-2 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30 rounded-full"
              >
                <Icon icon="mdi:delete" className="text-xl" />
              </button>
            </div>
          </div>
        ))}

        {localCharacters.length === 0 && (
          <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg">
            <Icon icon="mdi:account-multiple-plus" className="text-4xl text-gray-400 dark:text-gray-600 mb-2" />
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
              Add character images and information to help readers visualize your story&apos;s cast
            </p>
          </div>
        )}
      </div>

      {/* Character edit modal */}
      {editingCharacter && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-md">
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {editingCharacter.id ? 'Edit Character' : 'Add New Character'}
                </h3>
                <button
                  onClick={resetForm}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  aria-label="Close modal"
                >
                  <Icon icon="mdi:close" className="text-2xl" />
                </button>
              </div>
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  const file = formData.get('image') as File;
                  
                  let imageUrl = editingCharacter.imageUrl;
                  if (file.size > 0) {
                    setIsUploading(true);
                    const uploadedUrl = await handleImageUpload(file);
                    if (uploadedUrl) imageUrl = uploadedUrl;
                  }

                  const characterData = {
                    ...editingCharacter,
                    name: formData.get('name') as string,
                    role: formData.get('role') as string,
                    description: formData.get('description') as string,
                    imageUrl,
                  };

                  if (editingCharacter.id) {
                    await handleUpdateCharacter(characterData);
                  } else {
                    await handleAddCharacter(characterData);
                  }
                  resetForm();
                }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    defaultValue={editingCharacter.name}
                    required
                    placeholder="Enter character name"
                    aria-label="Character name"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Role
                  </label>
                  <input
                    type="text"
                    name="role"
                    defaultValue={editingCharacter.role}
                    required
                    placeholder="e.g. Male Lead, Female Lead, Supporting"
                    aria-label="Character role"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Description
                  </label>
                  <textarea
                    name="description"
                    defaultValue={editingCharacter.description || ''}
                    rows={3}
                    placeholder="Enter character description"
                    aria-label="Character description"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Image
                  </label>
                  <div className="space-y-2">
                    {(previewImage || editingCharacter.imageUrl) && (
                      <div className="w-32 h-32 relative rounded-lg overflow-hidden mx-auto">
                        <img
                          src={previewImage || editingCharacter.imageUrl}
                          alt="Character preview"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      name="image"
                      accept="image/*"
                      onChange={handleImageChange}
                      aria-label="Character image"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-900"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 mt-6">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isUploading}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 rounded-lg disabled:opacity-50 flex items-center gap-2"
                  >
                    {isUploading && <Icon icon="mdi:loading" className="animate-spin" />}
                    {isUploading ? 'Uploading...' : 'Save'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}; 