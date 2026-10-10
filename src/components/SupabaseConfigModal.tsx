import React, { useState } from 'react';
import { 
  SUPABASE_PROJECT_REF, 
  DEFAULT_SUPABASE_URL, 
  getSupabaseAnonKey, 
  setSupabaseAnonKey, 
  clearSupabaseAnonKey,
  isSupabaseConfigured 
} from '../lib/supabaseClient';
import { Database, Key, CheckCircle, AlertTriangle, ShieldCheck, X } from 'lucide-react';

interface SupabaseConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfigChanged: () => void;
}

export const SupabaseConfigModal: React.FC<SupabaseConfigModalProps> = ({
  isOpen,
  onClose,
  onConfigChanged,
}) => {
  const [anonKey, setAnonKey] = useState(getSupabaseAnonKey());
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (!anonKey.trim()) {
      setErrorMsg('Veuillez fournir la clé publique (Anon Key) de Supabase.');
      return;
    }
    setSupabaseAnonKey(anonKey.trim());
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onConfigChanged();
      onClose();
      window.location.reload();
    }, 800);
  };

  const handleReset = () => {
    clearSupabaseAnonKey();
    setAnonKey('');
    onConfigChanged();
  };

  const configured = isSupabaseConfigured();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in duration-200">
        <div className="bg-emerald-800 text-white p-5 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-emerald-700/80 rounded-lg">
              <Database className="w-5 h-5 text-emerald-200" />
            </div>
            <div>
              <h3 className="font-bold text-lg">Connexion Backend Supabase</h3>
              <p className="text-xs text-emerald-200">Projet Tafita mada ({SUPABASE_PROJECT_REF})</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-emerald-200 hover:text-white p-1 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs space-y-2 text-slate-700">
            <div className="flex justify-between items-center py-1 border-b border-slate-200">
              <span className="font-semibold text-slate-600">Projet Supabase:</span>
              <span className="font-mono text-emerald-700 font-bold">Tafita mada</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-slate-200">
              <span className="font-semibold text-slate-600">Project Ref:</span>
              <span className="font-mono bg-slate-200 px-2 py-0.5 rounded text-slate-800 font-semibold">{SUPABASE_PROJECT_REF}</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-slate-200">
              <span className="font-semibold text-slate-600">API URL:</span>
              <span className="font-mono text-slate-600 truncate max-w-[240px]">{DEFAULT_SUPABASE_URL}</span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="font-semibold text-slate-600">Statut de la clé:</span>
              {configured ? (
                <span className="inline-flex items-center text-emerald-600 font-semibold gap-1">
                  <CheckCircle className="w-3.5 h-3.5" /> Clé configurée
                </span>
              ) : (
                <span className="inline-flex items-center text-amber-600 font-semibold gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" /> Clé non détectée
                </span>
              )}
            </div>
          </div>

          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 text-xs text-emerald-900 flex items-start gap-2.5">
            <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Sécurité stricte :</p>
              <p className="text-emerald-800">
                Utilisez uniquement votre <strong>anon / public key</strong> de Supabase. 
                Ne collez jamais votre <code>service_role secret key</code> dans le client.
              </p>
            </div>
          </div>

          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                Clé Publique Supabase (Anon Key)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Key className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  value={anonKey}
                  onChange={(e) => setAnonKey(e.target.value)}
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-mono"
                />
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Disponible dans le dashboard Supabase : Project Settings → API → Project API Keys (anon / public).
              </p>
            </div>

            {errorMsg && (
              <p className="text-xs text-red-600 font-medium">{errorMsg}</p>
            )}

            {savedSuccess && (
              <div className="p-2.5 bg-emerald-100 text-emerald-800 rounded-lg text-xs font-medium flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                Clé enregistrée avec succès ! Rechargement...
              </div>
            )}

            <div className="flex items-center justify-between pt-2">
              {configured && (
                <button
                  type="button"
                  onClick={handleReset}
                  className="text-xs text-red-600 hover:text-red-700 hover:underline"
                >
                  Effacer la clé
                </button>
              )}
              <div className="flex gap-2 ml-auto">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Fermer
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-colors shadow-sm"
                >
                  Enregistrer et Connecter
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
