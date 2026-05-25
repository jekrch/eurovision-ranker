import { lazy, Suspense } from 'react';
import { Provider } from 'react-redux';
import ReactDOM from 'react-dom/client';
import store from './redux/store';
import { registerUnauthorizedHandler } from './utilities/api/client';
import { logout } from './redux/rootSlice';

// import global styles
import './index.css';
import './themes.css';
import './auroral.css';

registerUnauthorizedHandler(() => {
    store.dispatch(logout());
});

// lazy load the App component
const App = lazy(() => import('./App'));

const LoadingFallback = () => <div className="w-full h-full normal-bg" aria-label="Loading"/>;

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
    <Provider store={store}>
      <Suspense fallback={<LoadingFallback />}>
        <App />
      </Suspense>
    </Provider>
);
