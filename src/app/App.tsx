import { RouterProvider } from 'react-router-dom';

import { AppProvider } from './AppProvider';
import { router } from './router';

export const App = () => (
  <AppProvider>
    <RouterProvider router={router} />
  </AppProvider>
);
