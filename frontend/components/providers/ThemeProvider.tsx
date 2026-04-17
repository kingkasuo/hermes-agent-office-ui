'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

type Theme = 'light' | 'dark';
type Locale = 'en' | 'zh';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

interface I18nContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  toggleLocale: () => void;
  t: (key: string) => string;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);
const I18nContext = createContext<I18nContextType | undefined>(undefined);

// 翻译字典
const translations = {
  en: {
    'app.title': 'Hermes Agent Office',
    'app.subtitle': 'Pixel-style AI Agent Monitoring',
    'app.live': 'Live',
    'stats.online': 'Online',
    'stats.busy': 'Busy',
    'stats.idle': 'Idle',
    'stats.offline': 'Offline',
    'dashboard.officeFloor': 'Office Floor',
    'dashboard.recentActivity': 'Recent Activity',
    'dashboard.systemMetrics': 'System Metrics',
    'dashboard.taskDistribution': 'Task Distribution',
    'dashboard.liveStatistics': 'Live Statistics',
    'metrics.cpu': 'CPU Usage',
    'metrics.memory': 'Memory Usage',
    'metrics.apiCalls': 'API Calls',
    'metrics.totalCalls': 'Total API Calls',
    'tasks.completed': 'Completed',
    'tasks.pending': 'Pending',
    'tasks.running': 'Running',
    'tasks.failed': 'Failed',
    'activity.completed': 'completed',
    'activity.started': 'started',
    'activity.idle': 'is idle',
    'activity.error': 'error',
    'activity.wentOffline': 'went offline',
    'settings.theme': 'Theme',
    'settings.language': 'Language',
    'settings.light': 'Light',
    'settings.dark': 'Dark',
  },
  zh: {
    'app.title': 'Hermes 智能体办公室',
    'app.subtitle': '像素风格 AI 智能体监控系统',
    'app.live': '实时',
    'stats.online': '在线',
    'stats.busy': '忙碌',
    'stats.idle': '空闲',
    'stats.offline': '离线',
    'dashboard.officeFloor': '办公区域',
    'dashboard.recentActivity': '最近活动',
    'dashboard.systemMetrics': '系统指标',
    'dashboard.taskDistribution': '任务分布',
    'dashboard.liveStatistics': '实时统计',
    'metrics.cpu': 'CPU 使用率',
    'metrics.memory': '内存使用率',
    'metrics.apiCalls': 'API 调用',
    'metrics.totalCalls': '总 API 调用',
    'tasks.completed': '已完成',
    'tasks.pending': '待处理',
    'tasks.running': '执行中',
    'tasks.failed': '失败',
    'activity.completed': '完成',
    'activity.started': '开始',
    'activity.idle': '空闲',
    'activity.error': '错误',
    'activity.wentOffline': '离线',
    'settings.theme': '主题',
    'settings.language': '语言',
    'settings.light': '浅色',
    'settings.dark': '深色',
  },
};

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>('dark');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('theme') as Theme;
    if (saved) {
      setTheme(saved);
    } else if (window.matchMedia('(prefers-color-scheme: light)').matches) {
      setTheme('light');
    }
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      localStorage.setItem('theme', theme);
      document.documentElement.setAttribute('data-theme', theme);
    }
  }, [theme, mounted]);

  const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark');

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>('zh');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('locale') as Locale;
    if (saved) {
      setLocale(saved);
    } else if (navigator.language.startsWith('zh')) {
      setLocale('zh');
    } else {
      setLocale('en');
    }
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      localStorage.setItem('locale', locale);
      document.documentElement.setAttribute('lang', locale);
    }
  }, [locale, mounted]);

  const toggleLocale = () => setLocale(locale === 'en' ? 'zh' : 'en');
  const t = (key: string): string => {
    return translations[locale][key as keyof typeof translations['en']] || key;
  };

  return (
    <I18nContext.Provider value={{ locale, setLocale, toggleLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within I18nProvider');
  }
  return context;
}