import React, { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import { TopHeader } from './components/TopHeader';
import { Sidebar, SidebarTab } from './components/Sidebar';
import { ShowEpisodeListPage } from './pages/ShowEpisodeListPage';
import { PublishPage } from './pages/PublishPage';
import { MediaLibraryPage } from './pages/MediaLibraryPage';
import { UsersPage } from './pages/UsersPage';
import { SettingsPage } from './pages/SettingsPage';
import './styles/cms.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 10000
    }
  }
});

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<SidebarTab>('catalog');

  const renderContent = () => {
    switch (activeTab) {
      case 'catalog':
        return <ShowEpisodeListPage initialTab="shows" />;
      case 'episodes':
        return <ShowEpisodeListPage initialTab="episodes" />;
      case 'publish':
        return <PublishPage />;
      case 'media':
        return <MediaLibraryPage />;
      case 'users':
        return <UsersPage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <ShowEpisodeListPage initialTab="shows" />;
    }
  };

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <div className="studio-root-layout">
          <TopHeader />
          <div className="studio-body-layout">
            <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
            <main className="studio-main-viewport">
              {renderContent()}
            </main>
          </div>
        </div>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
