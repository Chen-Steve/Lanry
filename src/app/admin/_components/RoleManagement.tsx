'use client';

import { useState, useEffect } from 'react';
import supabase from '@/lib/supabaseClient';

// Define the User interface to match your profiles table
interface User {
  id: string;
  username: string;
  role: 'USER' | 'AUTHOR' | 'TRANSLATOR' | 'ADMIN' | 'SUPER_ADMIN';
  created_at: string;
  updated_at: string;
  current_streak?: number;
  last_visit?: string;
  coins?: number;
}

export default function RoleManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching users:', error);
      return;
    }

    setUsers(data || []);
    setLoading(false);
  };

  const updateUserRole = async (userId: string, newRole: User['role']) => {
    const { error } = await supabase
      .from('profiles')
      .update({ role: newRole })
      .eq('id', userId);

    if (error) {
      console.error('Error updating role:', error);
      return;
    }

    fetchUsers();
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-4">User Role Management</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead>
            <tr>
              <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Username
              </th>
              <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Role
              </th>
              <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map((user) => (
              <tr key={user.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  {user.username}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {user.role}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <select
                    aria-label="Role"
                    value={user.role}
                    onChange={(e) => updateUserRole(user.id, e.target.value as User['role'])}
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                  >
                    <option value="USER">User</option>
                    <option value="AUTHOR">Author</option>
                    <option value="TRANSLATOR">Translator</option>
                    <option value="ADMIN">Admin</option>
                    <option value="SUPER_ADMIN">Super Admin</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
} 