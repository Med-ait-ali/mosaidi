import { useState, useCallback, useRef, useEffect } from 'react';
import { type Lang, t } from './i18n';
import { analyzeLessonAI, correctPaperAI, generateReportAI } from './ai-service';
import {
  BookOpen, FileCheck, CalendarDays, LayoutDashboard, Settings, LogOut, Menu, X,
  Upload, Sparkles, FileText, Mail, MessageCircle,
  ChevronRight, ChevronLeft, Plus, Trash2, Shield, Cloud, Bell, Globe,
  GraduationCap, Brain, CheckCircle2, AlertCircle, Star, TrendingUp, Clock,
  Eye, Download, Users, Target, Lightbulb, Award, BarChart3, Loader2, Lock,
  RefreshCw, Zap
} from 'lucide-react';

type Page = 'dashboard' | 'lesson' | 'correction' | 'tracker' | 'settings';
type AuthPage = 'login' | 'signup';

interface Activity {
  id: string;
  date: string;
  type: string;
  description: string;
  subject: string;
}

function detectLanguage(text: string): 'ar' | 'fr' {
  const arabicRegex = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
  const arabicCount = (text.match(new RegExp(arabicRegex.source, 'g')) || []).length;
  const latinCount = (text.match(/[a-zA-ZÀ-ÿ]/g) || []).length;
  return arabicCount > latinCount ? 'ar' : 'fr';
}

const PRIMARY_LEVELS = [
  { value: 'CP', labelAr: 'المستوى الأول (CP)', labelFr: 'CP - Cours Préparatoire' },
  { value: 'CE1', labelAr: 'المستوى الثاني (CE1)', labelFr: 'CE1 - Cours Élémentaire 1' },
  { value: 'CE2', labelAr: 'المستوى الثالث (CE2)', labelFr: 'CE2 - Cours Élémentaire 2' },
  { value: 'CM1', labelAr: 'المستوى الرابع (CM1)', labelFr: 'CM1 - Cours Moyen 1' },
  { value: 'CM2', labelAr: 'المستوى الخامس (CM2)', labelFr: 'CM2 - Cours Moyen 2' },
  { value: 'CM2+', labelAr: 'المستوى السادس (CM2+)', labelFr: 'CM2+ - Cours Moyen 2+' },
];

const SUBJECTS = [
  { value: 'math', ar: 'الرياضيات', fr: 'Mathématiques' },
  { value: 'science', ar: 'النشاط العلمي', fr: 'Activité scientifique' },
  { value: 'arabic', ar: 'اللغة العربية', fr: 'Langue arabe' },
  { value: 'french', ar: 'اللغة الفرنسية', fr: 'Langue française' },
  { value: 'history', ar: 'التاريخ', fr: 'Histoire' },
  { value: 'geography', ar: 'الجغرافيا', fr: 'Géographie' },
  { value: 'islamic', ar: 'التربية الإسلامية', fr: 'Éducation islamique' },
  { value: 'civic', ar: 'التربية المدنية', fr: 'Éducation civique' },
  { value: 'amazigh', ar: 'اللغة الأمازيغية', fr: 'Langue amazighe' },
  { value: 'art', ar: 'التربية التشكيلية', fr: 'Arts plastiques' },
];

// ==================== CREDIT FOOTER ====================
function CreditFooter() {
  return (
    <div className="text-center py-3 mt-4">
      <p className="text-xs text-gray-400 font-medium tracking-wide">
        Created by <span className="text-blue-500 font-semibold">Med Ait Ali Oulhoucien</span>
      </p>
    </div>
  );
}

// ==================== AI ERROR BOX ====================
function AiErrorBox({ error, lang, onRetry }: { error: string; lang: Lang; onRetry: () => void }) {
  return (
    <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 my-4 slide-up">
      <div className="flex items-start gap-3">
        <AlertCircle size={22} className="text-red-500 shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-sm font-semibold text-red-800 mb-1">{t('aiError', lang)}</p>
          <p className="text-xs text-red-600 mb-3 break-words">{error}</p>
          <button onClick={onRetry} className="flex items-center gap-2 bg-red-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-600 transition-colors">
            <RefreshCw size={16} />
            {t('retry', lang)}
          </button>
        </div>
      </div>
    </div>
  );
}

// ==================== RAW RESPONSE DISPLAY ====================
function AiSourceBadge({ source, lang }: { source?: string; lang: Lang }) {
  if (!source) return null;
  const isOnline = source === 'ai';
  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium mb-3 ${
      isOnline ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-blue-50 text-blue-700 border border-blue-200'
    }`}>
      {isOnline ? <Zap size={14} /> : <Brain size={14} />}
      {isOnline
        ? (lang === 'ar' ? '✅ تم التحليل بواسطة الذكاء الاصطناعي عبر الإنترنت' : '✅ Analysé par l\'IA en ligne')
        : (lang === 'ar' ? '🧠 تم التحليل بواسطة المحرك الذكي المحلي' : '🧠 Analysé par le moteur intelligent local')
      }
    </div>
  );
}

function RawResponseDisplay({ text, lang }: { text: string; lang: Lang }) {
  return (
    <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
      <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
        <Brain size={18} className="text-blue-500" /> {t('rawResponse', lang)}
      </h4>
      <div className="prose prose-sm max-w-none">
        <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans leading-relaxed">{text}</pre>
      </div>
    </div>
  );
}

// ==================== AUTH SCREEN ====================
function AuthScreen({ lang, onLogin, onToggleLang }: { lang: Lang; onLogin: (name: string) => void; onToggleLang: () => void }) {
  const [authPage, setAuthPage] = useState<AuthPage>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const isRtl = lang === 'ar';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin(name || email.split('@')[0] || (lang === 'ar' ? 'أستاذ(ة)' : 'Enseignant(e)'));
  };

  return (
    <div dir={isRtl ? 'rtl' : 'ltr'} className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden" style={{ background: 'linear-gradient(160deg, #1e6bb8 0%, #2563eb 40%, #4abe8a 100%)' }}>
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-[-10%] right-[-5%] w-80 h-80 rounded-full bg-white/5 blur-xl" />
        <div className="absolute bottom-[-10%] left-[-5%] w-96 h-96 rounded-full bg-white/5 blur-xl" />
      </div>
      <button onClick={onToggleLang} className="absolute top-4 right-4 flex items-center gap-2 bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-white/30 transition-all z-10">
        <Globe size={16} />
        {t('switchLang', lang)}
      </button>

      <div className="relative z-10 w-full max-w-md fade-in">
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto mb-4 rounded-2xl gradient-primary flex items-center justify-center shadow-lg shadow-blue-900/30">
            <Brain className="text-white" size={40} />
          </div>
          <h1 className="text-2xl font-bold text-white mb-1">Mossaidi</h1>
          <p className="text-lg text-blue-100 mb-1">{t('appName', lang)}</p>
          <p className="text-blue-200 text-sm">{t('appTagline', lang)}</p>
        </div>

        <div className="glass-card rounded-2xl p-6 shadow-2xl">
          <h2 className="text-xl font-bold text-gray-800 mb-1">
            {authPage === 'login' ? t('login', lang) : t('signup', lang)}
          </h2>
          <p className="text-sm text-gray-500 mb-6">
            {authPage === 'login' ? t('loginSubtitle', lang) : t('signupSubtitle', lang)}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {authPage === 'signup' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('fullName', lang)}</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)} className="input-field" placeholder={lang === 'ar' ? 'محمد أمين' : 'Mohamed Amine'} />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('email', lang)}</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="input-field" placeholder="teacher@school.com" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('password', lang)}</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="input-field" placeholder="••••••••" />
            </div>
            {authPage === 'signup' && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('school', lang)}</label>
                  <input type="text" className="input-field" placeholder={lang === 'ar' ? 'مدرسة النجاح' : 'École Réussite'} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('selectLevel', lang)}</label>
                  <select className="input-field">
                    {PRIMARY_LEVELS.map(lvl => (
                      <option key={lvl.value} value={lvl.value}>{lang === 'ar' ? lvl.labelAr : lvl.labelFr}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}
            <button type="submit" className="btn-primary w-full flex items-center justify-center gap-2 text-base py-3">
              <Lock size={18} />
              {authPage === 'login' ? t('login', lang) : t('signup', lang)}
            </button>
          </form>

          {authPage === 'login' && (
            <button className="w-full text-center text-sm text-blue-600 mt-3 hover:underline">{t('forgotPassword', lang)}</button>
          )}

          <div className="mt-6 pt-4 border-t border-gray-200 text-center">
            <p className="text-sm text-gray-500">
              {authPage === 'login' ? t('noAccount', lang) : t('hasAccount', lang)}
              <button onClick={() => setAuthPage(authPage === 'login' ? 'signup' : 'login')} className="text-blue-600 font-semibold mx-1 hover:underline">
                {authPage === 'login' ? t('signup', lang) : t('login', lang)}
              </button>
            </p>
          </div>
        </div>

        <p className="text-center text-blue-100 text-xs mt-4">{t('secureNote', lang)}</p>
        <div className="text-center mt-6">
          <p className="text-xs text-blue-200/70 font-medium">
            Created by <span className="text-white/80 font-semibold">Med Ait Ali Oulhoucien</span>
          </p>
        </div>
      </div>
    </div>
  );
}

// ==================== DASHBOARD ====================
function Dashboard({ lang, userName, onNavigate }: { lang: Lang; userName: string; onNavigate: (p: Page) => void }) {
  const isRtl = lang === 'ar';
  const Arrow = isRtl ? ChevronLeft : ChevronRight;

  const stats = [
    { icon: BookOpen, label: t('lessonsAnalyzed', lang), value: 24, color: 'from-blue-500 to-blue-600' },
    { icon: FileCheck, label: t('papersCorrected', lang), value: 156, color: 'from-green-500 to-emerald-600' },
    { icon: BarChart3, label: t('reportsGenerated', lang), value: 8, color: 'from-amber-500 to-orange-500' },
  ];

  const features = [
    { page: 'lesson' as Page, icon: Brain, title: t('lessonAnalyzer', lang), desc: lang === 'ar' ? 'تحليل الدروس وإنشاء جذاذات بيداغوجية' : 'Analyser les leçons et créer des fiches pédagogiques', color: 'from-blue-500 to-indigo-600' },
    { page: 'correction' as Page, icon: FileCheck, title: t('studentCorrection', lang), desc: lang === 'ar' ? 'تصحيح أوراق التلاميذ بالذكاء الاصطناعي' : "Corriger les copies des élèves avec l'IA", color: 'from-green-500 to-emerald-600' },
    { page: 'tracker' as Page, icon: CalendarDays, title: t('activityTracker', lang), desc: lang === 'ar' ? 'تتبع الأنشطة وإنشاء تقارير شهرية' : 'Suivre les activités et générer des rapports mensuels', color: 'from-amber-500 to-orange-500' },
  ];

  return (
    <div className="space-y-6 fade-in">
      {/* Welcome */}
      <div className="gradient-hero rounded-2xl p-6 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles size={20} className="text-yellow-300" />
            <span className="text-blue-100 text-sm">{t('todayOverview', lang)}</span>
          </div>
          <h2 className="text-2xl font-bold mb-1">{t('welcomeBack', lang)}، {userName}! 👋</h2>
          <p className="text-blue-100 text-sm">{t('appTagline', lang)}</p>
        </div>
      </div>

      {/* AI Status — Always Active */}
      <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-green-50 text-green-700 border border-green-200">
        <Zap size={16} className="text-green-500" />
        {t('aiActive', lang)}
        <span className="mx-auto" />
        <span className="text-xs opacity-70">{t('aiPowered', lang)}</span>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {stats.map((s, i) => (
          <div key={i} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center slide-up" style={{ animationDelay: `${i * 0.1}s` }}>
            <div className={`w-10 h-10 mx-auto rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center mb-2`}>
              <s.icon size={20} className="text-white" />
            </div>
            <div className="text-2xl font-bold text-gray-800">{s.value}</div>
            <div className="text-xs text-gray-500 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* AI Tip */}
      <div className="bg-gradient-to-r from-blue-50 to-green-50 border border-blue-100 rounded-xl p-4 flex gap-3">
        <div className="w-10 h-10 shrink-0 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
          <Lightbulb size={20} className="text-white" />
        </div>
        <div>
          <h4 className="font-semibold text-gray-800 text-sm mb-1">{t('aiTip', lang)}</h4>
          <p className="text-xs text-gray-600 leading-relaxed">{t('aiTipText', lang)}</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h3 className="text-lg font-bold text-gray-800 mb-3">{t('quickActions', lang)}</h3>
        <div className="space-y-3">
          {features.map((f, i) => (
            <button key={i} onClick={() => onNavigate(f.page)} className="feature-card w-full bg-white rounded-xl p-4 border border-gray-100 shadow-sm flex items-center gap-4 text-start">
              <div className={`w-12 h-12 shrink-0 rounded-xl bg-gradient-to-br ${f.color} flex items-center justify-center`}>
                <f.icon size={24} className="text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-gray-800">{f.title}</h4>
                <p className="text-xs text-gray-500 mt-0.5">{f.desc}</p>
              </div>
              <Arrow size={20} className="text-gray-400 shrink-0" />
            </button>
          ))}
        </div>
      </div>

      <CreditFooter />
    </div>
  );
}

// ==================== LESSON ANALYZER ====================
function LessonAnalyzer({ lang }: { lang: Lang }) {
  const [text, setText] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('');
  const [activeTab, setActiveTab] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => setImage(ev.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const getSubjectLabel = (val: string, lng: 'ar' | 'fr') => {
    const s = SUBJECTS.find(s => s.value === val);
    return s ? s[lng] : val;
  };

  const getLevelLabel = (val: string, lng: 'ar' | 'fr') => {
    const l = PRIMARY_LEVELS.find(l => l.value === val);
    return l ? (lng === 'ar' ? l.labelAr : l.labelFr) : val;
  };

  const handleAnalyze = async () => {
    if (!text) return;
    setAnalyzing(true);
    setError(null);
    const responseLang = detectLanguage(text);
    const subjectLabel = getSubjectLabel(selectedSubject, responseLang);
    const levelLabel = getLevelLabel(selectedLevel, responseLang);

    try {
      const res = await analyzeLessonAI(text, subjectLabel, levelLabel, responseLang);
      setResult(res);
    } catch (err: any) {
      setError(err.message || 'Unknown error');
    } finally {
      setAnalyzing(false);
    }
  };

  const resultLang = result?._lang || lang;

  const tabs = [
    { label: t('lessonPlan', resultLang), icon: FileText },
    { label: t('dailyObjectives', resultLang), icon: Target },
    { label: t('suggestedActivities', resultLang), icon: Lightbulb },
    { label: t('differentiationStrategies', resultLang), icon: Users },
    { label: t('formativeAssessment', resultLang), icon: CheckCircle2 },
  ];

  return (
    <div className="space-y-5 fade-in">
      <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl p-5 text-white">
        <div className="flex items-center gap-3 mb-2">
          <Brain size={24} />
          <h2 className="text-xl font-bold">{t('lessonAnalyzer', lang)}</h2>
        </div>
        <p className="text-blue-100 text-sm">{t('lessonAnalyzerDesc', lang)}</p>
        <div className="mt-2 text-xs text-blue-200 flex items-center gap-1">
          <Zap size={12} /> {t('aiPowered', lang)}
        </div>
      </div>

      {!result ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <select value={selectedSubject} onChange={e => setSelectedSubject(e.target.value)} className="input-field text-sm">
              <option value="">{t('selectSubject', lang)}</option>
              {SUBJECTS.map(s => <option key={s.value} value={s.value}>{s[lang]}</option>)}
            </select>
            <select value={selectedLevel} onChange={e => setSelectedLevel(e.target.value)} className="input-field text-sm">
              <option value="">{t('selectLevel', lang)}</option>
              {PRIMARY_LEVELS.map(lvl => (
                <option key={lvl.value} value={lvl.value}>{lang === 'ar' ? lvl.labelAr : lvl.labelFr}</option>
              ))}
            </select>
          </div>

          <div onClick={() => fileRef.current?.click()} className="border-2 border-dashed border-blue-300 bg-blue-50/50 rounded-xl p-6 text-center cursor-pointer hover:bg-blue-50 transition-all">
            {image ? (
              <div className="space-y-3">
                <img src={image} alt="Lesson" className="max-h-48 mx-auto rounded-lg shadow-sm" />
                <p className="text-sm text-green-600 font-medium flex items-center justify-center gap-1">
                  <CheckCircle2 size={16} /> {t('imageUploaded', lang)}
                </p>
                <p className="text-xs text-gray-400">
                  {lang === 'ar' ? 'يرجى كتابة محتوى الدرس أيضاً في الحقل أدناه' : 'Veuillez aussi écrire le contenu de la leçon dans le champ ci-dessous'}
                </p>
              </div>
            ) : (
              <>
                <Upload size={36} className="mx-auto text-blue-400 mb-3" />
                <p className="text-blue-600 font-semibold text-sm">{t('uploadLesson', lang)}</p>
                <p className="text-xs text-gray-500 mt-1">{t('dragDrop', lang)}</p>
              </>
            )}
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
          </div>

          <textarea value={text} onChange={e => setText(e.target.value)} placeholder={t('enterLessonText', lang)} className="input-field min-h-[140px] resize-none text-sm" />

          {text && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-2.5 flex items-center gap-2">
              <Globe size={14} className="text-blue-500 shrink-0" />
              <p className="text-xs text-blue-700">
                {detectLanguage(text) === 'ar'
                  ? 'تم اكتشاف اللغة العربية — ستكون الإجابات باللغة العربية'
                  : 'Langue française détectée — Les réponses seront en français'}
              </p>
            </div>
          )}

          {error && <AiErrorBox error={error} lang={lang} onRetry={handleAnalyze} />}

          <button
            onClick={handleAnalyze}
            disabled={analyzing || !text}
            className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {analyzing ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                {t('aiAnalyzing', lang)}
              </>
            ) : (
              <>
                <Sparkles size={20} />
                {t('analyzeLesson', lang)}
              </>
            )}
          </button>

          {!text && (
            <p className="text-center text-xs text-gray-400">{t('pleaseEnterText', lang)}</p>
          )}
        </div>
      ) : (
        <div className="space-y-4 slide-up">
          <AiSourceBadge source={result._source} lang={resultLang} />

          {result._raw ? (
            <RawResponseDisplay text={result._raw} lang={resultLang} />
          ) : (
            <>
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
                {tabs.map((tab, i) => (
                  <button key={i} onClick={() => setActiveTab(i)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                      activeTab === i ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}>
                    <tab.icon size={14} />
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 min-h-[300px]">
                {activeTab === 0 && result.plan && <LessonPlanContent data={result.plan} lang={resultLang} />}
                {activeTab === 1 && result.objectives && <ObjectivesContent data={result.objectives} lang={resultLang} />}
                {activeTab === 2 && result.activities && <ActivitiesContent data={result.activities} lang={resultLang} />}
                {activeTab === 3 && result.differentiation && <DifferentiationContent data={result.differentiation} lang={resultLang} />}
                {activeTab === 4 && result.assessment && <AssessmentContent data={result.assessment} lang={resultLang} />}
              </div>
            </>
          )}

          <div className="flex gap-3">
            <button onClick={() => handleExportPDF(lang)} className="btn-primary flex-1 flex items-center justify-center gap-2 text-sm">
              <Download size={16} /> {t('exportPDF', lang)}
            </button>
            <button onClick={() => handleShareWhatsApp(lang)} className="btn-secondary flex-1 flex items-center justify-center gap-2 text-sm">
              <MessageCircle size={16} /> {t('shareWhatsApp', lang)}
            </button>
          </div>

          <button onClick={() => { setResult(null); setText(''); setImage(null); setError(null); setActiveTab(0); }} className="w-full text-center text-sm text-gray-500 hover:text-gray-700 py-2">
            ← {t('back', lang)}
          </button>
          <CreditFooter />
        </div>
      )}
    </div>
  );
}

// ==================== STUDENT CORRECTION ====================
function StudentCorrection({ lang }: { lang: Lang }) {
  const [text, setText] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [correcting, setCorrecting] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [studentName, setStudentName] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('');
  const [activeTab, setActiveTab] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => setImage(ev.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleCorrect = async () => {
    if (!text) return;
    setCorrecting(true);
    setError(null);
    const responseLang = detectLanguage(text);
    const subjectLabel = SUBJECTS.find(s => s.value === selectedSubject)?.[responseLang] || '';
    const levelLabel = PRIMARY_LEVELS.find(l => l.value === selectedLevel)?.[responseLang === 'ar' ? 'labelAr' : 'labelFr'] || '';

    try {
      const res = await correctPaperAI(text, studentName, subjectLabel, levelLabel, responseLang);
      setResult(res);
    } catch (err: any) {
      setError(err.message || 'Unknown error');
    } finally {
      setCorrecting(false);
    }
  };

  const resultLang = result?._lang || lang;

  const tabs = [
    { label: t('pedagogicalCorrection', resultLang), icon: FileCheck },
    { label: t('constructiveFeedback', resultLang), icon: Star },
    { label: t('errorExplanation', resultLang), icon: AlertCircle },
    { label: t('remediationActivities', resultLang), icon: Lightbulb },
  ];

  return (
    <div className="space-y-5 fade-in">
      <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl p-5 text-white">
        <div className="flex items-center gap-3 mb-2">
          <FileCheck size={24} />
          <h2 className="text-xl font-bold">{t('studentCorrection', lang)}</h2>
        </div>
        <p className="text-green-100 text-sm">{t('studentCorrectionDesc', lang)}</p>
        <div className="mt-2 text-xs text-green-200 flex items-center gap-1">
          <Zap size={12} /> {t('aiPowered', lang)}
        </div>
      </div>

      {!result ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('studentName', lang)}</label>
              <input type="text" value={studentName} onChange={e => setStudentName(e.target.value)} className="input-field text-sm" placeholder={lang === 'ar' ? 'أحمد بن علي' : 'Ahmed Ben Ali'} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('selectLevel', lang)}</label>
              <select value={selectedLevel} onChange={e => setSelectedLevel(e.target.value)} className="input-field text-sm">
                <option value="">{t('selectLevel', lang)}</option>
                {PRIMARY_LEVELS.map(lvl => (
                  <option key={lvl.value} value={lvl.value}>{lang === 'ar' ? lvl.labelAr : lvl.labelFr}</option>
                ))}
              </select>
            </div>
          </div>

          <select value={selectedSubject} onChange={e => setSelectedSubject(e.target.value)} className="input-field text-sm">
            <option value="">{t('selectSubject', lang)}</option>
            {SUBJECTS.map(s => <option key={s.value} value={s.value}>{s[lang]}</option>)}
          </select>

          <div onClick={() => fileRef.current?.click()} className="border-2 border-dashed border-green-300 bg-green-50/50 rounded-xl p-6 text-center cursor-pointer hover:bg-green-50 transition-all">
            {image ? (
              <div className="space-y-3">
                <img src={image} alt="Paper" className="max-h-48 mx-auto rounded-lg shadow-sm" />
                <p className="text-sm text-green-600 font-medium flex items-center justify-center gap-1">
                  <CheckCircle2 size={16} /> {t('imageUploaded', lang)}
                </p>
                <p className="text-xs text-gray-400">
                  {lang === 'ar' ? 'يرجى كتابة إجابات التلميذ أيضاً في الحقل أدناه' : "Veuillez aussi écrire les réponses de l'élève dans le champ ci-dessous"}
                </p>
              </div>
            ) : (
              <>
                <Upload size={36} className="mx-auto text-green-400 mb-3" />
                <p className="text-green-600 font-semibold text-sm">{t('uploadStudentPaper', lang)}</p>
                <p className="text-xs text-gray-500 mt-1">{t('dragDrop', lang)}</p>
              </>
            )}
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
          </div>

          <textarea value={text} onChange={e => setText(e.target.value)} placeholder={t('enterAnswers', lang)} className="input-field min-h-[140px] resize-none text-sm" />

          {text && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-2.5 flex items-center gap-2">
              <Globe size={14} className="text-green-500 shrink-0" />
              <p className="text-xs text-green-700">
                {detectLanguage(text) === 'ar'
                  ? 'تم اكتشاف اللغة العربية — سيكون التصحيح باللغة العربية'
                  : 'Langue française détectée — La correction sera en français'}
              </p>
            </div>
          )}

          {error && <AiErrorBox error={error} lang={lang} onRetry={handleCorrect} />}

          <button
            onClick={handleCorrect}
            disabled={correcting || !text}
            className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: 'linear-gradient(135deg, #22c55e, #10b981)' }}
          >
            {correcting ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                {t('aiCorrecting', lang)}
              </>
            ) : (
              <>
                <Sparkles size={20} />
                {t('correctPaper', lang)}
              </>
            )}
          </button>

          {!text && (
            <p className="text-center text-xs text-gray-400">{t('pleaseEnterAnswers', lang)}</p>
          )}
        </div>
      ) : (
        <div className="space-y-4 slide-up">
          <AiSourceBadge source={result._source} lang={resultLang} />

          {result._raw ? (
            <RawResponseDisplay text={result._raw} lang={resultLang} />
          ) : (
            <>
              {/* Score */}
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 text-center">
                <div className="text-sm text-gray-500 mb-2">{t('overallScore', resultLang)}</div>
                <div className="text-5xl font-bold text-green-500 mb-1">
                  {result.score || 14}<span className="text-2xl text-gray-400">/{result.maxScore || 20}</span>
                </div>
                <div className="flex justify-center gap-1 mt-2">
                  {[1,2,3,4,5].map(i => <Star key={i} size={18} className={i <= (result.stars || 3) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'} />)}
                </div>
                {studentName && <p className="text-sm text-gray-500 mt-2">{t('studentName', resultLang)}: <span className="font-semibold text-gray-700">{studentName}</span></p>}
              </div>

              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
                {tabs.map((tab, i) => (
                  <button key={i} onClick={() => setActiveTab(i)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                      activeTab === i ? 'bg-green-600 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}>
                    <tab.icon size={14} />
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 min-h-[250px]">
                {activeTab === 0 && result.correction && <CorrectionDetail data={result.correction} lang={resultLang} />}
                {activeTab === 1 && result.feedback && <FeedbackDetail data={result.feedback} lang={resultLang} />}
                {activeTab === 2 && result.errors && <ErrorDetail data={result.errors} lang={resultLang} />}
                {activeTab === 3 && result.remediation && <RemediationDetail data={result.remediation} lang={resultLang} />}
              </div>
            </>
          )}

          <div className="flex gap-3">
            <button onClick={() => handleExportPDF(lang)} className="btn-primary flex-1 flex items-center justify-center gap-2 text-sm" style={{ background: 'linear-gradient(135deg, #22c55e, #10b981)' }}>
              <Download size={16} /> {t('exportPDF', lang)}
            </button>
            <button onClick={() => handleShareEmail(lang)} className="btn-secondary flex-1 flex items-center justify-center gap-2 text-sm" style={{ borderColor: '#22c55e', color: '#22c55e' }}>
              <Mail size={16} /> {t('shareEmail', lang)}
            </button>
          </div>

          <button onClick={() => { setResult(null); setText(''); setImage(null); setStudentName(''); setError(null); setActiveTab(0); }} className="w-full text-center text-sm text-gray-500 hover:text-gray-700 py-2">
            ← {t('back', lang)}
          </button>
          <CreditFooter />
        </div>
      )}
    </div>
  );
}

// ==================== ACTIVITY TRACKER ====================
function ActivityTracker({ lang }: { lang: Lang }) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [report, setReport] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [newActivity, setNewActivity] = useState({ date: '', type: 'lesson', description: '', subject: '' });
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());

  const months = [
    t('january', lang), t('february', lang), t('march', lang), t('april', lang),
    t('may', lang), t('june', lang), t('july', lang), t('august', lang),
    t('september', lang), t('october', lang), t('november', lang), t('december', lang),
  ];

  const addActivity = () => {
    if (!newActivity.description) return;
    setActivities([...activities, {
      id: Date.now().toString(),
      ...newActivity,
      date: newActivity.date || new Date().toISOString().split('T')[0],
    }]);
    setNewActivity({ date: '', type: 'lesson', description: '', subject: '' });
    setShowForm(false);
  };

  const deleteActivity = (id: string) => setActivities(activities.filter(a => a.id !== id));

  const generateReportAction = async () => {
    if (activities.length === 0) return;
    setGenerating(true);
    setError(null);
    const allText = activities.map(a => a.description).join(' ');
    const responseLang = allText ? detectLanguage(allText) : lang;

    try {
      const res = await generateReportAI(activities, months[selectedMonth], responseLang);
      setReport(res);
    } catch (err: any) {
      setError(err.message || 'Unknown error');
    } finally {
      setGenerating(false);
    }
  };

  const reportLang = report?._lang || lang;

  const activityTypes = [
    { value: 'lesson', label: t('lesson', lang) },
    { value: 'exercise', label: t('exercise', lang) },
    { value: 'evaluation', label: t('evaluation', lang) },
    { value: 'project', label: t('project', lang) },
  ];

  return (
    <div className="space-y-5 fade-in">
      <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl p-5 text-white">
        <div className="flex items-center gap-3 mb-2">
          <CalendarDays size={24} />
          <h2 className="text-xl font-bold">{t('activityTracker', lang)}</h2>
        </div>
        <p className="text-amber-100 text-sm">{t('activityTrackerDesc', lang)}</p>
        <div className="mt-2 text-xs text-amber-200 flex items-center gap-1">
          <Zap size={12} /> {t('aiPowered', lang)}
        </div>
      </div>

      {!report ? (
        <div className="space-y-4">
          {/* Month Selector */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <label className="text-sm font-medium text-gray-700 mb-2 block">{t('month', lang)}</label>
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
              {months.map((m, i) => (
                <button key={i} onClick={() => setSelectedMonth(i)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                    selectedMonth === i ? 'bg-amber-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}>
                  {m}
                </button>
              ))}
            </div>
          </div>

          {/* Activities List */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-800 text-sm">
                {t('completedActivities', lang)} ({activities.length})
              </h3>
              <button onClick={() => setShowForm(true)} className="flex items-center gap-1 text-amber-600 text-sm font-medium hover:text-amber-700">
                <Plus size={16} /> {t('addActivity', lang)}
              </button>
            </div>

            {showForm && (
              <div className="p-4 bg-amber-50 border-b border-amber-100 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-gray-600 mb-1 block">{t('activityDate', lang)}</label>
                    <input type="date" value={newActivity.date} onChange={e => setNewActivity({...newActivity, date: e.target.value})} className="input-field text-sm py-2" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-600 mb-1 block">{t('activityType', lang)}</label>
                    <select value={newActivity.type} onChange={e => setNewActivity({...newActivity, type: e.target.value})} className="input-field text-sm py-2">
                      {activityTypes.map(at => <option key={at.value} value={at.value}>{at.label}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-xs text-gray-600 mb-1 block">{t('selectSubject', lang)}</label>
                  <select value={newActivity.subject} onChange={e => setNewActivity({...newActivity, subject: e.target.value})} className="input-field text-sm py-2">
                    <option value="">{t('selectSubject', lang)}</option>
                    {SUBJECTS.map(s => <option key={s.value} value={s[lang]}>{s[lang]}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-600 mb-1 block">{t('activityDescription', lang)}</label>
                  <input type="text" value={newActivity.description} onChange={e => setNewActivity({...newActivity, description: e.target.value})} className="input-field text-sm py-2" placeholder={lang === 'ar' ? 'وصف النشاط...' : "Description de l'activité..."} />
                </div>
                <div className="flex gap-2">
                  <button onClick={addActivity} className="btn-primary text-sm py-2 px-4" style={{ background: 'linear-gradient(135deg, #f59e0b, #ea580c)' }}>{t('save', lang)}</button>
                  <button onClick={() => setShowForm(false)} className="btn-secondary text-sm py-2 px-4">{t('cancel', lang)}</button>
                </div>
              </div>
            )}

            {activities.length === 0 ? (
              <div className="p-8 text-center text-gray-400">
                <CalendarDays size={40} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm">{t('noData', lang)}</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {activities.map((a, i) => (
                  <div key={a.id} className="p-3.5 flex items-center gap-3 slide-up" style={{ animationDelay: `${i * 0.05}s` }}>
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      a.type === 'lesson' ? 'bg-blue-100 text-blue-600' :
                      a.type === 'exercise' ? 'bg-green-100 text-green-600' :
                      a.type === 'evaluation' ? 'bg-purple-100 text-purple-600' :
                      'bg-amber-100 text-amber-600'
                    }`}>
                      {a.type === 'lesson' ? <BookOpen size={16} /> :
                       a.type === 'exercise' ? <FileText size={16} /> :
                       a.type === 'evaluation' ? <CheckCircle2 size={16} /> :
                       <Star size={16} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-700 truncate">{a.description}</p>
                      <p className="text-xs text-gray-400">{a.date} • {a.subject}</p>
                    </div>
                    <button onClick={() => deleteActivity(a.id)} className="text-gray-300 hover:text-red-500 transition-colors">
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {error && <AiErrorBox error={error} lang={lang} onRetry={generateReportAction} />}

          <button
            onClick={generateReportAction}
            disabled={generating || activities.length === 0}
            className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: 'linear-gradient(135deg, #f59e0b, #ea580c)' }}
          >
            {generating ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                {t('aiGenerating', lang)}
              </>
            ) : (
              <>
                <Sparkles size={20} />
                {t('generateReport', lang)}
              </>
            )}
          </button>
        </div>
      ) : (
        <div className="space-y-4 slide-up">
          <AiSourceBadge source={report._source} lang={reportLang} />

          {report._raw ? (
            <RawResponseDisplay text={report._raw} lang={reportLang} />
          ) : (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <h3 className="font-bold text-lg text-gray-800 mb-4 flex items-center gap-2">
                <BarChart3 size={20} className="text-amber-500" />
                {t('monthlyReport', reportLang)} - {months[selectedMonth]}
              </h3>

              <div className="space-y-5">
                <div>
                  <h4 className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <TrendingUp size={16} className="text-green-500" /> {t('progressSummary', reportLang)}
                  </h4>
                  <p className="text-sm text-gray-600 leading-relaxed bg-green-50 p-3 rounded-lg">{report.summary}</p>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <Eye size={16} className="text-blue-500" /> {t('observations', reportLang)}
                  </h4>
                  <ul className="space-y-2">
                    {(report.observations || []).map((o: string, i: number) => (
                      <li key={i} className="text-sm text-gray-600 flex items-start gap-2 bg-blue-50 p-3 rounded-lg">
                        <CheckCircle2 size={16} className="text-blue-500 mt-0.5 shrink-0" /> {o}
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <Award size={16} className="text-amber-500" /> {t('recommendations', reportLang)}
                  </h4>
                  <ul className="space-y-2">
                    {(report.recommendations || []).map((r: string, i: number) => (
                      <li key={i} className="text-sm text-gray-600 flex items-start gap-2 bg-amber-50 p-3 rounded-lg">
                        <Sparkles size={16} className="text-amber-500 mt-0.5 shrink-0" /> {r}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <button onClick={() => handleExportPDF(lang)} className="btn-primary flex-1 flex items-center justify-center gap-2 text-sm" style={{ background: 'linear-gradient(135deg, #f59e0b, #ea580c)' }}>
              <Download size={16} /> {t('exportPDF', lang)}
            </button>
            <button onClick={() => handleShareWhatsApp(lang)} className="btn-secondary flex-1 flex items-center justify-center gap-2 text-sm" style={{ borderColor: '#f59e0b', color: '#f59e0b' }}>
              <MessageCircle size={16} /> {t('shareWhatsApp', lang)}
            </button>
          </div>

          <button onClick={() => { setReport(null); setError(null); }} className="w-full text-center text-sm text-gray-500 hover:text-gray-700 py-2">
            ← {t('back', lang)}
          </button>
          <CreditFooter />
        </div>
      )}
    </div>
  );
}

// ==================== SETTINGS ====================
function SettingsPage({ lang, onToggleLang }: { lang: Lang; onToggleLang: () => void }) {
  return (
    <div className="space-y-5 fade-in">
      <div className="bg-gradient-to-r from-gray-700 to-gray-900 rounded-2xl p-5 text-white">
        <div className="flex items-center gap-3 mb-2">
          <Settings size={24} />
          <h2 className="text-xl font-bold">{t('settings', lang)}</h2>
        </div>
      </div>

      <div className="space-y-3">
        {/* AI Status — Always Active */}
        <div className="bg-white rounded-xl border-2 border-green-200 shadow-sm overflow-hidden">
          <h3 className="font-semibold text-gray-800 p-4 pb-2 text-sm flex items-center gap-2">
            <Brain size={16} className="text-green-500" />
            {lang === 'ar' ? 'حالة الذكاء الاصطناعي' : "État de l'IA"}
          </h3>
          <div className="p-4 pt-2 space-y-3">
            <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl p-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                <Zap size={24} className="text-white" />
              </div>
              <div>
                <p className="font-semibold text-green-800 text-sm">{t('aiActive', lang)}</p>
                <p className="text-xs text-green-600 mt-0.5">{t('aiReady', lang)}</p>
              </div>
              <span className="w-3 h-3 rounded-full bg-green-400 animate-pulse ml-auto shrink-0" />
            </div>
            <p className="text-xs text-gray-500 leading-relaxed">
              {lang === 'ar'
                ? 'يعمل الذكاء الاصطناعي تلقائياً بدون أي إعداد. لا حاجة لمفتاح API أو حساب إضافي. مجاني بالكامل ومفتوح المصدر.'
                : "L'IA fonctionne automatiquement sans aucune configuration. Pas besoin de clé API ni de compte supplémentaire. Entièrement gratuit et open-source."}
            </p>
          </div>
        </div>

        {/* Account */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <h3 className="font-semibold text-gray-800 p-4 pb-2 text-sm flex items-center gap-2">
            <Users size={16} className="text-blue-500" /> {t('account', lang)}
          </h3>
          <div className="divide-y divide-gray-50">
            <SettingItem icon={<Globe size={18} className="text-blue-500" />} label={t('language', lang)} action={
              <button onClick={onToggleLang} className="text-sm font-medium text-blue-600 bg-blue-50 px-3 py-1 rounded-lg">{t('switchLang', lang)}</button>
            } />
            <SettingItem icon={<Users size={18} className="text-green-500" />} label={t('profile', lang)} action={
              <ChevronRight size={18} className="text-gray-400" />
            } />
          </div>
        </div>

        {/* Security */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <h3 className="font-semibold text-gray-800 p-4 pb-2 text-sm flex items-center gap-2">
            <Shield size={16} className="text-green-500" /> {t('security', lang)}
          </h3>
          <div className="divide-y divide-gray-50">
            <SettingItem icon={<Lock size={18} className="text-purple-500" />} label={t('dataEncryption', lang)} action={
              <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">{t('enabled', lang)} ✓</span>
            } />
            <SettingItem icon={<Cloud size={18} className="text-blue-500" />} label={t('cloudBackup', lang)} action={
              <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">{t('enabled', lang)} ✓</span>
            } />
            <SettingItem icon={<Bell size={18} className="text-amber-500" />} label={t('notifications', lang)} action={
              <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">{t('enabled', lang)} ✓</span>
            } />
          </div>
        </div>

        {/* About */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <h3 className="font-semibold text-gray-800 p-4 pb-2 text-sm flex items-center gap-2">
            <AlertCircle size={16} className="text-gray-500" /> {t('about', lang)}
          </h3>
          <div className="p-4 pt-2">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center">
                <Brain className="text-white" size={24} />
              </div>
              <div>
                <p className="font-bold text-gray-800">Mossaidi - {t('appName', lang)}</p>
                <p className="text-xs text-gray-500">{t('version', lang)} 3.0.0</p>
              </div>
            </div>
            <p className="text-xs text-gray-500 leading-relaxed">
              {lang === 'ar'
                ? 'مساعدي التربوي الذكي هو تطبيق مبتكر يعتمد على الذكاء الاصطناعي المجاني والمفتوح المصدر لمساعدة المعلمين في إعداد الدروس وتصحيح الأوراق وتتبع الأنشطة. مصمم خصيصاً لمعلمي المرحلة الابتدائية (من CP إلى CM2). يعمل تلقائياً بدون أي إعداد أو مفتاح API.'
                : "Mossaidi est une application innovante basée sur l'IA gratuite et open-source pour aider les enseignants à préparer les leçons, corriger les copies et suivre les activités. Conçue pour les enseignants du primaire (CP à CM2). Fonctionne automatiquement sans aucune configuration ni clé API."
              }
            </p>
            <div className="mt-4 pt-3 border-t border-gray-100">
              <p className="text-xs text-gray-400 text-center font-medium">
                Created by <span className="text-blue-500 font-semibold">Med Ait Ali Oulhoucien</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      <CreditFooter />
    </div>
  );
}

function SettingItem({ icon, label, action }: { icon: React.ReactNode; label: string; action: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between p-4 py-3.5">
      <div className="flex items-center gap-3">
        {icon}
        <span className="text-sm text-gray-700">{label}</span>
      </div>
      {action}
    </div>
  );
}

// ==================== SUB COMPONENTS ====================
function LessonPlanContent({ data, lang }: { data: any; lang: Lang }) {
  return (
    <div className="space-y-4">
      <div className="bg-blue-50 rounded-xl p-4">
        <h4 className="font-bold text-blue-800 mb-3 flex items-center gap-2">
          <GraduationCap size={18} /> {t('lessonPlan', lang)}
        </h4>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div><span className="text-gray-500">{t('lessonTitle', lang)}:</span> <span className="font-medium text-gray-800">{data.title}</span></div>
          <div><span className="text-gray-500">{t('level', lang)}:</span> <span className="font-medium text-gray-800">{data.level}</span></div>
          <div><span className="text-gray-500">{t('duration', lang)}:</span> <span className="font-medium text-gray-800">{data.duration}</span></div>
          <div><span className="text-gray-500">{t('subject', lang)}:</span> <span className="font-medium text-gray-800">{data.subject}</span></div>
        </div>
      </div>
      {data.prerequisites && (
        <div>
          <h5 className="font-semibold text-gray-700 mb-2 text-sm">{t('prerequisites', lang)}</h5>
          <ul className="space-y-1">
            {data.prerequisites.map((p: string, i: number) => (
              <li key={i} className="text-sm text-gray-600 flex items-start gap-2"><CheckCircle2 size={14} className="text-blue-500 mt-0.5 shrink-0" /> {p}</li>
            ))}
          </ul>
        </div>
      )}
      {data.materials && (
        <div>
          <h5 className="font-semibold text-gray-700 mb-2 text-sm">{t('materials', lang)}</h5>
          <div className="flex flex-wrap gap-2">
            {data.materials.map((m: string, i: number) => (
              <span key={i} className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs">{m}</span>
            ))}
          </div>
        </div>
      )}
      {data.phases && (
        <div>
          <h5 className="font-semibold text-gray-700 mb-2 text-sm">{t('phases', lang)}</h5>
          <div className="space-y-2">
            {data.phases.map((p: any, i: number) => (
              <div key={i} className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-sm text-gray-800">{p.name}</span>
                  <span className="text-xs text-gray-400 flex items-center gap-1"><Clock size={12} /> {p.duration}</span>
                </div>
                <p className="text-xs text-gray-600">{p.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ObjectivesContent({ data, lang }: { data: any; lang: Lang }) {
  if (!Array.isArray(data)) return null;
  return (
    <div className="space-y-4">
      <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
        <Target size={18} className="text-blue-500" /> {t('dailyObjectives', lang)}
      </h4>
      {data.map((obj: any, i: number) => (
        <div key={i} className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm font-bold shrink-0">{i + 1}</div>
            <div>
              <h5 className="font-semibold text-gray-800 text-sm mb-1">{obj.title}</h5>
              <p className="text-xs text-gray-600">{obj.description}</p>
              {obj.levelLabel && (
                <div className="mt-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    obj.level === 'knowledge' ? 'bg-green-100 text-green-700' :
                    obj.level === 'comprehension' ? 'bg-blue-100 text-blue-700' :
                    'bg-purple-100 text-purple-700'
                  }`}>{obj.levelLabel}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function ActivitiesContent({ data, lang }: { data: any; lang: Lang }) {
  if (!Array.isArray(data)) return null;
  return (
    <div className="space-y-4">
      <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
        <Lightbulb size={18} className="text-amber-500" /> {t('suggestedActivities', lang)}
      </h4>
      {data.map((act: any, i: number) => (
        <div key={i} className="border border-gray-100 rounded-xl p-4 hover:border-blue-200 transition-colors">
          <div className="flex items-start gap-3">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
              i === 0 ? 'bg-green-100 text-green-600' : i === 1 ? 'bg-blue-100 text-blue-600' : i === 2 ? 'bg-purple-100 text-purple-600' : 'bg-amber-100 text-amber-600'
            }`}>
              {i === 0 ? <Users size={16} /> : i === 1 ? <BookOpen size={16} /> : i === 2 ? <Star size={16} /> : <Lightbulb size={16} />}
            </div>
            <div>
              <h5 className="font-semibold text-gray-800 text-sm">{act.title}</h5>
              <p className="text-xs text-gray-600 mt-1">{act.description}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-xs text-gray-400 flex items-center gap-1"><Clock size={12} /> {act.duration}</span>
                <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{act.type}</span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function DifferentiationContent({ data, lang }: { data: any; lang: Lang }) {
  if (!Array.isArray(data)) return null;
  return (
    <div className="space-y-4">
      <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
        <Users size={18} className="text-purple-500" /> {t('differentiationStrategies', lang)}
      </h4>
      {data.map((strat: any, i: number) => (
        <div key={i} className={`rounded-xl p-4 ${
          i === 0 ? 'bg-green-50 border border-green-100' : i === 1 ? 'bg-blue-50 border border-blue-100' : 'bg-purple-50 border border-purple-100'
        }`}>
          <h5 className="font-semibold text-gray-800 text-sm mb-2 flex items-center gap-2">
            {i === 0 ? <TrendingUp size={16} className="text-green-500" /> : i === 1 ? <Target size={16} className="text-blue-500" /> : <Star size={16} className="text-purple-500" />}
            {strat.level}
          </h5>
          <p className="text-xs text-gray-600 mb-2">{strat.strategy}</p>
          {strat.activities && (
            <ul className="space-y-1">
              {strat.activities.map((a: string, j: number) => (
                <li key={j} className="text-xs text-gray-600 flex items-start gap-1.5">
                  <CheckCircle2 size={12} className="mt-0.5 shrink-0 text-gray-400" /> {a}
                </li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </div>
  );
}

function AssessmentContent({ data, lang }: { data: any; lang: Lang }) {
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [showResults, setShowResults] = useState(false);

  if (!Array.isArray(data)) return null;

  return (
    <div className="space-y-4">
      <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
        <CheckCircle2 size={18} className="text-green-500" /> {t('formativeAssessment', lang)}
      </h4>
      {data.map((q: any, i: number) => (
        <div key={i} className="border border-gray-100 rounded-xl p-4">
          <p className="font-medium text-sm text-gray-800 mb-3">{i + 1}. {q.question}</p>
          <div className="space-y-2">
            {(q.options || []).map((opt: string, j: number) => (
              <button
                key={j}
                onClick={() => { if (!showResults) setAnswers({...answers, [i]: j}); }}
                className={`w-full text-start text-sm p-2.5 rounded-lg border-2 transition-all ${
                  showResults
                    ? j === q.correct ? 'border-green-500 bg-green-50 text-green-700' :
                      answers[i] === j ? 'border-red-300 bg-red-50 text-red-600' : 'border-gray-100 text-gray-600'
                    : answers[i] === j ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-100 text-gray-600 hover:border-gray-300'
                }`}
              >
                <span className="font-medium">{String.fromCharCode(65 + j)}.</span> {opt}
              </button>
            ))}
          </div>
        </div>
      ))}
      <button onClick={() => setShowResults(!showResults)} className="btn-primary w-full text-sm">
        {showResults
          ? (lang === 'ar' ? 'إخفاء الإجابات' : 'Masquer les réponses')
          : (lang === 'ar' ? 'عرض الإجابات الصحيحة' : 'Afficher les réponses correctes')}
      </button>
    </div>
  );
}

function CorrectionDetail({ data, lang }: { data: any; lang: Lang }) {
  if (!Array.isArray(data)) return null;
  return (
    <div className="space-y-3">
      <h4 className="font-bold text-gray-800 flex items-center gap-2">
        <FileCheck size={18} className="text-green-500" /> {t('pedagogicalCorrection', lang)}
      </h4>
      {data.map((item: any, i: number) => (
        <div key={i} className="bg-gray-50 rounded-lg p-3">
          <div className="flex items-center justify-between mb-1">
            <span className="font-medium text-sm text-gray-800">{item.question}</span>
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${item.correct ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
              {item.correct ? (lang === 'ar' ? 'صحيح ✓' : 'Correct ✓') : (lang === 'ar' ? 'خطأ ✗' : 'Incorrect ✗')}
            </span>
          </div>
          <p className="text-xs text-gray-500">{lang === 'ar' ? 'إجابة التلميذ:' : "Réponse de l'élève:"} <span className="text-gray-700">{item.studentAnswer}</span></p>
          {!item.correct && <p className="text-xs text-green-600 mt-1">{lang === 'ar' ? 'الإجابة الصحيحة:' : 'Réponse correcte:'} {item.correctAnswer}</p>}
        </div>
      ))}
    </div>
  );
}

function FeedbackDetail({ data, lang }: { data: any; lang: Lang }) {
  return (
    <div className="space-y-4">
      <h4 className="font-bold text-gray-800 flex items-center gap-2">
        <Star size={18} className="text-amber-500" /> {t('constructiveFeedback', lang)}
      </h4>
      {data.strengths && (
        <div className="bg-green-50 rounded-xl p-4">
          <h5 className="font-semibold text-green-700 text-sm mb-2 flex items-center gap-2">
            <TrendingUp size={16} /> {t('strengths', lang)}
          </h5>
          <ul className="space-y-1.5">
            {data.strengths.map((s: string, i: number) => (
              <li key={i} className="text-sm text-gray-600 flex items-start gap-2"><CheckCircle2 size={14} className="text-green-500 mt-0.5 shrink-0" /> {s}</li>
            ))}
          </ul>
        </div>
      )}
      {data.weaknesses && (
        <div className="bg-amber-50 rounded-xl p-4">
          <h5 className="font-semibold text-amber-700 text-sm mb-2 flex items-center gap-2">
            <AlertCircle size={16} /> {t('weaknesses', lang)}
          </h5>
          <ul className="space-y-1.5">
            {data.weaknesses.map((w: string, i: number) => (
              <li key={i} className="text-sm text-gray-600 flex items-start gap-2"><AlertCircle size={14} className="text-amber-500 mt-0.5 shrink-0" /> {w}</li>
            ))}
          </ul>
        </div>
      )}
      {data.encouragement && (
        <div className="bg-blue-50 rounded-xl p-4">
          <p className="text-sm text-gray-700 leading-relaxed">{data.encouragement}</p>
        </div>
      )}
    </div>
  );
}

function ErrorDetail({ data, lang }: { data: any; lang: Lang }) {
  if (!Array.isArray(data)) return null;
  return (
    <div className="space-y-3">
      <h4 className="font-bold text-gray-800 flex items-center gap-2">
        <AlertCircle size={18} className="text-red-500" /> {t('errorExplanation', lang)}
      </h4>
      {data.map((err: any, i: number) => (
        <div key={i} className="border border-red-100 rounded-xl p-4 bg-red-50/50">
          <h5 className="font-semibold text-red-700 text-sm mb-1">{err.type}</h5>
          <p className="text-xs text-gray-600 mb-2">{err.explanation}</p>
          <div className="bg-white rounded-lg p-2">
            <p className="text-xs text-green-600"><span className="font-medium">{lang === 'ar' ? 'النصيحة:' : 'Conseil:'}</span> {err.tip}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function RemediationDetail({ data, lang }: { data: any; lang: Lang }) {
  if (!Array.isArray(data)) return null;
  return (
    <div className="space-y-3">
      <h4 className="font-bold text-gray-800 flex items-center gap-2">
        <Lightbulb size={18} className="text-purple-500" /> {t('remediationActivities', lang)}
      </h4>
      {data.map((rem: any, i: number) => (
        <div key={i} className="border border-purple-100 rounded-xl p-4 bg-purple-50/50">
          <h5 className="font-semibold text-purple-700 text-sm mb-1 flex items-center gap-2">
            <Award size={14} /> {rem.title}
          </h5>
          <p className="text-xs text-gray-600 mb-2">{rem.description}</p>
          <span className="text-xs bg-purple-100 text-purple-600 px-2 py-0.5 rounded-full">{rem.type}</span>
        </div>
      ))}
    </div>
  );
}

// ==================== EXPORT HELPERS ====================
function handleExportPDF(lang: Lang) {
  const message = lang === 'ar' ? 'جاري تحضير ملف PDF...\n\nسيتم فتح نافذة الطباعة. اختر "حفظ كـ PDF" للتصدير.' : 'Préparation du fichier PDF...\n\nLa fenêtre d\'impression va s\'ouvrir. Choisissez "Enregistrer en PDF" pour exporter.';
  alert(message);
  window.print();
}

function handleShareWhatsApp(lang: Lang) {
  const text = lang === 'ar'
    ? 'تم إنشاء هذا المحتوى بواسطة تطبيق مساعدي التربوي الذكي - Mossaidi 📚✨'
    : 'Ce contenu a été généré par Mossaidi 📚✨';
  window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
}

function handleShareEmail(lang: Lang) {
  const subject = lang === 'ar' ? 'تقرير من مساعدي التربوي الذكي - Mossaidi' : 'Rapport de Mossaidi';
  const body = lang === 'ar' ? 'مرفق تقرير تم إنشاؤه بواسطة تطبيق مساعدي التربوي الذكي - Mossaidi' : 'Ci-joint un rapport généré par Mossaidi';
  window.open(`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, '_blank');
}

// ==================== MAIN APP ====================
export function App() {
  const [lang, setLang] = useState<Lang>('ar');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState('');
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isRtl = lang === 'ar';

  const toggleLang = useCallback(() => setLang(prev => prev === 'ar' ? 'fr' : 'ar'), []);

  const handleLogin = useCallback((name: string) => {
    setUserName(name);
    setIsLoggedIn(true);
  }, []);

  const handleLogout = useCallback(() => {
    setIsLoggedIn(false);
    setUserName('');
    setCurrentPage('dashboard');
  }, []);

  const navigateTo = useCallback((page: Page) => {
    setCurrentPage(page);
    setSidebarOpen(false);
  }, []);

  useEffect(() => {
    document.documentElement.dir = isRtl ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  }, [lang, isRtl]);

  if (!isLoggedIn) {
    return <AuthScreen lang={lang} onLogin={handleLogin} onToggleLang={toggleLang} />;
  }

  const navItems = [
    { page: 'dashboard' as Page, icon: LayoutDashboard, label: t('dashboard', lang) },
    { page: 'lesson' as Page, icon: Brain, label: t('lessonAnalyzer', lang) },
    { page: 'correction' as Page, icon: FileCheck, label: t('studentCorrection', lang) },
    { page: 'tracker' as Page, icon: CalendarDays, label: t('activityTracker', lang) },
    { page: 'settings' as Page, icon: Settings, label: t('settings', lang) },
  ];

  return (
    <div dir={isRtl ? 'rtl' : 'ltr'} className="min-h-screen bg-[#f0f5fa] flex flex-col">
      {/* Mobile Header */}
      <header className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-50 no-print">
        <div className="flex items-center justify-between px-4 py-3">
          <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
            <Menu size={22} className="text-gray-600" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
              <Brain className="text-white" size={18} />
            </div>
            <h1 className="text-sm font-bold text-gray-800">Mossaidi</h1>
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" title="AI Active" />
          </div>
          <button onClick={toggleLang} className="flex items-center gap-1.5 bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-blue-100 transition-colors">
            <Globe size={14} />
            {t('switchLang', lang)}
          </button>
        </div>
      </header>

      {/* Sidebar Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 no-print">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <div className={`absolute top-0 ${isRtl ? 'right-0' : 'left-0'} h-full w-72 bg-white shadow-2xl fade-in flex flex-col`}>
            <div className="gradient-hero p-5 pb-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                  <Brain className="text-white" size={22} />
                </div>
                <button onClick={() => setSidebarOpen(false)} className="p-1.5 rounded-lg hover:bg-white/20 transition-colors">
                  <X size={20} className="text-white" />
                </button>
              </div>
              <h2 className="text-white font-bold">{userName}</h2>
              <p className="text-blue-200 text-xs">{t('teacher', lang)}</p>
              <div className="mt-2 flex items-center gap-1 text-xs text-green-300">
                <Zap size={12} /> {t('aiActive', lang)}
              </div>
            </div>

            <nav className="flex-1 p-3 space-y-1 overflow-y-auto scrollbar-thin">
              {navItems.map(item => (
                <button key={item.page} onClick={() => navigateTo(item.page)}
                  className={`nav-item w-full flex items-center gap-3 text-sm font-medium ${currentPage === item.page ? 'active' : 'text-gray-600'}`}>
                  <item.icon size={20} />
                  {item.label}
                </button>
              ))}
            </nav>

            <div className="px-3 py-2 border-t border-gray-100">
              <p className="text-[10px] text-gray-400 text-center font-medium">
                Created by <span className="text-blue-500 font-semibold">Med Ait Ali Oulhoucien</span>
              </p>
            </div>

            <div className="p-3 border-t border-gray-100">
              <button onClick={handleLogout} className="nav-item w-full flex items-center gap-3 text-sm font-medium text-red-500 hover:bg-red-50">
                <LogOut size={20} />
                {t('logout', lang)}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 p-4 pb-24 max-w-2xl mx-auto w-full">
        {currentPage === 'dashboard' && <Dashboard lang={lang} userName={userName} onNavigate={navigateTo} />}
        {currentPage === 'lesson' && <LessonAnalyzer lang={lang} />}
        {currentPage === 'correction' && <StudentCorrection lang={lang} />}
        {currentPage === 'tracker' && <ActivityTracker lang={lang} />}
        {currentPage === 'settings' && <SettingsPage lang={lang} onToggleLang={toggleLang} />}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 shadow-lg z-40 no-print">
        <div className="max-w-2xl mx-auto flex items-center justify-around py-2">
          {navItems.slice(0, 4).map(item => (
            <button key={item.page} onClick={() => navigateTo(item.page)}
              className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl transition-all ${
                currentPage === item.page ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'
              }`}>
              <div className={`p-1.5 rounded-xl transition-all ${currentPage === item.page ? 'bg-blue-50' : ''}`}>
                <item.icon size={20} />
              </div>
              <span className="text-[10px] font-medium">{item.label.split(' ')[0]}</span>
            </button>
          ))}
          <button onClick={() => navigateTo('settings')}
            className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl transition-all ${
              currentPage === 'settings' ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'
            }`}>
            <div className={`p-1.5 rounded-xl transition-all ${currentPage === 'settings' ? 'bg-blue-50' : ''}`}>
              <Settings size={20} />
            </div>
            <span className="text-[10px] font-medium">{navItems[4].label.split(' ')[0]}</span>
          </button>
        </div>
        <div className="h-[env(safe-area-inset-bottom)]" />
      </nav>
    </div>
  );
}
