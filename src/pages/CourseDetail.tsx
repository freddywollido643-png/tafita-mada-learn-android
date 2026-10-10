import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getSupabaseClient, isSupabaseConfigured } from '../lib/supabaseClient';
import { Course, Lesson, Quiz, Question, Answer, CourseResource } from '../types/database';
import { 
  ArrowLeft, 
  CheckCircle, 
  Circle, 
  FileText, 
  HelpCircle, 
  Download, 
  GraduationCap, 
  Award,
  AlertCircle,
  RefreshCw,
  KeyRound,
  ExternalLink
} from 'lucide-react';

interface CourseDetailProps {
  courseId: string;
  onBack: () => void;
  openConfigModal: () => void;
}

export const CourseDetailPage: React.FC<CourseDetailProps> = ({ courseId, onBack, openConfigModal }) => {
  const { user } = useAuth();
  const [course, setCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const [progressMap, setProgressMap] = useState<Record<string, boolean>>({});
  const [resources, setResources] = useState<CourseResource[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);
  const [quizQuestions, setQuizQuestions] = useState<Question[]>([]);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, Answer[]>>({});
  const [userSelectedAnswers, setUserSelectedAnswers] = useState<Record<string, string>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState<number>(0);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [actionMsg, setActionMsg] = useState<string | null>(null);

  const loadCourseData = async () => {
    setLoading(true);
    setErrorMsg(null);

    if (!isSupabaseConfigured()) {
      setCourse(null);
      setLessons([]);
      setActiveLesson(null);
      setLoading(false);
      return;
    }

    const supabase = getSupabaseClient();
    try {
      // 1. Fetch real course from public.courses
      const { data: courseData, error: courseError } = await supabase
        .from('courses')
        .select('*')
        .eq('id', courseId)
        .maybeSingle();

      if (courseError) {
        console.error('Supabase course detail error:', courseError);
        setErrorMsg(courseError.message);
        setCourse(null);
        setLessons([]);
        setLoading(false);
        return;
      }

      if (!courseData) {
        setCourse(null);
        setLessons([]);
        setLoading(false);
        return;
      }

      const fetchedCourse = courseData as Course;
      setCourse(fetchedCourse);

      // 2. Fetch real lessons from public.lessons matching course_id exactly
      const { data: lessonsData, error: lessonsError } = await supabase
        .from('lessons')
        .select('*')
        .eq('course_id', courseId)
        .order('lesson_order', { ascending: true });

      if (lessonsError) {
        console.warn('Supabase lessons query error:', lessonsError.message);
        setLessons([]);
      } else if (lessonsData && lessonsData.length > 0) {
        const fetchedLessons = lessonsData as Lesson[];
        setLessons(fetchedLessons);
        setActiveLesson(fetchedLessons[0]);
      } else {
        setLessons([]);
        setActiveLesson(null);
      }

      // 3. Fetch real resources for this course
      const { data: resourcesData } = await supabase
        .from('course_resources')
        .select('*')
        .eq('course_id', courseId);

      if (resourcesData) {
        setResources(resourcesData as CourseResource[]);
      } else {
        setResources([]);
      }

      // 4. Fetch real quizzes for this course
      const { data: quizzesData } = await supabase
        .from('quizzes')
        .select('*')
        .eq('course_id', courseId);

      if (quizzesData) {
        setQuizzes(quizzesData as Quiz[]);
      } else {
        setQuizzes([]);
      }

      // 5. Check real enrollments using student_id
      if (user) {
        const { data: enrollData } = await supabase
          .from('course_enrollments')
          .select('*')
          .eq('course_id', courseId)
          .eq('student_id', user.id)
          .maybeSingle();

        if (enrollData) {
          setIsEnrolled(true);
        } else {
          setIsEnrolled(false);
        }

        // 6. Check real lesson_progress for this user
        const { data: progressData } = await supabase
          .from('lesson_progress')
          .select('*')
          .eq('user_id', user.id);

        if (progressData) {
          const pMap: Record<string, boolean> = {};
          progressData.forEach((p: any) => {
            if (p.completed) pMap[p.lesson_id] = true;
          });
          setProgressMap(pMap);
        }
      } else {
        setIsEnrolled(false);
        setProgressMap({});
      }
    } catch (err: any) {
      console.error('Error fetching course detail from Supabase:', err);
      setErrorMsg(err?.message || 'Tsy afaka nalaina ny taranja sy ny lesona.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCourseData();
  }, [courseId, user]);


  const toggleLessonProgress = async (lessonId: string) => {
    if (!user) {
      setActionMsg('Mila miditra (connexion) aloha ianao vao afaka mitahiry ny fivoaranao.');
      setTimeout(() => setActionMsg(null), 3500);
      return;
    }
    const currentVal = progressMap[lessonId] || false;
    const newVal = !currentVal;

    setProgressMap(prev => ({ ...prev, [lessonId]: newVal }));

    if (isSupabaseConfigured()) {
      const supabase = getSupabaseClient();
      try {
        const { error } = await supabase
          .from('lesson_progress')
          .upsert({
            user_id: user.id,
            lesson_id: lessonId,
            completed: newVal,
            completed_at: newVal ? new Date().toISOString() : null,
          });

        if (error) {
          setActionMsg('Tsy voatahiry ny fivoarana (RLS): ' + error.message);
          setTimeout(() => setActionMsg(null), 4000);
          setProgressMap(prev => ({ ...prev, [lessonId]: currentVal }));
        }
      } catch (err: any) {
        setActionMsg('Tsy voatahiry ny fivoarana: ' + (err?.message || 'Erreur'));
        setTimeout(() => setActionMsg(null), 4000);
        setProgressMap(prev => ({ ...prev, [lessonId]: currentVal }));
      }
    }
  };

  const handleEnroll = async () => {
    if (!user) {
      setActionMsg('Mila miditra (connexion) ianao hisoratana anarana amin\'ity taranja ity.');
      setTimeout(() => setActionMsg(null), 3500);
      return;
    }

    if (isSupabaseConfigured()) {
      const supabase = getSupabaseClient();
      try {
        const { error } = await supabase
          .from('course_enrollments')
          .insert({
            student_id: user.id,
            course_id: courseId,
            status: 'active',
            enrolled_at: new Date().toISOString(),
          });

        if (error) {
          setActionMsg('Tsy tontosa ny fisoratana anarana (RLS): ' + error.message);
          setTimeout(() => setActionMsg(null), 4000);
          return;
        }
      } catch (err: any) {
        setActionMsg('Tsy tontosa ny fisoratana anarana: ' + (err?.message || 'Erreur'));
        setTimeout(() => setActionMsg(null), 4000);
        return;
      }
    }

    setIsEnrolled(true);
    setActionMsg('Tafiditra soa aman-tsara ianao ! Afaka manomboka ny lesona rehetra.');
    setTimeout(() => setActionMsg(null), 3000);
  };

  const startQuiz = async (quiz: Quiz) => {
    setActiveQuiz(quiz);
    setQuizSubmitted(false);
    setUserSelectedAnswers({});
    setQuizScore(0);

    if (isSupabaseConfigured()) {
      const supabase = getSupabaseClient();
      try {
        const { data: qData } = await supabase
          .from('questions')
          .select('*')
          .eq('quiz_id', quiz.id)
          .order('order_index', { ascending: true });

        if (qData && qData.length > 0) {
          setQuizQuestions(qData as Question[]);
          const questionIds = qData.map(q => q.id);

          const { data: ansData } = await supabase
            .from('answers')
            .select('*')
            .in('question_id', questionIds);

          if (ansData) {
            const map: Record<string, Answer[]> = {};
            ansData.forEach((a: any) => {
              if (!map[a.question_id]) map[a.question_id] = [];
              map[a.question_id].push(a as Answer);
            });
            setQuizAnswers(map);
          }
        }
      } catch (err) {
        console.warn('Error fetching quiz details:', err);
      }
    }
  };

  const handleSelectQuizAnswer = (questionId: string, answerId: string) => {
    if (quizSubmitted) return;
    setUserSelectedAnswers(prev => ({
      ...prev,
      [questionId]: answerId,
    }));
  };

  const submitQuiz = async () => {
    let score = 0;
    let totalPoints = 0;

    quizQuestions.forEach((q) => {
      const points = q.points || 5;
      totalPoints += points;
      const selectedId = userSelectedAnswers[q.id];
      const answersForQ = quizAnswers[q.id] || [];
      const correctAns = answersForQ.find(a => a.is_correct);
      if (correctAns && correctAns.id === selectedId) {
        score += points;
      }
    });

    setQuizScore(score);
    setQuizSubmitted(true);

    if (user && activeQuiz && isSupabaseConfigured()) {
      const supabase = getSupabaseClient();
      try {
        const { data: attempt } = await supabase
          .from('quiz_attempts')
          .insert({
            quiz_id: activeQuiz.id,
            user_id: user.id,
            score,
            max_score: totalPoints,
            passed: score >= totalPoints / 2,
            created_at: new Date().toISOString(),
          })
          .select()
          .maybeSingle();

        if (attempt) {
          // Record quiz answers
          const records = Object.entries(userSelectedAnswers).map(([qId, ansId]) => {
            const ansList = quizAnswers[qId] || [];
            const isCor = ansList.find(a => a.id === ansId)?.is_correct || false;
            return {
              attempt_id: attempt.id,
              question_id: qId,
              answer_id: ansId,
              is_correct: isCor,
            };
          });

          await supabase.from('quiz_answers').insert(records);
        }
      } catch (err) {
        console.warn('Error storing quiz attempt in Supabase:', err);
      }
    }
  };

  // Helper to render HTML or plain text safely
  const isHtmlContent = (text?: string): boolean => {
    if (!text) return false;
    const trimmed = text.trim();
    return trimmed.startsWith('<') && (trimmed.includes('</') || trimmed.includes('/>'));
  };

  const isConfigured = isSupabaseConfigured();

  if (loading) {
    return (
      <div className="py-24 text-center space-y-4">
        <RefreshCw className="w-8 h-8 animate-spin text-emerald-600 mx-auto" />
        <p className="text-slate-600 text-sm font-medium">Eo am-pampidirana ny lesona sy taranja avy amin'ny Supabase...</p>
      </div>
    );
  }

  if (!isConfigured) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-8 sm:p-12 text-center max-w-xl mx-auto space-y-5 my-8">
        <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto text-amber-600 border border-amber-200">
          <KeyRound className="w-7 h-7" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-900">Mila ampidirina ny fanalahidy Supabase</h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-2 leading-relaxed">
            Mba hahafahana mijery ny votoatin'ity taranja ity sy ireo lesona voatahiry ao amin'ny backend "szxficncfyvghhxqzlnp", ampidiro ny fanalahidy anon/public.
          </p>
        </div>
        <div className="flex justify-center gap-3 pt-2">
          <button
            onClick={onBack}
            className="px-4 py-2 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-semibold"
          >
            Hiverina
          </button>
          <button
            onClick={openConfigModal}
            className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold"
          >
            Ampidiro ny fanalahidy
          </button>
        </div>
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="bg-white rounded-2xl border border-rose-200 p-8 text-center max-w-xl mx-auto space-y-4 my-8">
        <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto border border-rose-200">
          <AlertCircle className="w-6 h-6" />
        </div>
        <div>
          <h3 className="font-bold text-slate-900">Nisy olana teo am-pamakiana ity taranja ity</h3>
          <p className="text-xs text-rose-700 mt-1 font-mono">{errorMsg}</p>
        </div>
        <div className="flex justify-center gap-3 pt-2">
          <button
            onClick={onBack}
            className="px-4 py-2 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-semibold"
          >
            Hiverina
          </button>
          <button
            onClick={loadCourseData}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold"
          >
            Andramo indray
          </button>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-md mx-auto space-y-4 my-8">
        <FileText className="w-12 h-12 text-slate-300 mx-auto" />
        <div>
          <h3 className="font-bold text-slate-800">Tsy hita ity taranja ity</h3>
          <p className="text-xs text-slate-500 mt-1">
            Tsy misy taranja manana io laharana famantarana (ID) io ao amin'ny backend.
          </p>
        </div>
        <button
          onClick={onBack}
          className="px-5 py-2.5 bg-emerald-700 text-white rounded-xl text-xs font-bold hover:bg-emerald-800"
        >
          Hiverina amin'ny lisitra
        </button>
      </div>
    );
  }

  const completedCount = lessons.filter(l => progressMap[l.id]).length;
  const hasProgressData = Boolean(user && Object.keys(progressMap).length > 0);
  const progressPercent = (user && lessons.length > 0) ? Math.round((completedCount / lessons.length) * 100) : 0;

  return (
    <div className="space-y-6 pb-20">
      {/* Back button */}
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-emerald-700 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Hiverina amin'ny lisitry ny taranja
      </button>

      {actionMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{actionMsg}</span>
        </div>
      )}

      {/* Course Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                {course.series ? `Série ${course.series}` : 'Fianarana'}
              </span>
              <span className="text-xs text-slate-500 flex items-center gap-1">
                <GraduationCap className="w-3.5 h-3.5 text-slate-400" />
                {course.status ? `Statut: ${course.status}` : 'Mavitrika'}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              {course.title}
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 max-w-3xl leading-relaxed">
              {course.description}
            </p>
          </div>

          <div className="flex flex-col items-start md:items-end gap-2 shrink-0">
            {isEnrolled ? (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                Mpikambana manaraka ity taranja ity
              </div>
            ) : (
              <button
                onClick={handleEnroll}
                className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-md transition-colors"
              >
                {course.price_mga && course.price_mga > 0 ? `Hisoratra anarana (${course.price_mga.toLocaleString()} Ar)` : 'Hisoratra anarana maimaimpoana'}
              </button>
            )}

            {/* Progress Bar */}
            <div className="w-48 space-y-1">
              <div className="flex justify-between text-[11px] text-slate-500 font-medium">
                <span>Fivoarana (Progrès)</span>
                <span>{progressPercent}%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200">
                <div
                  className="bg-emerald-600 h-full rounded-full transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Two Column Layout: Syllabus / Lessons List + Active Lesson / Quiz Viewer */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Lessons Syllabus Navigation */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-700" />
              Fandaharam-potoana (Syllabus)
            </h3>
            <span className="text-xs text-slate-500">{completedCount}/{lessons.length} vita</span>
          </div>

          <div className="space-y-2">
            {lessons.map((lesson, idx) => {
              const isSelected = activeLesson?.id === lesson.id && !activeQuiz;
              const isCompleted = progressMap[lesson.id] || false;
              return (
                <div
                  key={lesson.id}
                  onClick={() => { setActiveLesson(lesson); setActiveQuiz(null); }}
                  className={`p-3 rounded-xl border text-left cursor-pointer transition-all flex items-center justify-between gap-3 ${
                    isSelected
                      ? 'border-emerald-600 bg-emerald-50/80 font-semibold text-emerald-950'
                      : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50 text-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleLessonProgress(lesson.id);
                      }}
                      title={isCompleted ? 'Efa vita (tsindrio raha foanana)' : 'Marihina ho vita'}
                      className="text-slate-400 hover:text-emerald-700 transition-colors"
                    >
                      {isCompleted ? (
                        <CheckCircle className="w-4 h-4 text-emerald-600 fill-emerald-100" />
                      ) : (
                        <Circle className="w-4 h-4 text-slate-300" />
                      )}
                    </button>
                    <span className="text-xs leading-snug">
                      {lesson.title}
                    </span>
                  </div>

                  {lesson.lesson_order !== undefined && (
                    <span className="text-[10px] text-slate-400 shrink-0 flex items-center gap-1 font-medium">
                      #{lesson.lesson_order}
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Quizzes List */}
          {quizzes.length > 0 && (
            <div className="pt-4 border-t border-slate-100 space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-amber-600" />
                Fanadinana Fohy (Quizzes)
              </h4>
              {quizzes.map((q) => (
                <button
                  key={q.id}
                  onClick={() => startQuiz(q)}
                  className={`w-full p-2.5 rounded-xl border text-left text-xs transition-all flex items-center justify-between ${
                    activeQuiz?.id === q.id
                      ? 'border-amber-500 bg-amber-50 text-amber-950 font-bold'
                      : 'border-slate-100 hover:border-amber-200 text-slate-700'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <HelpCircle className="w-4 h-4 text-amber-600" />
                    {q.title}
                  </span>
                  <span className="text-[10px] text-amber-800 font-semibold bg-amber-100 px-1.5 py-0.5 rounded">
                    Quiz
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* Resources */}
          {resources.length > 0 && (
            <div className="pt-4 border-t border-slate-100 space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Tahiry sy fitaovana (Ressources)
              </h4>
              {resources.map((res) => (
                <a
                  key={res.id}
                  href={res.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between p-2 rounded-lg text-xs text-slate-600 hover:text-emerald-700 hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-all"
                >
                  <span className="truncate max-w-[180px]">{res.title}</span>
                  <Download className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                </a>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Active Content Viewer or Quiz Attempt */}
        <div className="lg:col-span-2">
          {activeQuiz ? (
            /* Quiz Active View */
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div>
                  <span className="text-[10px] uppercase font-bold text-amber-600 tracking-wider">
                    Fanadinana Fohy (Quiz)
                  </span>
                  <h2 className="text-xl font-bold text-slate-900 mt-0.5">{activeQuiz.title}</h2>
                  <p className="text-xs text-slate-500">{activeQuiz.description}</p>
                </div>
                <button
                  onClick={() => setActiveQuiz(null)}
                  className="text-xs text-slate-500 hover:text-slate-800 underline"
                >
                  Hiverina amin'ny lesona
                </button>
              </div>

              {quizSubmitted ? (
                /* Quiz Results */
                <div className="p-6 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl border border-emerald-200 text-center space-y-3">
                  <Award className="w-12 h-12 text-emerald-600 mx-auto" />
                  <h3 className="text-lg font-bold text-emerald-950">Vita ny fanadinana !</h3>
                  <p className="text-sm text-emerald-800">
                    Naoty azonao : <strong className="text-xl font-extrabold">{quizScore} isa</strong>
                  </p>
                  <p className="text-xs text-slate-600">
                    Efa voatahiry ao amin'ny backend Supabase (<code>quiz_attempts</code>) ny vokatry ny fanadinanao.
                  </p>
                  <button
                    onClick={() => { setQuizSubmitted(false); setUserSelectedAnswers({}); }}
                    className="mt-2 px-4 py-2 bg-emerald-700 text-white rounded-lg text-xs font-bold hover:bg-emerald-800"
                  >
                    Hamerina ny fanadinana
                  </button>
                </div>
              ) : (
                /* Question list */
                <div className="space-y-6">
                  {quizQuestions.map((q, qIndex) => {
                    const answersForQ = quizAnswers[q.id] || [];
                    return (
                      <div key={q.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
                        <p className="text-xs font-bold text-slate-900">
                          Fanontaniana {qIndex + 1} : {q.question_text}
                        </p>
                        <div className="space-y-2">
                          {answersForQ.map((ans) => {
                            const isSelected = userSelectedAnswers[q.id] === ans.id;
                            return (
                              <div
                                key={ans.id}
                                onClick={() => handleSelectQuizAnswer(q.id, ans.id)}
                                className={`p-2.5 rounded-lg border text-xs cursor-pointer transition-all flex items-center justify-between ${
                                  isSelected
                                    ? 'border-emerald-600 bg-emerald-50 text-emerald-950 font-medium'
                                    : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                                }`}
                              >
                                <span>{ans.answer_text}</span>
                                <input
                                  type="radio"
                                  checked={isSelected}
                                  onChange={() => handleSelectQuizAnswer(q.id, ans.id)}
                                  className="text-emerald-600 focus:ring-emerald-500"
                                />
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}

                  <button
                    onClick={submitQuiz}
                    disabled={Object.keys(userSelectedAnswers).length === 0}
                    className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 disabled:bg-slate-300 text-white font-bold rounded-xl text-xs shadow-xs transition-colors"
                  >
                    Handefa ny valiny (Valider le Quiz)
                  </button>
                </div>
              )}
            </div>
          ) : activeLesson ? (
            /* Active Lesson Content */
            <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-4 border-b border-slate-100 gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                      Lesona ao amin'ny fandaharam-pianarana
                    </span>
                    {activeLesson.lesson_order !== undefined && (
                      <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-bold">
                        Laharana #{activeLesson.lesson_order}
                      </span>
                    )}
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
                    {activeLesson.title}
                  </h2>
                </div>

                {user && (
                  <button
                    onClick={() => toggleLessonProgress(activeLesson.id)}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                      progressMap[activeLesson.id]
                        ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                        : 'bg-slate-100 text-slate-700 hover:bg-emerald-50 hover:text-emerald-700'
                    }`}
                  >
                    {progressMap[activeLesson.id] ? (
                      <>
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-700" />
                        Efa voavaky sy vita
                      </>
                    ) : (
                      <>
                        <Circle className="w-3.5 h-3.5 text-slate-400" />
                        Marihina ho vita
                      </>
                    )}
                  </button>
                )}
              </div>

              {/* Lesson body (rendered cleanly with HTML or plain text) */}
              <div className="prose prose-slate max-w-none text-slate-700 text-sm leading-relaxed">
                {activeLesson.content ? (
                  isHtmlContent(activeLesson.content) ? (
                    <div 
                      className="lesson-html-content space-y-3 [&_h2]:text-lg [&_h2]:font-bold [&_h2]:text-slate-900 [&_h2]:mt-4 [&_h2]:mb-2 [&_h3]:text-sm [&_h3]:font-bold [&_h3]:text-emerald-800 [&_h3]:mt-3 [&_h3]:mb-1 [&_p]:text-slate-700 [&_p]:leading-relaxed [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:mt-1 [&_strong]:text-slate-900"
                      dangerouslySetInnerHTML={{ __html: activeLesson.content }} 
                    />
                  ) : (
                    <div className="whitespace-pre-line">
                      {activeLesson.content}
                    </div>
                  )
                ) : (
                  <p className="text-slate-400 italic">Tsy mbola misy votoatiny nampidirina ity lesona ity.</p>
                )}
              </div>

              {/* Link if external content_url exists */}
              {activeLesson.content_url && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
                  <span className="text-slate-600 font-medium">Loharano na tahiry ivelany :</span>
                  <a
                    href={activeLesson.content_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-emerald-700 hover:text-emerald-800 font-bold"
                  >
                    <span>Hijery</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}

              {/* Lesson bottom actions */}
              <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-500">
                  {user 
                    ? (progressMap[activeLesson.id] ? 'Lesona efa voarakitra ho vita' : 'Hamarino rehefa voavaky ny lesona')
                    : 'Midira amin\'ny kaonty mba hanarahana ny fivoaranao'}
                </span>
                {user && (
                  <button
                    onClick={() => toggleLessonProgress(activeLesson.id)}
                    className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold rounded-lg text-xs shadow-xs"
                  >
                    {progressMap[activeLesson.id] ? 'Efa voamarika' : 'Hamita ny lesona'}
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400">
              Mifidiana lesona avy amin'ny lisitra havia.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
