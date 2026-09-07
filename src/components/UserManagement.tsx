import React, { useState } from 'react';
import { User } from '../types';
import {
  UserPlus,
  Upload,
  Edit,
  Trash2,
  Eye,
  EyeOff,
} from 'lucide-react';

interface UserManagementProps {
  users: User[];
  onAddUser: (user: any) => Promise<void>;
  onUpdateUser: (user: User) => Promise<void>;
  onDeleteUser: (userId: string) => Promise<void>;
  onImportUsers: (newUsers: any[]) => Promise<void>;
}

export const UserManagement: React.FC<UserManagementProps> = ({
  users,
  onAddUser,
  onUpdateUser,
  onDeleteUser,
  onImportUsers,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    nip: '',
    name: '',
    email: '',
    role: 'GURU' as 'ADMIN' | 'GURU' | 'PEGAWAI',
    phone: '',
    jabatan: '',
    password: '',
    confirmPassword: '',
  });

  const [formError, setFormError] = useState('');

  const resetForm = () => {
    setFormData({
      nip: '',
      name: '',
      email: '',
      role: 'GURU',
      phone: '',
      jabatan: '',
      password: '',
      confirmPassword: '',
    });
    setFormError('');
    setEditingUser(null);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (formError) setFormError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validasi
    if (formData.password.length < 6) {
      setFormError('Password minimal 6 karakter.');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setFormError('Password dan Konfirmasi Password tidak sama.');
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        nip: formData.nip,
        name: formData.name,
        email: formData.email,
        role: formData.role,
        phone: formData.phone,
        password: formData.password,
      };

      if (editingUser) {
        // Update user (tambahkan id)
        await onUpdateUser({ ...editingUser, ...payload });
      } else {
        // Tambah user baru
        await onAddUser(payload);
      }

      // Tutup modal dan reset form
      resetForm();
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error submit user:', error);
      setFormError('Terjadi kesalahan. Silakan coba lagi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openAddModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const openEditModal = (user: User) => {
    setEditingUser(user);
    setFormData({
      nip: user.nip || '',
      name: user.name || '',
      email: user.email || '',
      role: user.role || 'GURU',
      phone: user.phone || '',
      jabatan: '',
      password: '',
      confirmPassword: '',
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (userId: string) => {
    if (!window.confirm('Yakin ingin menghapus user ini?')) return;
    try {
      await onDeleteUser(userId);
    } catch (error) {
      alert('Gagal menghapus user.');
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
        <h3 className="text-lg font-bold text-slate-800">Data Guru & Pegawai</h3>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-sm font-bold transition"
          >
            <UserPlus className="w-4 h-4" />
            Tambah Pengguna
          </button>
          <button
            onClick={() => onImportUsers([])}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-bold transition"
          >
            <Upload className="w-4 h-4" />
            Import Excel
          </button>
        </div>
      </div>

      {/* Tabel (responsif: scroll horizontal di HP) */}
      <div className="overflow-x-auto -mx-4 sm:mx-0">
        <table className="w-full text-sm min-w-[640px]">
          <thead className="bg-slate-50 text-slate-600 font-semibold">
            <tr>
              <th className="p-3 text-left">NIP</th>
              <th className="p-3 text-left">Nama</th>
              <th className="p-3 text-left hidden sm:table-cell">Email</th>
              <th className="p-3 text-left">Role</th>
              <th className="p-3 text-left hidden md:table-cell">No HP</th>
              <th className="p-3 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-6 text-center text-slate-400">
                  Belum ada data guru / pegawai.
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="p-3 text-xs font-mono">{user.nip}</td>
                  <td className="p-3 font-medium">{user.name}</td>
                  <td className="p-3 hidden sm:table-cell text-xs">{user.email}</td>
                  <td className="p-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                        user.role === 'ADMIN'
                          ? 'bg-purple-100 text-purple-800'
                          : user.role === 'GURU'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {user.role}
                    </span>
                  </td>
                  <td className="p-3 hidden md:table-cell">{user.phone || '-'}</td>
                  <td className="p-3 text-center whitespace-nowrap">
                    <button
                      onClick={() => openEditModal(user)}
                      className="text-blue-600 hover:text-blue-800 p-1"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(user.id.toString())}
                      className="text-red-600 hover:text-red-800 p-1 ml-2"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Tambah/Edit User */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-4 sm:p-6">
            <h4 className="text-xl font-bold text-slate-800 mb-4">
              {editingUser ? 'Edit Guru / Pegawai' : 'Tambah Guru / Pegawai Baru'}
            </h4>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* NIP */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  NIP / Nomor Induk Pegawai
                </label>
                <input
                  type="text"
                  name="nip"
                  value={formData.nip}
                  onChange={handleChange}
                  placeholder="Contoh: 199008222018011004"
                  className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              {/* Nama */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  Nama Lengkap & Gelar
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Contoh: Rina Melati, S.Pd."
                  className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  Email Sekolah
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Contoh: rina@tkpembina.sch.id"
                  className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              {/* Role & Phone (grid) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">
                    Role / Peran
                  </label>
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="GURU">GURU</option>
                    <option value="PEGAWAI">PEGAWAI</option>
                    <option value="ADMIN">ADMIN</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">
                    No WhatsApp / HP
                  </label>
                  <input
                    type="text"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="081234567890"
                    className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Jabatan */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  Jabatan / Penugasan di TK
                </label>
                <input
                  type="text"
                  name="jabatan"
                  value={formData.jabatan}
                  onChange={handleChange}
                  placeholder="Guru Sentra TK"
                  className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Password */}
              <div className="border-t border-slate-200 pt-4 mt-2">
                <p className="text-sm font-bold text-slate-700 mb-3">🔐 Akun Login</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">
                      Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="Min. 6 karakter"
                        className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 pr-10"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">
                      Konfirmasi Password
                    </label>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      placeholder="Ulangi password"
                      className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
                      required
                    />
                  </div>
                </div>
                {formError && (
                  <p className="text-rose-600 text-sm mt-2">{formError}</p>
                )}
              </div>

              {/* Tombol */}
              <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    resetForm();
                    setIsModalOpen(false);
                  }}
                  className="px-6 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl font-bold transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition disabled:opacity-50"
                >
                  {isSubmitting
                    ? 'Menyimpan...'
                    : editingUser
                    ? 'Update Pengguna'
                    : 'Tambah Pengguna'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};