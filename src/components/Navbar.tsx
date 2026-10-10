import React, { useState } from 'react';
import { 
  BookOpen, 
  Users, 
  BookMarked, 
  Library, 
  User, 
  Home, 
  Menu, 
  X, 
  Database, 
  LogOut, 
  LogIn,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { isSupabaseConfigured, SUPABASE_PROJECT_REF } from '../lib/supabaseClient';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  openConfigModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab, openConfigModal }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, profile, role, signOut } = useAuth();
  const configured = isSupabaseConfigured();

  const navItems = [
    { id: 'home', label: 'Accueil', icon: Home },
    { id: 'courses', label: 'Cours', icon: BookOpen },
    { id: 'community', label: 'Communauté', icon: Users },
    { id: 'dictionary', label: 'Dictionnaire', icon: BookMarked },
    { id: 'books', label: 'Livres', icon: Library },
    { id: 'profile', label: 'Profil', icon: User },
  ];

  const handleNavClick = (id: string) => {
    setActiveTab(id);
    setMobileMenuOpen(false);
  };

  const getRoleBadge = (r: string) => {
    switch (r) {
      case 'Mpampianatra':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'Admin':
        return 'bg-rose-100 text-rose-800 border-rose-300';
      case 'RAD':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'Mpianatra':
      default:
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => handleNavClick('home')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-700 to-teal-500 flex items-center justify-center text-white shadow-md font-bold text-xl">
              T
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg tracking-tight text-slate-900">
                  TAFITA MADA
                </span>
                <span className="px-1.5 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800 tracking-wide uppercase">
                  Learn
                </span>
              </div>
              <p className="text-[10px] text-slate-500 tracking-wider">
                Vavahadin'ny Fahalalana sy ny Fahaizana
              </p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-emerald-700 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Right Header: Supabase status & User Auth */}
          <div className="hidden lg:flex items-center gap-3">
            {/* Supabase backend status pill */}
            <button
              onClick={openConfigModal}
              title="Statut du backend Supabase (szxficncfyvghhxqzlnp)"
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                configured
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                  : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
              }`}
            >
              <Database className="w-3.5 h-3.5" />
              <span>Supabase: {SUPABASE_PROJECT_REF.slice(0, 8)}...</span>
              {configured ? (
                <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
              )}
            </button>

            {user ? (
              <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
                <button
                  onClick={() => handleNavClick('profile')}
                  className="flex items-center gap-2 group text-left"
                >
                  <div className="w-8 h-8 rounded-full bg-slate-200 border border-slate-300 flex items-center justify-center text-slate-700 text-xs font-bold uppercase overflow-hidden">
                    {profile?.avatar_url ? (
                      <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      (profile?.full_name || user.email || 'U').charAt(0)
                    )}
                  </div>
                  <div className="text-xs">
                    <p className="font-semibold text-slate-800 group-hover:text-emerald-700 truncate max-w-[100px]">
                      {profile?.full_name || user.email?.split('@')[0]}
                    </p>
                    <span className={`text-[10px] px-1 py-0.2 rounded border font-medium ${getRoleBadge(role)}`}>
                      {role}
                    </span>
                  </div>
                </button>
                <button
                  onClick={() => signOut()}
                  title="Déconnexion"
                  className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => handleNavClick('auth')}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
              >
                <LogIn className="w-3.5 h-3.5" />
                Se connecter
              </button>
            )}
          </div>

          {/* Mobile menu trigger */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={openConfigModal}
              className="p-1.5 text-slate-500 rounded-lg border border-slate-200"
            >
              <Database className="w-4 h-4" />
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-600 hover:bg-slate-100"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-5 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium ${
                  isActive
                    ? 'bg-emerald-700 text-white'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Icon className="w-5 h-5" />
                {item.label}
              </button>
            );
          })}
          <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                openConfigModal();
              }}
              className="flex items-center justify-between w-full px-3 py-2 text-xs font-medium text-slate-600 bg-slate-50 rounded-lg"
            >
              <span className="flex items-center gap-2">
                <Database className="w-4 h-4 text-emerald-600" />
                Projet Supabase: {SUPABASE_PROJECT_REF}
              </span>
              <span className={configured ? 'text-emerald-600 font-bold' : 'text-amber-600 font-bold'}>
                {configured ? 'Actif' : 'Configurer'}
              </span>
            </button>
            {user ? (
              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold">
                    {(profile?.full_name || 'U').charAt(0)}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-800">{profile?.full_name}</p>
                    <span className="text-[10px] text-slate-500">{role}</span>
                  </div>
                </div>
                <button
                  onClick={() => signOut()}
                  className="text-xs text-red-600 font-semibold px-2 py-1"
                >
                  Déconnexion
                </button>
              </div>
            ) : (
              <button
                onClick={() => handleNavClick('auth')}
                className="w-full text-center py-2 bg-emerald-700 text-white rounded-lg text-xs font-semibold"
              >
                Se connecter / Créer un compte
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
