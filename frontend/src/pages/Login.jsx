import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { loginUser } from '../redux/slices/authSlice';
import { Eye, EyeOff } from 'lucide-react';
import BrandLogo from '../components/BrandLogo';
import HighlightedSoldyHome from '../components/HighlightedSoldyHome';
import { useLanguage } from '../contexts/LanguageContext';
import toast from 'react-hot-toast';

export default function Login() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error } = useSelector((s) => s.auth);
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const { t } = useLanguage();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await dispatch(loginUser(form));
    if (loginUser.fulfilled.match(result)) {
      toast.success(`Welcome back, ${result.payload.user.name}!`);
      navigate('/');
    } else if (loginUser.rejected.match(result)) {
      toast.error(result.payload || 'Login failed');
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-fit mx-auto mb-4">
            <BrandLogo compact theme="auto" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{t('auth.welcomeBack', 'Welcome back')}</h1>
          <p className="text-gray-500 mt-1">
            <HighlightedSoldyHome text={t('auth.signInAccount', 'Sign in to your SoldyHome account')} />
          </p>
        </div>

        <div className="card p-8">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-3 mb-5 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="your@email.com"
                required
                className="input"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Password</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="••••••••"
                  required
                  className="input pr-10"
                />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="flex justify-end">
              <Link to="/forgot-password" className="text-xs text-primary-600 hover:underline">{t('auth.forgotPassword', 'Forgot password?')}</Link>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? 'Signing in...' : t('auth.signIn', 'Sign In')}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            {t('auth.dontHaveAccount', "Don't have an account?")}{' '}
            <Link to="/register" className="text-primary-600 font-medium hover:underline">{t('auth.createOne', 'Create one')}</Link>
          </p>
        </div>

        <div className="mt-5 flex items-center justify-center gap-4 text-xs text-gray-500 dark:text-gray-400">
          <Link to="/privacy-policy" className="hover:text-gray-700 dark:hover:text-gray-200 hover:underline">
            Privacy Policy
          </Link>
          <span>•</span>
          <Link to="/terms-and-conditions" className="hover:text-gray-700 dark:hover:text-gray-200 hover:underline">
            Terms & Conditions
          </Link>
        </div>
      </div>
    </div>
  );
}

