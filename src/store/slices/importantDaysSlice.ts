// src/store/slices/importantDaysSlice.ts
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { ImportantDaysService } from '../../services/importantDays';
import { ImportantDay } from '../../types';

interface ImportantDaysState {
  items: ImportantDay[];
  loading: boolean;
  error: string | null;
}

const initialState: ImportantDaysState = {
  items: [],
  loading: false,
  error: null,
};

export const fetchImportantDays = createAsyncThunk(
  'importantDays/fetchAll',
  async (companyId: string | undefined) => {
    return await ImportantDaysService.getAll(companyId);
  }
);

const importantDaysSlice = createSlice({
  name: 'importantDays',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchImportantDays.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchImportantDays.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchImportantDays.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch important days';
      });
  },
});

export default importantDaysSlice.reducer;
