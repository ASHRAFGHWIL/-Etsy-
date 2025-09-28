import React, { useState, useCallback, useEffect } from 'react';
import { generateEmailContent } from './services/geminiService';
import type { GeneratedEmail, ArchivedEmail } from './types';
import { SparklesIcon, ArchiveBoxIcon, PaperAirplaneIcon, ChevronDownIcon, SunIcon, MoonIcon } from './components/icons';

interface HeaderProps {
    theme: 'light' | 'dark';
    toggleTheme: () => void;
}

const Header: React.FC<HeaderProps> = ({ theme, toggleTheme }) => (
    <header className="bg-white shadow-md dark:bg-slate-800 transition-colors">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
            <div className="flex items-center space-x-4">
                <div className="bg-gradient-to-r from-teal-400 to-blue-500 p-3 rounded-lg text-white">
                    <PaperAirplaneIcon className="w-8 h-8"/>
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-slate-100">مسوّق Etsy بالذكاء الاصطناعي</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">أنشئ حملات بريد إلكتروني احترافية لمنتجاتك الرقمية</p>
                </div>
            </div>
            <button
                onClick={toggleTheme}
                className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 dark:focus:ring-offset-slate-800 transition-colors"
                aria-label="Toggle dark mode"
            >
                {theme === 'light' ? <MoonIcon className="w-6 h-6" /> : <SunIcon className="w-6 h-6" />}
            </button>
        </div>
    </header>
);

interface InputFormProps {
    onGenerate: (productDescription: string, productUrl: string, ownerEmail: string, mailingList: string, customPrompt: string) => void;
    isLoading: boolean;
}

const InputForm: React.FC<InputFormProps> = ({ onGenerate, isLoading }) => {
    const [productDescription, setProductDescription] = useState('ملف رقمي – تصميم صندوق تخزين بطاريات – متوافق مع CNC & Glowforge');
    const [productUrl, setProductUrl] = useState('');
    const [ownerEmail, setOwnerEmail] = useState('');
    const [mailingList, setMailingList] = useState('');
    const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
    const [customPrompt, setCustomPrompt] = useState('');

    const recipientCount = mailingList.split(/[\n,;]+/).map(email => email.trim()).filter(Boolean).length;

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const text = e.target?.result as string;
                const emails = text.split(/[\n,;]+/).map(email => email.trim()).filter(email => email);
                setMailingList(emails.join('\n'));
            };
            reader.readAsText(file);
        }
    };
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onGenerate(productDescription, productUrl, ownerEmail, mailingList, customPrompt);
    };

    return (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md transition-colors">
            <h2 className="text-xl font-semibold mb-4 text-gray-700 dark:text-slate-200">1. أدخل تفاصيل حملتك</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="product-description" className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">وصف المنتج</label>
                    <textarea
                        id="product-description"
                        value={productDescription}
                        onChange={(e) => setProductDescription(e.target.value)}
                        rows={4}
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition dark:bg-slate-700 dark:border-gray-600 dark:text-slate-200 dark:placeholder-gray-400"
                        placeholder="مثال: ملف رقمي لتصميم..."
                        required
                    />
                </div>
                <div>
                    <label htmlFor="product-url" className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">رابط المنتج على Etsy</label>
                    <input
                        id="product-url"
                        type="url"
                        value={productUrl}
                        onChange={(e) => setProductUrl(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition dark:bg-slate-700 dark:border-gray-600 dark:text-slate-200 dark:placeholder-gray-400"
                        placeholder="https://www.etsy.com/listing/..."
                        required
                    />
                </div>
                <div>
                    <label htmlFor="owner-email" className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">بريدك الإلكتروني (لاستلام نسخة)</label>
                    <input
                        id="owner-email"
                        type="email"
                        value={ownerEmail}
                        onChange={(e) => setOwnerEmail(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition dark:bg-slate-700 dark:border-gray-600 dark:text-slate-200 dark:placeholder-gray-400"
                        placeholder="your.email@example.com"
                        required
                    />
                </div>
                <div>
                    <label htmlFor="mailing-list" className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">القائمة البريدية</label>
                    <textarea
                        id="mailing-list"
                        value={mailingList}
                        onChange={(e) => setMailingList(e.target.value)}
                        rows={6}
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition dark:bg-slate-700 dark:border-gray-600 dark:text-slate-200 dark:placeholder-gray-400"
                        placeholder="الصق قائمة الإيميلات هنا، كل بريد في سطر..."
                        required
                    />
                     {recipientCount > 0 && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            عدد المستلمين: {recipientCount}. سيتم تكييف نبرة الرسالة تلقائيًا.
                        </p>
                    )}
                    <label htmlFor="csv-upload" className="mt-2 text-sm text-center text-gray-500 dark:text-gray-400 block">
                        أو{" "}
                        <span className="font-medium text-teal-600 hover:text-teal-500 dark:text-teal-400 dark:hover:text-teal-300 cursor-pointer">
                            ارفع ملف CSV
                        </span>
                        <input id="csv-upload" type="file" className="sr-only" accept=".csv, .txt" onChange={handleFileChange} />
                    </label>
                </div>

                <div className="pt-2">
                    <button
                        type="button"
                        onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
                        className="w-full flex justify-between items-center p-2 rounded-md hover:bg-gray-100 dark:hover:bg-slate-700/50 transition-colors"
                        aria-expanded={isAdvancedOpen}
                    >
                        <span className="font-semibold text-gray-700 dark:text-slate-300">الإعدادات المتقدمة</span>
                        <ChevronDownIcon className={`w-5 h-5 text-gray-400 dark:text-gray-500 transition-transform ${isAdvancedOpen ? 'rotate-180' : ''}`}/>
                    </button>
                    {isAdvancedOpen && (
                        <div className="mt-2 p-4 bg-gray-50 dark:bg-slate-800/50 rounded-md border dark:border-gray-200 dark:border-gray-700">
                            <label htmlFor="custom-prompt" className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">
                                موجه مخصص (Prompt)
                            </label>
                            <textarea
                                id="custom-prompt"
                                value={customPrompt}
                                onChange={(e) => setCustomPrompt(e.target.value)}
                                rows={8}
                                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition dark:bg-slate-700 dark:border-gray-600 dark:text-slate-200 dark:placeholder-gray-400"
                                placeholder="أدخل الموجه المخصص هنا. إذا ترك فارغًا، سيتم استخدام الموجه الافتراضي."
                            />
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                                سيحل النظام تلقائيًا محل <code>{`{{productDescription}}`}</code> و <code>{`{{productUrl}}`}</code> بالقيم التي أدخلتها أعلاه.
                            </p>
                        </div>
                    )}
                </div>

                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full flex items-center justify-center bg-gradient-to-r from-teal-500 to-blue-600 text-white font-bold py-3 px-4 rounded-md hover:from-teal-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                >
                    {isLoading ? (
                        <>
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            جاري الإنشاء...
                        </>
                    ) : (
                        <>
                            <SparklesIcon className="w-5 h-5 ml-2"/>
                            أنشئ رسالة البريد الإلكتروني
                        </>
                    )}
                </button>
            </form>
        </div>
    );
};

interface EmailPreviewProps {
    email: GeneratedEmail;
    onUpdate: (updatedEmail: GeneratedEmail) => void;
    onArchive: () => void;
}

const EmailPreview: React.FC<EmailPreviewProps> = ({ email, onUpdate, onArchive }) => (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md mt-6 animate-fade-in transition-colors">
        <h2 className="text-xl font-semibold mb-4 text-gray-700 dark:text-slate-200">2. معاينة وتعديل الرسالة</h2>
        <div className="space-y-4">
            <div>
                <label htmlFor="email-subject" className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">العنوان (Subject)</label>
                <input
                    id="email-subject"
                    type="text"
                    value={email.subject}
                    onChange={(e) => onUpdate({ ...email, subject: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-md bg-gray-50 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition dark:bg-slate-700 dark:border-gray-600 dark:text-slate-200"
                />
            </div>
            <div>
                <label htmlFor="email-body" className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">محتوى الرسالة</label>
                <textarea
                    id="email-body"
                    value={email.body}
                    onChange={(e) => onUpdate({ ...email, body: e.target.value })}
                    rows={12}
                    className="w-full p-3 border border-gray-300 rounded-md bg-gray-50 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition dark:bg-slate-700 dark:border-gray-600 dark:text-slate-200"
                    style={{ fontFamily: 'Tahoma, Arial, sans-serif' }}
                />
            </div>
            <button
                onClick={onArchive}
                className="w-full flex items-center justify-center bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold py-3 px-4 rounded-md hover:from-green-600 hover:to-emerald-700 transition-all duration-300"
            >
                <ArchiveBoxIcon className="w-5 h-5 ml-2"/>
                أرشفة الحملة (محاكاة الإرسال)
            </button>
            <p className="text-xs text-center text-gray-500 dark:text-gray-400 mt-2">
                ملاحظة: هذا الإجراء يقوم بأرشفة الحملة في "الرسائل المرسلة" أدناه. لإرسال الرسائل فعلياً، قم بنسخ المحتوى واستخدم خدمة البريد الإلكتروني الخاصة بك.
            </p>
        </div>
    </div>
);


const ArchivedCampaignItem: React.FC<{ email: ArchivedEmail }> = ({ email }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-slate-800 transition-colors">
            <button onClick={() => setIsOpen(!isOpen)} className="w-full text-right p-4 flex justify-between items-center hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">
                <div>
                    <p className="font-semibold text-gray-800 dark:text-slate-100">{email.subject}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        {new Date(email.timestamp).toLocaleString('ar-EG')} - {email.productDescription}
                    </p>
                </div>
                <ChevronDownIcon className={`w-5 h-5 text-gray-400 dark:text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}/>
            </button>
            {isOpen && (
                <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-slate-800/50">
                    <h4 className="font-semibold mb-2 dark:text-slate-200">محتوى الرسالة:</h4>
                    <pre className="whitespace-pre-wrap text-sm text-gray-700 dark:text-slate-300 p-3 bg-white dark:bg-slate-700 rounded-md border dark:border-gray-600" style={{ fontFamily: 'Tahoma, Arial, sans-serif' }}>
                        {email.body}
                    </pre>
                </div>
            )}
        </div>
    );
};

const Archive: React.FC<{ emails: ArchivedEmail[] }> = ({ emails }) => (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md mt-6 transition-colors">
        <h2 className="text-xl font-semibold mb-4 text-gray-700 dark:text-slate-200 flex items-center">
            <ArchiveBoxIcon className="w-6 h-6 ml-3 text-teal-600"/>
            الرسائل المُرسلة (الأرشيف)
        </h2>
        <div className="space-y-3">
            {emails.length > 0 ? (
                [...emails].reverse().map(email => <ArchivedCampaignItem key={email.id} email={email} />)
            ) : (
                <p className="text-center text-gray-500 dark:text-gray-400 py-4">لا توجد حملات مرسلة بعد.</p>
            )}
        </div>
    </div>
);


export default function App() {
    const [generatedEmail, setGeneratedEmail] = useState<GeneratedEmail | null>(null);
    const [archivedEmails, setArchivedEmails] = useState<ArchivedEmail[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [currentCampaignDetails, setCurrentCampaignDetails] = useState({ productDescription: '', productUrl: '' });
    
    const [theme, setTheme] = useState<'light' | 'dark'>(() => {
        if (typeof window !== 'undefined' && localStorage.getItem('theme')) {
            return localStorage.getItem('theme') as 'light' | 'dark';
        }
        if (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            return 'dark';
        }
        return 'light';
    });

    useEffect(() => {
        const root = window.document.documentElement;
        if (theme === 'dark') {
            root.classList.add('dark');
        } else {
            root.classList.remove('dark');
        }
        localStorage.setItem('theme', theme);
    }, [theme]);

    const toggleTheme = () => {
        setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
    };

    const handleGenerate = useCallback(async (productDescription: string, productUrl: string, ownerEmail: string, mailingList: string, customPrompt: string) => {
        setIsLoading(true);
        setError(null);
        setGeneratedEmail(null);
        setCurrentCampaignDetails({ productDescription, productUrl });
        
        const recipientCount = mailingList.split(/[\n,;]+/).map(email => email.trim()).filter(Boolean).length;

        try {
            const emailContent = await generateEmailContent(productDescription, productUrl, customPrompt, recipientCount);
            setGeneratedEmail(emailContent);
        } catch (e: any) {
            setError(e.message || 'حدث خطأ غير متوقع.');
        } finally {
            setIsLoading(false);
        }
    }, []);

    const handleArchive = useCallback(() => {
        if (generatedEmail) {
            const newArchivedEmail: ArchivedEmail = {
                ...generatedEmail,
                id: new Date().toISOString(),
                productDescription: currentCampaignDetails.productDescription,
                productUrl: currentCampaignDetails.productUrl,
                timestamp: new Date().toISOString(),
            };
            setArchivedEmails(prev => [...prev, newArchivedEmail]);
            setGeneratedEmail(null); // Clear preview after archiving
        }
    }, [generatedEmail, currentCampaignDetails]);

    const handleUpdateEmail = (updatedEmail: GeneratedEmail) => {
        setGeneratedEmail(updatedEmail);
    };

    return (
        <>
            <Header theme={theme} toggleTheme={toggleTheme} />
            <main className="container mx-auto px-4 sm:px-6 py-8">
                <div className="max-w-3xl mx-auto">
                    <InputForm onGenerate={handleGenerate} isLoading={isLoading} />

                    {error && (
                        <div className="mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-md dark:bg-red-900/50 dark:border-red-700 dark:text-red-300" role="alert">
                            <p className="font-bold">خطأ</p>
                            <p>{error}</p>
                        </div>
                    )}

                    {generatedEmail && (
                        <EmailPreview email={generatedEmail} onUpdate={handleUpdateEmail} onArchive={handleArchive} />
                    )}

                    <Archive emails={archivedEmails} />
                </div>
            </main>
        </>
    );
}