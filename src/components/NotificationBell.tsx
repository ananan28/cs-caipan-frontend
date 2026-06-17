import { useState, useEffect } from 'react';
import { supabase } from '../api/supabase';
import { useAuthStore } from '../store/authStore';
import { Bell, X, Check, Mail } from 'lucide-react';

export function NotificationBell() {
  const { user } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (user?.id) {
      fetchMessages();
      const interval = setInterval(fetchMessages, 30000);
      return () => clearInterval(interval);
    }
  }, [user?.id]);

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('receiver_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(10);
      if (error) throw error;
      setMessages(data || []);
      setUnreadCount(data?.filter((m: any) => !m.is_read).length || 0);
    } catch (error) {
      console.error('Fetch messages error:', error);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await supabase.from('messages').update({ is_read: true }).eq('id', id);
      fetchMessages();
    } catch (error) {
      console.error('Mark as read error:', error);
    }
  };

  const markAllRead = async () => {
    try {
      await supabase.from('messages').update({ is_read: true }).eq('receiver_id', user?.id);
      fetchMessages();
    } catch (error) {
      console.error('Mark all read error:', error);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg hover:bg-primary-900/20 transition-colors border border-transparent hover:border-primary-700/20"
      >
        <Bell size={18} className="text-primary-400/60" />
        {unreadCount > 0 && (
          <span className="absolute top-0.5 right-0.5 w-4 h-4 bg-red-500 text-white text-[9px] rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 max-h-96 bg-[#141b2d] border border-[#1e2a45] rounded-xl shadow-2xl overflow-hidden z-50">
          <div className="flex items-center justify-between p-3 border-b border-[#1e2a45]">
            <span className="text-white font-medium text-sm">消息通知</span>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="text-xs text-primary-400 hover:text-primary-300 transition"
              >
                全部已读
              </button>
            )}
            <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-white">
              <X size={16} />
            </button>
          </div>

          <div className="overflow-y-auto max-h-72">
            {messages.length === 0 ? (
              <div className="text-center py-8 text-gray-400 text-sm">
                <Mail size={32} className="mx-auto text-gray-600 mb-2" />
                暂无消息
              </div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`p-3 border-b border-[#1e2a45]/50 hover:bg-[#1a2340] transition cursor-pointer ${
                    !msg.is_read ? 'bg-primary-500/5' : ''
                  }`}
                  onClick={() => markAsRead(msg.id)}
                >
                  <div className="flex items-start gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full mt-1.5 ${!msg.is_read ? 'bg-blue-500' : 'bg-gray-500'}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium truncate">{msg.subject}</p>
                      <p className="text-gray-400 text-xs truncate">{msg.content}</p>
                      <p className="text-gray-500 text-[10px] mt-0.5">
                        {new Date(msg.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="p-2 border-t border-[#1e2a45] text-center">
            <a href="/messages" className="text-xs text-primary-400 hover:text-primary-300 transition">
              查看全部消息 →
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
