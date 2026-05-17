import React from 'react';
import { Plus } from 'lucide-react';
import { Article } from '../../types/admin';

interface ContentTabProps {
    articles: Article[];
    events: any[];
    setShowArticleModal: (show: boolean) => void;
    handleDeleteArticle: (id: string) => void;
    handleUpdateEventStatus: (id: string, status: 'active' | 'rejected' | 'pending') => void;
}

const ContentTab: React.FC<ContentTabProps> = ({ articles, events, setShowArticleModal, handleDeleteArticle, handleUpdateEventStatus }) => {
    return (
        <div className="space-y-8">
            <header className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">إدارة المحتوى والفعاليات</h2>
                <button onClick={() => setShowArticleModal(true)} className="bg-fuchsia-600 text-white font-black px-6 py-3 rounded-2xl text-xs flex items-center gap-2"><Plus size={16} /> مقال جديد</button>
            </header>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-4">
                    <h3 className="text-xs font-bold text-white/20 uppercase tracking-widest px-2">آخر المقالات</h3>
                    {articles.length === 0 ? <p className="text-xs text-white/20 p-4">لا يوجد مقالات</p> : articles.map(article => (
                        <div key={article.id} className="bg-[#121214] p-4 rounded-3xl border border-white/5 flex gap-4 items-center group hover:border-red-500/20 transition-all">
                            <img src={article.image_url} className="w-16 h-16 rounded-xl object-cover bg-black flex-shrink-0" alt="" />
                            <div className="flex-1 min-w-0">
                                <h4 className="font-bold text-sm truncate">{article.title}</h4>
                                <p className="text-[10px] text-white/40">{article.category} | {new Date(article.created_at).toLocaleDateString('ar-EG')}</p>
                            </div>
                            <button
                                onClick={() => handleDeleteArticle(article.id)}
                                className="opacity-0 group-hover:opacity-100 transition-opacity px-3 py-2 bg-red-500/10 text-red-400 border border-red-500/20 rounded-xl text-[10px] font-bold hover:bg-red-500 hover:text-white flex-shrink-0"
                            >
                                حذف
                            </button>
                        </div>
                    ))}
                </div>
                <div className="space-y-4">
                    <h3 className="text-xs font-bold text-white/20 uppercase tracking-widest px-2">الفعاليات والطلبات الإعلانية</h3>
                    {events.length === 0 ? <p className="text-xs text-white/20 p-4">لا يوجد فعاليات معلقة</p> : events.map((event: any) => (
                        <div key={event.id} className="bg-[#121214] p-6 rounded-[32px] border border-white/5 space-y-4">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h4 className="font-bold text-sm">{event.title}</h4>
                                    <p className="text-[10px] text-white/40">الناشر: {event.tenant?.name}</p>
                                </div>
                                <span className={`text-[9px] font-bold px-2 py-1 rounded-lg ${
                                    event.status === 'active' ? 'bg-green-500/10 text-green-400' : 
                                    event.status === 'rejected' ? 'bg-red-500/10 text-red-400' : 
                                    'bg-amber-500/10 text-amber-400'
                                }`}>
                                    {event.status === 'active' ? 'نشط ومفعل' : 
                                     event.status === 'rejected' ? 'مرفوض' : 'في انتظار المراجعة'}
                                </span>
                            </div>
                            
                            <div className="flex gap-2">
                                {event.status !== 'active' && (
                                    <button 
                                        onClick={() => handleUpdateEventStatus(event.id, 'active')}
                                        className="flex-1 py-2 bg-green-500 text-black text-[10px] font-black rounded-xl hover:bg-green-400 transition-all"
                                    >
                                        تنشيط ونشر
                                    </button>
                                )}
                                {event.status === 'active' && (
                                    <button 
                                        onClick={() => handleUpdateEventStatus(event.id, 'pending')}
                                        className="flex-1 py-2 bg-white/5 text-white text-[10px] font-bold rounded-xl border border-white/10 hover:bg-white/10 transition-all"
                                    >
                                        تعطيل مؤقت
                                    </button>
                                )}
                                {event.status !== 'rejected' && (
                                    <button 
                                        onClick={() => handleUpdateEventStatus(event.id, 'rejected')}
                                        className="py-2 px-4 bg-red-500/10 text-red-400 text-[10px] font-bold rounded-xl border border-red-500/20 hover:bg-red-500 hover:text-white transition-all"
                                    >
                                        رفض نهائي
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ContentTab;
