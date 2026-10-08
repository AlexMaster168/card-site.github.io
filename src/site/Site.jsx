import { useEffect, useState } from 'preact/hooks'
import { LANGS, useLang } from '../lib/i18n.js'
import { asset } from '../lib/data.js'
import { useReveal } from '../lib/reveal.js'
import { Icon } from './icons.jsx'
import { ProjectModal } from './ProjectModal.jsx'

const NAV = ['projects', 'research', 'skills', 'experience', 'contact']

export function Site({ data }) {
  const i18n = useLang()
  const { t, l, lang, setLang } = i18n
  const [open, setOpen] = useState(null)
  const { profile, projects } = data
  const featured = projects.filter((p) => p.featured)
  const rest = projects.filter((p) => !p.featured)

  useReveal([lang])
  useEffect(() => {
    document.title = `${l(profile.name)} — ${l(profile.role).split('·')[0].trim()}`
  }, [lang])

  return (
    <>
      <header class="topbar">
        <div class="container topbar__inner">
          <a href="#top" class="logo">{l(profile.name).split(' ').map((w) => w[0]).join('')}<span>.</span></a>
          <nav class="nav">
            {NAV.map((id) => <a href={`#${id}`}>{t(id)}</a>)}
          </nav>
          <div class="lang">
            {LANGS.map((code) => (
              <button class={code === lang ? 'active' : ''} onClick={() => setLang(code)}>{code === 'uk' ? 'UA' : 'EN'}</button>
            ))}
          </div>
        </div>
      </header>

      <main id="top">
        <section class="hero container">
          <div class="hero__glow" aria-hidden="true" />
          <p class="eyebrow mono"><Icon name="pin" size={14} /> {l(profile.location)}</p>
          <h1 class="hero__name">{l(profile.name)}</h1>
          <p class="hero__role">{l(profile.role)}</p>
          <p class="hero__summary">{l(profile.summary)}</p>
          <div class="hero__actions">
            {profile.cv && <a class="btn btn--primary" href={asset(profile.cv)} download><Icon name="download" /> {t('downloadCv')}</a>}
            <a class="btn" href="#contact">{t('getInTouch')} <Icon name="arrow" /></a>
          </div>
          <Socials profile={profile} />
          {data.stats?.length > 0 && (
            <dl class="stats">
              {data.stats.map((s) => (
                <div class="stat" data-reveal>
                  <dt>{l(s.label)}</dt>
                  <dd>{s.value}</dd>
                </div>
              ))}
            </dl>
          )}
        </section>

        <section id="projects" class="section container">
          <SectionTitle n="01" title={t('featured')} />
          <div class="projects">
            {featured.map((p) => <ProjectCard key={p.id} p={p} i18n={i18n} onOpen={() => setOpen(p)} />)}
          </div>
          {rest.length > 0 && (
            <>
              <h3 class="subhead">{t('more')}</h3>
              <div class="mini-projects">
                {rest.map((p) => (
                  <button key={p.id} class="mini" data-reveal onClick={() => setOpen(p)}>
                    {p.images?.[0] && <img src={asset(p.images[0])} alt="" loading="lazy" />}
                    <div class="mini__body">
                      <strong>{p.title}</strong>
                      <span>{l(p.tagline)}</span>
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}
          {profile.github && (
            <a class="link-more" href={profile.github} target="_blank" rel="noopener">{t('allRepos')} <Icon name="arrow" size={16} /></a>
          )}
        </section>

        {data.publications?.length > 0 && (
          <section id="research" class="section container">
            <SectionTitle n="02" title={t('publications')} />
            <div class="pubs">
              {data.publications.map((pub) => (
                <article class="pub" data-reveal>
                  <p class="pub__kind mono">{l(pub.kind)}</p>
                  <h3>{l(pub.title)}</h3>
                  <p class="pub__venue">{l(pub.venue)}</p>
                  <p>{l(pub.summary)}</p>
                  {pub.metrics?.length > 0 && (
                    <dl class="pub__metrics">
                      {pub.metrics.map((m) => <div><dd>{m.value}</dd><dt>{l(m.label)}</dt></div>)}
                    </dl>
                  )}
                  {pub.link && <a class="link-more" href={pub.link} target="_blank" rel="noopener">{t('open')} <Icon name="external" size={15} /></a>}
                </article>
              ))}
            </div>
          </section>
        )}

        {data.skills?.length > 0 && (
          <section id="skills" class="section container">
            <SectionTitle n="03" title={t('skills')} />
            <div class="skills">
              {data.skills.map((g) => (
                <div class="skill-group" data-reveal>
                  <h3 class="mono">{l(g.group)}</h3>
                  <ul class="chips">{g.items.map((s) => <li>{s}</li>)}</ul>
                </div>
              ))}
            </div>
          </section>
        )}

        <section id="experience" class="section container">
          <SectionTitle n="04" title={t('experience')} />
          <div class="timeline-wrap">
            <ol class="timeline">
              {data.experience?.map((e) => (
                <li data-reveal>
                  <span class="timeline__period mono">{e.period}</span>
                  <h3>{l(e.role)}</h3>
                  <p>{l(e.description)}</p>
                </li>
              ))}
            </ol>
            {data.education?.length > 0 && (
              <aside class="edu" data-reveal>
                <h3 class="mono">{t('education')}</h3>
                {data.education.map((e) => (
                  <div class="edu__item">
                    <strong>{l(e.degree)}</strong>
                    <span>{l(e.school)}</span>
                    <span class="mono muted">{e.period}</span>
                  </div>
                ))}
              </aside>
            )}
          </div>
        </section>

        <section id="contact" class="section container contact" data-reveal>
          <h2>{t('contactTitle')}</h2>
          <p>{t('contactText')}</p>
          {profile.email && <a class="contact__mail" href={`mailto:${profile.email}`}>{profile.email}</a>}
          <Socials profile={profile} />
        </section>
      </main>

      <footer class="footer container mono">
        © {new Date().getFullYear()} {l(profile.name)}
      </footer>

      {open && <ProjectModal p={open} i18n={i18n} onClose={() => setOpen(null)} />}
    </>
  )
}

function SectionTitle({ n, title }) {
  return (
    <h2 class="section__title" data-reveal>
      <span class="mono">{n}</span>
      {title}
    </h2>
  )
}

function Socials({ profile }) {
  const links = [
    ['github', profile.github, 'GitHub'],
    ['linkedin', profile.linkedin, 'LinkedIn'],
    ['telegram', profile.telegram, 'Telegram'],
    ['mail', profile.email && `mailto:${profile.email}`, 'Email'],
  ].filter(([, href]) => href)
  return (
    <div class="socials">
      {links.map(([icon, href, label]) => (
        <a href={href} target="_blank" rel="noopener" aria-label={label} title={label}><Icon name={icon} size={20} /></a>
      ))}
    </div>
  )
}

function ProjectCard({ p, i18n, onOpen }) {
  const { l, t } = i18n
  const cover = p.images?.[0]
  return (
    <article class="card" data-reveal>
      <button class="card__media" onClick={onOpen} aria-label={`${t('details')}: ${p.title}`}>
        {cover ? <img src={asset(cover)} alt="" loading="lazy" /> : <div class="card__placeholder mono">{p.title}</div>}
      </button>
      <div class="card__body">
        <div class="card__head">
          <h3><button onClick={onOpen}>{p.title}</button></h3>
          {p.year && <span class="mono muted">{p.year}</span>}
        </div>
        <p class="card__tagline">{l(p.tagline)}</p>
        <ul class="chips chips--sm">{p.tech?.slice(0, 6).map((s) => <li>{s}</li>)}</ul>
        <div class="card__links">
          {p.github && <a href={p.github} target="_blank" rel="noopener"><Icon name="github" size={16} /> {t('code')}</a>}
          {p.demo && <a href={p.demo} target="_blank" rel="noopener"><Icon name="external" size={16} /> {t('live')}</a>}
          <button class="card__more" onClick={onOpen}>{t('details')} <Icon name="chevron" size={16} /></button>
        </div>
      </div>
    </article>
  )
}
