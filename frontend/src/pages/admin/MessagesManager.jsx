import { useEffect, useRef, useState } from 'react';
import { Send, Loader2, MessageCircle } from 'lucide-react';
import { useSelector, useDispatch } from 'react-redux';
import api from '../../services/api';
import BrandLogo from '../../components/BrandLogo';
import { getSocket } from '../../services/socket';
import { incrementUnreadMessages } from '../../redux/slices/notificationsSlice';

export default function MessagesManager() {
  const { user: adminUser } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const [threads, setThreads] = useState([]);
  const [selectedThreadId, setSelectedThreadId] = useState('');
  const [conversation, setConversation] = useState(null);
  const [reply, setReply] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesRef = useRef(null);
  const selectedThreadIdRef = useRef('');

  const loadThreads = async () => {
    const response = await api.get('/admin/messages');
    const list = response?.data?.conversations || [];
    setThreads(list);

    if (!selectedThreadId && list.length) {
      setSelectedThreadId(list[0]._id);
    }

    if (selectedThreadId && !list.find((item) => item._id === selectedThreadId) && list.length) {
      setSelectedThreadId(list[0]._id);
    }
  };

  const loadConversation = async (id) => {
    if (!id) {
      setConversation(null);
      return;
    }

    const response = await api.get(`/admin/messages/${id}`);
    setConversation(response?.data?.conversation || null);
  };

  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      try {
        setLoading(true);
        await loadThreads();
      } catch (_error) {
        if (!cancelled) {
          setThreads([]);
          setConversation(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    init();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!selectedThreadId) return;

    loadConversation(selectedThreadId).catch(() => {
      setConversation(null);
    });
  }, [selectedThreadId]);

  useEffect(() => {
    selectedThreadIdRef.current = selectedThreadId;
  }, [selectedThreadId]);

  useEffect(() => {
    if (!adminUser || adminUser.role !== 'admin') return;

    const socket = getSocket();
    const joinAdminRoom = () => {
      socket.emit('support:join-admin');
    };

    const handleRealtimeAdminUnread = (payload) => {
      const conversationId = String(payload?.conversationId || '').trim();
      if (!conversationId) return;

      setThreads((prevThreads) => prevThreads.map((thread) => {
        if (thread._id !== conversationId) return thread;
        return {
          ...thread,
          adminUnreadCount: Number(payload?.adminUnreadCount || 0),
        };
      }));

      if (selectedThreadIdRef.current === conversationId) {
        loadConversation(conversationId).catch(() => {
          setConversation(null);
        });
      }
    };

    socket.on('support:admin-unread', handleRealtimeAdminUnread);
    socket.on('connect', joinAdminRoom);
    if (!socket.connected) socket.connect();
    else joinAdminRoom();

    return () => {
      socket.off('support:admin-unread', handleRealtimeAdminUnread);
      socket.off('connect', joinAdminRoom);
      socket.disconnect();
    };
  }, [adminUser]);

  useEffect(() => {
    const container = messagesRef.current;
    if (!container) return;
    container.scrollTop = container.scrollHeight;
  }, [conversation?.messages?.length]);

  const onSendReply = async (event) => {
    event.preventDefault();
    const text = reply.trim();
    if (!text || !selectedThreadId) return;

    setSending(true);
    try {
      const response = await api.post(`/admin/messages/${selectedThreadId}/reply`, { message: text });
      setConversation(response?.data?.conversation || null);
      setReply('');
      await loadThreads();
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="card p-6 text-sm text-gray-600 dark:text-gray-300">Loading support messages...</div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-4">
      <div className="flex items-center gap-2">
        <MessageCircle size={20} className="text-[#b45309]" />
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Customer Messages</h1>
      </div>

      <div className="grid lg:grid-cols-[320px,1fr] gap-4">
        <aside className="card p-3 h-[70vh] overflow-y-auto">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">Conversations</h2>
          <div className="space-y-2">
            {threads.length === 0 ? (
              <p className="text-sm text-gray-500">No conversations yet.</p>
            ) : threads.map((thread) => {
              const customerInitial = String(thread?.user?.name?.[0] || 'C').toUpperCase();
              return (
                <button
                  key={thread._id}
                  type="button"
                  onClick={() => setSelectedThreadId(thread._id)}
                  className={`w-full text-left rounded-xl border px-3 py-2 transition-colors flex gap-2 items-start ${
                    selectedThreadId === thread._id
                      ? 'border-[#b45309] bg-amber-50 dark:bg-amber-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                >
                  {/* User Avatar */}
                  <div className="w-8 h-8 rounded-full bg-[#b45309]/20 dark:bg-[#b45309]/40 flex items-center justify-center shrink-0 mt-0.5 overflow-hidden">
                    {thread?.user?.avatar ? (
                      <img src={thread.user.avatar} alt={thread?.user?.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xs font-bold text-[#b45309]">{customerInitial}</span>
                    )}
                  </div>
                  
                  {/* Conversation Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate flex-1">{thread?.user?.name || 'Customer'}</p>
                      {(thread?.adminUnreadCount || 0) > 0 ? (
                        <span className="inline-flex min-w-[18px] h-[18px] px-1 rounded-full bg-[#b45309] text-white text-[9px] font-bold items-center justify-center leading-none shrink-0">
                          {thread.adminUnreadCount > 99 ? '99+' : thread.adminUnreadCount}
                        </span>
                      ) : null}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{thread?.user?.email || '-'}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-300 truncate mt-0.5 line-clamp-1">{thread?.lastMessage?.text || 'No messages'}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        <section className="card p-4 sm:p-5 h-[70vh] flex flex-col">
          {!conversation ? (
            <p className="text-sm text-gray-500">Select a conversation to view messages.</p>
          ) : (
            <>
              <div className="mb-3">
                <p className="font-semibold text-gray-900 dark:text-gray-100">{conversation?.user?.name || 'Customer'}</p>
                <p className="text-xs text-gray-500">{conversation?.user?.email || ''}</p>
              </div>

              <div ref={messagesRef} className="flex-1 overflow-y-auto rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 p-3 space-y-2">
                {(conversation.messages || []).map((msg, index, messages) => {
                  const isAdmin = msg.senderType === 'admin';
                  const previous = messages[index - 1];
                  const showAvatar = !previous || previous.senderType !== msg.senderType;
                  const customerInitial = String(conversation?.user?.name?.[0] || 'C').toUpperCase();
                  return (
                    <div key={msg._id} className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}>
                      {isAdmin ? (
                        <div className="flex items-end gap-2 max-w-[95%] sm:max-w-[85%] md:max-w-[80%]">
                          <div className="min-w-0 px-3 py-2 rounded-xl shadow-sm bg-[#b45309]/85 border border-[#b45309]/60 text-amber-50">
                            <p className="text-[13px] sm:text-sm leading-5 whitespace-pre-wrap break-words [overflow-wrap:anywhere]">{msg.text}</p>
                          </div>
                          {showAvatar ? (
                            <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-gray-700 overflow-hidden flex items-center justify-center shrink-0">
                              <BrandLogo compact iconOnly theme="auto" />
                            </div>
                          ) : (
                            <div className="w-8 h-8 shrink-0" aria-hidden="true" />
                          )}
                        </div>
                      ) : (
                        <div className="flex items-end gap-2 max-w-[95%] sm:max-w-[85%] md:max-w-[80%]">
                          {showAvatar ? (
                            <div className="w-8 h-8 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 overflow-hidden flex items-center justify-center shrink-0">
                              {conversation?.user?.avatar ? (
                                <img src={conversation.user.avatar} alt={conversation?.user?.name || 'Customer'} className="w-full h-full object-cover" />
                              ) : (
                                <span className="text-[11px] font-bold text-primary-700 dark:text-primary-300">{customerInitial}</span>
                              )}
                            </div>
                          ) : (
                            <div className="w-8 h-8 shrink-0" aria-hidden="true" />
                          )}
                          <div className="min-w-0 px-3 py-2 rounded-xl shadow-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-100">
                            <p className="text-[13px] sm:text-sm leading-5 whitespace-pre-wrap break-words [overflow-wrap:anywhere]">{msg.text}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <form onSubmit={onSendReply} className="mt-3">
                <div className="flex items-center gap-2">
                  <input
                  value={reply}
                  onChange={(event) => setReply(event.target.value)}
                  placeholder="Type admin reply..."
                  className="flex-1 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#111827] px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                  <button
                    type="submit"
                    disabled={sending}
                    aria-label="Send reply"
                    title="Send"
                    className="h-10 w-10 shrink-0 inline-flex items-center justify-center rounded-xl bg-[#b45309] hover:bg-[#92400e] disabled:opacity-70 text-white transition-colors"
                  >
                    {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                  </button>
                </div>
              </form>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
