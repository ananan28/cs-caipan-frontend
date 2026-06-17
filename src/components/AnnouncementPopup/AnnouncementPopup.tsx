import { useState, useEffect } from 'react';
import { supabase } from '../../api/supabase';
import { useAuthStore } from '../../store/authStore';
import { X, Bell, AlertCircle, Info } from 'lucide-react';

type Announcement = {
  id: string;
  title: string;
  content: string;
  type: 'normal' | 'important' | 'emergency';
  is_popup: boolean;
  created_at: string;
};

export function AnnouncementPopup() {
  const { user } = useAuthStore();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (user?.id) {
      fetchPopupAnnouncements();
    }
  }, [user?.id]);

  const fetchPopupAnnouncements = async () => {
    try {
      // 获取未读的弹窗公告
      const { data: reads } = await supabase
        .from('announcement_reads')
        .select('announcement_id')
        .eq('user_id', user?.id);

      const readIds = new Set(reads?.map((r: any) => r.announcement_id) || []);

      const { data } = await supabase
        .from('announcements')
        .select('*')
        .eq('is_active', true)
        .eq('is_popup', true)
        .order('created_at', { ascending: false });

      if (data) {
        const unread = data.filter((a: any) => !readIds.has(a.id));
        if (unread.length > 0) {
          setAnnouncements(unread);
          setCurrentIndex(0);
          setShow(true);
        }
      }
    } catch (error) {
      console.error('Fetch popup announcements error:', error);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await supabase.from('announcement_reads').insert({
        announcement_id: id,
        user_id: user?.id,
      });
    } catch (error) {
      console.error('Mark as read error:', error);
    }
  };

  const handleClose = () => {
    if (announcements[currentIndex]) {
      markAsRead(announcements[currentIndex].id);
    }
    if (currentIndex < announcements.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setShow(false);
    }
  };

  const handleSkipAll = () => {
    announcements.forEach((a) => markAsRead(a.id));
    setShow(false);
  };

  if (!show || announcements.length === 0) return null;

  const current = announcements[currentIndex];
  const isLast = currentIndex === announcements.length - 1;

  const getTypeStyle = (type: string) => {
    const map = {
      normal: { bg: 'bg-blue-500/10 border-blue-500/30', icon: Info, color: 'text-blue-400' },
      important: { bg: 'bg-yellow-500/10 border-yellow-500/30', icon: Bell, color: 'text-yellow-400' },
      emergency: { bg: 'bg-red-500/10 border-red-500/30', icon: AlertCircle, color: 'text-red-400' },
    };
    return map[type as keyof typeof map] || map.normal;
  };

  const style = getTypeStyle(current.type);
  const Icon = style.icon;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[999]">
      <div className={`${style.bg} border rounded-2xl p-6 max-w-md w-full mx-4 relative animate-fadeIn`}>
        <button
          onClick={handleSkipAll}
          className="absolute top-2 right-2 text-gray-400 hover:text-white transition p-1"
        >
          <X size={20} />
        </button>

        <div className="flex items-center gap-3 mb-3">
          <Icon className={`${style.color}`} size={28} />
          <span className={`text-xs px-2 py-0.5 rounded-full ${style.color} bg-${style.color.split('-')[1]}-500/20`}>
            {current.type === 'emergency' ? '紧急' : current.type === 'important' ? '重要' : '公告'}
          </span>
        </div>

        <h2 className="text-xl font-bold text-white">{current.title}</h2>
        <p className="text-gray-300 text-sm mt-3 whitespace-pre-wrap leading-relaxed">{current.content}</p>

        <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/10">
          <span className="text-xs text-gray-500">
            {currentIndex + 1} / {announcements.length}
          </span>
          <button
            onClick={handleClose}
            className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-2 rounded-lg text-sm transition"
          >
            {isLast ? '我知道了' : '下一条 →'}
          </button>
        </div>
      </div>
    </div>
  );
}
