import { useEffect, useRef, useState } from 'react';
import { MessageCircle, Send, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import api from '../services/api';
import BrandLogo from '../components/BrandLogo';
import { clearUnreadMessages } from '../redux/slices/notificationsSlice';

const CUSTOMER_CARE_EMAIL = 'kisimoniaubain@gmail.com';

const initialForm = {
  name: '',
  email: '',
  subject: '',
  message: '',
};

export default function Contact() {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const userInitial = String(user?.name?.[0] || user?.fullName?.[0] || 'U').toUpperCase();
  const [form, setForm] = useState(initialForm);
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState({ type: '', message: '' });
  const [chatMessage, setChatMessage] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [chatSending, setChatSending] = useState(false);
  const [conversation, setConversation] = useState({ messages: [] });
  const chatScrollRef = useRef(null);

  const onChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  useEffect(() => {
    if (!user) return;

    let cancelled = false;
    setChatLoading(true);

    api.get('/contact/chat')
      .then((response) => {
        if (!cancelled) {
          setConversation(response?.data?.conversation || { messages: [] });
          // Clear unread messages when user views conversation
          dispatch(clearUnreadMessages());
        }
      })
      .catch(() => {
        if (!cancelled) {
          setConversation({ messages: [] });
        }
      })
      .finally(() => {
        if (!cancelled) setChatLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [user, dispatch]);

  useEffect(() => {
    const container = chatScrollRef.current;
    if (!container) return;
    container.scrollTop = container.scrollHeight;
  }, [conversation?.messages?.length, chatLoading]);

  const onSendChatMessage = async (event) => {
    event.preventDefault();
    const text = chatMessage.trim();
    if (!text) return;

    setChatSending(true);
    try {
      const response = await api.post('/contact/chat', { message: text });
      setConversation(response?.data?.conversation || { messages: [] });
      // Clear unread messages after sending
      dispatch(clearUnreadMessages());
      setChatMessage('');
    } catch (_error) {
      setStatus({ type: 'error', message: 'Could not send chat message. Please try again.' });
    } finally {
      setChatSending(false);
    }
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    setSending(true);
    setStatus({ type: '', message: '' });

    try {
      const response = await api.post('/contact', form);
      setStatus({
        type: 'success',
        message: response?.data?.message || 'Your message has been sent to customer care.',
      });
      setForm(initialForm);
    } catch (error) {
      const backendMessage = String(error?.response?.data?.message || '');

      if (backendMessage.toLowerCase().includes('email is not configured')) {
        const mailtoSubject = encodeURIComponent(form.subject || 'Soldy.Shop Contact Request');
        const mailtoBody = encodeURIComponent(
          `Name: ${form.name}\nEmail: ${form.email}\n\n${form.message}`
        );

        window.location.href = `mailto:${CUSTOMER_CARE_EMAIL}?subject=${mailtoSubject}&body=${mailtoBody}`;
        setStatus({
          type: 'success',
          message: 'Direct email app opened as fallback. Please send the drafted message to customer care.',
        });
        return;
      }

      setStatus({
        type: 'error',
        message: backendMessage || 'Failed to send your message. Please try again.',
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
      <div className="grid lg:grid-cols-2 gap-6 lg:gap-8 items-stretch">
        <section className="card p-6 sm:p-7 w-full lg:max-w-[600px] h-full lg:h-[640px] lg:max-h-[640px] overflow-y-auto">
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-gray-100">Contact Us</h1>
          <p className="mt-2 text-sm leading-6 text-gray-600 dark:text-gray-300">
            Send us your question and our team will reply by email as soon as possible.
          </p>

          <form onSubmit={onSubmit} className="mt-5 space-y-4">
            <div>
              <label htmlFor="name" className="block text-xs font-medium text-gray-700 dark:text-gray-200 mb-1">Full Name</label>
              <input
                id="name"
                name="name"
                type="text"
                value={form.name}
                onChange={onChange}
                required
                className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#111827] px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Your full name"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-xs font-medium text-gray-700 dark:text-gray-200 mb-1">Email Address</label>
              <input
                id="email"
                name="email"
                type="email"
                value={form.email}
                onChange={onChange}
                required
                className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#111827] px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label htmlFor="subject" className="block text-xs font-medium text-gray-700 dark:text-gray-200 mb-1">Subject</label>
              <input
                id="subject"
                name="subject"
                type="text"
                value={form.subject}
                onChange={onChange}
                required
                className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#111827] px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="What do you need help with?"
              />
            </div>

            <div>
              <label htmlFor="message" className="block text-xs font-medium text-gray-700 dark:text-gray-200 mb-1">Message</label>
              <textarea
                id="message"
                name="message"
                value={form.message}
                onChange={onChange}
                required
                rows={5}
                className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#111827] px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Type your message here..."
              />
            </div>

            {status.message ? (
              <div
                className={`rounded-xl border px-4 py-3 text-sm ${
                  status.type === 'success'
                    ? 'border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-200'
                    : 'border-red-300 bg-red-50 text-red-800 dark:border-red-700 dark:bg-red-900/20 dark:text-red-200'
                }`}
              >
                {status.message}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={sending}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#b45309] hover:bg-[#92400e] disabled:opacity-70 text-white text-sm font-semibold px-4 py-2 transition-colors"
            >
              {sending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
              {sending ? 'Sending...' : 'Send Message'}
            </button>
          </form>
        </section>

        <section className="card p-6 sm:p-8 h-full lg:h-[640px] lg:max-h-[640px] flex flex-col min-h-0">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Chat With Customer Care</h2>
          <p className="mt-2 text-sm leading-6 text-gray-600 dark:text-gray-300">
            Need immediate support? Reach our team instantly through the in-site message conversation.
          </p>

          <div className="mt-6 flex-1 flex flex-col min-h-0">

            {!user ? (
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Please <Link to="/login" className="text-[#b45309] font-semibold hover:underline">log in</Link> to chat directly with admin support.
              </p>
            ) : (
              <>
                <div ref={chatScrollRef} className="flex-1 min-h-0 overflow-y-auto rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 p-3 space-y-2">
                  {chatLoading ? (
                    <p className="text-sm text-gray-500">Loading messages...</p>
                  ) : conversation?.messages?.length ? (
                    conversation.messages.map((msg, index, messages) => {
                      const mine = msg.senderType === 'user';
                      const previous = messages[index - 1];
                      const showAvatar = !previous || previous.senderType !== msg.senderType;
                      return (
                        <div key={msg._id || `${msg.createdAt}-${msg.text}`} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                          {mine ? (
                            <div className="flex items-end gap-2 max-w-[95%] sm:max-w-[85%] md:max-w-[80%]">
                              <div className="min-w-0 px-3 py-2 rounded-xl shadow-sm bg-[#b45309]/85 border border-[#b45309]/60 text-amber-50">
                                <p className="text-[13px] sm:text-sm leading-5 whitespace-pre-wrap break-words [overflow-wrap:anywhere]">{msg.text}</p>
                              </div>
                              {showAvatar ? (
                                <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-gray-700 overflow-hidden flex items-center justify-center shrink-0">
                                  {user?.avatar ? (
                                    <img src={user.avatar} alt={user?.name || 'Customer'} className="w-full h-full object-cover" />
                                  ) : (
                                    <span className="text-[11px] font-bold text-primary-700 dark:text-primary-300">{userInitial}</span>
                                  )}
                                </div>
                              ) : (
                                <div className="w-8 h-8 shrink-0" aria-hidden="true" />
                              )}
                            </div>
                          ) : (
                            <div className="flex items-end gap-2 max-w-[95%] sm:max-w-[85%] md:max-w-[80%]">
                              {showAvatar ? (
                                <div className="w-8 h-8 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 overflow-hidden flex items-center justify-center shrink-0">
                                  <BrandLogo compact iconOnly theme="auto" />
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
                    })
                  ) : (
                    <p className="text-sm text-gray-500">No messages yet. Start your conversation below.</p>
                  )}
                </div>

                <form onSubmit={onSendChatMessage} className="mt-3 shrink-0">
                  <div className="flex items-center gap-2">
                    <input
                    value={chatMessage}
                    onChange={(event) => setChatMessage(event.target.value)}
                    placeholder="Type your message to admin support..."
                    className="flex-1 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#111827] px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                    <button
                      type="submit"
                      disabled={chatSending}
                      aria-label="Send message"
                      title="Send"
                      className="h-10 w-10 shrink-0 inline-flex items-center justify-center rounded-xl bg-[#b45309] hover:bg-[#92400e] disabled:opacity-70 text-white transition-colors"
                    >
                      {chatSending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
