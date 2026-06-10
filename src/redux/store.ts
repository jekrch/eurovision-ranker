import { combineReducers, configureStore } from '@reduxjs/toolkit';

import authReducer from './authSlice';
import groupsReducer from './groupsSlice';
import rootReducer from './rootSlice';
import tableReducer from './tableSlice';

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
