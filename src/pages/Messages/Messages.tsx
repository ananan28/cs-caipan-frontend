import { useState } from 'react';
import { Card } from '../../components/UI/Card';
import { Button } from '../../components/UI/Button';
import { 
  MessageCircle, Send, Inbox, User, Trash2, 
  Check, X, Reply, ChevronDown, ChevronUp,
  Mail, MailOpen
} from 'lucide-react';

type Message = {
  id: string;
  from: string;
  to: string;
  subject: string;
  content: string;
  type: 'direct' | 'role' | 'all';
  isRead: boolean;
  isStarred?: boolean;
  replies?: Reply[];
  createdAt: string;
};

type Reply = {
  id: string;
  from: string;
  content: string;
  createdAt: string;
};

export function Messages() {
  const [messages, setMessages] = useState<Message[]>([
    { 
      id: '1', 
      from: '系统管理员', 
      to: 'admin', 
      subject: '欢迎使用CS财盛集团', 
      content: '欢迎来到CS财盛集团号码检测平台。您可以使用左侧菜单的各项功能进行号码检测、查看余额和管理账号。如有任何问题，请随时联系我们。',
      type: 'all', 
      isRead: false,
      createdAt: new Date().toISOString(),
      replies: []
    },
    { 
      id: '2', 
      from: '客服中心', 
      to: 'admin', 
      subject: '充值问题反馈', 
      content: '您的USDT充值已到账，积分已增加。如未收到请及时联系客服。',
      type: 'direct', 
      isRead: false,
      createdAt: new Date(Date.now() - 3600000).toISOString(),
      replies: []
    },
    { 
      id: '3', 
      from: 'admin', 
      to: 'all', 
      subject: '系统维护通知', 
      content: '系统将于本周六凌晨2:00-4:00进行例行维护，届时服务将暂停。请提前做好任务安排。',
      type: 'all', 
      isRead: true,
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      replies: [
        {
          id: 'r1',
          from: '用户A',
          content: '收到，谢谢通知',
          createdAt: new Date(Date.now() - 80000000).toISOString()
        }
      ]
    },
  ]);
  const [activeTab, setActiveTab] = useState<'inbox' | 'sent' | 'compose'>('inbox');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [formData, setFormData] = useState({ to: 'all', subject: '', content: '' });

  // 获取选中的消息
  const selectedMessage = messages.find(m => m.id === selectedId);

  // 标记已读
  const markAsRead = (id: string) => {
    setMessages(messages.map(m => m.id === id ? { ...m, isRead: true } : m));
  };

  // 切换选中
  const toggleSelect = (id: string) => {
    if (selectedId === id) {
      setSelectedId(null);
    } else {
      setSelectedId(id);
      markAsRead(id);
    }
  };

  // 发送回复
  const handleReply = () => {
    if (!replyContent.trim()) { alert('请输入回复内容'); return; }
    if (!selectedMessage) return;

    const newReply: Reply = {
      id: 'r' + Date.now(),
      from: 'admin',
      content: replyContent,
      createdAt: new Date().toISOString(),
    };

    setMessages(messages.map(m => 
      m.id === selectedId 
        ? { ...m, replies: [...(m.replies || []), newReply] } 
        : m
    ));
    setReplyContent('');
    alert('✅ 回复已发送');
  };

  // 发送新消息
  const handleSend = () => {
    if (!formData.subject || !formData.content) { alert('请填写主题和内容'); return; }
    const newMsg: Message = {
      id: Date.now().toString(),
      from: 'admin',
      to: formData.to,
      subject: formData.subject,
      content: formData.content,
      type: formData.to === 'all' ? 'all' : 'direct',
      isRead: false,
      createdAt: new Date().toISOString(),
      replies: [],
    };
    setMessages([newMsg, ...messages]);
    alert('✅ 消息已发送');
    setFormData({ to: 'all', subject: '', content: '' });
    setActiveTab('sent');
  };

  // 删除消息
  const deleteMessage = (id: string) => {
    if (confirm('确定删除此消息吗？')) {
      setMessages(messages.filter(m => m.id !== id));
      if (selectedId === id) setSelectedId(null);
    }
  };

  const unreadCount = messages.filter(m => !m.isRead).length;
  const inboxMessages = messages.filter(m => m.to === 'admin' || m.type === 'all');
  const sentMessages = messages.filter(m => m.from === 'admin');

  return (
    <div className="p-4 space-y-4 h-full">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <MessageCircle className="text-primary-500" size={28} />
            站内消息
          </h1>
          <p className="text-gray-400 text-sm">收件、阅读和回复消息</p>
        </div>
        <Button onClick={() => setActiveTab('compose')}>
          <Send size={16} /> 写消息
        </Button>
      </div>

      {/* 标签栏 */}
      <div className="flex gap-2 border-b border-[#1e2a45] pb-2">
        <button 
          onClick={() => setActiveTab('inbox')} 
          className={`px-4 py-2 rounded-lg text-sm transition flex items-center gap-2 ${
            activeTab === 'inbox' ? 'bg-primary-600/20 text-primary-400' : 'text-gray-400 hover:text-white'
          }`}
        >
          <Inbox size={16} /> 收件箱 {unreadCount > 0 && <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">{unreadCount}</span>}
        </button>
        <button 
          onClick={() => setActiveTab('sent')} 
          className={`px-4 py-2 rounded-lg text-sm transition flex items-center gap-2 ${
            activeTab === 'sent' ? 'bg-primary-600/20 text-primary-400' : 'text-gray-400 hover:text-white'
          }`}
        >
          <Send size={16} /> 已发送
        </button>
      </div>

      {/* 写消息 */}
      {activeTab === 'compose' && (
        <Card className="bg-[#141b2d] border-[#1e2a45] p-4">
          <h3 className="text-white font-semibold mb-3">📝 写消息</h3>
          <div className="space-y-3">
            <select
              value={formData.to}
              onChange={(e) => setFormData({ ...formData, to: e.target.value })}
              className="w-full bg-[#0a0e1a] border border-[#1e2a45] rounded-lg px-4 py-2 text-white text-sm"
            >
              <option value="all">所有用户</option>
              <option value="gm">GM</option>
              <option value="agent">代理</option>
              <option value="user">普通用户</option>
            </select>
            <input
              placeholder="主题"
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              className="w-full bg-[#0a0e1a] border border-[#1e2a45] rounded-lg px-4 py-2 text-white text-sm"
            />
            <textarea
              placeholder="内容"
              rows={4}
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              className="w-full bg-[#0a0e1a] border border-[#1e2a45] rounded-lg px-4 py-2 text-white text-sm"
            />
            <div className="flex gap-2">
              <Button onClick={handleSend}>发送</Button>
              <Button variant="secondary" onClick={() => setActiveTab('inbox')}>取消</Button>
            </div>
          </div>
        </Card>
      )}

      {/* 消息列表 */}
      {(activeTab === 'inbox' || activeTab === 'sent') && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[calc(100vh-320px)] min-h-[400px]">
          {/* 消息列表 */}
          <div className="lg:col-span-1 space-y-2 overflow-y-auto pr-2">
            {(activeTab === 'inbox' ? inboxMessages : sentMessages).length === 0 ? (
              <div className="text-center py-8 text-gray-400">暂无消息</div>
            ) : (
              (activeTab === 'inbox' ? inboxMessages : sentMessages).map((m) => (
                <div
                  key={m.id}
                  onClick={() => toggleSelect(m.id)}
                  className={`p-3 rounded-xl border cursor-pointer transition ${
                    selectedId === m.id 
                      ? 'border-primary-500/50 bg-primary-500/10' 
                      : m.isRead 
                        ? 'border-[#1e2a45] hover:border-[#2a3a5a]' 
                        : 'border-blue-500/30 bg-blue-500/5'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        {!m.isRead && <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0"></span>}
                        <span className="text-white text-sm font-medium truncate">{m.subject}</span>
                      </div>
                      <p className="text-gray-400 text-xs truncate">{m.from}</p>
                      <p className="text-gray-500 text-xs">{new Date(m.createdAt).toLocaleString()}</p>
                    </div>
                    {m.replies && m.replies.length > 0 && (
                      <span className="text-xs text-gray-500 bg-[#0a0e1a] px-2 py-0.5 rounded-full flex-shrink-0">
                        {m.replies.length}
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* 消息详情 */}
          <div className="lg:col-span-2 bg-[#141b2d] border border-[#1e2a45] rounded-xl p-4 flex flex-col h-full">
            {selectedMessage ? (
              <>
                <div className="flex items-start justify-between border-b border-[#1e2a45] pb-3">
                  <div>
                    <h3 className="text-white font-semibold text-lg">{selectedMessage.subject}</h3>
                    <div className="flex items-center gap-3 mt-1 text-sm">
                      <span className="text-gray-400">发件人: <span className="text-white">{selectedMessage.from}</span></span>
                      <span className="text-gray-500">|</span>
                      <span className="text-gray-400">{new Date(selectedMessage.createdAt).toLocaleString()}</span>
                    </div>
                  </div>
                  <button onClick={() => deleteMessage(selectedMessage.id)} className="p-1 rounded hover:bg-red-500/10 text-gray-500 hover:text-red-400">
                    <Trash2 size={18} />
                  </button>
                </div>

                <div className="flex-1 py-3 overflow-y-auto">
                  <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">
                    {selectedMessage.content}
                  </p>

                  {/* 回复列表 */}
                  {selectedMessage.replies && selectedMessage.replies.length > 0 && (
                    <div className="mt-4 space-y-2 border-t border-[#1e2a45] pt-3">
                      <p className="text-xs text-gray-500 font-medium">📌 回复</p>
                      {selectedMessage.replies.map((reply) => (
                        <div key={reply.id} className="bg-[#0a0e1a] rounded-lg p-3">
                          <div className="flex items-center justify-between">
                            <span className="text-white text-sm font-medium">{reply.from}</span>
                            <span className="text-gray-500 text-xs">{new Date(reply.createdAt).toLocaleString()}</span>
                          </div>
                          <p className="text-gray-300 text-sm mt-1">{reply.content}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 回复框 */}
                <div className="border-t border-[#1e2a45] pt-3 mt-auto">
                  <div className="flex items-center gap-2">
                    <input
                      placeholder="输入回复内容..."
                      value={replyContent}
                      onChange={(e) => setReplyContent(e.target.value)}
                      className="flex-1 bg-[#0a0e1a] border border-[#1e2a45] rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
                      onKeyDown={(e) => e.key === 'Enter' && handleReply()}
                    />
                    <Button size="sm" onClick={handleReply}>
                      <Reply size={16} /> 回复
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
                选择一条消息查看详情
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
