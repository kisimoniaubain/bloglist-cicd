import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';
import furnitureProducts from '../../data/furnitureProducts';

const PAGE_SIZE_DEFAULT = 12;

const shouldUseFallback = (err) => {
  const status = err?.response?.status;
  return !err?.response || status === 401 || status === 403 || status === 429 || status >= 500;
};

const sortProducts = (items, sort) => {
  const cloned = [...items];
  const sortMap = {
    'price-asc': (a, b) => a.price - b.price,
    'price-desc': (a, b) => b.price - a.price,
    rating: (a, b) => (b.rating || 0) - (a.rating || 0),
    newest: (a, b) => String(b._id).localeCompare(String(a._id)),
    popular: (a, b) => (b.soldCount || 0) - (a.soldCount || 0),
  };
  return sortMap[sort] ? cloned.sort(sortMap[sort]) : cloned;
};

const buildFallbackProductsPayload = (params = {}) => {
  const pageSize = Number(params.pageSize) || PAGE_SIZE_DEFAULT;
  const page = Number(params.page) || 1;
  const keyword = (params.keyword || '').toString().toLowerCase().trim();
  const category = (params.category || '').toString().trim();
  const minPrice = params.minPrice ? Number(params.minPrice) : null;
  const maxPrice = params.maxPrice ? Number(params.maxPrice) : null;

  let filtered = furnitureProducts.filter((p) => p.isActive);

  if (keyword) {
    filtered = filtered.filter((p) => p.name.toLowerCase().includes(keyword));
  }
  if (category) {
    filtered = filtered.filter((p) => p.category === category);
  }
  if (minPrice !== null) {
    filtered = filtered.filter((p) => p.price >= minPrice);
  }
  if (maxPrice !== null) {
    filtered = filtered.filter((p) => p.price <= maxPrice);
  }

  const sorted = sortProducts(filtered, params.sort);
  const total = sorted.length;
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const start = (page - 1) * pageSize;
  const products = sorted.slice(start, start + pageSize);

  return {
    products,
    total,
    pages,
    page,
  };
};

export const fetchProducts = createAsyncThunk('products/fetchAll', async (params = {}, { rejectWithValue }) => {
  try {
    const query = new URLSearchParams(params).toString();
    const res = await api.get(`/products?${query}`);
    return res.data;
  } catch (err) {
    if (shouldUseFallback(err)) {
      return buildFallbackProductsPayload(params);
    }
    return rejectWithValue(err.response?.data?.message);
  }
});

export const fetchProductById = createAsyncThunk('products/fetchById', async (id, { rejectWithValue }) => {
  try {
    const res = await api.get(`/products/${id}`);
    return res.data.product;
  } catch (err) {
    if (shouldUseFallback(err)) {
      return furnitureProducts.find((p) => p._id === id) || null;
    }
    return rejectWithValue(err.response?.data?.message);
  }
});

export const fetchFeatured = createAsyncThunk('products/fetchFeatured', async (_, { rejectWithValue }) => {
  try {
    const res = await api.get('/products/featured');
    return res.data.products;
  } catch (err) {
    if (shouldUseFallback(err)) {
      return furnitureProducts.filter((p) => p.isFeatured && p.isActive).slice(0, 8);
    }
    return rejectWithValue(err.response?.data?.message);
  }
});

export const fetchCategories = createAsyncThunk('products/fetchCategories', async (_, { rejectWithValue }) => {
  try {
    const res = await api.get('/products/categories');
    return res.data.categories;
  } catch (err) {
    if (shouldUseFallback(err)) {
      return [...new Set(furnitureProducts.filter((p) => p.isActive).map((p) => p.category))];
    }
    return rejectWithValue(err.response?.data?.message);
  }
});

const productSlice = createSlice({
  name: 'products',
  initialState: {
    items: [],
    featured: [],
    categories: [],
    currentProduct: null,
    total: 0,
    pages: 1,
    page: 1,
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchProducts.pending, (s) => { s.loading = true; s.error = null; })
      .addCase(fetchProducts.fulfilled, (s, a) => {
        s.loading = false;
        s.items = a.payload.products;
        s.total = a.payload.total;
        s.pages = a.payload.pages;
        s.page = a.payload.page;
      })
      .addCase(fetchProducts.rejected, (s, a) => { s.loading = false; s.error = a.payload; })

      .addCase(fetchProductById.pending, (s) => { s.loading = true; })
      .addCase(fetchProductById.fulfilled, (s, a) => { s.loading = false; s.currentProduct = a.payload; })
      .addCase(fetchProductById.rejected, (s, a) => { s.loading = false; s.error = a.payload; })

      .addCase(fetchFeatured.fulfilled, (s, a) => { s.featured = a.payload; })
      .addCase(fetchCategories.fulfilled, (s, a) => { s.categories = a.payload; });
  },
});

export default productSlice.reducer;
