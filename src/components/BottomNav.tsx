import React from 'react';
import { UserRole } from '../types';
import { Home, Users, FolderOpen, MapPinned, MessageSquare, Settings } from 'lucide-react';

export type TabType = 'home' | 'tab2' | 'pos' | 'tab3' | 'chat' | 'admin';

interface BottomNavProps {
  userRole: UserRole;
  activeTab: TabType;
  unreadChatCount?: number;
  onTabChange: (tab: TabType) => void;
  merchantContext?: boolean;
  youthContext?: boolean;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  userRole,
  activeTab,
  unreadChatCount = 0,
  onTabChange,
  merchantContext = false,
  youthContext = false
}) => {
  const getTab2Label = () => {
    if (userRole === 'admin' || userRole === 'super_admin' || userRole === 'supervisor' || userRole === 'sub_admin') return 'Monitoring';
    return merchantContext ? 'Transactions' : 'Clients';
  };

  const getTab3Label = () => 'Archives';
  const getAdminLabel = () => 'Gestion';

  if (youthContext) {
    return (
      <nav className="app-bottom-nav fixed bottom-4 left-4 right-4 h-18 backdrop-blur-2xl bg-zinc-950/85 border border-white/10 rounded-3xl z-40 flex items-center justify-around px-3 shadow-[0_12px_40px_rgba(0,0,0,0.65)]">
        <button
          onClick={() => onTabChange('home')}
          data-active={activeTab === 'home'}
          className={`app-tab flex-1 flex flex-col items-center justify-center space-y-1 transition-all duration-200 ${
            activeTab === 'home' ? 'text-emerald-400' : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Home className={`w-5 h-5 transition-transform duration-200 ${activeTab === 'home' ? '-translate-y-0.5 scale-110 text-emerald-400' : ''}`} />
          <span className="text-[10px] font-black uppercase tracking-wider">Accueil</span>
          {activeTab === 'home' && <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.8)]" />}
        </button>
        <button
          onClick={() => onTabChange('chat')}
          data-active={activeTab === 'chat'}
          className={`app-tab flex-1 flex flex-col items-center justify-center space-y-1 transition-all duration-200 ${
            activeTab === 'chat' ? 'text-cyan-400' : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <div className="relative">
            <MessageSquare className={`w-5 h-5 transition-transform duration-200 ${activeTab === 'chat' ? '-translate-y-0.5 scale-110 text-cyan-400' : ''}`} />
            {unreadChatCount > 0 && activeTab !== 'chat' && (
              <span className="absolute -top-1.5 -right-2 min-w-4 h-4 px-1 bg-cyan-500 text-zinc-950 rounded-full text-[9px] font-black flex items-center justify-center shadow-[0_0_8px_rgba(6,182,212,0.6)]">
                {unreadChatCount > 99 ? '99+' : unreadChatCount}
              </span>
            )}
          </div>
          <span className="text-[10px] font-black uppercase tracking-wider">Chat</span>
          {activeTab === 'chat' && <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full shadow-[0_0_8px_rgba(6,182,212,0.8)]" />}
        </button>
      </nav>
    );
  }

  return (
    <nav className="app-bottom-nav fixed bottom-4 left-4 right-4 h-18 backdrop-blur-2xl bg-zinc-950/85 border border-white/10 rounded-3xl z-40 flex items-center justify-around px-3 shadow-[0_12px_40px_rgba(0,0,0,0.65)]">
      <button
        onClick={() => onTabChange('home')}
        data-active={activeTab === 'home'}
        className={`app-tab flex-1 flex flex-col items-center justify-center space-y-1 transition-all duration-200 ${
          activeTab === 'home' ? 'text-emerald-400' : 'text-zinc-400 hover:text-zinc-200'
        }`}
      >
        <Home className={`w-5 h-5 transition-transform duration-200 ${activeTab === 'home' ? '-translate-y-0.5 scale-110 text-emerald-400' : ''}`} />
        <span className="text-[10px] font-black uppercase tracking-wider">Home</span>
        {activeTab === 'home' && (
          <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
        )}
      </button>

      <button
        onClick={() => onTabChange('tab2')}
        data-active={activeTab === 'tab2'}
        className={`app-tab flex-1 flex flex-col items-center justify-center space-y-1 transition-all duration-200 ${
          activeTab === 'tab2' ? 'text-cyan-400' : 'text-zinc-400 hover:text-zinc-200'
        }`}
      >
        <Users className={`w-5 h-5 transition-transform duration-200 ${activeTab === 'tab2' ? '-translate-y-0.5 scale-110 text-cyan-400' : ''}`} />
        <span className="text-[10px] font-black uppercase tracking-wider">{getTab2Label()}</span>
        {activeTab === 'tab2' && (
          <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
        )}
      </button>

      {merchantContext && userRole === 'agent' && (
        <button
          onClick={() => onTabChange('pos')}
          data-active={activeTab === 'pos'}
          className={`app-tab flex-1 flex flex-col items-center justify-center space-y-1 transition-all duration-200 ${
            activeTab === 'pos' ? 'text-teal-400' : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <MapPinned className={`w-5 h-5 transition-transform duration-200 ${activeTab === 'pos' ? '-translate-y-0.5 scale-110 text-teal-400' : ''}`} />
          <span className="text-[10px] font-black uppercase tracking-wider">Mes POS</span>
          {activeTab === 'pos' && (
            <div className="w-1.5 h-1.5 bg-teal-400 rounded-full shadow-[0_0_8px_rgba(20,184,166,0.8)]" />
          )}
        </button>
      )}

      <button
        onClick={() => onTabChange('tab3')}
        data-active={activeTab === 'tab3'}
        className={`app-tab flex-1 flex flex-col items-center justify-center space-y-1 transition-all duration-200 ${
          activeTab === 'tab3' ? 'text-indigo-400' : 'text-zinc-400 hover:text-zinc-200'
        }`}
      >
        <FolderOpen className={`w-5 h-5 transition-transform duration-200 ${activeTab === 'tab3' ? '-translate-y-0.5 scale-110 text-indigo-400' : ''}`} />
        <span className="text-[10px] font-black uppercase tracking-wider">{getTab3Label()}</span>
        {activeTab === 'tab3' && (
          <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full shadow-[0_0_8px_rgba(99,102,241,0.8)]" />
        )}
      </button>

      <button
        onClick={() => onTabChange('chat')}
        data-active={activeTab === 'chat'}
        className={`app-tab flex-1 flex flex-col items-center justify-center space-y-1 transition-all duration-200 ${
          activeTab === 'chat' ? 'text-amber-400' : 'text-zinc-400 hover:text-zinc-200'
        }`}
      >
        <div className="relative">
          <MessageSquare className={`w-5 h-5 transition-transform duration-200 ${activeTab === 'chat' ? '-translate-y-0.5 scale-110 text-amber-400' : ''}`} />
          {unreadChatCount > 0 && activeTab !== 'chat' && (
            <span className="absolute -top-1.5 -right-2 min-w-4 h-4 px-1 bg-amber-500 text-zinc-950 rounded-full text-[9px] font-black flex items-center justify-center shadow-[0_0_8px_rgba(245,158,11,0.6)]">
              {unreadChatCount > 99 ? '99+' : unreadChatCount}
            </span>
          )}
        </div>
        <span className="text-[10px] font-black uppercase tracking-wider">Chat</span>
        {activeTab === 'chat' && (
          <div className="w-1.5 h-1.5 bg-amber-400 rounded-full shadow-[0_0_8px_rgba(245,158,11,0.8)]" />
        )}
      </button>

      {(userRole === 'admin' || userRole === 'super_admin' || userRole === 'supervisor' || userRole === 'sub_admin') && (
        <button
          onClick={() => onTabChange('admin')}
          data-active={activeTab === 'admin'}
          className={`app-tab flex-1 flex flex-col items-center justify-center space-y-1 transition-all duration-200 ${
            activeTab === 'admin' ? 'text-fuchsia-400' : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Settings className={`w-5 h-5 transition-transform duration-200 ${activeTab === 'admin' ? '-translate-y-0.5 scale-110 text-fuchsia-400' : ''}`} />
          <span className="text-[10px] font-black uppercase tracking-wider">{getAdminLabel()}</span>
          {activeTab === 'admin' && (
            <div className="w-1.5 h-1.5 bg-fuchsia-400 rounded-full shadow-[0_0_8px_rgba(217,70,239,0.8)]" />
          )}
        </button>
      )}
    </nav>
  );
};

export default BottomNav;
