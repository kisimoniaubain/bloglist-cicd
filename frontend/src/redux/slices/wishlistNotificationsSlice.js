import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { logout } from './authSlice';
import api from '../../services/api';

// Async thunk to fetch wishlist count
export const fetchWishlistCount = createAsyncThunk(
  'wishlistNotifications/fetchWishlistCount',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/wishlist/count');
      const count = Number(response?.data?.count || 0);
      return { count };
    } catch (error) {
      if (error?.response?.status === 401) {
          return { count: 0 };
      }
      console.error('Error fetching wishlist count:', error);
      return rejectWithValue(error?.response?.data?.message || error.message || 'Failed to fetch wishlist count');
    }
  }
);

const wishlistNotificationsSlice = createSlice({
  name: 'wishlistNotifications',
  initialState: {
    wishlistCount: 0,
    loading: false,
    error: null,
  },
  reducers: {
    setWishlistCount: (state, action) => {
      state.wishlistCount = action.payload;
    },
    clearWishlistCount: (state) => {
      state.wishlistCount = 0;
    },
    incrementWishlistCount: (state) => {
      state.wishlistCount += 1;
    },
    decrementWishlistCount: (state) => {
      if (state.wishlistCount > 0) {
        state.wishlistCount -= 1;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchWishlistCount.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchWishlistCount.fulfilled, (state, action) => {
        state.wishlistCount = action.payload.count;
        state.loading = false;
      })
      .addCase(fetchWishlistCount.rejected, (state, action) => {
        state.error = action.payload;
        state.loading = false;
      })
      .addCase(logout, (state) => {
        state.wishlistCount = 0;
        state.loading = false;
        state.error = null;
      });
  },
});

export const {
  setWishlistCount,
  clearWishlistCount,
  incrementWishlistCount,
  decrementWishlistCount,
} = wishlistNotificationsSlice.actions;

export default wishlistNotificationsSlice.reducer;
