import '@ant-design/v5-patch-for-react-19';

import { StyleProvider } from '@ant-design/cssinjs';
import { QueryClientProvider } from '@tanstack/react-query';
import { App as AntApp, ConfigProvider } from 'antd';
import enUS from 'antd/locale/en_US';
import { useMemo, type ReactNode } from 'react';

import { Spinner } from '@/shared/components/ui/Loader';
import { queryClient } from '@/shared/lib/react-query';
import { useThemeStore } from '@/shared/lib/theme';

import { getAppTheme } from './theme';

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const mode = useThemeStore((s) => s.mode);
  const appTheme = useMemo(() => getAppTheme(mode), [mode]);
  return (
    <QueryClientProvider client={queryClient}>
      <StyleProvider layer>
        <ConfigProvider theme={appTheme} locale={enUS} componentSize="middle" spin={{ indicator: <Spinner /> }}>
          <AntApp className="h-full" message={{ maxCount: 3, top: 12 }} notification={{ placement: 'bottomRight' }}>
            {children}
          </AntApp>
        </ConfigProvider>
      </StyleProvider>
    </QueryClientProvider>
  );
};
