import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { logout } from './authSlice';
import api from '../../services/api';
import { setWishlistCount } from './wishlistNotificationsSlice';

const hasAuthToken = () => {
  try {
    return Boolean(sessionStorage.getItem('soldyToken') || localStorage.getItem('soldyToken'));
  } catch {
    return false;
  }
};

// Async thunk to fetch wishlist items from server
export const fetchWishlist = createAsyncThunk(
  'wishlist/fetchWishlist',
  async (_, { rejectWithValue, dispatch }) => {
    try {
      const response = await api.get('/wishlist');
      const items = response.data.wishlist?.products || [];
      dispatch(setWishlistCount(items.length));
      return items;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch wishlist');
    }
  }
);

export const toggleWishlistAsync = createAsyncThunk(
  'wishlist/toggleWishlistAsync',
  async (product, { getState, rejectWithValue, dispatch }) => {
    try {
      const state = getState();
      const exists = state.wishlist.items.some((item) => item._id === product._id);

      const response = exists
        ? await api.delete(`/wishlist/${product._id}`)
        : await api.post('/wishlist', { productId: product._id });

      const items = response.data.wishlist?.products || [];
      dispatch(setWishlistCount(items.length));
      return items;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update wishlist');
    }
  }
);

const loadWishlist = () => {
  try {
    // Only load cached wishlist when a token exists in browser storage.
    if (!hasAuthToken()) {
      return [];
    }
    const raw = localStorage.getItem('soldyWishlist');
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    localStorage.removeItem('soldyWishlist');
    return [];
  }
};

const wishlistSlice = createSlice({
  name: 'wishlist',
  initialState: { items: loadWishlist(), loading: false, error: null },
  reducers: {
    toggleWishlist: (state, action) => {
      const product = action.payload;
      const index = state.items.findIndex((i) => i._id === product._id);
      if (index > -1) {
        state.items.splice(index, 1);
      } else {
        state.items.push(product);
      }
      try {
        localStorage.setItem('soldyWishlist', JSON.stringify(state.items));
      } catch {
        // ignore storage quota/privacy errors to avoid breaking UI
      }
    },
    clearWishlist: (state) => {
      state.items = [];
      try {
        localStorage.removeItem('soldyWishlist');
      } catch {
        // ignore storage quota/privacy errors to avoid breaking UI
      }
    },
  },
  extraReducers: (builder) => {
    builder.addCase(logout, (state) => {
      state.items = [];
      state.loading = false;
      state.error = null;
      try {
        localStorage.removeItem('soldyWishlist');
      } catch {
        // ignore storage quota/privacy errors to avoid breaking UI
      }
    });
    builder.addCase(fetchWishlist.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchWishlist.fulfilled, (state, action) => {
      state.loading = false;
      state.items = action.payload;
      try {
        localStorage.setItem('soldyWishlist', JSON.stringify(action.payload));
      } catch {
        // ignore storage quota/privacy errors to avoid breaking UI
      }
    });
    builder.addCase(fetchWishlist.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
    });
    builder.addCase(toggleWishlistAsync.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(toggleWishlistAsync.fulfilled, (state, action) => {
      state.loading = false;
      state.items = action.payload;
      try {
        localStorage.setItem('soldyWishlist', JSON.stringify(action.payload));
      } catch {
        // ignore storage quota/privacy errors to avoid breaking UI
      }
    });
    builder.addCase(toggleWishlistAsync.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
    });
  },
});

export const { toggleWishlist, clearWishlist } = wishlistSlice.actions;
export default wishlistSlice.reducer;
