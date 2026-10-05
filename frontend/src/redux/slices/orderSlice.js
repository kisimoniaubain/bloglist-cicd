import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';
import toast from 'react-hot-toast';

const ORDERS_KEY = 'soldyLocalOrders';

const loadLocalOrders = () => {
  try {
    const parsed = JSON.parse(localStorage.getItem(ORDERS_KEY) || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const saveLocalOrders = (orders) => {
  localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
};

const shouldUseLocalFallback = (err) => {
  const status = err?.response?.status;
  return !err?.response || status === 401 || status === 403 || status === 429 || status >= 500;
};

const clearBrokenAuthIfNeeded = (err) => {
  const msg = String(err?.response?.data?.message || '').toLowerCase();
  if (err?.response?.status === 401 && msg.includes('token')) {
    localStorage.removeItem('soldyToken');
    localStorage.removeItem('soldyUser');
    toast('Session expired. Switching to website mode orders.', { icon: 'ℹ️' });
  }
};

export const createOrder = createAsyncThunk('orders/create', async (orderData, { rejectWithValue }) => {
  try {
    const res = await api.post('/orders', orderData);
    return res.data.order;
  } catch (err) {
    if (shouldUseLocalFallback(err)) {
      clearBrokenAuthIfNeeded(err);
      const localOrder = {
        _id: `local-order-${Date.now()}`,
        ...orderData,
        status: 'pending',
        isPaid: false,
        createdAt: new Date().toISOString(),
      };
      const orders = [localOrder, ...loadLocalOrders()];
      saveLocalOrders(orders);
      toast('Order saved in website mode', { icon: 'ℹ️' });
      return localOrder;
    }
    return rejectWithValue(err.response?.data?.message);
  }
});

export const fetchMyOrders = createAsyncThunk('orders/fetchMy', async (_, { rejectWithValue }) => {
  try {
    const res = await api.get('/orders/my');
    return res.data.orders;
  } catch (err) {
    if (shouldUseLocalFallback(err)) {
      clearBrokenAuthIfNeeded(err);
      return loadLocalOrders();
    }
    return rejectWithValue(err.response?.data?.message);
  }
});

export const fetchOrderById = createAsyncThunk('orders/fetchById', async (id, { rejectWithValue }) => {
  try {
    const res = await api.get(`/orders/${id}`);
    return res.data.order;
  } catch (err) {
    if (shouldUseLocalFallback(err)) {
      clearBrokenAuthIfNeeded(err);
      const order = loadLocalOrders().find((o) => o._id === id);
      return order || null;
    }
    return rejectWithValue(err.response?.data?.message);
  }
});

export const cancelOrder = createAsyncThunk('orders/cancel', async (id, { rejectWithValue }) => {
  try {
    const res = await api.put(`/orders/${id}/cancel`);
    toast.success('Order cancelled');
    return res.data.order;
  } catch (err) {
    if (shouldUseLocalFallback(err)) {
      clearBrokenAuthIfNeeded(err);
      const orders = loadLocalOrders().map((o) => (o._id === id ? { ...o, status: 'cancelled' } : o));
      saveLocalOrders(orders);
      const updated = orders.find((o) => o._id === id);
      if (updated) {
        toast.success('Order cancelled');
        return updated;
      }
      return rejectWithValue('Order not found');
    }
    toast.error(err.response?.data?.message || 'Failed to cancel');
    return rejectWithValue(err.response?.data?.message);
  }
});

const orderSlice = createSlice({
  name: 'orders',
  initialState: { list: loadLocalOrders(), currentOrder: null, loading: false, error: null },
  reducers: {
    clearCurrentOrder: (state) => { state.currentOrder = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createOrder.pending, (s) => { s.loading = true; })
      .addCase(createOrder.fulfilled, (s, a) => { s.loading = false; s.currentOrder = a.payload; })
      .addCase(createOrder.rejected, (s, a) => { s.loading = false; s.error = a.payload; })

      .addCase(fetchMyOrders.pending, (s) => { s.loading = true; })
      .addCase(fetchMyOrders.fulfilled, (s, a) => { s.loading = false; s.list = a.payload; })
      .addCase(fetchMyOrders.rejected, (s, a) => { s.loading = false; s.error = a.payload; })

      .addCase(fetchOrderById.fulfilled, (s, a) => { s.currentOrder = a.payload; })

      .addCase(cancelOrder.fulfilled, (s, a) => {
        s.list = s.list.map((o) => (o._id === a.payload._id ? a.payload : o));
        if (s.currentOrder?._id === a.payload._id) s.currentOrder = a.payload;
      });
  },
});

export const { clearCurrentOrder } = orderSlice.actions;
export default orderSlice.reducer;
