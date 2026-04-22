import { Telegraf, Context } from 'telegraf';
import { analyzeHomework } from './services/geminiService';
import axios from 'axios';
import { load } from 'cheerio';

const token = process.env.TELEGRAM_BOT_TOKEN;

if (!token) {
  console.warn('TELEGRAM_BOT_TOKEN is not defined. Bot functionality will be disabled.');
}

export const bot = token ? new Telegraf(token) : null;

// In-memory sessions storage
const userSessions = new Map<number, { 
  state: 'START' | 'AWAIT_IDENTITY' | 'AWAIT_LINK',
  userData?: { name: string, surname: string, group: string },
  history: { status: string, time: string, score: number }[]
}>();

// In-memory stats storage
export const stats = {
  totalChecks: 0,
  passes: 0,
  fails: 0,
  lastFeedback: "",
  recentSubmissions: [] as any[] // Track last few submissions with user data
};

const teacherChatId = process.env.TEACHER_CHAT_ID;

async function getContentFromUrl(url: string): Promise<string | null> {
  try {
    const response = await axios.get(url, { 
      timeout: 10000, 
      headers: { 
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36' 
      } 
    });

    // Return the raw text content limited to 5000 characters as requested
    const data = typeof response.data === 'string' ? response.data : JSON.stringify(response.data);
    return data.substring(0, 5000);
  } catch (error) {
    console.error('Content extraction error:', error);
    return null;
  }
}

if (bot) {
  bot.start((ctx) => {
    const userId = ctx.from.id;
    // Reset session for this user but keep history if it exists
    const existing = userSessions.get(userId);
    userSessions.set(userId, { 
      state: 'AWAIT_IDENTITY', 
      history: existing?.history || [] 
    });
    
    ctx.reply(
      '<b>🎓 НИТУ МИСИС | AI-консультант SMM</b>\n\n' +
      'Привет! Я Ваш ИИ-помощник. 👋\n\n' +
      'Для начала работы, пожалуйста, представьтесь в формате:\n' +
      '<i>Имя Фамилия Группа</i>\n\n' +
      'Пример: <code>Иван Иванов СММ-23-1</code>',
      { parse_mode: 'HTML' }
    );
  });

  bot.command('reset', (ctx) => {
    const userId = ctx.from.id;
    userSessions.delete(userId);
    ctx.reply('<b>Данные сессии и истории очищены.</b> Введите /start, чтобы начать заново.', { parse_mode: 'HTML' });
  });

  bot.command('history', (ctx) => {
    const userId = ctx.from.id;
    const session = userSessions.get(userId);
    if (!session || !session.history || session.history.length === 0) {
      return ctx.reply('У вас пока нет истории проверок.');
    }

    let historyMsg = `<b>📜 Ваша история проверок:</b>\n\n`;
    session.history.forEach((h, i) => {
      historyMsg += `${i + 1}. ${h.time} — <b>${h.status}</b> (${h.score}/100)\n`;
    });
    ctx.reply(historyMsg, { parse_mode: 'HTML' });
  });

  bot.command('stats', (ctx) => {
    const userId = ctx.from.id;
    if (teacherChatId && String(userId) !== String(teacherChatId)) {
      return ctx.reply('У вас нет прав для просмотра статистики.');
    }

    let statsMsg = `<b>📊 Аналитика курса:</b>\n\n`;
    statsMsg += `Всего проверок: ${stats.totalChecks}\n`;
    statsMsg += `✅ Зачётов: ${stats.passes}\n`;
    statsMsg += `❌ Не зачётов: ${stats.fails}\n`;
    statsMsg += `📈 Коэффициент успеха: ${stats.totalChecks > 0 ? Math.round((stats.passes / stats.totalChecks) * 100) : 0}%`;
    ctx.reply(statsMsg, { parse_mode: 'HTML' });
  });

  bot.command('help', (ctx) => {
    ctx.reply(
      '<b>📖 Инструкция по использованию:</b>\n\n' +
      '1. Сначала представьтесь (Имя Фамилия Группа).\n' +
      '2. Отправьте ссылку на ваше ДЗ или отправьте текст задания напрямую.\n\n' +
      '✅ <b>Принимаем ссылки:</b> Google Docs, Figma, Telegra.ph, VK post, TG post.\n' +
      '🎨 <b>Критерии оценки:</b> Реакция, Креатив, Структура, SMM-соответствие, Грамотность.\n\n' +
      '🔧 <b>Команды:</b>\n' +
      '/history - история ваших проверок\n' +
      '/reset - сбросить профиль и историю\n' +
      '/start - начать заново',
      { parse_mode: 'HTML' }
    );
  });

  bot.on('text', async (ctx) => {
    const userId = ctx.from.id;
    const text = ctx.message.text;
    
    // Ignore other commands handled separately
    if (text.startsWith('/')) return;

    const session = userSessions.get(userId);

    if (!session || session.state === 'AWAIT_IDENTITY') {
      const parts = text.split(' ');
      if (parts.length < 3) {
        return ctx.reply('Пожалуйста, введите данные в формате: <b>Имя Фамилия Группа</b>', { parse_mode: 'HTML' });
      }

      const userData = {
        name: parts[0],
        surname: parts[1],
        group: parts.slice(2).join(' ')
      };

      const currentHistory = session?.history || [];
      userSessions.set(userId, { 
        state: 'AWAIT_LINK', 
        userData,
        history: currentHistory
      });

      return ctx.reply(
        `Приятно познакомиться, <b>${userData.name}</b>! 😊\n\n` +
        `Теперь отправьте ссылку на ваше ДЗ или текст задания.`,
        { parse_mode: 'HTML' }
      );
    }

    if (session.state === 'AWAIT_LINK') {
      const isUrl = text.startsWith('http://') || text.startsWith('https://');
      
      ctx.reply('🔍 <b>Анализирую задание...</b> Это займет около 10-20 секунд.', { parse_mode: 'HTML' });

      try {
        let contentToAnalyze = text;

        if (isUrl) {
          const extractedContent = await getContentFromUrl(text);
          if (extractedContent) {
            contentToAnalyze = `Проанализируй ДЗ:\n${extractedContent}`;
          } else {
            return ctx.reply(`Ссылка ${text} недоступна. Попросите студента прислать текст.`);
          }
        }

        const promptWithContext = `Студент: ${session.userData?.name} ${session.userData?.surname} (${session.userData?.group})\n\n${contentToAnalyze}`;
        
        let result;
        try {
          result = await analyzeHomework(promptWithContext);
        } catch (geminiError: any) {
          console.error('Gemini Error:', geminiError);
          const errorMsg = geminiError.message || 'неизвестная ошибка ИИ';
          return ctx.reply(`<b>⚠️ Ошибка анализа:</b> ${errorMsg}\n\nПопробуйте еще раз или пришлите текст задания напрямую.`, { parse_mode: 'HTML' });
        }

        // Update in-memory stats
        stats.totalChecks++;
        if (result.status === 'ЗАЧЁТ') stats.passes++;
        else stats.fails++;
        stats.lastFeedback = result.recommendation; // Store recommendation as feedback snippet
        
        // Update user history
        session.history.push({
          status: result.status,
          score: result.score,
          time: new Date().toLocaleDateString()
        });

        // Add to recent submissions
        stats.recentSubmissions.unshift({
          user: `${session.userData?.name} ${session.userData?.surname}`,
          group: session.userData?.group,
          status: result.status,
          time: new Date().toLocaleTimeString()
        });
        if (stats.recentSubmissions.length > 5) stats.recentSubmissions.pop();

        let responseMsg = `<b>🎓 НИТУ МИСИС | AI-консультант SMM</b>\n\n`;
        responseMsg += `👤 <i>${session.userData?.name} ${session.userData?.surname} (${session.userData?.group})</i>\n\n`;
        responseMsg += `📌 <b>Ссылка на ДЗ:</b> ${isUrl ? text : 'Текст задания'}\n\n`;
        
        responseMsg += `<b>✅ Сильные стороны:</b>\n${result.strengths.split(';').map((s: string) => `• ${s.trim()}`).join('\n')}\n\n`;
        responseMsg += `<b>⚠️ Что можно улучшить:</b>\n${result.improvements.split(';').map((s: string) => `• ${s.trim()}`).join('\n')}\n\n`;
        
        const statusEmoji = result.status === 'ЗАЧЁТ' ? '✅' : '❌';
        responseMsg += `${statusEmoji} <b>${result.status}</b> (${result.score}/100)\n\n`;
        responseMsg += `💡 <b>Рекомендация:</b> ${result.recommendation}`;

        ctx.reply(responseMsg, { parse_mode: 'HTML' });
        
        // Forward to teacher if configured
        if (teacherChatId) {
          bot.telegram.sendMessage(teacherChatId, `<b>📎 Копия разбора:</b>\n\n${responseMsg}`, { parse_mode: 'HTML' });
        }

        ctx.reply('Вы можете отправить новую ссылку для следующей проверки.');
      } catch (error) {
        console.error('Bot HW Error:', error);
        ctx.reply('Произошла ошибка при анализе. Попробуйте еще раз или пришлите текст задания напрямую.');
      }
    }
  });

  // Start polling in dev or use webhook in prod
  if (process.env.NODE_ENV !== 'production') {
    bot.launch();
    console.log('Telegram Bot started in polling mode');
  }
}

// Enable graceful stop
process.once('SIGINT', () => bot?.stop('SIGINT'));
process.once('SIGTERM', () => bot?.stop('SIGTERM'));
