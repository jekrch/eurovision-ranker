import { combineReducers, configureStore } from '@reduxjs/toolkit';
import rootReducer from './rootSlice';
import authReducer from './authSlice';
import tableReducer from './tableSlice';
import groupsReducer from './groupsSlice';

const reducer = combineReducers({
  root: rootReducer,
  auth: authReducer,
  table: tableReducer,
  groups: groupsReducer,
});

const store = configureStore({
  reducer,
});

export type AppState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;
