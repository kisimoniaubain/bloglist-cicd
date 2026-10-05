import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { logout, unlockAdminAccess, updateProfile } from '../redux/slices/authSlice';
import toast from 'react-hot-toast';
import { User, MapPin, Lock, Package, Trash2, Plus } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';

export default function Profile() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useSelector((s) => s.auth);
  const [activeTab, setActiveTab] = useState('profile');
  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
  });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [saving, setSaving] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [adminPassInput, setAdminPassInput] = useState('');

  useEffect(() => {
    setProfileForm({
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
    });
  }, [user]);

  useEffect(() => {
    const shouldUnlock = new URLSearchParams(location.search).get('adminUnlock') === '1';
    if (shouldUnlock && user?.role === 'admin') {
      setShowAdminModal(true);
    }
  }, [location.search, user?.role]);

  const forceRelogin = () => {
    dispatch(logout());
    setShowAdminModal(false);
    setAdminPassInput('');
    navigate('/');
  };

  const handleAdminAccess = async () => {
    const token = localStorage.getItem('soldyToken') || '';
    if (!token || token.startsWith('local-token-')) {
      toast.error('Your session is not connected to the backend. Please sign in again.');
      forceRelogin();
      return;
    }

    try {
      const result = await dispatch(unlockAdminAccess(adminPassInput));
      if (unlockAdminAccess.rejected.match(result)) {
        throw new Error(result.payload || 'Failed to unlock admin access');
      }
      setShowAdminModal(false);
      setAdminPassInput('');
      toast.success('Admin access granted');
      navigate('/admin');
    } catch (err) {
      const message = err?.message || err.response?.data?.message || 'Failed to unlock admin access';
      if (message.toLowerCase().includes('token failed') || message.toLowerCase().includes('no token')) {
        toast.error('Session expired. Please sign in again.');
        forceRelogin();
        return;
      }
      toast.error(message);
    }
  };

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    await dispatch(updateProfile(profileForm));
    setSaving(false);
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('Passwords do not match'); return;
    }
    setSaving(true);
    try {
      await api.put('/auth/change-password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      toast.success('Password changed successfully!');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'addresses', label: 'Addresses', icon: MapPin },
    { id: 'security', label: 'Security', icon: Lock },
  ];

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <div className="flex items-center gap-4 sm:gap-5 mb-6 sm:mb-8">
        <div className="w-16 h-16 rounded-2xl bg-primary-100 flex items-center justify-center overflow-hidden">
          {user?.avatar ? (
            <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
          ) : (
            <span className="text-2xl font-bold text-primary-600">{user?.name?.[0]?.toUpperCase()}</span>
          )}
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">{user?.name}</h1>
          <p className="text-gray-500 text-sm">{user?.email}</p>
          <span className={`badge mt-1 ${user?.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'} capitalize`}>
            {user?.role}
          </span>
        </div>
        {user?.role === 'admin' && (
          <button
            type="button"
            onClick={() => setShowAdminModal(true)}
            className="btn-secondary ml-auto"
          >
            Admin Dashboard
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6 overflow-x-auto">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex-none min-w-[112px] sm:flex-1 sm:min-w-0 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-lg transition-all ${
              activeTab === id ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Icon size={15} /> {label}
          </button>
        ))}
      </div>

      {/* Profile tab */}
      {activeTab === 'profile' && (
        <form onSubmit={handleProfileSave} className="card p-4 sm:p-6 space-y-4 animate-fade-in">
          <h2 className="font-semibold text-gray-900">Personal Information</h2>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Full Name</label>
            <input value={profileForm.name} onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
              className="input" required />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Email</label>
            <input
              type="email"
              value={profileForm.email}
              onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
              className="input"
              required
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Phone</label>
            <input value={profileForm.phone} onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
              placeholder="+254 700 000 000" className="input" />
          </div>
          <button type="submit" disabled={saving} className="btn-primary w-full sm:w-auto">
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      )}

      {/* Addresses tab */}
      {activeTab === 'addresses' && (
        <div className="card p-4 sm:p-6 animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Saved Addresses</h2>
          </div>
          {user?.addresses?.length > 0 ? (
            <div className="space-y-3">
              {user.addresses.map((addr) => (
                <div key={addr._id} className="border border-gray-100 rounded-xl p-4 text-sm">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{addr.fullName}</p>
                      <p className="text-gray-600 mt-0.5">{addr.phone}</p>
                      <p className="text-gray-600">{addr.address}, {addr.city}, {addr.country}</p>
                    </div>
                    {addr.isDefault && (
                      <span className="badge bg-primary-50 text-primary-600 text-xs">Default</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">
              <MapPin size={32} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">No addresses saved yet</p>
              <p className="text-xs mt-1">Addresses are saved during checkout</p>
            </div>
          )}
        </div>
      )}

      {/* Security tab */}
      {activeTab === 'security' && (
        <form onSubmit={handlePasswordChange} className="card p-4 sm:p-6 space-y-4 animate-fade-in">
          <h2 className="font-semibold text-gray-900">Change Password</h2>
          {['currentPassword', 'newPassword', 'confirmPassword'].map((key) => (
            <div key={key}>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                {key === 'currentPassword' ? 'Current Password' : key === 'newPassword' ? 'New Password' : 'Confirm New Password'}
              </label>
              <input type="password" value={passwordForm[key]}
                onChange={(e) => setPasswordForm({ ...passwordForm, [key]: e.target.value })}
                placeholder="••••••••" required minLength={6} className="input" />
            </div>
          ))}
          <button type="submit" disabled={saving} className="btn-primary w-full sm:w-auto">
            {saving ? 'Changing...' : 'Change Password'}
          </button>
        </form>
      )}

      {showAdminModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="card w-full max-w-sm p-5 sm:p-6">
            <h3 className="text-lg font-bold text-gray-900">Admin Access</h3>
            <p className="text-sm text-gray-500 mt-1">Enter dashboard password to continue.</p>

            <input
              type="password"
              value={adminPassInput}
              onChange={(e) => setAdminPassInput(e.target.value)}
              placeholder="Enter password"
              className="input mt-4"
              autoFocus
            />

            <div className="flex gap-3 mt-4">
              <button
                type="button"
                className="btn-secondary flex-1"
                onClick={() => {
                  setShowAdminModal(false);
                  setAdminPassInput('');
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-primary flex-1"
                onClick={handleAdminAccess}
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
