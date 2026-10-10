import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getSupabaseClient, isSupabaseConfigured } from '../lib/supabaseClient';
import { Course, Group, CommunityLink, DictionaryEntry, Book } from '../types/database';
import { 
  BookOpen, 
  Users, 
  BookMarked, 
  Library, 
  ArrowRight, 
  CheckCircle2, 
  Sparkles, 
  MessageSquare, 
  ExternalLink,
  GraduationCap
} from 'lucide-react';

interface HomePageProps {
  onNavigate: (tab: string, extraId?: string) => void;
  openConfigModal: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onNavigate, openConfigModal }) => {
  const { user, profile, role } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [externalLinks, setExternalLinks] = useState<CommunityLink[]>([]);
  const [featuredWord, setFeaturedWord] = useState<DictionaryEntry | null>(null);
  const [featuredBooks, setFeaturedBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      setLoading(true);
      if (!isSupabaseConfigured()) {
        setCourses([]);
        setGroups([]);
        setExternalLinks([]);
        setFeaturedWord(null);
        setFeaturedBooks([]);
        setLoading(false);
        return;
      }

      // If Supabase is configured, fetch directly from the existing tables!
      const supabase = getSupabaseClient();
      try {
        const [coursesRes, groupsRes, extRes, dictRes, booksRes] = await Promise.allSettled([
          supabase.from('courses').select('*').limit(3),
          supabase.from('groups').select('*').limit(3),
          supabase.from('community_links').select('*').limit(4),
          supabase.from('dictionary_entries').select('*').limit(1).maybeSingle(),
          supabase.from('books').select('*').limit(3),
        ]);

        if (coursesRes.status === 'fulfilled' && coursesRes.value.data && coursesRes.value.data.length > 0) {
          setCourses(coursesRes.value.data as Course[]);
        } else {
          setCourses([]);
        }
        if (groupsRes.status === 'fulfilled' && groupsRes.value.data && groupsRes.value.data.length > 0) {
          setGroups(groupsRes.value.data as Group[]);
        }
        if (extRes.status === 'fulfilled' && extRes.value.data && extRes.value.data.length > 0) {
          setExternalLinks(extRes.value.data as CommunityLink[]);
        }
        if (dictRes.status === 'fulfilled' && dictRes.value.data) {
          setFeaturedWord(dictRes.value.data as DictionaryEntry);
        }
        if (booksRes.status === 'fulfilled' && booksRes.value.data && booksRes.value.data.length > 0) {
          setFeaturedBooks(booksRes.value.data as Book[]);
        }
      } catch (err) {
        console.warn('Error fetching live data from tables:', err);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);


  return (
    <div className="space-y-10 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-emerald-900 via-teal-800 to-slate-900 text-white rounded-3xl p-8 sm:p-12 shadow-xl border border-emerald-700/30">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-200 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Sehatra Fanabeazana sy Fahalalana Malagasy</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight">
            Tongasoa eto amin'ny <br />
            <span className="text-emerald-300">TAFITA MADA Learn</span>
          </h1>

          <p className="text-slate-200 text-sm sm:text-base leading-relaxed">
            {user ? (
              <>
                Faly mandray anao, <span className="font-bold text-white">{profile?.full_name || user.email}</span> ! 
                Mizora amin'ny fandrosoana sy fahaizana miaraka amin'ireo fampianarana, vondrona ary boky voatokana ho anao ({role}).
              </>
            ) : (
              <>
                Mianara amin'ny fomba maoderina. Lesona manaraka ny fandaharam-pianarana, fizarana fahalalana, ary vondrom-piarahamonina velona manerana an'i Madagasikara.
              </>
            )}
          </p>

          <div className="pt-2 flex flex-wrap gap-3">
            <button
              onClick={() => onNavigate('courses')}
              className="px-5 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm shadow-md transition-all flex items-center gap-2"
            >
              <BookOpen className="w-4 h-4" />
              Zahao ireo taranja (Cours)
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => onNavigate('community')}
              className="px-5 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 font-semibold text-sm backdrop-blur-xs transition-all flex items-center gap-2"
            >
              <Users className="w-4 h-4" />
              Hiditra vondrona (Groupes)
            </button>
          </div>
        </div>
      </section>

      {/* Quick Navigation Cards */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { id: 'courses', title: 'Cours & Lesona', desc: 'Fampianarana sy fanadinana', icon: BookOpen, color: 'text-emerald-700 bg-emerald-50' },
          { id: 'community', title: 'Communauté', desc: 'Vondrona anatiny & rohy ivelany', icon: Users, color: 'text-teal-700 bg-teal-50' },
          { id: 'dictionary', title: 'Rakibolana', desc: 'Teny malagasy sy dikany', icon: BookMarked, color: 'text-amber-700 bg-amber-50' },
          { id: 'books', title: 'Boky & Tahiry', desc: 'Boky nomerika sy taratasy', icon: Library, color: 'text-blue-700 bg-blue-50' },
        ].map((c) => {
          const Icon = c.icon;
          return (
            <div
              key={c.id}
              onClick={() => onNavigate(c.id)}
              className="group bg-white p-5 rounded-2xl border border-slate-200 hover:border-emerald-500/50 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${c.color} transition-transform group-hover:scale-105`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 group-hover:text-emerald-700 transition-colors text-sm">
                    {c.title}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">{c.desc}</p>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-emerald-700 group-hover:translate-x-1 transition-transform">
                <span>Handeha</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </div>
          );
        })}
      </section>

      {/* Featured Courses Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Taranja Asongadina (Cours en vedette)</h2>
            <p className="text-xs text-slate-500">Lesona sy fiofanana vonona ianarana</p>
          </div>
          <button
            onClick={() => onNavigate('courses')}
            className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
          >
            Hijerena ny rehetra <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {courses.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-500 text-xs">
            Tsy misy taranja asongadina amin'izao fotoana izao.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {courses.map((course) => (
            <div
              key={course.id}
              onClick={() => onNavigate('courses', course.id)}
              className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-lg transition-all cursor-pointer flex flex-col justify-between"
            >
              <div className="p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800">
                    {course.series ? `Série ${course.series}` : 'Fianarana'}
                  </span>
                  <span className="text-xs font-bold text-emerald-600">
                    {course.price_mga && course.price_mga > 0 ? `${course.price_mga.toLocaleString()} Ar` : 'Maimaimpoana'}
                  </span>
                </div>
                <h3 className="font-bold text-slate-900 text-base leading-snug hover:text-emerald-700">
                  {course.title}
                </h3>
                <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                  {course.description || 'Lesona feno ahitana torolalana sy fanazavana.'}
                </p>
              </div>
              <div className="bg-slate-50 px-5 py-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span className="flex items-center gap-1.5">
                  <GraduationCap className="w-4 h-4 text-emerald-600" />
                  {course.series ? `Série ${course.series}` : 'Fianarana'}
                </span>
                <span className="font-semibold text-emerald-700 flex items-center gap-1">
                  Hanomboka <ArrowRight className="w-3 h-3" />
                </span>
              </div>
            </div>
          ))}
        </div>
        )}
      </section>

      {/* Internal Community & Dictionary Spotlight Grid */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Internal Groups Preview (2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-emerald-100 rounded-xl text-emerald-700">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900">Vondrona ifanakalozana anatiny (Groupes Internes)</h3>
                <p className="text-xs text-slate-500">Chat sy resaka anivon'ny mpianatra sy mpampianatra</p>
              </div>
            </div>
            <button
              onClick={() => onNavigate('community')}
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-800"
            >
              Hiditra vondrona
            </button>
          </div>

          <div className="space-y-3">
            {groups.map((group) => (
              <div
                key={group.id}
                onClick={() => onNavigate('community', group.id)}
                className="p-3.5 rounded-xl border border-slate-100 hover:border-emerald-300 hover:bg-emerald-50/30 transition-all cursor-pointer flex items-center justify-between"
              >
                <div className="space-y-1">
                  <h4 className="font-semibold text-sm text-slate-900">{group.name}</h4>
                  <p className="text-xs text-slate-500 line-clamp-1">{group.description}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0 ml-4">
                  <span className="text-[11px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md font-medium">
                    Vondrona
                  </span>
                  <MessageSquare className="w-4 h-4 text-emerald-600" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Word of the Day (1 col) */}
        <div className="bg-gradient-to-br from-amber-50 to-orange-50/50 rounded-2xl border border-amber-200 p-6 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-200 text-amber-900">
                Teny Malagasy Androany
              </span>
              <BookMarked className="w-4 h-4 text-amber-700" />
            </div>

            {featuredWord && (
              <>
                <div>
                  <h3 className="text-xl font-extrabold text-slate-900">{featuredWord.term}</h3>
                  <p className="text-xs text-amber-800 italic mt-0.5">{featuredWord.subject || 'Fianarana'}</p>
                </div>

                <div className="text-xs text-slate-700 space-y-2 bg-white/70 p-3.5 rounded-xl border border-amber-100">
                  <p className="font-medium text-slate-900">{featuredWord.definition}</p>
                  {featuredWord.translation_fr && (
                    <p className="text-slate-600 border-t border-amber-100/60 pt-1.5">
                      <span className="font-semibold text-slate-800">Français:</span> {featuredWord.translation_fr}
                    </p>
                  )}
                  {featuredWord.example && (
                    <p className="text-slate-600 italic border-t border-amber-100/60 pt-1.5 text-[11px]">
                      « {featuredWord.example} »
                    </p>
                  )}
                </div>
              </>
            )}
          </div>

          <button
            onClick={() => onNavigate('dictionary')}
            className="mt-4 w-full py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-colors shadow-xs flex items-center justify-center gap-1.5"
          >
            Hikaroka ao amin'ny Rakibolana <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </section>

      {/* External Communities (Strictly separated per architecture) */}
      <section className="bg-slate-900 text-white rounded-2xl p-6 sm:p-8 space-y-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 rounded-full text-[11px] font-semibold border border-emerald-500/30">
              Rohy Ivelany (Communautés Externes)
            </span>
          </div>
          <h2 className="text-xl font-bold mt-2">Mifandraisa amin'ny tambazotra sosialy</h2>
          <p className="text-xs text-slate-400">
            Manaraha ny vondrona ofisialy TAFITA MADA amin'ny WhatsApp, Telegram, Facebook ary YouTube
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {externalLinks.map((link) => (
            <a
              key={link.id}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-slate-800/80 hover:bg-slate-800 border border-slate-700 hover:border-emerald-500/50 p-4 rounded-xl transition-all group flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                    {link.platform}
                  </span>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-500 group-hover:text-emerald-400 transition-colors" />
                </div>
                <h4 className="font-semibold text-sm text-white group-hover:text-emerald-300 transition-colors capitalize">
                  {link.platform ? `Vondrona ${link.platform}` : 'Rohy Ivelany'}
                </h4>
                <p className="text-[11px] text-slate-400 line-clamp-2">
                  {link.description || 'Rohy ofisialy TAFITA MADA.'}
                </p>
              </div>
              <div className="mt-3 pt-2 border-t border-slate-700 text-[11px] font-medium text-emerald-400 flex items-center gap-1">
                Hiditra mivantana <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </a>
          ))}
        </div>
      </section>
    </div>
  );
};
