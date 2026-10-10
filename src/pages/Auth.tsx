import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types/database';
import { LogIn, UserPlus, Shield, GraduationCap, Users2, BookOpen, AlertCircle } from 'lucide-react';

interface AuthPageProps {
  onSuccess: () => void;
  openConfigModal: () => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({ onSuccess, openConfigModal }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<UserRole>('Mpianatra');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const { signIn, signUp, isConfigured } = useAuth();

  const [emailNotConfirmed, setEmailNotConfirmed] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setEmailNotConfirmed(false);
    setLoading(true);

    if (!isConfigured) {
      setError("Veuillez d'abord configurer la clé d'API publique Supabase (Anon Key) pour se connecter au backend Tafita mada.");
      setLoading(false);
      return;
    }

    try {
      if (isLogin) {
        const { error: err, isEmailNotConfirmed } = await signIn(email, password);
        if (isEmailNotConfirmed) {
          setEmailNotConfirmed(true);
          setError("Voamarina fa mbola tsy voamarina ny email-nao. Jereo ny boîte mail-nao ary tsindrio ny rohy fanamafisana (lien de confirmation).");
        } else if (err) {
          setError(err.message || "Erreur lors de la connexion. Vérifiez vos identifiants.");
        } else {
          onSuccess();
        }
      } else {
        if (!fullName.trim()) {
          setError('Veuillez renseigner votre nom complet.');
          setLoading(false);
          return;
        }
        const { error: err, isEmailConfirmationRequired } = await signUp(email, password, {
          full_name: fullName.trim(),
          role,
          phone: phone.trim(),
        });

        if (err) {
          setError(err.message || "Erreur lors de l'inscription.");
        } else if (isEmailConfirmationRequired) {
          setSuccessMsg("Tontosa ny fisoratana anarana ! Misy rohy fanamafisana (confirmation) nalefa tany amin'ny mailaka " + email + ". Tsindrio io rohy io alohan'ny hidirana.");
          setIsLogin(true);
        } else {
          setSuccessMsg("Compte créé avec succès ! Fidirana eo no ho eo...");
          setTimeout(() => {
            onSuccess();
          }, 1200);
        }
      }
    } catch (err: any) {
      setError(err?.message || "Une erreur inattendue s'est produite.");
    } finally {
      setLoading(false);
    }
  };

  const rolesList: { role: UserRole; title: string; desc: string; icon: any }[] = [
    { role: 'Mpianatra', title: 'Mpianatra (Élève/Étudiant)', desc: 'Manaraka fampianarana sy manao fanadinana', icon: GraduationCap },
    { role: 'Mpampianatra', title: 'Mpampianatra (Enseignant)', desc: 'Mampianatra sy mizara fahaizana', icon: BookOpen },
    { role: 'RAD', title: 'RAD (Ray aman-dreny)', desc: 'Manara-maso ny fivoaran\'ny mpianatra', icon: Users2 },
  ];

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-emerald-800 to-teal-700 p-6 text-white text-center">
          <div className="w-12 h-12 mx-auto bg-white/10 rounded-2xl flex items-center justify-center font-bold text-2xl mb-3 backdrop-blur-xs">
            T
          </div>
          <h2 className="text-xl font-bold">
            {isLogin ? 'Fidirana ao amin\'ny TAFITA MADA' : 'Fisoratana anarana vaovao'}
          </h2>
          <p className="text-xs text-emerald-100 mt-1">
            Sehatra fanabeazana nomerika ho an'ny fampandrosoana
          </p>
        </div>

        {/* Tab Toggle */}
        <div className="grid grid-cols-2 border-b border-slate-200 bg-slate-50">
          <button
            onClick={() => { setIsLogin(true); setError(null); }}
            className={`py-3 text-sm font-semibold flex items-center justify-center gap-2 transition-colors ${
              isLogin
                ? 'bg-white text-emerald-800 border-b-2 border-emerald-700'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <LogIn className="w-4 h-4" />
            Hiditra (Connexion)
          </button>
          <button
            onClick={() => { setIsLogin(false); setError(null); }}
            className={`py-3 text-sm font-semibold flex items-center justify-center gap-2 transition-colors ${
              !isLogin
                ? 'bg-white text-emerald-800 border-b-2 border-emerald-700'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <UserPlus className="w-4 h-4" />
            Hisoratra (S'inscrire)
          </button>
        </div>

        <div className="p-6">
          {!isConfigured && (
            <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Clé Supabase non configurée</p>
                <p className="text-amber-800">
                  Pour vous authentifier via le backend Tafita mada,{' '}
                  <button
                    type="button"
                    onClick={openConfigModal}
                    className="font-bold underline text-amber-950 hover:text-black"
                  >
                    cliquez ici pour entrer la clé anon
                  </button>.
                </p>
              </div>
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800">
              {successMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Anarana feno (Nom complet) *
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Ohatra: Rasoanaivo Faly"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Laharana finday (Numéro téléphone - facultatif)
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="034 00 000 00"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-2">
                    Andraikitra (Profil utilisateur) *
                  </label>
                  <div className="space-y-2">
                    {rolesList.map((r) => {
                      const Icon = r.icon;
                      const selected = role === r.role;
                      return (
                        <div
                          key={r.role}
                          onClick={() => setRole(r.role)}
                          className={`flex items-center p-2.5 rounded-xl border cursor-pointer transition-all ${
                            selected
                              ? 'border-emerald-600 bg-emerald-50/70 shadow-xs'
                              : 'border-slate-200 hover:border-slate-300 bg-white'
                          }`}
                        >
                          <input
                            type="radio"
                            name="role"
                            checked={selected}
                            onChange={() => setRole(r.role)}
                            className="mr-3 text-emerald-600 focus:ring-emerald-500"
                          />
                          <Icon className={`w-4 h-4 mr-2 ${selected ? 'text-emerald-700' : 'text-slate-400'}`} />
                          <div className="text-xs">
                            <span className="font-semibold text-slate-900">{r.title}</span>
                            <p className="text-[11px] text-slate-500">{r.desc}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Adiresy mailaka (Email) *
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="mpianatra@tafitamada.mg"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Teny miafina (Mot de passe) *
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-emerald-700 hover:bg-emerald-800 disabled:bg-slate-400 text-white rounded-lg text-sm font-bold shadow-md transition-all flex items-center justify-center gap-2 mt-4"
            >
              {loading ? (
                <span>Eo am-panatanterahana...</span>
              ) : isLogin ? (
                <>
                  <LogIn className="w-4 h-4" />
                  Hiditra (Se connecter)
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  Hisoratra anarana (Créer mon compte)
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-center text-[11px] text-slate-500 gap-1.5">
            <Shield className="w-3.5 h-3.5 text-emerald-600" />
            <span>Fiarovana azo antoka tamin'ny alalan'ny Supabase Auth</span>
          </div>
        </div>
      </div>
    </div>
  );
};
