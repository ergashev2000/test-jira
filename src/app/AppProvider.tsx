import '@ant-design/v5-patch-for-react-19';

import { StyleProvider } from '@ant-design/cssinjs';
import { QueryClientProvider } from '@tanstack/react-query';
import { App as AntApp, ConfigProvider } from 'antd';
import enUS from 'antd/locale/en_US';
import type { ReactNode } from 'react';

import { queryClient } from '@/shared/lib/react-query';

import { appTheme } from './theme';

/** QueryClient + antd theme (layered under Tailwind utilities) + antd App context for message/modal. */
export const AppProvider = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider client={queryClient}>
    <StyleProvider layer>
      <ConfigProvider theme={appTheme} locale={enUS} componentSize="middle">
        <AntApp className="h-full" message={{ maxCount: 3, top: 56 }} notification={{ placement: 'bottomRight' }}>
          {children}
        </AntApp>
      </ConfigProvider>
    </StyleProvider>
  </QueryClientProvider>
);
