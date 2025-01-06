import { lazy, Suspense } from 'react';
import { Provider } from 'react-redux';
import ReactDOM from 'react-dom/client';
import store from './redux/store';

// import global styles
import './index.css';
import './auroral.css';

// lazy load the App component
const App = lazy(() => import('./App'));

const LoadingFallback = () => <div className="w-full h-full normal-bg" aria-label="Loading"/>;

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

declare global {
  interface Window {
    gtag: (
      command: string,
      action: string,
      params?: Record<string, any>
    ) => void;
    dataLayer: any[];
  }
}

root.render(
    <Provider store={store}>
      <Suspense fallback={<LoadingFallback />}>
        <App />
      </Suspense>
    </Provider>
);