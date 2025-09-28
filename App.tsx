import React, { useState, useEffect } from 'react';
import { generateEmailContent } from './services/geminiService';
import { GeneratedEmail, ArchivedEmail } from './types';
import { SparklesIcon, ArchiveBoxIcon, SunIcon, MoonIcon, ChevronDownIcon, ClipboardIcon, CheckIcon } from './components/icons';

const App: React.FC = () => {
  // State for theme
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      const storedTheme = window.localStorage.getItem('theme');
      if (storedTheme === 'dark' || storedTheme === 'light') {
        return storedTheme;
      }
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark';
      }
    }
    return 'light';
  });

  // Effect to apply theme
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
  };
  
  // State for form inputs
  const [productDescription, setProductDescription] = useState<string>('');
  const [productUrl, setProductUrl] = useState<string>('');
  const [isUrlValid, setIsUrlValid] = useState<boolean>(true);
  const [customPrompt, setCustomPrompt] = useState<string>('');
  const [recipientCount, setRecipientCount] = useState<string>('');
  const [recipientTitle, setRecipientTitle] = useState<string>('');
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);
  const [language, setLanguage] = useState<'ar' | 'en-US'>('ar');


  // State for API interaction
  const [generatedEmail, setGeneratedEmail] = useState<GeneratedEmail | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // State for archiving
  const [archivedEmails, setArchivedEmails] = useState<ArchivedEmail[]>([]);
  
  // State for animations
  const [displayedEmail, setDisplayedEmail] = useState<GeneratedEmail | null>(null);
  const [animationTrigger, setAnimationTrigger] = useState(false);
  const [newlyArchivedId, setNewlyArchivedId] = useState<string | null>(null);

  // State for copy to clipboard feedback
  const [subjectCopied, setSubjectCopied] = useState<boolean>(false);
  const [bodyCopied, setBodyCopied] = useState<boolean>(false);

  // State for toast notification
  const [toastMessage, setToastMessage] = useState<string>('');

  // Effect to clear toast message after a delay
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => {
        setToastMessage('');
      }, 3000); // Toast visible for 3 seconds
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);


  // Effect for URL validation
  useEffect(() => {
    if (productUrl === '') {
      setIsUrlValid(true);
      return;
    }
    const isValid = /^https?:\/\//.test(productUrl);
    setIsUrlValid(isValid);
  }, [productUrl]);


  const handleGenerateClick = async () => {
    if (!productDescription.trim() || !productUrl.trim() || !isUrlValid) {
      setError("يرجى التأكد من ملء جميع الحقول المطلوبة بشكل صحيح.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setAnimationTrigger(false);


    try {
      const count = recipientCount ? parseInt(recipientCount, 10) : undefined;
      const result = await generateEmailContent(productDescription, productUrl, language, customPrompt, count, recipientTitle);
      setGeneratedEmail(result);
      setDisplayedEmail(result);
      // Use requestAnimationFrame to ensure the state update is processed before triggering the animation
      requestAnimationFrame(() => {
        setAnimationTrigger(true);
      });
    } catch (err: any) {
      setError(err.message || "حدث خطأ غير متوقع.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleArchiveClick = () => {
    if (!generatedEmail) return;

    const newArchivedEmail: ArchivedEmail = {
      ...generatedEmail,
      id: new Date().toISOString(),
      productDescription,
      productUrl,
      timestamp: new Date().toLocaleString('ar-EG'),
      language,
      recipientTitle,
    };
    
    setAnimationTrigger(false); // Start fade-out animation
    setNewlyArchivedId(newArchivedEmail.id);
    setToastMessage('تمت أرشفة البريد الإلكتروني بنجاح!');


    setTimeout(() => {
      setGeneratedEmail(null);
      setDisplayedEmail(null); // Remove from DOM after animation
      setArchivedEmails(prev => [newArchivedEmail, ...prev]);
    }, 500); // Duration should match the CSS transition
  };
  
  const handleCopyToClipboard = (text: string, type: 'subject' | 'body') => {
    navigator.clipboard.writeText(text).then(() => {
      if (type === 'subject') {
        setSubjectCopied(true);
        setTimeout(() => setSubjectCopied(false), 2000);
      } else {
        setBodyCopied(true);
        setTimeout(() => setBodyCopied(false), 2000);
      }
    }).catch(err => {
      console.error('Failed to copy text: ', err);
    });
  };


  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-sans transition-colors duration-300" dir="rtl">
      <div className="container mx-auto p-4 md:p-8 max-w-4xl">
        <header className="flex justify-between items-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800 dark:text-white">مولّد رسائل التسويق الذكي</h1>
          <button
            onClick={toggleTheme}
            className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-50 dark:focus:ring-offset-gray-900 focus:ring-indigo-500"
            aria-label="Toggle theme"
          >
            {theme === 'light' ? <MoonIcon className="w-6 h-6" /> : <SunIcon className="w-6 h-6" />}
          </button>
        </header>

        <main>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-gray-700 dark:text-gray-200">معلومات المنتج</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">لغة البريد الإلكتروني المُنشأ</label>
                <div className="flex rounded-md shadow-sm">
                  <button
                    type="button"
                    onClick={() => setLanguage('ar')}
                    className={`relative inline-flex items-center justify-center w-1/2 px-4 py-2 rounded-r-md border text-sm font-medium focus:z-10 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors duration-200 ${
                      language === 'ar'
                        ? 'bg-indigo-600 border-indigo-600 text-white'
                        : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600'
                    }`}
                  >
                    العربية
                  </button>
                  <button
                    type="button"
                    onClick={() => setLanguage('en-US')}
                    className={`relative -ml-px inline-flex items-center justify-center w-1/2 px-4 py-2 rounded-l-md border text-sm font-medium focus:z-10 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors duration-200 ${
                        language === 'en-US'
                          ? 'bg-indigo-600 border-indigo-600 text-white'
                          : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600'
                      }`}
                  >
                    English
                  </button>
                </div>
              </div>
              <div>
                <label htmlFor="recipient-title" className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">لقب المرسل إليه (اختياري)</label>
                <select
                  id="recipient-title"
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                  value={recipientTitle}
                  onChange={(e) => setRecipientTitle(e.target.value)}
                >
                  <option value="">-- اختر لقباً --</option>
                  <option value="السيد">السيد</option>
                  <option value="السيدة">السيدة</option>
                  <option value="السادة">السادة</option>
                  <option value="الأستاذ">الأستاذ</option>
                  <option value="الأستاذة">الأستاذة</option>
                </select>
              </div>
              <div>
                <label htmlFor="product-description" className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">وصف المنتج</label>
                <textarea
                  id="product-description"
                  rows={4}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                  placeholder="مثال: قالب سيرة ذاتية احترافي قابل للتعديل لبرنامج Microsoft Word..."
                  value={productDescription}
                  onChange={(e) => setProductDescription(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="product-url" className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">رابط المنتج</label>
                <input
                  type="url"
                  id="product-url"
                  className={`w-full p-2 border ${
                    isUrlValid
                      ? 'border-gray-300 dark:border-gray-600 focus:ring-indigo-500 focus:border-indigo-500'
                      : 'border-red-500 dark:border-red-400 focus:ring-red-500 focus:border-red-500'
                  } rounded-md bg-gray-50 dark:bg-gray-700 transition`}
                  placeholder="https://www.etsy.com/listing/..."
                  value={productUrl}
                  onChange={(e) => setProductUrl(e.target.value)}
                  aria-invalid={!isUrlValid}
                  aria-describedby="url-error"
                />
                {!isUrlValid && productUrl && (
                    <p id="url-error" className="mt-1 text-sm text-red-600 dark:text-red-400">
                      الرجاء إدخال رابط صالح يبدأ بـ http:// أو https://
                    </p>
                )}
              </div>

              <button
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="flex items-center text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                خيارات متقدمة
                <ChevronDownIcon className={`w-4 h-4 mr-1 transition-transform duration-200 ${showAdvanced ? 'rotate-180' : ''}`} />
              </button>

              {showAdvanced && (
                <div className="space-y-4 pt-2 border-t border-gray-200 dark:border-gray-700">
                  <div>
                    <label htmlFor="recipient-count" className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">عدد المستلمين (اختياري)</label>
                    <input
                      type="number"
                      id="recipient-count"
                      min="1"
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                      placeholder="لتخصيص صيغة المخاطبة (مفرد، مثنى، جمع)"
                      value={recipientCount}
                      onChange={(e) => setRecipientCount(e.target.value)}
                    />
                  </div>
                  <div>
                    <label htmlFor="custom-prompt" className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">توجيه مخصص (اختياري)</label>
                    <textarea
                      id="custom-prompt"
                      rows={5}
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                      placeholder="يمكنك كتابة توجيهك الخاص هنا. استخدم {{productDescription}} و {{productUrl}} كمتغيرات."
                      value={customPrompt}
                      onChange={(e) => setCustomPrompt(e.target.value)}
                    />
                  </div>
                </div>
              )}
            </div>
            <div className="mt-6 text-left">
              <button
                onClick={handleGenerateClick}
                disabled={isLoading || !productDescription.trim() || !productUrl.trim() || !isUrlValid}
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-800 disabled:bg-indigo-400 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? (
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  <SparklesIcon className="w-5 h-5 -ml-1 mr-2" />
                )}
                {isLoading ? 'جاري الإنشاء...' : 'أنشئ البريد الإلكتروني'}
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-100 dark:bg-red-900/30 border border-red-400 text-red-700 dark:text-red-300 px-4 py-3 rounded-md relative mb-6" role="alert">
              <strong className="font-bold">خطأ!</strong>
              <span className="block sm:inline ml-2">{error}</span>
            </div>
          )}
          
          <div className={`transition-all duration-500 ease-out ${animationTrigger ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            {displayedEmail && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
                <h2 className="text-2xl font-semibold mb-4 text-gray-700 dark:text-gray-200">البريد الإلكتروني المُنشأ</h2>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-medium text-gray-600 dark:text-gray-300 mb-1">الموضوع:</h3>
                    <p
                      className={`p-3 bg-gray-100 dark:bg-gray-700 rounded-md ${language === 'en-US' ? 'text-left' : 'text-right'}`}
                      dir={language === 'en-US' ? 'ltr' : 'rtl'}
                    >
                      {displayedEmail.subject}
                    </p>
                    <div className="mt-2 flex justify-end">
                      <button
                        onClick={() => handleCopyToClipboard(displayedEmail.subject, 'subject')}
                        className="flex items-center px-2 py-1 text-sm font-medium rounded-md text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 disabled:text-gray-500 dark:disabled:text-gray-400 disabled:hover:bg-transparent dark:disabled:hover:bg-transparent transition-colors"
                        disabled={subjectCopied}
                      >
                        {subjectCopied ? (
                          <>
                            <CheckIcon className="w-4 h-4 ml-1" />
                            تم النسخ!
                          </>
                        ) : (
                          <>
                            <ClipboardIcon className="w-4 h-4 ml-1" />
                            نسخ
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-600 dark:text-gray-300 mb-1">المحتوى:</h3>
                    <div
                      className={`p-3 bg-gray-100 dark:bg-gray-700 rounded-md whitespace-pre-wrap ${language === 'en-US' ? 'text-left' : 'text-right'}`}
                      dir={language === 'en-US' ? 'ltr' : 'rtl'}
                    >
                      {displayedEmail.body}
                    </div>
                    <div className="mt-2 flex justify-end">
                      <button
                        onClick={() => handleCopyToClipboard(displayedEmail.body, 'body')}
                        className="flex items-center px-2 py-1 text-sm font-medium rounded-md text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 disabled:text-gray-500 dark:disabled:text-gray-400 disabled:hover:bg-transparent dark:disabled:hover:bg-transparent transition-colors"
                        disabled={bodyCopied}
                      >
                        {bodyCopied ? (
                          <>
                            <CheckIcon className="w-4 h-4 ml-1" />
                            تم النسخ!
                          </>
                        ) : (
                          <>
                            <ClipboardIcon className="w-4 h-4 ml-1" />
                            نسخ
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
                <div className="mt-6 text-left">
                  <button
                    onClick={handleArchiveClick}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-500 text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-800 transition-colors"
                  >
                    <ArchiveBoxIcon className="w-5 h-5 -ml-1 mr-2" />
                    أرشفة
                  </button>
                </div>
              </div>
            )}
          </div>

          {archivedEmails.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-semibold mb-4 text-gray-700 dark:text-gray-200">الأرشيف</h2>
              <div className="space-y-6">
                {archivedEmails.map((email) => (
                  <div 
                    key={email.id} 
                    className={`border-b border-gray-200 dark:border-gray-700 pb-4 last:border-b-0 last:pb-0 ${email.id === newlyArchivedId ? 'animate-slide-in-fade' : ''}`}
                  >
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">{email.timestamp}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-2 truncate">
                      <span className="font-semibold">المنتج:</span> {email.productDescription}
                    </p>
                    {email.recipientTitle && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-2 truncate">
                            <span className="font-semibold">اللقب:</span> {email.recipientTitle}
                        </p>
                    )}
                    <h3
                      className={`font-semibold text-gray-800 dark:text-gray-100 ${email.language === 'en-US' ? 'text-left' : 'text-right'}`}
                      dir={email.language === 'en-US' ? 'ltr' : 'rtl'}
                    >
                      {email.subject}
                    </h3>
                    <p
                      className={`mt-2 text-gray-600 dark:text-gray-300 whitespace-pre-wrap ${email.language === 'en-US' ? 'text-left' : 'text-right'}`}
                      dir={email.language === 'en-US' ? 'ltr' : 'rtl'}
                    >
                      {email.body}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-8 right-8 z-50 bg-green-600 text-white font-semibold py-3 px-6 rounded-lg shadow-lg animate-toast"
        >
          {toastMessage}
        </div>
      )}
    </div>
  );
};

export default App;