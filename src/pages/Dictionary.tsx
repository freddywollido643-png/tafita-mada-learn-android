import React, { useEffect, useState } from 'react';
import { getSupabaseClient, isSupabaseConfigured } from '../lib/supabaseClient';
import { DictionaryEntry } from '../types/database';
import { BookMarked, Search, Filter, BookOpen } from 'lucide-react';

interface DictionaryPageProps {
  openConfigModal: () => void;
}

export const DictionaryPage: React.FC<DictionaryPageProps> = ({ openConfigModal }) => {
  const [entries, setEntries] = useState<DictionaryEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [selectedLevel, setSelectedLevel] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDictionary = async () => {
      setLoading(true);

      if (!isSupabaseConfigured()) {
        setEntries([
          {
            id: 'd-1',
            term: 'Fihavanana',
            subject: 'Kolontsaina',
            level: 'Rehetra',
            definition: 'Fifamatorana ara-piarahamonina sy ara-pitiavana eo amin\'ny mpiray tanindrazana na mpiara-belona.',
            translation_fr: 'Solidarité, fraternité et harmonie sociale malgache.',
            translation_en: 'Malagasy kinship, solidarity and mutual respect.',
            example: 'Ny fihavanana no sarobidy indrindra amin\'ny fiainan\'ny Malagasy.',
          },
          {
            id: 'd-2',
            term: 'Valim-babena',
            subject: 'Fahendrena',
            level: 'Rehetra',
            definition: 'Adidy sy valisoa atolotra ho fankasitrahana ny ray aman-dreny na ny fiaraha-monina tamin\'ny fanabeazana nomeny.',
            translation_fr: 'Reconnaissance filiale, devoir envers les aînés et bienfaiteurs.',
            translation_en: 'Filial gratitude and reciprocal duty.',
            example: 'Adidin\'ny tanora ny manao valim-babena ho an\'ny firenena.',
          },
        ]);
        setLoading(false);
        return;
      }

      // Supabase is configured: query dictionary_entries using real columns
      const supabase = getSupabaseClient();
      try {
        const { data, error } = await supabase
          .from('dictionary_entries')
          .select('*')
          .order('term', { ascending: true });

        if (error) {
          console.warn('Error fetching dictionary_entries:', error.message);
        }

        if (data && data.length > 0) {
          setEntries(data as DictionaryEntry[]);
        }
      } catch (err) {
        console.warn('Error loading dictionary from Supabase:', err);
      } finally {
        setLoading(false);
      }
    };

    loadDictionary();
  }, []);

  const subjects = ['all', ...Array.from(new Set(entries.map(e => e.subject).filter(Boolean)))];
  const levels = ['all', ...Array.from(new Set(entries.map(e => e.level).filter(Boolean)))];

  const filteredEntries = entries.filter((item) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      item.term.toLowerCase().includes(q) ||
      item.definition.toLowerCase().includes(q) ||
      (item.translation_fr && item.translation_fr.toLowerCase().includes(q)) ||
      (item.translation_en && item.translation_en.toLowerCase().includes(q)) ||
      (item.example && item.example.toLowerCase().includes(q));

    const matchesSubject = selectedSubject === 'all' || item.subject === selectedSubject;
    const matchesLevel = selectedLevel === 'all' || item.level === selectedLevel;

    return matchesSearch && matchesSubject && matchesLevel;
  });

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-xs font-semibold mb-2">
            <BookMarked className="w-3.5 h-3.5" />
            <span>Rakibolana Malagasy</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            Rakibolana & Harena Ara-Piteny
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Fikarohana teny, dika vilana amin'ny teny Frantsay sy Anglisy, ary ohatra fampiasana.
          </p>
        </div>

        <div className="text-xs text-slate-500">
          Teny voarakitra : <strong className="text-slate-900">{entries.length}</strong>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Hikaroka teny amin'ny teny Malagasy na Frantsay..."
              className="w-full pl-10 pr-4 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
            />
          </div>

          <div className="flex gap-2">
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="px-3 py-2 text-sm border border-slate-300 rounded-xl bg-white text-slate-700 focus:ring-2 focus:ring-amber-500 outline-none"
            >
              <option value="all">Taranja rehetra (Sujet)</option>
              {subjects.filter(s => s !== 'all').map((subj) => (
                <option key={subj} value={subj}>{subj}</option>
              ))}
            </select>

            <select
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e.target.value)}
              className="px-3 py-2 text-sm border border-slate-300 rounded-xl bg-white text-slate-700 focus:ring-2 focus:ring-amber-500 outline-none"
            >
              <option value="all">Ambaratonga rehetra (Niveau)</option>
              {levels.filter(l => l !== 'all').map((lvl) => (
                <option key={lvl} value={lvl}>{lvl}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Results Grid */}
      {loading ? (
        <div className="py-20 text-center text-slate-500 text-sm">
          Eo am-pampidirana ny rakibolana...
        </div>
      ) : filteredEntries.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500">
          <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="font-semibold text-slate-800">Tsy misy teny mifanaraka amin'ny fikarohanao.</p>
          <p className="text-xs mt-1">Hamarino ny tsipelina na andramo teny hafa.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredEntries.map((entry) => (
            <div
              key={entry.id}
              className="bg-white rounded-2xl border border-slate-200 hover:border-amber-400/60 p-6 shadow-xs hover:shadow-md transition-all space-y-4"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-xl font-black text-slate-900 tracking-tight">
                    {entry.term}
                  </h3>
                  {entry.language && (
                    <span className="text-xs font-serif italic text-amber-800">
                      {entry.language}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1.5">
                  {entry.subject && (
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-full">
                      {entry.subject}
                    </span>
                  )}
                  {entry.level && (
                    <span className="text-[10px] font-semibold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full">
                      {entry.level}
                    </span>
                  )}
                </div>
              </div>

              {/* Definition */}
              <div className="text-xs sm:text-sm text-slate-700 leading-relaxed bg-slate-50/70 p-3.5 rounded-xl border border-slate-100 space-y-2">
                <p className="font-medium text-slate-900">{entry.definition}</p>

                {entry.translation_fr && (
                  <div className="pt-2 border-t border-slate-200 text-xs text-slate-600">
                    <span className="font-bold text-slate-700">Français :</span>{' '}
                    <span>{entry.translation_fr}</span>
                  </div>
                )}

                {entry.translation_en && (
                  <div className="pt-1.5 text-xs text-slate-600">
                    <span className="font-bold text-slate-700">English :</span>{' '}
                    <span>{entry.translation_en}</span>
                  </div>
                )}

                {entry.example && (
                  <div className="pt-2 border-t border-slate-200 text-xs text-slate-500 italic">
                    « {entry.example} »
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
