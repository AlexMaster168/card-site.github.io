import { useEffect, useRef, useState } from 'preact/hooks'
import { asset } from '../lib/data.js'
import { Icon } from './icons.jsx'

export function ProjectModal({ p, i18n, onClose }) {
  const { l, t } = i18n
  const ref = useRef()
  const [idx, setIdx] = useState(0)
  const images = p.images || []
  const go = (d) => setIdx((i) => (i + d + images.length) % images.length)

  useEffect(() => {
    ref.current.showModal()
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  useEffect(() => {
    if (images.length < 2) return
    const onKey = (e) => {
      if (e.key === 'ArrowRight') go(1)
      if (e.key === 'ArrowLeft') go(-1)
    }
    addEventListener('keydown', onKey)
    return () => removeEventListener('keydown', onKey)
  }, [images.length])

  return (
    <dialog ref={ref} class="modal" onClose={onClose} onClick={(e) => e.target === ref.current && ref.current.close()}>
      <div class="modal__box">
        <button class="modal__close" onClick={() => ref.current.close()} aria-label={t('close')}><Icon name="close" /></button>
        {images.length > 0 && (
          <div class="gallery">
            <img src={asset(images[idx])} alt={p.title} />
            {images.length > 1 && (
              <>
                <button class="gallery__nav gallery__nav--prev" onClick={() => go(-1)} aria-label="Previous"><Icon name="chevronLeft" /></button>
                <button class="gallery__nav gallery__nav--next" onClick={() => go(1)} aria-label="Next"><Icon name="chevron" /></button>
                <div class="gallery__dots">
                  {images.map((_, i) => <button class={i === idx ? 'active' : ''} onClick={() => setIdx(i)} aria-label={`${i + 1}`} />)}
                </div>
              </>
            )}
          </div>
        )}
        <div class="modal__body">
          <div class="card__head">
            <h2>{p.title}</h2>
            {p.year && <span class="mono muted">{p.year}</span>}
          </div>
          <p class="modal__tagline">{l(p.tagline)}</p>
          {l(p.description) && <p>{l(p.description)}</p>}
          {p.tech?.length > 0 && <ul class="chips">{p.tech.map((s) => <li>{s}</li>)}</ul>}
          <div class="hero__actions">
            {p.github && <a class="btn btn--primary" href={p.github} target="_blank" rel="noopener"><Icon name="github" /> {t('code')}</a>}
            {p.demo && <a class="btn" href={p.demo} target="_blank" rel="noopener"><Icon name="external" /> {t('live')}</a>}
          </div>
        </div>
      </div>
    </dialog>
  )
}
