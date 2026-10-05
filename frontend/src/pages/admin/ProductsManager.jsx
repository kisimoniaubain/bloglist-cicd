import { useEffect, useState } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import Loader from '../../components/Loader';
import { Plus, Edit2, Trash2, X, Check } from 'lucide-react';
import { isVideoUrl } from '../../utils/imageUrl';

const EMPTY_PRODUCT = {
  name: '', description: '', price: '', discountPrice: '', category: '',
  stock: '', brand: '', isFeatured: false, images: [],
};

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_PRODUCT);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [storageStatus, setStorageStatus] = useState({
    provider: 'checking',
    activeMode: 'checking',
    missingVars: [],
  });

  const loadProducts = () => {
    setLoading(true);
    api.get('/products?pageSize=50').then((r) => setProducts(r.data.products)).finally(() => setLoading(false));
  };

  const loadStorageStatus = () => {
    api.get('/storage/status')
      .then((r) => {
        setStorageStatus({
          provider: String(r.data?.provider || 'unknown').toLowerCase(),
          activeMode: String(r.data?.activeMode || 'unknown').toLowerCase(),
          missingVars: Array.isArray(r.data?.missingVars) ? r.data.missingVars : [],
        });
      })
      .catch(() => {
        setStorageStatus({
          provider: 'unknown',
          activeMode: 'offline',
          missingVars: [],
        });
      });
  };

  useEffect(() => { loadProducts(); }, []);
  useEffect(() => { loadStorageStatus(); }, []);

  const isPersistentStorage = storageStatus.activeMode === 'cloudinary';

  const openCreate = () => { setForm(EMPTY_PRODUCT); setEditing(null); setShowModal(true); };
  const openEdit = (p) => { setForm({ ...p, price: p.price, discountPrice: p.discountPrice || '' }); setEditing(p._id); setShowModal(true); };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        await api.put(`/products/${editing}`, form);
        toast.success('Product updated');
      } else {
        await api.post('/products', form);
        toast.success('Product created');
      }
      setShowModal(false);
      loadProducts();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this product?')) return;
    try {
      await api.delete(`/products/${id}`);
      toast.success('Product deleted');
      loadProducts();
    } catch { toast.error('Failed to delete'); }
  };

  const handleImageUpload = async (files) => {
    if (!files?.length) return;

    try {
      setUploading(true);
      const formData = new FormData();
      Array.from(files).forEach((file) => formData.append('files', file));

      const res = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 120000,
      });

      const uploadedUrls = Array.isArray(res.data?.urls)
        ? res.data.urls
        : (res.data?.url ? [res.data.url] : []);

      if (!uploadedUrls.length) {
        throw new Error('Upload response did not include files');
      }

      setForm((prev) => ({ ...prev, images: [...(prev.images || []), ...uploadedUrls] }));
      toast.success(`${uploadedUrls.length} media file(s) uploaded`);
    } catch (err) {
      const message = err.code === 'ECONNABORTED'
        ? 'Upload took too long. Please try again with smaller files.'
        : (err.response?.data?.message || err.message || 'Media upload failed');
      toast.error(message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Products</h1>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2 text-sm py-2">
          <Plus size={16} /> Add Product
        </button>
      </div>

      <div className={`rounded-xl border px-4 py-3 text-sm ${isPersistentStorage
        ? 'border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-200'
        : 'border-[#b45309] bg-[#b45309] text-white dark:border-[#b45309] dark:bg-[#b45309] dark:text-white'
      }`}>
        {isPersistentStorage
          ? 'Upload storage is Cloudinary. Product images/videos are persistent across deploys and restarts.'
          : 'Upload storage is not persistent. Configure Cloudinary before uploading production images/videos.'}
        {!isPersistentStorage && storageStatus.missingVars.length > 0 ? (
          <div className="mt-1 text-xs opacity-90">
            Missing env vars: {storageStatus.missingVars.join(', ')}
          </div>
        ) : null}
      </div>

      {loading ? <div className="flex justify-center py-16"><Loader /></div> : (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-100 dark:bg-gray-800">
              <tr>
                {['Product', 'Category', 'Price', 'Stock', 'Featured', 'Actions'].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-gray-700 dark:text-gray-400 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {products.map((p) => (
                <tr key={p._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {isVideoUrl(p.images?.[0]) ? (
                        <video src={p.images?.[0]} className="w-10 h-10 rounded-lg object-cover" muted playsInline preload="metadata" />
                      ) : (
                        <img src={p.images?.[0] || 'https://placehold.co/40x40'} className="w-10 h-10 rounded-lg object-cover" alt="" />
                      )}
                      <span className="font-medium text-gray-900 dark:text-white truncate max-w-[180px]">{p.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-400">{p.category}</td>
                  <td className="px-4 py-3 text-gray-900 dark:text-white font-medium">KSh {p.price.toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <span className={`badge ${p.stock > 0 ? 'bg-green-900 text-green-400' : 'bg-red-900 text-red-400'}`}>
                      {p.stock}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {p.isFeatured ? <Check size={16} className="text-green-500" /> : <X size={16} className="text-gray-600" />}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(p)} className="p-1.5 text-blue-400 hover:bg-blue-900/30 rounded-lg"><Edit2 size={14} /></button>
                      <button onClick={() => handleDelete(p._id)} className="p-1.5 text-red-400 hover:bg-red-900/30 rounded-lg"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="font-bold text-gray-900 dark:text-white">{editing ? 'Edit Product' : 'Add Product'}</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"><X size={20} /></button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              {[['name', 'Product Name'], ['category', 'Category'], ['brand', 'Brand']].map(([key, label]) => (
                <div key={key}>
                  <label className="text-xs text-gray-600 dark:text-gray-400 mb-1 block">{label}</label>
                  <input value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                    required={key !== 'brand'}
                    className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl px-3 py-2.5 text-gray-900 dark:text-white text-sm focus:outline-none focus:border-primary-500" />
                </div>
              ))}
              <div>
                <label className="text-xs text-gray-600 dark:text-gray-400 mb-1 block">Description</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                  required rows={3}
                  className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl px-3 py-2.5 text-gray-900 dark:text-white text-sm focus:outline-none focus:border-primary-500 resize-none" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[['price', 'Price (KSh)'], ['discountPrice', 'Discount Price'], ['stock', 'Stock']].map(([key, label]) => (
                  <div key={key}>
                    <label className="text-xs text-gray-600 dark:text-gray-400 mb-1 block">{label}</label>
                    <input type="number" value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                      required={key !== 'discountPrice'} min="0"
                      className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl px-3 py-2.5 text-gray-900 dark:text-white text-sm focus:outline-none focus:border-primary-500" />
                  </div>
                ))}
              </div>
              <div>
                <label className="text-xs text-gray-600 dark:text-gray-400 mb-1 block">Image URLs (comma-separated)</label>
                <input value={form.images?.join(', ')}
                  onChange={(e) => setForm({ ...form, images: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) })}
                  placeholder="https://example.com/img1.jpg, https://..."
                  className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl px-3 py-2.5 text-gray-900 dark:text-white text-sm focus:outline-none focus:border-primary-500" />
              </div>
              <div>
                <label className="text-xs text-gray-600 dark:text-gray-400 mb-1 block">Upload Images/Videos</label>
                {!isPersistentStorage ? (
                  <div className="mb-2 rounded-lg border border-[#b45309] bg-[#b45309] px-3 py-2 text-xs text-white">
                    Warning: uploads are not persistent until Cloudinary mode is active.
                  </div>
                ) : null}
                <label className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer">
                  {uploading ? 'Uploading...' : 'Select media files'}
                  <input
                    type="file"
                    accept="image/*,video/*"
                    multiple
                    className="hidden"
                    disabled={uploading}
                    onChange={(e) => handleImageUpload(e.target.files)}
                  />
                </label>
                {form.images?.length > 0 && (
                  <div className="grid grid-cols-4 gap-2 mt-3">
                    {form.images.map((img) => (
                      <div key={img} className="relative group">
                        {isVideoUrl(img) ? (
                          <video src={img} className="w-full h-14 object-cover rounded-lg border border-gray-300 dark:border-gray-700" muted playsInline preload="metadata" />
                        ) : (
                          <img src={img} alt="Product" className="w-full h-14 object-cover rounded-lg border border-gray-300 dark:border-gray-700" />
                        )}
                        <button
                          type="button"
                          className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] opacity-0 group-hover:opacity-100"
                          onClick={() => setForm((prev) => ({ ...prev, images: prev.images.filter((value) => value !== img) }))}
                          aria-label="Remove image"
                        >
                          x
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.isFeatured} onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })}
                  className="w-4 h-4 rounded" />
                <span className="text-sm text-gray-700 dark:text-gray-300">Featured product</span>
              </label>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1 border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300">Cancel</button>
                <button type="submit" disabled={saving} className="btn-primary flex-1">
                  {saving ? 'Saving...' : (editing ? 'Update' : 'Create')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
