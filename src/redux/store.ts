import { configureStore } from '@reduxjs/toolkit';
import rootReducer from './rootSlice';

const store = configureStore({
  reducer: rootReducer,
});

export type AppState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;