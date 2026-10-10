import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { getSupabaseClient, isSupabaseConfigured } from '../lib/supabaseClient';
import { Group, GroupMember, GroupMessage, CommunityLink } from '../types/database';
import { 
  Users, 
  MessageSquare, 
  Send, 
  ExternalLink, 
  ShieldCheck, 
  UserPlus, 
  LogOut, 
  Globe, 
  Lock, 
  CheckCircle,
  Hash,
  AlertCircle
} from 'lucide-react';

interface CommunityPageProps {
  initialGroupId?: string;
  openConfigModal: () => void;
}

export const CommunityPage: React.FC<CommunityPageProps> = ({ initialGroupId, openConfigModal }) => {
  const { user, profile } = useAuth();
  
  // Strict separation of sub-tabs
  const [activeCommunityTab, setActiveCommunityTab] = useState<'internal' | 'external'>('internal');

  // Internal groups state
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [messages, setMessages] = useState<GroupMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isMemberOfCurrentGroup, setIsMemberOfCurrentGroup] = useState(false);
  const [showMemberList, setShowMemberList] = useState(false);
  const [groupRlsError, setGroupRlsError] = useState<string | null>(null);

  // External communities state
  const [externalLinks, setExternalLinks] = useState<CommunityLink[]>([]);

  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll messages to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load Initial Groups and External Links
  useEffect(() => {
    const loadCommunityData = async () => {
      setLoading(true);
      setGroupRlsError(null);

      if (!isSupabaseConfigured()) {
        const mockGroups: Group[] = [
          {
            id: 'grp-malagasy',
            name: 'Mpianatra Malagasy 2026',
            description: 'Vondrona hifanakalozana momba ny fitsipi-pitenenana, haisoratra ary fanadinana ofisialy.',
          },
          {
            id: 'grp-informatique',
            name: 'Klioba Informatika sy Coding',
            description: 'Resaka momba ny fampiharana nomerika, tranonkala sy fandaharana solosaina ho an\'ny tanora.',
          },
        ];

        setGroups(mockGroups);
        const active = mockGroups.find(g => g.id === initialGroupId) || mockGroups[0];
        setSelectedGroup(active);
        setIsMemberOfCurrentGroup(true);

        setExternalLinks([
          {
            id: 'ext-wa',
            platform: 'whatsapp',
            url: 'https://chat.whatsapp.com/example',
            description: 'Fampahafantarana haingana, fandaharam-potoana ary fanontaniana mivantana.',
          },
          {
            id: 'ext-tg',
            platform: 'telegram',
            url: 'https://t.me/tafitamada',
            description: 'Fizarana antontan-taratasy, boky PDF sy fanazaran-tena maimaimpoana.',
          },
          {
            id: 'ext-fb',
            platform: 'facebook',
            url: 'https://facebook.com/tafitamada',
            description: 'Vaovao rehetra momba ny tetikasa, fanadinana sy hetsika fanabeazana.',
          },
          {
            id: 'ext-yt',
            platform: 'youtube',
            url: 'https://youtube.com/@tafitamada',
            description: 'Lahatsary fampianarana, fanazavana lesona amin\'ny teny Malagasy.',
          },
        ]);

        setLoading(false);
        return;
      }

      // Supabase is configured: fetch from groups & community_links tables
      const supabase = getSupabaseClient();
      try {
        const [groupsRes, linksRes] = await Promise.all([
          supabase.from('groups').select('*').order('created_at', { ascending: false }),
          supabase.from('community_links').select('*'),
        ]);

        if (groupsRes.error) {
          console.warn('Groups query error (known backend RLS issue):', groupsRes.error.message);
          setGroupRlsError("Misy fepetra ara-piarovana (RLS) eo amin'ny vondrona anatiny amin'ny backend. Mbola eo am-pandaminana izany.");
        } else if (groupsRes.data && groupsRes.data.length > 0) {
          setGroups(groupsRes.data as Group[]);
          const current = (initialGroupId && groupsRes.data.find((g: any) => g.id === initialGroupId)) || groupsRes.data[0];
          setSelectedGroup(current as Group);
        }

        if (linksRes.data && linksRes.data.length > 0) {
          setExternalLinks(linksRes.data as CommunityLink[]);
        }
      } catch (err: any) {
        console.warn('Error fetching community data:', err);
        setGroupRlsError("Tsy afaka nalaina ny vondrona anatiny (RLS).");
      } finally {
        setLoading(false);
      }
    };

    loadCommunityData();
  }, [initialGroupId]);

  // Load Messages and Members when Selected Group changes
  useEffect(() => {
    if (!selectedGroup || !isSupabaseConfigured()) return;

    const supabase = getSupabaseClient();

    const fetchGroupDetails = async () => {
      try {
        // Fetch group messages
        const { data: messagesData, error: msgErr } = await supabase
          .from('group_messages')
          .select('*, sender:profiles(*)')
          .eq('group_id', selectedGroup.id)
          .order('created_at', { ascending: true })
          .limit(100);

        if (msgErr) {
          console.warn('Group messages error (RLS):', msgErr.message);
        } else if (messagesData) {
          setMessages(messagesData as GroupMessage[]);
        }

        // Fetch group members using verified fields
        const { data: membersData, error: membErr } = await supabase
          .from('group_members')
          .select('group_id, user_id, created_at, profile:profiles(*)')
          .eq('group_id', selectedGroup.id);

        if (membErr) {
          console.warn('Group members error (RLS):', membErr.message);
        } else if (membersData) {
          const normalizedMembers: GroupMember[] = (membersData as any[]).map((m: any) => ({
            group_id: m.group_id,
            user_id: m.user_id,
            created_at: m.created_at,
            profile: Array.isArray(m.profile) ? m.profile[0] : m.profile,
          }));
          setMembers(normalizedMembers);
          if (user) {
            const isMember = membersData.some((m: any) => m.user_id === user.id);
            setIsMemberOfCurrentGroup(isMember);
          }
        }
      } catch (err) {
        console.warn('Error loading group messages and members:', err);
      }
    };

    fetchGroupDetails();

    // Subscribe to realtime messages on group_messages table
    const channel = supabase
      .channel(`group_messages:${selectedGroup.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'group_messages',
          filter: `group_id=eq.${selectedGroup.id}`,
        },
        async (payload) => {
          const newRow = payload.new as GroupMessage;
          const { data: senderProfile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', newRow.user_id)
            .maybeSingle();

          setMessages((prev) => [
            ...prev,
            { ...newRow, sender: senderProfile || undefined },
          ]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedGroup, user]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedGroup) return;

    if (!user) {
      setNotification('Mila miditra (connexion) aloha ianao vao afaka mandefa hafatra.');
      setTimeout(() => setNotification(null), 3500);
      return;
    }

    if (!isMemberOfCurrentGroup) {
      setNotification('Mila mikambana amin\'ity vondrona ity aloha ianao vao afaka manoratra.');
      setTimeout(() => setNotification(null), 3500);
      return;
    }

    setSendingMessage(true);
    const content = newMessage.trim();
    setNewMessage('');

    if (isSupabaseConfigured()) {
      const supabase = getSupabaseClient();
      try {
        const { error } = await supabase
          .from('group_messages')
          .insert({
            group_id: selectedGroup.id,
            user_id: user.id,
            content,
            created_at: new Date().toISOString(),
          });

        if (error) {
          setNotification('Tsy voalefa ny hafatra (RLS): ' + error.message);
          setTimeout(() => setNotification(null), 4000);
        }
      } catch (err: any) {
        setNotification('Tsy voalefa ny hafatra: ' + (err?.message || 'Erreur'));
        setTimeout(() => setNotification(null), 4000);
      } finally {
        setSendingMessage(false);
      }
    }
  };

  const handleJoinGroup = async () => {
    if (!user || !selectedGroup) {
      setNotification('Mila miditra (connexion) aloha ianao.');
      setTimeout(() => setNotification(null), 3500);
      return;
    }

    if (isSupabaseConfigured()) {
      const supabase = getSupabaseClient();
      try {
        const { error } = await supabase
          .from('group_members')
          .insert({
            group_id: selectedGroup.id,
            user_id: user.id,
          });

        if (error) {
          setNotification('Tsy afaka niditra tamin\'ny vondrona (RLS): ' + error.message);
          setTimeout(() => setNotification(null), 4000);
          return;
        }
      } catch (err: any) {
        setNotification('Olana tamin\'ny fidirana: ' + (err?.message || 'Erreur'));
        setTimeout(() => setNotification(null), 4000);
        return;
      }
    }

    setIsMemberOfCurrentGroup(true);
    setNotification('Tafiditra ho mpikambana soa aman-tsara ianao !');
    setTimeout(() => setNotification(null), 3000);
  };

  const handleLeaveGroup = async () => {
    if (!user || !selectedGroup) return;

    if (isSupabaseConfigured()) {
      const supabase = getSupabaseClient();
      try {
        await supabase
          .from('group_members')
          .delete()
          .eq('group_id', selectedGroup.id)
          .eq('user_id', user.id);
      } catch (err) {
        console.warn('Error leaving group:', err);
      }
    }

    setIsMemberOfCurrentGroup(false);
    setNotification('Niala tamin\'ny vondrona ianao.');
    setTimeout(() => setNotification(null), 3000);
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Top Banner & Strict Architecture Switcher */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold mb-2">
            <Users className="w-3.5 h-3.5" />
            <span>Fiaraha-monina sy Fifanakalozana</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            Sehatra Fiaraha-monina (Communauté)
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Resaka anatiny amin'ireo vondrom-pianarana sy rohy ofisialy amin'ireo tambazotra ivelany.
          </p>
        </div>

        {/* Tab switch strictly separating Internal from External */}
        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
          <button
            onClick={() => setActiveCommunityTab('internal')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
              activeCommunityTab === 'internal'
                ? 'bg-white text-emerald-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <MessageSquare className="w-4 h-4 text-emerald-700" />
            Vondrona Anatiny (Groupes Internes)
          </button>
          <button
            onClick={() => setActiveCommunityTab('external')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
              activeCommunityTab === 'external'
                ? 'bg-white text-emerald-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Globe className="w-4 h-4 text-emerald-700" />
            Rohy Ivelany (Communautés Externes)
          </button>
        </div>
      </div>

      {notification && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* VIEW 1: INTERNAL GROUPS (Chat & Members) */}
      {activeCommunityTab === 'internal' && (
        <div className="space-y-4">
          {groupRlsError && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-900 flex items-start gap-3 shadow-xs">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Fampahafantarana momba ny vondrona anatiny :</p>
                <p className="text-amber-800 mt-0.5 leading-relaxed">
                  Misy fanitsiana ara-piarovana (RLS database) eo amin'ny latabatra <code>group_members</code> ao amin'ny backend. 
                  Mbola tsy afaka jerena na andefasana hafatra mivantana ny vondrona anatiny mandra-pahavitan'ny fanitsiana RLS any aoriana.
                </p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Groups list sidebar (1 col) */}
            <div className="lg:col-span-1 bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <Hash className="w-3.5 h-3.5 text-emerald-700" />
                  Vondrona ({groups.length})
                </span>
              </div>

              <div className="space-y-1.5">
                {groups.length === 0 ? (
                  <div className="p-3 text-center text-xs text-slate-400">
                    Tsy misy vondrona hita.
                  </div>
                ) : (
                  groups.map((group) => {
                    const isSelected = selectedGroup?.id === group.id;
                    return (
                      <button
                        key={group.id}
                        onClick={() => { setSelectedGroup(group); setShowMemberList(false); }}
                        className={`w-full text-left p-3 rounded-xl border transition-all flex flex-col gap-1 ${
                          isSelected
                            ? 'border-emerald-600 bg-emerald-50/70 text-emerald-950 font-semibold shadow-xs'
                            : 'border-transparent hover:border-slate-200 hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <span className="text-xs font-bold truncate">{group.name}</span>
                        <p className="text-[11px] text-slate-500 line-clamp-1 font-normal">
                          {group.description}
                        </p>
                      </button>
                    );
                  })
                )}
              </div>
            </div>

          {/* Group Chat Center & Member Roster (3 cols) */}
          <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col h-[650px] overflow-hidden">
            {selectedGroup ? (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-slate-900 text-sm">{selectedGroup.name}</h3>
                      <span className="text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full font-medium">
                        {members.length > 0 ? members.length : 1} mpikambana
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 line-clamp-1">{selectedGroup.description}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowMemberList(!showMemberList)}
                      className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                    >
                      {showMemberList ? 'Hanafy ny mpikambana' : 'Mpikambana'}
                    </button>

                    {isMemberOfCurrentGroup ? (
                      <button
                        onClick={handleLeaveGroup}
                        title="Hiala amin'ny vondrona"
                        className="px-2.5 py-1.5 rounded-lg border border-rose-200 text-xs font-semibold text-rose-700 hover:bg-rose-50 transition-colors flex items-center gap-1"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        Hiala
                      </button>
                    ) : (
                      <button
                        onClick={handleJoinGroup}
                        className="px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition-colors flex items-center gap-1"
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                        Hiditra
                      </button>
                    )}
                  </div>
                </div>

                {/* Sub-drawer for Members */}
                {showMemberList && (
                  <div className="bg-slate-50 border-b border-slate-200 p-4 max-h-48 overflow-y-auto space-y-2">
                    <span className="text-xs font-bold text-slate-700">Lisitry ny Mpikambana (Membres) :</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                      {members.map((m, mIdx) => (
                        <div key={`${m.group_id}-${m.user_id}-${mIdx}`} className="p-2 bg-white rounded-lg border border-slate-200 flex items-center gap-2 text-xs">
                          <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-[10px]">
                            {(m.profile?.full_name || 'U').charAt(0)}
                          </div>
                          <div className="truncate">
                            <p className="font-semibold truncate">{m.profile?.full_name || 'Mpikambana'}</p>
                            <span className="text-[10px] text-slate-400">{m.profile?.role || 'Mpianatra'}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Chat Messages Stream */}
                <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-50/30">
                  {messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 text-xs space-y-2">
                      <MessageSquare className="w-8 h-8 text-slate-300" />
                      <p>Mbola tsy misy hafatra ato amin'ity vondrona ity.</p>
                      <p>Manorata voalohany mba hanombohana ny resaka !</p>
                    </div>
                  ) : (
                    messages.map((msg) => {
                      const isMe = user?.id === msg.user_id;
                      const senderName = msg.sender?.full_name || (isMe ? 'Ianao' : 'Mpikambana');
                      const senderRole = msg.sender?.role || 'Mpianatra';

                      return (
                        <div
                          key={msg.id}
                          className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                        >
                          <div className="flex items-center gap-2 mb-1 px-1 text-[11px] text-slate-500">
                            <span className="font-bold text-slate-800">{senderName}</span>
                            <span className="text-[10px] px-1 py-0.2 bg-slate-100 rounded text-slate-600">
                              {senderRole}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <div
                            className={`p-3 rounded-2xl max-w-[80%] text-xs leading-relaxed shadow-xs ${
                              isMe
                                ? 'bg-emerald-700 text-white rounded-br-none'
                                : 'bg-white border border-slate-200 text-slate-800 rounded-bl-none'
                            }`}
                          >
                            {msg.content}
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Chat Composer */}
                <div className="p-3 border-t border-slate-200 bg-white">
                  {!isMemberOfCurrentGroup ? (
                    <div className="p-2 text-center text-xs text-slate-500 bg-slate-100 rounded-xl flex items-center justify-center gap-2">
                      <Lock className="w-4 h-4 text-slate-400" />
                      <span>Tsindrio ny bokotra <strong>« Hiditra »</strong> eo ambony raha hanoratra ato amin'ny vondrona.</span>
                    </div>
                  ) : (
                    <form onSubmit={handleSendMessage} className="flex gap-2">
                      <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Manorata hafatra eto..."
                        className="flex-1 px-4 py-2.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                      />
                      <button
                        type="submit"
                        disabled={sendingMessage || !newMessage.trim()}
                        className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 disabled:bg-slate-300 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Alefa</span>
                      </button>
                    </form>
                  )}
                </div>
              </>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-sm">
                Mifidiana vondrona avy eo amin'ny lisitra havia.
              </div>
            )}
          </div>
        </div>
      </div>
    )}

      {/* VIEW 2: EXTERNAL COMMUNITIES (Strictly separated) */}
      {activeCommunityTab === 'external' && (
        <div className="space-y-6">
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
            <div className="text-xs text-emerald-950 space-y-1">
              <p className="font-bold">Fanazavana momba ny rohy ivelany (Communautés Externes) :</p>
              <p className="text-emerald-800 leading-relaxed">
                Ireo vondrona ireo dia fehezin'ny fepetra sy fitsipiky ny sehatra ivelany (WhatsApp, Telegram, Facebook, YouTube).
                Tsy mifangaro amin'ny resaka anatiny (Chat groupes internes) ao amin'ny fampiharana izy ireo.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {externalLinks.map((link) => (
              <div
                key={link.id}
                className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs hover:border-emerald-500/50 hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-slate-100 text-slate-800">
                      {link.platform}
                    </span>
                    <span className="text-xs text-emerald-700 font-semibold">
                      Ofisialy
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 capitalize">
                    {link.platform ? `Vondrona ${link.platform}` : 'Rohy Ivelany'}
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">{link.description || 'Rohy ofisialy TAFITA MADA.'}</p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">Rohy ofisialy TAFITA MADA</span>
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs"
                  >
                    <span>Hiditra amin'ny {link.platform}</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
