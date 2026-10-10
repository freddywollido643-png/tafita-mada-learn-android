import React from 'react';
import { SUPABASE_PROJECT_REF } from '../lib/supabaseClient';
import { Database, Heart } from 'lucide-react';

interface FooterProps {
  openConfigModal: () => void;
}

export const Footer: React.FC<FooterProps> = ({ openConfigModal }) => {
  return (
    <footer className="bg-slate-900 text-slate-400 text-xs py-10 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-white font-bold text-base">
              <span className="w-6 h-6 rounded bg-emerald-600 text-white flex items-center justify-center text-xs">T</span>
              TAFITA MADA Learn
            </div>
            <p className="text-slate-400 leading-relaxed">
              Sehatra fampianarana sy fizarana fahaizana ho an'ny Malagasy rehetra.
              Fampianarana mifanaraka amin'ny vanim-potoana.
            </p>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-3">Votoatiny</h4>
            <ul className="space-y-2">
              <li><span className="hover:text-emerald-400">Fianarana sy Fampianarana (Cours)</span></li>
              <li><span className="hover:text-emerald-400">Vondrona ifanakalozana (Groupes)</span></li>
              <li><span className="hover:text-emerald-400">Rakibolana Malagasy (Dictionnaire)</span></li>
              <li><span className="hover:text-emerald-400">Fivarotam-boky (Livres)</span></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-3">Rindran-damina (Backend)</h4>
            <div className="space-y-2">
              <p className="text-[11px] text-slate-400">
                Backend Supabase dédié :
              </p>
              <div className="p-2.5 rounded-lg bg-slate-800 border border-slate-700 font-mono text-[11px] text-emerald-400 flex items-center justify-between">
                <span>{SUPABASE_PROJECT_REF}</span>
                <button
                  onClick={openConfigModal}
                  className="text-slate-300 hover:text-white underline text-[10px]"
                >
                  Statut
                </button>
              </div>
              <p className="text-[10px] text-slate-500">
                Base PostgreSQL & Auth avec Row Level Security (RLS)
              </p>
            </div>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-3">Fiaraha-monina</h4>
            <p className="text-slate-400 mb-2">
              Ny firaisankina no herintsika. Miaraka manangana ny hoavin'ny fanabeazana eto Madagasikara.
            </p>
            <div className="flex items-center gap-1 text-[11px] text-slate-500">
              Namboarina tamin'ny <Heart className="w-3.5 h-3.5 text-rose-500 inline fill-rose-500" /> ho an'i Madagasikara
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-4 text-[11px] text-slate-500">
          <p>© {new Date().getFullYear()} TAFITA MADA Learn. Zo rehetra voatokana.</p>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5">
              <Database className="w-3 h-3 text-emerald-500" />
              Projet: Tafita mada
            </span>
            <span>•</span>
            <span>RLS Active</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
