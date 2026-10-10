import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getSupabaseClient, isSupabaseConfigured, SUPABASE_PROJECT_REF, DEFAULT_SUPABASE_URL } from '../lib/supabaseClient';
import { CourseEnrollment, Course, QuizAttempt, TeacherProfile, TeacherService } from '../types/database';
import { 
  User, 
  Mail, 
  Phone, 
  GraduationCap, 
  CheckCircle, 
  Database, 
  Edit3, 
  Save, 
  Clock, 
  Award, 
  Briefcase,
  AlertCircle,
  Key
} from 'lucide-react';

interface ProfilePageProps {
  onNavigateToAuth: () => void;
  openConfigModal: () => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({ onNavigateToAuth, openConfigModal }) => {
  const { user, profile, hasProfileRecord, role, updateProfile, signOut, refreshProfile } = useAuth();
  
  const [fullName, setFullName] = useState(profile?.full_name || user?.user_metadata?.full_name || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [bio, setBio] = useState(profile?.bio || '');
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const [enrolledCourses, setEnrolledCourses] = useState<Course[]>([]);
  const [quizAttempts, setQuizAttempts] = useState<QuizAttempt[]>([]);
  const [teacherProfile, setTeacherProfile] = useState<TeacherProfile | null>(null);
  const [teacherServices, setTeacherServices] = useState<TeacherService[]>([]);
  const [loadingExtras, setLoadingExtras] = useState(false);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setPhone(profile.phone || '');
      setBio(profile.bio || '');
    }
  }, [profile]);

  useEffect(() => {
    if (!user || !isSupabaseConfigured()) return;

    const loadUserExtras = async () => {
      setLoadingExtras(true);
      const supabase = getSupabaseClient();
      try {
        // Load enrolled courses using student_id
        const { data: enrollments } = await supabase
          .from('course_enrollments')
          .select('*, courses(*)')
          .eq('student_id', user.id);

        if (enrollments) {
          const coursesList = enrollments.map((e: any) => e.courses).filter(Boolean);
          setEnrolledCourses(coursesList as Course[]);
        }

        // Load quiz attempts
        const { data: attempts } = await supabase
          .from('quiz_attempts')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (attempts) {
          setQuizAttempts(attempts as QuizAttempt[]);
        }

        // If teacher, load teacher profile and services
        if (role === 'Mpampianatra') {
          const { data: tProfile } = await supabase
            .from('teacher_profiles')
            .select('*')
            .eq('user_id', user.id)
            .maybeSingle();

          if (tProfile) {
            setTeacherProfile(tProfile as TeacherProfile);
            const { data: tServices } = await supabase
              .from('teacher_services')
              .select('*')
              .eq('teacher_id', tProfile.id);

            if (tServices) {
              setTeacherServices(tServices as TeacherService[]);
            }
          }
        }
      } catch (err) {
        console.warn('Error loading user extras:', err);
      } finally {
        setLoadingExtras(false);
      }
    };

    loadUserExtras();
  }, [user, role]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveMessage(null);

    if (isSupabaseConfigured() && user) {
      const supabase = getSupabaseClient();
      try {
        const { error } = await supabase
          .from('profiles')
          .upsert({
            id: user.id,
            email: user.email,
            full_name: fullName.trim(),
            phone: phone.trim(),
            bio: bio.trim(),
          });

        if (error) {
          setSaveMessage('Tsy voatahiry ny mombamomba (RLS): ' + error.message);
          setSaving(false);
          return;
        }

        await refreshProfile();
        setSaveMessage('Voatahiry soa aman-tsara ny mombamomba anao !');
        setIsEditing(false);
        setTimeout(() => setSaveMessage(null), 3000);
      } catch (err: any) {
        setSaveMessage('Olana: ' + (err?.message || 'Erreur'));
      } finally {
        setSaving(false);
      }
    } else {
      const { error } = await updateProfile({
        full_name: fullName.trim(),
        phone: phone.trim(),
        bio: bio.trim(),
      });
      setSaving(false);
      if (error) {
        setSaveMessage('Erreur: ' + error.message);
      } else {
        setSaveMessage('Voatahiry soa aman-tsara ny mombamomba anao !');
        setIsEditing(false);
        setTimeout(() => setSaveMessage(null), 3000);
      }
    }
  };

  const configured = isSupabaseConfigured();

  if (!user) {
    return (
      <div className="max-w-xl mx-auto py-16 px-4 text-center space-y-6">
        <div className="w-16 h-16 bg-emerald-100 text-emerald-800 rounded-3xl mx-auto flex items-center justify-center font-bold text-2xl shadow-sm">
          <User className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-slate-900">Mila miditra aloha ianao</h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Hiditra na hisoratra anarana mba hahitana ny mombamomba anao, ny lesona arahinao ary ny fivoaranao.
          </p>
        </div>
        <button
          onClick={onNavigateToAuth}
          className="px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm rounded-xl shadow-md transition-colors"
        >
          Hiditra / Hisoratra anarana
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      {/* Top Profile Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="h-32 bg-gradient-to-r from-emerald-800 via-teal-700 to-slate-900 p-6 flex items-end justify-between text-white relative">
          <div className="absolute top-4 right-4">
            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-white/20 backdrop-blur-xs border border-white/30 text-white">
              {role}
            </span>
          </div>
        </div>

        <div className="px-6 pb-6 pt-0 relative">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-12 mb-4">
            <div className="w-24 h-24 rounded-2xl bg-white p-1 shadow-md border border-slate-200">
              <div className="w-full h-full rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center text-3xl font-extrabold uppercase">
                {(profile?.full_name || user.email || 'U').charAt(0)}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-1.5"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  Hanova mombamomba
                </button>
              ) : (
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Aoka ihany
                </button>
              )}

              <button
                onClick={() => signOut()}
                className="px-4 py-2 text-xs font-semibold rounded-xl border border-rose-200 text-rose-700 hover:bg-rose-50 transition-colors"
              >
                Hivoaka (Déconnexion)
              </button>
            </div>
          </div>

          {!hasProfileRecord && (
            <div className="mb-4 p-3.5 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Mombamomba tsy mbola feno (Profil non encore créé dans le backend) :</p>
                <p className="text-amber-800 mt-0.5">
                  Mbola tsy misy rakitra voarakitra ao amin'ny latabatra <code>profiles</code> ho an'ity kaonty ity.
                  Azonao atao ny manindry « Hanova mombamomba » mba hitahirizana ny anaranao sy ny laharan-taratasinao.
                </p>
              </div>
            </div>
          )}

          {saveMessage && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{saveMessage}</span>
            </div>
          )}

          {isEditing ? (
            <form onSubmit={handleSaveProfile} className="space-y-4 pt-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Anarana feno :</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Laharana finday :</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="034 00 000 00"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Mombamomba fohy (Bio) :</label>
                <textarea
                  rows={3}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Fanoritsoritana fohy..."
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Aoka ihany
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl shadow-xs flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  {saving ? 'Eo am-pitahirizana...' : 'Hitahiry ny fanovana'}
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
                  {profile?.full_name || 'Mpikambana TAFITA'}
                </h1>
                <p className="text-xs text-slate-500">{user.email}</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-600 pt-2 border-t border-slate-100">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="truncate">{user.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{profile?.phone || 'Tsy misy laharana'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Andraikitra : {role}</span>
                </div>
              </div>

              {profile?.bio && (
                <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-700 border border-slate-100">
                  <p className="font-semibold text-slate-900 mb-0.5">Mombamomba :</p>
                  <p>{profile.bio}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Backend Status Diagnostic Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-100 text-emerald-800 rounded-xl">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Fampifandraisana amin'ny Supabase Backend</h3>
              <p className="text-xs text-slate-500">Tafita mada ({SUPABASE_PROJECT_REF})</p>
            </div>
          </div>
          <button
            onClick={openConfigModal}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors"
          >
            <Key className="w-3.5 h-3.5" />
            {configured ? 'Hanova ny Clé' : 'Hampiditra Clé'}
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
            <span className="text-slate-500">Project Reference :</span>
            <span className="font-mono font-bold text-emerald-800 text-sm mt-1">{SUPABASE_PROJECT_REF}</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
            <span className="text-slate-500">Statut Anon Key :</span>
            <span className={`font-bold text-sm mt-1 flex items-center gap-1.5 ${configured ? 'text-emerald-700' : 'text-amber-700'}`}>
              {configured ? <CheckCircle className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-amber-600" />}
              {configured ? 'Miasa sy mifandray' : 'Mila ampidirina'}
            </span>
          </div>
        </div>
      </div>

      {/* Enrolled Courses & Progress History */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
          <GraduationCap className="w-4 h-4 text-emerald-700" />
          Taranja voasoratra (Cours Inscrits)
        </h3>

        {enrolledCourses.length === 0 ? (
          <div className="p-6 text-center text-slate-400 text-xs">
            Mbola tsy misy taranja voasoratra. Jereo ny pejy « Cours » hanombohana.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {enrolledCourses.map((c) => (
              <div key={c.id} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-1">
                <span className="text-[10px] font-bold text-emerald-700 uppercase">{c.series ? `Série ${c.series}` : 'Fianarana'}</span>
                <h4 className="text-xs font-bold text-slate-900">{c.title}</h4>
                <p className="text-[11px] text-slate-500 line-clamp-2">{c.description || 'Lesona TAFITA'}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quiz Attempts History */}
      {quizAttempts.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-600" />
            Tantaran'ny Fanadinana Fohy (Historique des Quiz)
          </h3>

          <div className="space-y-2">
            {quizAttempts.map((attempt) => (
              <div key={attempt.id} className="p-3 rounded-xl border border-slate-100 bg-slate-50 flex items-center justify-between text-xs">
                <div className="space-y-0.5">
                  <span className="font-semibold text-slate-900">Quiz ID: {attempt.quiz_id}</span>
                  <p className="text-[10px] text-slate-400">
                    {attempt.created_at ? new Date(attempt.created_at).toLocaleDateString() : 'Vao haingana'}
                  </p>
                </div>
                <div className="text-right">
                  <span className="font-bold text-emerald-700">{attempt.score} / {attempt.max_score}</span>
                  <p className="text-[10px] text-slate-500">{attempt.passed ? 'Afaka' : 'Mila averina'}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Teacher Profile Section if Teacher */}
      {role === 'Mpampianatra' && teacherProfile && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-emerald-700" />
            Mombamomba ny Mpampianatra (Profil Enseignant)
          </h3>
          <p className="text-xs text-slate-600">{teacherProfile.qualification || 'Fahaiza-manao manokana'}</p>
          <div className="space-y-2">
            {teacherServices.map((srv) => (
              <div key={srv.id} className="p-3 rounded-xl border border-slate-100 flex justify-between items-center text-xs">
                <div>
                  <h4 className="font-semibold text-slate-900">{srv.title}</h4>
                  <p className="text-[11px] text-slate-500">{srv.description}</p>
                </div>
                <span className="font-bold text-emerald-700">{srv.price?.toLocaleString()} Ar</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
