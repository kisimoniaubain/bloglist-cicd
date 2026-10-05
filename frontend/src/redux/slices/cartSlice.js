import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';
import toast from 'react-hot-toast';
import furnitureProducts from '../../data/furnitureProducts';
import { logout } from './authSlice';

const CART_KEY = 'soldyLocalCart';

const loadLocalCart = () => {
  try {
    // Only load cart if user is logged in (has sessionStorage token)
    if (!sessionStorage.getItem('soldyToken')) {
      return { items: [], couponDiscount: 0, coupon: null };
    }
    const parsed = JSON.parse(localStorage.getItem(CART_KEY) || 'null');
    if (parsed && Array.isArray(parsed.items)) return parsed;
  } catch {
    // ignore malformed local data
  }
  return { items: [], couponDiscount: 0, coupon: null };
};

const saveLocalCart = (cart) => {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
};

const shouldUseLocalFallback = (err) => {
  const status = err?.response?.status;
  return !err?.response || status === 401 || status === 403 || status === 429 || status >= 500;
};

const clearBrokenAuthIfNeeded = (err) => {
  const msg = String(err?.response?.data?.message || '').toLowerCase();
  if (err?.response?.status === 401 && msg.includes('token')) {
    sessionStorage.removeItem('soldyToken');
    sessionStorage.removeItem('soldyUser');
    toast('Session expired. Using website cart mode.', { icon: 'ℹ️' });
  }
};

const findProduct = (productId) => furnitureProducts.find((p) => p._id === productId);
const isStaticProductId = (productId) => Boolean(findProduct(productId));

const getItemProductId = (item) => item?.product?._id || item?.product;

const mergeCarts = (serverCart, localCart) => {
  const merged = {
    items: [],
    couponDiscount: serverCart?.couponDiscount || 0,
    coupon: serverCart?.coupon || null,
  };

  const byId = new Map();
  [...(serverCart?.items || []), ...(localCart?.items || [])].forEach((item) => {
    const productId = getItemProductId(item);
    if (!productId) return;

    if (byId.has(productId)) {
      const prev = byId.get(productId);
      byId.set(productId, {
        ...prev,
        qty: (prev.qty || 0) + (item.qty || 0),
        product: prev.product || item.product,
      });
      return;
    }

    byId.set(productId, { ...item });
  });

  merged.items = Array.from(byId.values());
  return merged;
};

const loadServerCart = async () => {
  const res = await api.get('/cart');
  return res.data.cart;
};

export const fetchCart = createAsyncThunk('cart/fetch', async (_, { rejectWithValue }) => {
  try {
    if (!sessionStorage.getItem('soldyToken')) return { items: [], couponDiscount: 0, coupon: null };
    const serverCart = await loadServerCart();
    return mergeCarts(serverCart, loadLocalCart());
  } catch (err) {
    if (shouldUseLocalFallback(err)) {
      clearBrokenAuthIfNeeded(err);
      return loadLocalCart();
    }
    return rejectWithValue(err.response?.data?.message);
  }
});

export const addToCart = createAsyncThunk('cart/add', async ({ productId, qty = 1 }, { rejectWithValue }) => {
  try {
    const hasToken = Boolean(sessionStorage.getItem('soldyToken'));

    if (!hasToken) {
      return rejectWithValue('Please log in to add items to cart');
    }

    if (isStaticProductId(productId)) {
      const cart = loadLocalCart();
      const product = findProduct(productId);
      if (!product) return rejectWithValue('Product not found');
      const index = cart.items.findIndex((i) => (i.product?._id || i.product) === productId);
      if (index > -1) cart.items[index].qty += qty;
      else cart.items.push({
        _id: `local-cart-${Date.now()}`,
        product,
        price: product.discountPrice || product.price,
        qty,
      });
      saveLocalCart(cart);
      toast.success('Added to cart!');

      if (hasToken) {
        try {
          const serverCart = await loadServerCart();
          return mergeCarts(serverCart, cart);
        } catch {
          // Keep local static items visible even when server cart request fails.
        }
      }

      return cart;
    }

    const res = await api.post('/cart', { productId, qty });
    toast.success('Added to cart!');
    return mergeCarts(res.data.cart, loadLocalCart());
  } catch (err) {
    if (shouldUseLocalFallback(err)) {
      clearBrokenAuthIfNeeded(err);
      const cart = loadLocalCart();
      const product = findProduct(productId);
      if (!product) return rejectWithValue('Product not found');
      const index = cart.items.findIndex((i) => (i.product?._id || i.product) === productId);
      if (index > -1) cart.items[index].qty += qty;
      else cart.items.push({
        _id: `local-cart-${Date.now()}`,
        product,
        price: product.discountPrice || product.price,
        qty,
      });
      saveLocalCart(cart);
      toast.success('Added to cart!');
      return cart;
    }
    toast.error(err.response?.data?.message || 'Failed to add to cart');
    return rejectWithValue(err.response?.data?.message);
  }
});

export const updateCartQty = createAsyncThunk('cart/updateQty', async ({ productId, qty }, { rejectWithValue }) => {
  try {
    const hasToken = Boolean(sessionStorage.getItem('soldyToken'));

    if (!hasToken || isStaticProductId(productId)) {
      const cart = loadLocalCart();
      cart.items = cart.items
        .map((i) => ((i.product?._id || i.product) === productId ? { ...i, qty: Math.max(1, qty) } : i))
        .filter((i) => i.qty > 0);
      saveLocalCart(cart);

      if (hasToken) {
        try {
          const serverCart = await loadServerCart();
          return mergeCarts(serverCart, cart);
        } catch {
          // Fall back to local copy when server cart is unavailable.
        }
      }

      return cart;
    }

    const res = await api.put(`/cart/${productId}`, { qty });
    return mergeCarts(res.data.cart, loadLocalCart());
  } catch (err) {
    if (shouldUseLocalFallback(err)) {
      clearBrokenAuthIfNeeded(err);
      const cart = loadLocalCart();
      cart.items = cart.items
        .map((i) => ((i.product?._id || i.product) === productId ? { ...i, qty: Math.max(1, qty) } : i))
        .filter((i) => i.qty > 0);
      saveLocalCart(cart);
      return cart;
    }
    return rejectWithValue(err.response?.data?.message);
  }
});

export const removeFromCart = createAsyncThunk('cart/remove', async (productId, { rejectWithValue }) => {
  try {
    const hasToken = Boolean(sessionStorage.getItem('soldyToken'));

    if (!hasToken || isStaticProductId(productId)) {
      const cart = loadLocalCart();
      cart.items = cart.items.filter((i) => (i.product?._id || i.product) !== productId);
      saveLocalCart(cart);
      toast.success('Removed from cart');

      if (hasToken) {
        try {
          const serverCart = await loadServerCart();
          return mergeCarts(serverCart, cart);
        } catch {
          // Keep local cart changes even when server cart fetch fails.
        }
      }

      return cart;
    }

    const res = await api.delete(`/cart/${productId}`);
    toast.success('Removed from cart');
    return mergeCarts(res.data.cart, loadLocalCart());
  } catch (err) {
    if (shouldUseLocalFallback(err)) {
      clearBrokenAuthIfNeeded(err);
      const cart = loadLocalCart();
      cart.items = cart.items.filter((i) => (i.product?._id || i.product) !== productId);
      saveLocalCart(cart);
      toast.success('Removed from cart');
      return cart;
    }
    return rejectWithValue(err.response?.data?.message);
  }
});

export const clearCart = createAsyncThunk('cart/clear', async (_, { rejectWithValue }) => {
  try {
    const empty = { items: [], couponDiscount: 0, coupon: null };

    if (!sessionStorage.getItem('soldyToken')) {
      saveLocalCart(empty);
      return null;
    }

    await api.delete('/cart');
    saveLocalCart(empty);
    return null;
  } catch (err) {
    if (shouldUseLocalFallback(err)) {
      clearBrokenAuthIfNeeded(err);
      const empty = { items: [], couponDiscount: 0, coupon: null };
      saveLocalCart(empty);
      return null;
    }
    return rejectWithValue(err.response?.data?.message);
  }
});

export const applyCoupon = createAsyncThunk('cart/applyCoupon', async (code, { rejectWithValue }) => {
  try {
    if (!sessionStorage.getItem('soldyToken')) {
      const cart = loadLocalCart();
      const subtotal = cart.items.reduce((acc, i) => acc + i.price * i.qty, 0);
      const normalized = String(code || '').trim().toUpperCase();
      let discount = 0;
      if (normalized === 'SOLDY20') discount = Math.round(subtotal * 0.2);
      if (normalized === 'FREESHIP') discount = 200;
      if (!discount) {
        toast.error('Invalid coupon');
        return rejectWithValue('Invalid coupon');
      }
      cart.coupon = normalized;
      cart.couponDiscount = discount;
      saveLocalCart(cart);
      toast.success(`Coupon applied! Saved KSh ${discount}`);
      return { discount };
    }

    const res = await api.post('/cart/coupon', { code });
    toast.success(`Coupon applied! Saved KSh ${res.data.discount}`);
    return res.data;
  } catch (err) {
    if (shouldUseLocalFallback(err)) {
      clearBrokenAuthIfNeeded(err);
      const cart = loadLocalCart();
      const subtotal = cart.items.reduce((acc, i) => acc + i.price * i.qty, 0);
      const normalized = String(code || '').trim().toUpperCase();
      let discount = 0;
      if (normalized === 'SOLDY20') discount = Math.round(subtotal * 0.2);
      if (normalized === 'FREESHIP') discount = 200;
      if (!discount) {
        toast.error('Invalid coupon');
        return rejectWithValue('Invalid coupon');
      }
      cart.coupon = normalized;
      cart.couponDiscount = discount;
      saveLocalCart(cart);
      toast.success(`Coupon applied! Saved KSh ${discount}`);
      return { discount };
    }
    toast.error(err.response?.data?.message || 'Invalid coupon');
    return rejectWithValue(err.response?.data?.message);
  }
});

export const removeCoupon = createAsyncThunk('cart/removeCoupon', async (_, { rejectWithValue }) => {
  try {
    if (!sessionStorage.getItem('soldyToken')) {
      const cart = loadLocalCart();
      cart.coupon = null;
      cart.couponDiscount = 0;
      saveLocalCart(cart);
      toast.success('Coupon removed');
      return cart;
    }

    const res = await api.delete('/cart/coupon');
    toast.success('Coupon removed');
    return res.data.cart;
  } catch (err) {
    if (shouldUseLocalFallback(err)) {
      clearBrokenAuthIfNeeded(err);
      const cart = loadLocalCart();
      cart.coupon = null;
      cart.couponDiscount = 0;
      saveLocalCart(cart);
      toast.success('Coupon removed');
      return cart;
    }
    return rejectWithValue(err.response?.data?.message);
  }
});

const cartSlice = createSlice({
  name: 'cart',
  initialState: { ...loadLocalCart(), loading: false },
  reducers: {
    setLocalCart: (state, action) => { Object.assign(state, action.payload); },
  },
  extraReducers: (builder) => {
    const setCart = (state, action) => {
      state.loading = false;
      if (action.payload) {
        state.items = action.payload.items || [];
        state.couponDiscount = action.payload.couponDiscount || 0;
        state.coupon = action.payload.coupon || null;
      } else {
        state.items = [];
        state.couponDiscount = 0;
        state.coupon = null;
      }
    };
    builder
      .addCase(logout, (state) => {
        state.items = [];
        state.couponDiscount = 0;
        state.coupon = null;
        state.loading = false;
        localStorage.removeItem(CART_KEY);
      })
      .addCase(fetchCart.pending, (s) => { s.loading = true; })
      .addCase(fetchCart.fulfilled, setCart)
      .addCase(fetchCart.rejected, (s) => { s.loading = false; })
      .addCase(addToCart.fulfilled, setCart)
      .addCase(updateCartQty.fulfilled, setCart)
      .addCase(removeFromCart.fulfilled, setCart)
      .addCase(clearCart.fulfilled, setCart)
      .addCase(removeCoupon.fulfilled, setCart)
      .addCase(addToCart.rejected, (s) => { s.loading = false; })
      .addCase(updateCartQty.rejected, (s) => { s.loading = false; })
      .addCase(removeFromCart.rejected, (s) => { s.loading = false; })
      .addCase(clearCart.rejected, (s) => { s.loading = false; })
      .addCase(removeCoupon.rejected, (s) => { s.loading = false; })
      .addCase(applyCoupon.rejected, (s) => { s.loading = false; })
      .addCase(applyCoupon.fulfilled, (state, action) => {
        state.couponDiscount = action.payload.discount;
      });
  },
});

export const { setLocalCart } = cartSlice.actions;
export default cartSlice.reducer;
