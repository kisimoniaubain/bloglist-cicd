import { Link } from 'react-router-dom';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 px-4 py-12">
      <div className="max-w-3xl mx-auto bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 sm:p-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Privacy Policy</h1>
        <p className="mt-3 text-sm text-gray-600 dark:text-gray-300 leading-6">
          We use your account details, order details, and contact information only to deliver products,
          process payments, and support your orders. We do not sell your personal data.
        </p>
        <p className="mt-3 text-sm text-gray-600 dark:text-gray-300 leading-6">
          You can contact us at any time to update or remove your account information where applicable.
        </p>

        <div className="mt-8">
          <Link to="/login" className="text-primary-600 hover:underline text-sm font-medium">
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}
