import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';
import { logout } from './authSlice';

// Fetch unread message count
export const fetchUnreadMessageCount = createAsyncThunk('notifications/fetchUnreadMessageCount', async (_, { rejectWithValue }) => {
  try {
    const res = await api.get('/contact/chat/unread');
    return res.data.unreadCount || 0;
  } catch (err) {
    return rejectWithValue(0);
  }
});

const notificationsSlice = createSlice({
  name: 'notifications',
  initialState: {
    unreadMessages: 0,
    loading: false,
  },
  reducers: {
    setUnreadMessages: (state, action) => {
      state.unreadMessages = action.payload;
    },
    incrementUnreadMessages: (state) => {
      state.unreadMessages += 1;
    },
    clearUnreadMessages: (state) => {
      state.unreadMessages = 0;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUnreadMessageCount.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchUnreadMessageCount.fulfilled, (state, action) => {
        state.loading = false;
        state.unreadMessages = action.payload;
      })
      .addCase(fetchUnreadMessageCount.rejected, (state) => {
        state.loading = false;
        state.unreadMessages = 0;
      })
      // Clear notifications on logout
      .addCase(logout, (state) => {
        state.unreadMessages = 0;
        state.loading = false;
      });
  },
});

export const { setUnreadMessages, incrementUnreadMessages, clearUnreadMessages } = notificationsSlice.actions;
export default notificationsSlice.reducer;
