import { useEffect, useState } from 'preact/hooks'

export const LANGS = ['en', 'uk']

const UI = {
  en: {
    projects: 'Projects', research: 'Research', skills: 'Skills', experience: 'Experience', contact: 'Contact',
    featured: 'Selected projects', more: 'More from GitHub', code: 'Code', live: 'Live demo',
    downloadCv: 'Download CV', getInTouch: 'Get in touch', publications: 'Research & publications',
    education: 'Education', open: 'Open publication', allRepos: 'All repositories on GitHub',
    contactTitle: "Let's build something together", contactText: 'Open to offers, collaboration and relocation.',
    close: 'Close', details: 'Details',
  },
  uk: {
    projects: 'Проєкти', research: 'Наука', skills: 'Навички', experience: 'Досвід', contact: 'Контакти',
    featured: 'Вибрані проєкти', more: 'Ще з GitHub', code: 'Код', live: 'Демо',
    downloadCv: 'Завантажити CV', getInTouch: "Зв'язатися", publications: 'Наукові публікації',
    education: 'Освіта', open: 'Відкрити публікацію', allRepos: 'Усі репозиторії на GitHub',
    contactTitle: 'Давайте будувати разом', contactText: 'Відкритий до пропозицій, співпраці та релокації.',
    close: 'Закрити', details: 'Детальніше',
  },
}

function initialLang() {
  try {
    const saved = localStorage.getItem('lang')
    if (LANGS.includes(saved)) return saved
  } catch {}
  return /^(uk|ru)/i.test(navigator.language) ? 'uk' : 'en'
}

export function useLang() {
  const [lang, setLang] = useState(initialLang)
  useEffect(() => {
    document.documentElement.lang = lang
    try { localStorage.setItem('lang', lang) } catch {}
  }, [lang])
  const t = (key) => UI[lang][key] ?? key
  // Localized field: {en, uk} -> string, falling back to the other language.
  const l = (v) => (v && typeof v === 'object' ? v[lang] || v.en || v.uk || '' : v || '')
  return { lang, setLang, t, l }
}
