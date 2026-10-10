import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getSupabaseClient, isSupabaseConfigured } from '../lib/supabaseClient';
import { Course } from '../types/database';
import { 
  BookOpen, 
  Search, 
  CheckCircle, 
  GraduationCap, 
  ArrowRight,
  AlertCircle,
  RefreshCw,
  FileText,
  KeyRound
} from 'lucide-react';

interface CoursesPageProps {
  onSelectCourse: (courseId: string) => void;
  openConfigModal: () => void;
}

export const CoursesPage: React.FC<CoursesPageProps> = ({ onSelectCourse, openConfigModal }) => {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [lessonCounts, setLessonCounts] = useState<Record<string, number>>({});
  const [enrollments, setEnrollments] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [filterType, setFilterType] = useState<'all' | 'free' | 'paid'>('all');

  const loadCourses = async () => {
    setLoading(true);
    setErrorMsg(null);

    if (!isSupabaseConfigured()) {
      setCourses([]);
      setLessonCounts({});
      setLoading(false);
      return;
    }

    const supabase = getSupabaseClient();
    try {
      // 1. Fetch real courses from public.courses
      const { data: coursesData, error: coursesError } = await supabase
        .from('courses')
        .select('*')
        .order('created_at', { ascending: false });

      if (coursesError) {
        console.error('Supabase courses query error:', coursesError);
        setErrorMsg(coursesError.message);
        setCourses([]);
      } else {
        const fetchedCourses = (coursesData as Course[]) || [];
        setCourses(fetchedCourses);

        // 2. Fetch real lesson counts per course
        if (fetchedCourses.length > 0) {
          try {
            const countsPromise = fetchedCourses.map(async (c) => {
              const { count, error } = await supabase
                .from('lessons')
                .select('*', { count: 'exact', head: true })
                .eq('course_id', c.id);
              return { id: c.id, count: error ? 0 : (count || 0) };
            });
            const countsResults = await Promise.all(countsPromise);
            const countsMap: Record<string, number> = {};
            countsResults.forEach(item => {
              countsMap[item.id] = item.count;
            });
            setLessonCounts(countsMap);
          } catch (countsErr) {
            console.warn('Could not load lesson counts:', countsErr);
          }
        }
      }

      // 3. Fetch real user enrollments from course_enrollments
      if (user) {
        const { data: enrollData, error: enrollError } = await supabase
          .from('course_enrollments')
          .select('course_id')
          .eq('student_id', user.id);

        if (!enrollError && enrollData) {
          const map: Record<string, boolean> = {};
          enrollData.forEach((item: any) => {
            map[item.course_id] = true;
          });
          setEnrollments(map);
        }
      }
    } catch (err: any) {
      console.error('Failed to load courses from Supabase:', err);
      setErrorMsg(err?.message || 'Erreur de connexion à la base de données');
      setCourses([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCourses();
  }, [user]);

  const seriesList = ['all', ...Array.from(new Set(courses.map(c => c.series).filter(Boolean)))];

  const filteredCourses = courses.filter((course) => {
    const matchesSearch = 
      (course.title && course.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (course.description && course.description.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesSubject = selectedSubject === 'all' || course.series === selectedSubject;

    const matchesType = 
      filterType === 'all' || 
      (filterType === 'free' && (course.is_free || !course.price_mga || course.price_mga === 0)) || 
      (filterType === 'paid' && course.price_mga && course.price_mga > 0);

    return matchesSearch && matchesSubject && matchesType;
  });

  const isConfigured = isSupabaseConfigured();

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold mb-2">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Fampianarana sy Taranja</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            Ireo Taranja sy Lesona (Catalogue des Cours)
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Fidio ny taranja tianao hianarana ary tohizo amin'ny hafainganam-pandehanao ny fivoaranao.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {isConfigured && (
            <span className="text-xs text-slate-500 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl">
              Taranja voatahiry : <strong className="text-slate-900 font-bold">{courses.length}</strong>
            </span>
          )}
          <button
            onClick={loadCourses}
            disabled={loading}
            title="Hamahana indray"
            className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* Supabase Not Configured Warning */}
      {!isConfigured && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-amber-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-sm text-amber-950">Mila ampidirina ny fanalahidy Supabase (Anon Key)</h3>
              <p className="text-xs text-amber-800 mt-1">
                Mba hahafahana maka ireo taranja sy lesona tena izy voarakitra ao amin'ny Tetikasa Supabase Tafita mada.
              </p>
            </div>
          </div>
          <button
            onClick={openConfigModal}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shrink-0 flex items-center gap-1.5 transition-colors"
          >
            <KeyRound className="w-3.5 h-3.5" />
            Ampidiro ny fanalahidy
          </button>
        </div>
      )}

      {/* Error Message */}
      {errorMsg && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-5 text-rose-900 flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-sm text-rose-950">Nisy olana teo am-pamakiana ireo taranja (Erreur Supabase)</h3>
              <p className="text-xs text-rose-800 mt-1 font-mono">{errorMsg}</p>
            </div>
          </div>
          <button
            onClick={loadCourses}
            className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold shrink-0"
          >
            Andramo indray
          </button>
        </div>
      )}

      {/* Search and Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Hikaroka taranja (Malagasy, Matematika, Philosophie, SVT...)"
              className="w-full pl-10 pr-4 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
            />
          </div>

          <div className="flex gap-2">
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="px-3 py-2 text-sm border border-slate-300 rounded-xl bg-white text-slate-700 focus:ring-2 focus:ring-emerald-500 outline-none"
            >
              <option value="all">Série rehetra (Toutes séries)</option>
              {seriesList.filter(s => s !== 'all').map((sub) => (
                <option key={sub} value={sub}>Série {sub}</option>
              ))}
            </select>

            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="px-3 py-2 text-sm border border-slate-300 rounded-xl bg-white text-slate-700 focus:ring-2 focus:ring-emerald-500 outline-none"
            >
              <option value="all">Saram-pianarana rehetra</option>
              <option value="free">Maimaimpoana (Gratuit)</option>
              <option value="paid">Misy sarany (Payant)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Courses Grid */}
      {loading ? (
        <div className="py-20 text-center text-slate-500 text-sm space-y-3">
          <RefreshCw className="w-6 h-6 animate-spin text-emerald-600 mx-auto" />
          <p>Eo am-pampidirana ireo taranja avy amin'ny Supabase...</p>
        </div>
      ) : filteredCourses.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500 space-y-3">
          <BookOpen className="w-12 h-12 text-slate-300 mx-auto" />
          <p className="font-semibold text-slate-800">
            {courses.length === 0 
              ? 'Tsy misy taranja voarakitra ao amin\'ny tahiry Supabase amin\'izao fotoana izao.'
              : 'Tsy misy taranja mifanaraka amin\'ny fikarohanao.'}
          </p>
          <p className="text-xs text-slate-500">
            {courses.length === 0 
              ? 'Hamarino ny fifandraisana na ny fidirana amin\'ny backend.'
              : 'Andramo ovaina ny teny fototra na ny sivana.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course) => {
            const isEnrolled = enrollments[course.id];
            const realLessonCount = lessonCounts[course.id];

            return (
              <div
                key={course.id}
                className="bg-white rounded-2xl border border-slate-200 hover:border-emerald-500/50 hover:shadow-lg transition-all flex flex-col justify-between overflow-hidden"
              >
                <div className="p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                      {course.series ? `Série ${course.series}` : 'Fianarana'}
                    </span>
                    {isEnrolled ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        <CheckCircle className="w-3 h-3" /> Efa voasoratra
                      </span>
                    ) : course.price_mga && course.price_mga > 0 ? (
                      <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                        {course.price_mga.toLocaleString()} Ar
                      </span>
                    ) : (
                      <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        Maimaimpoana
                      </span>
                    )}
                  </div>

                  <div>
                    <h3 className="font-bold text-slate-900 text-lg hover:text-emerald-700 transition-colors">
                      {course.title}
                    </h3>
                    <p className="text-xs text-slate-600 mt-2 line-clamp-3 leading-relaxed">
                      {course.description || 'Lesona feno ahitana torolalana sy fanazavana.'}
                    </p>
                  </div>

                  {realLessonCount !== undefined && (
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium pt-1">
                      <FileText className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{realLessonCount} lesona voarakitra</span>
                    </div>
                  )}
                </div>

                <div className="bg-slate-50 px-6 py-4 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-500 flex items-center gap-1">
                    <GraduationCap className="w-4 h-4 text-emerald-600" />
                    {course.series ? `Série ${course.series}` : 'Ambaratonga rehetra'}
                  </span>

                  <button
                    onClick={() => onSelectCourse(course.id)}
                    className="px-3.5 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-semibold transition-colors flex items-center gap-1.5 shadow-xs"
                  >
                    <span>Hianatra</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
