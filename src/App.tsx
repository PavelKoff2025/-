import React, { useState, useEffect } from "react";
import { 
  Bot, 
  CheckCircle2, 
  XCircle, 
  BookOpen, 
  ShieldCheck, 
  MessageSquare, 
  ExternalLink,
  Info,
  Clock,
  Sparkles,
  School
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function App() {
  const [status, setStatus] = useState({ 
    botActive: false, 
    geminiActive: false, 
    stats: { 
      totalChecks: 0, 
      passes: 0, 
      fails: 0, 
      lastFeedback: "",
      recentSubmissions: [] as { user: string, group: string, status: string, time: string }[]
    } 
  });
  const [loading, setLoading] = useState(true);

  const fetchStatus = () => {
    fetch("/api/status")
      .then(res => res.json())
      .then(data => {
        setStatus(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Status fetch error:", err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 5000); // Poll for stats
    return () => clearInterval(interval);
  }, []);

  const [showConfig, setShowConfig] = useState(false);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header - MISIS Style */}
      <header className="bg-misis-blue text-white px-6 h-[70px] flex items-center justify-between border-b-4 border-misis-red shadow-lg z-50">
        <div className="text-xl font-black tracking-tighter uppercase">
          НИТУ <span className="text-misis-red">МИСИС</span>
        </div>
        <div className="flex items-center gap-6">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setShowConfig(true)}
            className="rounded-none border-white/20 bg-white/10 text-white hover:bg-white/20 text-[10px] font-bold uppercase tracking-widest hidden sm:flex"
          >
            Настройка Ключей
          </Button>
          <div className="text-right">
            <div className="text-[10px] opacity-70 uppercase font-bold">Курс: Взаимодействие с соцсетями</div>
            <div className="font-bold text-sm">AI-Консультант ДЗ</div>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {showConfig && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-misis-blue/80 backdrop-blur-sm p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white max-w-2xl w-full shadow-2xl border-4 border-misis-red flex flex-col"
            >
              <div className="bg-misis-blue p-6 text-white flex justify-between items-center">
                <h3 className="text-xl font-black uppercase tracking-tighter">Конфигурация Системы</h3>
                <button onClick={() => setShowConfig(false)} className="hover:rotate-90 transition-transform">
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
              
              <div className="p-8 space-y-6">
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-misis-blue text-white flex items-center justify-center font-bold shrink-0">1</div>
                    <div>
                      <p className="font-bold text-misis-blue text-sm uppercase">Где вводить ключи?</p>
                      <p className="text-xs text-slate-500 mt-1">
                        В боковой панели Google AI Studio (слева или сверху) найдите кнопку <b>Settings (Settings &gt; Secrets)</b>.
                      </p>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50 border border-slate-200">
                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-3">Необходимые секреты:</p>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center bg-white p-2 border border-slate-100">
                        <code className="text-xs font-bold text-blue-600">TELEGRAM_BOT_TOKEN</code>
                        <span className="text-[10px] text-slate-400">от @BotFather</span>
                      </div>
                      <div className="flex justify-between items-center bg-white p-2 border border-slate-100">
                        <code className="text-xs font-bold text-indigo-600">GEMINI_API_KEY</code>
                        <span className="text-[10px] text-slate-400">от aistudio.google.com</span>
                      </div>
                      <div className="flex justify-between items-center bg-white p-2 border border-slate-100">
                        <code className="text-xs font-bold text-misis-red">TEACHER_CHAT_ID</code>
                        <span className="text-[10px] text-slate-400">от @userinfobot</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-misis-accent text-white flex items-center justify-center font-bold shrink-0">2</div>
                    <div>
                      <p className="font-bold text-misis-accent text-sm uppercase">Что делать дальше?</p>
                      <p className="text-xs text-slate-500 mt-1">
                        После сохранения секретов приложение перезапустится. Статусы на главной панели станут ярко-зелеными, и бот начнет отвечать.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-100">
                  <Button 
                    className="w-full bg-misis-blue rounded-none uppercase font-bold tracking-widest text-[10px]"
                    onClick={() => setShowConfig(false)}
                  >
                    Всё понятно, закрыть
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <main className="flex-1 grid grid-cols-1 lg:grid-cols-[300px_1fr] bg-slate-200 gap-[1px]">
        {/* Sidebar */}
        <aside className="bg-white p-6 flex flex-col gap-6 overflow-y-auto border-r border-slate-200">
          <div className="geometric-card">
            <div className="status-badge">Система</div>
            <div className="font-bold text-lg text-misis-blue">Status: ONLINE</div>
            <div className="text-[11px] text-slate-500 mt-1 uppercase font-bold tracking-tighter">Monitoring Active</div>
          </div>

          <div className="flex flex-col gap-4">
            <div className="text-[11px] uppercase text-slate-400 font-black tracking-wider">Инструкция</div>
            
            <div className="space-y-4">
              <div className="text-xs border-l-2 border-misis-blue pl-4 py-2 text-slate-600 bg-slate-50/50">
                <p className="font-bold text-misis-blue uppercase mb-1">Для студентов:</p>
                Команда <b>/start</b> для регистрации. Отправьте ссылку (Google Docs, Figma, VK) или текст ДЗ сообщением.
              </div>
              
              <div className="text-xs border-l-2 border-misis-red pl-4 py-2 text-slate-600 bg-slate-50/50">
                <p className="font-bold text-misis-red uppercase mb-1">Для преподавателей:</p>
                Установите <b>TEACHER_CHAT_ID</b> в Secrets, чтобы получать отчеты. Узнать свой ID можно через <code>@userinfobot</code>.
              </div>

              <div className="flex flex-col gap-1 px-1">
                <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold uppercase transition-colors hover:text-misis-blue cursor-pointer">
                  <Info className="w-3 h-3" />
                  <span>Помощь: /help</span>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold uppercase transition-colors hover:text-misis-blue cursor-pointer">
                  <Clock className="w-3 h-3" />
                  <span>История: /history</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 flex-1 overflow-hidden">
            <div className="text-[11px] uppercase text-slate-400 font-black tracking-wider">История активности</div>
            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 pr-1">
              {status.stats.recentSubmissions && status.stats.recentSubmissions.length > 0 ? (
                status.stats.recentSubmissions.map((sub, i) => (
                  <div key={i} className="p-3 bg-slate-50 border-l-2 border-misis-blue flex flex-col gap-1 hover:bg-slate-100 transition-colors">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-xs uppercase text-slate-700 truncate max-w-[150px]">{sub.user}</span>
                      <span className={`text-[9px] font-black ${sub.status === 'ЗАЧЁТ' ? 'text-misis-green' : 'text-misis-red'}`}>{sub.status}</span>
                    </div>
                    <div className="text-[10px] text-slate-400">{sub.group} • {sub.time}</div>
                  </div>
                ))
              ) : (
                <div className="text-xs text-slate-400 italic text-center py-10 px-4">Ожидание активности студентов...</div>
              )}
            </div>
          </div>
        </aside>

        {/* Content Area */}
        <div className="bg-white p-8 flex flex-col gap-8 overflow-y-auto">
          {/* Top Info Bar */}
          <section className="grid grid-cols-1 md:grid-cols-3 bg-slate-200 gap-[1px]">
            <div className="stat-box">
              <div className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-1">Проверки</div>
              <div className="text-3xl font-black text-misis-blue tabular-nums tracking-tighter">{status.stats.totalChecks}</div>
            </div>
            <div className="stat-box">
              <div className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-1">Зачёты</div>
              <div className="text-3xl font-black text-misis-green tabular-nums tracking-tighter">{status.stats.passes}</div>
            </div>
            <div className="stat-box">
              <div className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-1">Доступность API</div>
              <div className={`text-xl font-black tracking-tighter pt-1 ${status.geminiActive ? 'text-misis-green' : 'text-misis-red'}`}>
                {status.geminiActive ? 'ACTIVE' : 'OFFLINE'}
              </div>
            </div>
          </section>

          {/* Main Content Grid */}
          <section className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            <div className="geometric-card min-h-[300px] flex flex-col">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-2 h-2 rounded-full bg-indigo-500" />
                <div className="font-black text-[10px] uppercase tracking-widest text-indigo-500">Google Gemini API Analysis</div>
              </div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight leading-none mb-6">Проверка курсовых работ и ДЗ</h2>
              
              <div className="flex-1 space-y-4">
                <div className="p-4 bg-slate-50 border border-slate-100 text-sm leading-relaxed text-slate-600 italic">
                  {status.stats.lastFeedback ? (
                    <div className="flex flex-col gap-3">
                      <div className="font-bold text-xs uppercase text-slate-400 not-italic">Последний разбор:</div>
                      "{status.stats.lastFeedback}"
                    </div>
                  ) : (
                    "Бот готов к анализу. Ожидайте поступления работ от студентов курса в Telegram."
                  )}
                </div>
              </div>
              
              <div className="mt-6 pt-6 border-t border-slate-100 flex items-center justify-between">
                <div className="flex gap-4">
                   <div className="text-center">
                    <div className="text-[9px] font-black text-slate-300 uppercase">Latency</div>
                    <div className="text-xs font-bold">1.4s avg</div>
                   </div>
                   <div className="text-center border-l border-slate-100 pl-4">
                    <div className="text-[9px] font-black text-slate-300 uppercase">Engine</div>
                    <div className="text-xs font-bold text-indigo-500">FLASH-3.0</div>
                   </div>
                </div>
                {!status.botActive && (
                  <Badge variant="destructive" className="rounded-none bg-misis-red px-4 uppercase font-bold tracking-widest text-[10px]">
                    Configure Token!
                  </Badge>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-8">
              <div className="geometric-card bg-slate-50/50 flex-1 flex flex-col justify-center items-center text-center p-12">
                <div className="status-badge bg-misis-green">Контроль качества</div>
                <div className="text-xs text-slate-400 uppercase font-bold tracking-widest mb-2">Общая оценка группы</div>
                <div className="text-6xl font-black text-misis-blue tracking-tighter">
                  {status.stats.totalChecks > 0 ? Math.round((status.stats.passes / status.stats.totalChecks) * 100) : 0}%
                </div>
                <div className="text-[10px] text-slate-400 font-bold uppercase mt-2">Коэффициент успеха</div>
              </div>
              
              <div className="geometric-card border-none p-0 overflow-hidden group">
                <div className="bg-misis-blue text-white p-6 transition-all group-hover:bg-blue-800 cursor-pointer flex flex-col gap-1">
                  <div className="flex justify-between items-center font-bold text-xs uppercase tracking-widest opacity-70">
                    <span>Telegram BOT UI</span>
                    <ExternalLink className="w-4 h-4" />
                  </div>
                  <div className="text-xl font-black uppercase tracking-tighter">Запустить проверку</div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="h-[40px] bg-white border-t border-slate-200 px-6 flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider">
        <div>&copy; 2026 НИТУ МИСИС | Кафедра социальных наук</div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-misis-green shadow-[0_0_10px_rgba(5,150,105,0.5)]" />
          Powered by Google Gemini API
        </div>
      </footer>
    </div>
  );
}
