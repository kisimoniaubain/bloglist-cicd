import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2, Store, Upload, Tag, Ban, RefreshCcw } from 'lucide-react';
import api from '../../services/api';
import Loader from '../../components/Loader';

const EMPTY_FORM = {
  name: '',
  description: '',
  category: '',
  brand: '',
  price: '',
  discountPrice: '',
  stock: '',
  images: '',
};

const toPayload = (form) => ({
  ...form,
  price: Number(form.price),
  discountPrice: form.discountPrice ? Number(form.discountPrice) : 0,
  stock: Number(form.stock),
  images: form.images
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean),
});

export default function SellerMarketplace() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [replacingImageId, setReplacingImageId] = useState('');
  const [editingId, setEditingId] = useState('');
  const [priceDrafts, setPriceDrafts] = useState({});
  const [form, setForm] = useState(EMPTY_FORM);

  const isEditing = useMemo(() => Boolean(editingId), [editingId]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const res = await api.get('/products/mine');
      const loadedProducts = res.data.products || [];
      setProducts(loadedProducts);
      setPriceDrafts(
        loadedProducts.reduce((acc, product) => {
          acc[product._id] = String(product.price ?? '');
          return acc;
        }, {})
      );
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load your products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const resetForm = () => {
    setEditingId('');
    setForm(EMPTY_FORM);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (Number(form.discountPrice) > Number(form.price)) {
      toast.error('Discount price cannot be greater than price');
      return;
    }

    const payload = toPayload(form);

    try {
      setSubmitting(true);
      if (isEditing) {
        await api.put(`/products/${editingId}`, payload);
        toast.success('Product updated successfully');
      } else {
        await api.post('/products', payload);
        toast.success('Product listed successfully');
      }
      resetForm();
      loadProducts();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save product');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (product) => {
    setEditingId(product._id);
    setForm({
      name: product.name || '',
      description: product.description || '',
      category: product.category || '',
      brand: product.brand || '',
      price: String(product.price ?? ''),
      discountPrice: product.discountPrice ? String(product.discountPrice) : '',
      stock: String(product.stock ?? ''),
      images: (product.images || []).join(', '),
    });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this listing?')) return;
    try {
      await api.delete(`/products/${id}`);
      toast.success('Listing removed');
      loadProducts();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete listing');
    }
  };

  const handleToggleListingStatus = async (product) => {
    const nextStatus = !product.isActive;
    try {
      await api.put(`/products/${product._id}`, { isActive: nextStatus });
      toast.success(nextStatus ? 'Listing reactivated' : 'Listing canceled from marketplace');
      loadProducts();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update listing status');
    }
  };

  const handleQuickPriceSave = async (product) => {
    const nextPrice = Number(priceDrafts[product._id]);
    if (!Number.isFinite(nextPrice) || nextPrice < 0) {
      toast.error('Enter a valid price');
      return;
    }

    try {
      await api.put(`/products/${product._id}`, {
        price: nextPrice,
        discountPrice: Math.min(Number(product.discountPrice || 0), nextPrice),
      });
      toast.success('Price updated');
      loadProducts();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update price');
    }
  };

  const handleUploadImages = async (files) => {
    if (!files?.length) return;

    try {
      setUploadingImages(true);
      const uploadPromises = Array.from(files).map(async (file) => {
        const formData = new FormData();
        formData.append('image', file);
        const res = await api.post('/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        return res.data.url;
      });

      const uploadedUrls = await Promise.all(uploadPromises);
      const existing = form.images
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean);
      const merged = [...existing, ...uploadedUrls];
      setForm((prev) => ({ ...prev, images: merged.join(', ') }));
      toast.success(`${uploadedUrls.length} image(s) uploaded`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Image upload failed');
    } finally {
      setUploadingImages(false);
    }
  };

  const handleReplaceMainImage = async (product, file) => {
    if (!file) return;

    try {
      setReplacingImageId(product._id);
      const formData = new FormData();
      formData.append('image', file);

      const uploadRes = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const newMainImage = uploadRes.data.url;
      const existingImages = Array.isArray(product.images) ? product.images : [];
      const nextImages = [newMainImage, ...existingImages.slice(1)];

      await api.put(`/products/${product._id}`, { images: nextImages });
      toast.success('Main image replaced');
      loadProducts();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to replace image');
    } finally {
      setReplacingImageId('');
    }
  };

  const parsedImages = useMemo(
    () =>
      form.images
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean),
    [form.images]
  );

  const activeCount = products.filter((product) => product.isActive).length;
  const pausedCount = products.filter((product) => !product.isActive).length;
  const totalStock = products.reduce((sum, product) => sum + Number(product.stock || 0), 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Store size={24} className="text-primary-600" /> Seller Marketplace
          </h1>
          <p className="text-gray-500 mt-1">Create and manage your product listings professionally.</p>
        </div>
        <span className="badge bg-primary-50 text-primary-700">Seller Access</span>
      </div>

      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card p-4">
          <p className="text-xs uppercase tracking-wide text-gray-500">Active Listings</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{activeCount}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs uppercase tracking-wide text-gray-500">Paused Listings</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{pausedCount}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs uppercase tracking-wide text-gray-500">Total Units in Stock</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{totalStock}</p>
        </div>
      </section>

      <section className="card p-4 sm:p-6">
        <h2 className="font-semibold text-gray-900 mb-4">{isEditing ? 'Edit Listing' : 'Add New Listing'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Product Name</label>
              <input
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                required
                className="input"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Category</label>
              <input
                value={form.category}
                onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))}
                required
                className="input"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
              rows={4}
              required
              className="input resize-none"
            />
          </div>

          <div className="grid sm:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Price (KSh)</label>
              <input
                type="number"
                min="0"
                value={form.price}
                onChange={(e) => setForm((prev) => ({ ...prev, price: e.target.value }))}
                required
                className="input"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Discount Price</label>
              <input
                type="number"
                min="0"
                value={form.discountPrice}
                onChange={(e) => setForm((prev) => ({ ...prev, discountPrice: e.target.value }))}
                className="input"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Stock</label>
              <input
                type="number"
                min="0"
                value={form.stock}
                onChange={(e) => setForm((prev) => ({ ...prev, stock: e.target.value }))}
                required
                className="input"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Brand</label>
              <input
                value={form.brand}
                onChange={(e) => setForm((prev) => ({ ...prev, brand: e.target.value }))}
                className="input"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Image URLs (comma-separated)</label>
            <input
              value={form.images}
              onChange={(e) => setForm((prev) => ({ ...prev, images: e.target.value }))}
              placeholder="https://image1.jpg, https://image2.jpg"
              className="input"
            />
          </div>

          <div className="space-y-3">
            <label className="text-sm font-medium text-gray-700 block">Upload Product Images</label>
            <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
              <label className="btn-secondary inline-flex items-center justify-center gap-2 cursor-pointer">
                <Upload size={16} /> {uploadingImages ? 'Uploading...' : 'Upload image files'}
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  disabled={uploadingImages}
                  onChange={(e) => handleUploadImages(e.target.files)}
                />
              </label>
              <span className="text-xs text-gray-500">JPG/PNG/WebP up to 5MB each.</span>
            </div>
            {parsedImages.length > 0 && (
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {parsedImages.map((url) => (
                  <div key={url} className="relative group">
                    <img src={url} alt="Uploaded" className="w-full h-16 rounded-lg object-cover border border-gray-200" />
                    <button
                      type="button"
                      onClick={() => {
                        const nextImages = parsedImages.filter((item) => item !== url);
                        setForm((prev) => ({ ...prev, images: nextImages.join(', ') }));
                      }}
                      className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                      aria-label="Remove image"
                    >
                      x
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button type="submit" disabled={submitting} className="btn-primary inline-flex items-center justify-center gap-2">
              <Plus size={16} />
              {submitting ? 'Saving...' : isEditing ? 'Update Listing' : 'Publish Listing'}
            </button>
            {isEditing && (
              <button type="button" onClick={resetForm} className="btn-secondary">
                Cancel Editing
              </button>
            )}
          </div>
        </form>
      </section>

      <section className="card p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900">Your Listings ({products.length})</h2>
        </div>

        {loading ? (
          <div className="py-12 flex justify-center"><Loader text="Loading listings..." /></div>
        ) : products.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            No listings yet. Add your first product above.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b border-gray-100">
                  <th className="py-3 pr-3">Product</th>
                  <th className="py-3 pr-3">Category</th>
                  <th className="py-3 pr-3">Quick Price Edit</th>
                  <th className="py-3 pr-3">Price</th>
                  <th className="py-3 pr-3">Stock</th>
                  <th className="py-3 pr-3">Status</th>
                  <th className="py-3 pr-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product._id} className={`border-b border-gray-100 ${!product.isActive ? 'opacity-70' : ''}`}>
                    <td className="py-3 pr-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={product.images?.[0] || 'https://placehold.co/60x60'}
                          alt={product.name}
                          className="w-12 h-12 rounded-lg object-cover"
                        />
                        <span className="font-medium text-gray-900 line-clamp-1">{product.name}</span>
                      </div>
                    </td>
                    <td className="py-3 pr-3 text-gray-600">{product.category}</td>
                    <td className="py-3 pr-3">
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="0"
                          value={priceDrafts[product._id] ?? ''}
                          onChange={(e) =>
                            setPriceDrafts((prev) => ({
                              ...prev,
                              [product._id]: e.target.value,
                            }))
                          }
                          className="w-24 border border-gray-200 rounded-lg px-2 py-1.5 text-sm"
                        />
                        <button
                          onClick={() => handleQuickPriceSave(product)}
                          className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1.5 rounded-lg bg-primary-50 text-primary-700 hover:bg-primary-100"
                        >
                          <Tag size={12} /> Save
                        </button>
                      </div>
                    </td>
                    <td className="py-3 pr-3 font-semibold text-gray-900">KSh {Number(product.price || 0).toLocaleString()}</td>
                    <td className="py-3 pr-3">
                      <span className={`badge ${product.stock > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {product.stock}
                      </span>
                    </td>
                    <td className="py-3 pr-3">
                      <span className={`badge ${product.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-700'}`}>
                        {product.isActive ? 'Active' : 'Canceled'}
                      </span>
                    </td>
                    <td className="py-3 pr-3">
                      <div className="flex items-center gap-2">
                        <button onClick={() => handleEdit(product)} className="p-2 rounded-lg text-primary-700 hover:bg-primary-50">
                          <Pencil size={15} />
                        </button>
                        <label className={`p-2 rounded-lg cursor-pointer ${replacingImageId === product._id ? 'text-gray-400 bg-gray-100' : 'text-indigo-700 hover:bg-indigo-50'}`} title="Replace main image">
                          <Upload size={15} />
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            disabled={replacingImageId === product._id}
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              handleReplaceMainImage(product, file);
                              e.target.value = '';
                            }}
                          />
                        </label>
                        <button
                          onClick={() => handleToggleListingStatus(product)}
                          className={`p-2 rounded-lg ${product.isActive ? 'text-[#b45309] hover:text-white hover:bg-[#b45309]' : 'text-green-700 hover:bg-green-50'}`}
                          title={product.isActive ? 'Cancel listing' : 'Reactivate listing'}
                        >
                          {product.isActive ? <Ban size={15} /> : <RefreshCcw size={15} />}
                        </button>
                        <button onClick={() => handleDelete(product._id)} className="p-2 rounded-lg text-red-600 hover:bg-red-50">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

