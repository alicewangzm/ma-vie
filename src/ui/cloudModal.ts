/**
 * Cloud modal: a fluffy panel that billows in and covers ~80% of the screen
 * — the "look closer" surface for every chapter (diplomas, projects,
 * PawHearth shots, teaching, visions, hobbies). Content-driven so chapters
 * animate the same way; images are slots that show a soft placeholder until
 * the real file lands in /assets.
 */

export interface CloudStory {
  title: string;
  body: readonly string[];
  images?: readonly { src: string; alt: string; caption?: string }[];
  links?: readonly { label: string; href: string }[];
  /** A live same-origin page (e.g. a design prototype), scaled to fit. */
  embed?: { src: string; width: number; height: number; label: string };
}

let styled = false;

function ensureStyles(): void {
  if (styled) return;
  styled = true;
  const style = document.createElement('style');
  style.textContent = /* css */ `
    .wl-modal-backdrop {
      position: absolute;
      inset: 0;
      background: rgba(236, 216, 228, 0.35);
      backdrop-filter: blur(3px);
      opacity: 0;
      transition: opacity 0.5s ease;
      pointer-events: auto;
      z-index: 30;
    }
    .wl-modal-backdrop.visible { opacity: 1; }
    .wl-cloud {
      position: absolute;
      left: 50%;
      top: 50%;
      /* one square window into the memory — media scrolls sideways inside */
      width: min(84vw, 78vh, 44rem);
      aspect-ratio: 1;
      transform: translate(-50%, -50%) scale(0.86);
      background: rgba(255, 252, 246, 0.94);
      border-radius: 4rem;
      box-shadow:
        0 0 0 14px rgba(255, 252, 246, 0.35),
        0 0 60px 30px rgba(255, 252, 246, 0.45),
        -3rem -2rem 0 -1.2rem rgba(255, 252, 246, 0.94),
        3rem -2.4rem 0 -1rem rgba(255, 252, 246, 0.94),
        -2rem 2.2rem 0 -1.4rem rgba(255, 252, 246, 0.94),
        2.4rem 2rem 0 -1.1rem rgba(255, 252, 246, 0.94);
      opacity: 0;
      transition: opacity 0.5s ease, transform 0.5s cubic-bezier(0.2, 0.9, 0.3, 1.1);
      display: flex;
      flex-direction: column;
      pointer-events: auto;
    }
    .wl-modal-backdrop.visible .wl-cloud {
      opacity: 1;
      transform: translate(-50%, -50%) scale(1);
    }
    .wl-cloud-scroll {
      flex: 1;
      min-height: 0;
      overflow-y: auto;
      padding: 2.4rem 2.6rem 3rem;
      color: #4a3f5c;
    }
    .wl-cloud h3 {
      margin: 0 0 0.8em;
      text-align: center;
      font-size: 1.35rem;
      letter-spacing: 0.05em;
    }
    .wl-cloud p { margin: 0 0 0.7em; line-height: 1.7; }
    .wl-cloud-media { position: relative; margin: 1rem 0; }
    .wl-cloud-strip {
      /* the photo reel: one row, swipe or arrow left/right */
      display: flex;
      gap: 0.7rem;
      overflow-x: auto;
      scroll-snap-type: x mandatory;
      padding: 0.2rem 0 0.5rem;
      scrollbar-width: thin;
      -webkit-overflow-scrolling: touch;
    }
    .wl-cloud-strip figure {
      flex: 0 0 auto;
      margin: 0;
      text-align: center;
      scroll-snap-align: center;
    }
    .wl-cloud-strip img,
    .wl-cloud-strip video,
    .wl-cloud-img-slot {
      height: min(15rem, 34vh);
      width: auto;
      max-width: min(22rem, 62vw);
      border-radius: 1rem;
      display: block;
      object-fit: cover;
    }
    .wl-cloud-img-slot {
      width: 13rem;
      background: repeating-linear-gradient(45deg, #eee6f0, #eee6f0 10px, #f6eff6 10px, #f6eff6 20px);
      display: flex;
      align-items: center;
      justify-content: center;
      color: rgba(74, 63, 92, 0.6);
      font-size: 0.8rem;
      font-style: italic;
      padding: 0 1rem;
      text-align: center;
    }
    .wl-cloud-strip figcaption { font-size: 0.8rem; opacity: 0.75; margin-top: 0.3em; }
    .wl-strip-arrow {
      position: absolute;
      top: 50%;
      transform: translateY(-50%);
      width: 2.4rem;
      height: 2.4rem;
      border-radius: 50%;
      border: 1px solid rgba(74, 63, 92, 0.3);
      background: rgba(255, 250, 240, 0.94);
      color: #4a3f5c;
      font-size: 1.05rem;
      cursor: pointer;
      z-index: 2;
      box-shadow: 0 2px 8px rgba(74, 63, 92, 0.2);
    }
    .wl-strip-arrow:hover { background: rgba(255, 244, 214, 1); }
    .wl-strip-arrow:disabled { opacity: 0.25; cursor: default; }
    .wl-strip-arrow[data-dir='prev'] { left: -0.7rem; }
    .wl-strip-arrow[data-dir='next'] { right: -0.7rem; }
    .wl-cloud-embed {
      /* fixed-size window a live prototype is scaled into */
      margin: 1rem auto 0.5rem;
      overflow: hidden;
      border-radius: 1.4rem;
    }
    .wl-cloud-embed iframe {
      border: 0;
      transform-origin: top left;
      display: block;
      background: transparent;
    }
    .wl-cloud-links { display: flex; gap: 0.8rem; justify-content: center; flex-wrap: wrap; margin-top: 0.6rem; }
    .wl-cloud-links a {
      color: #4a3f5c;
      background: rgba(255, 244, 214, 0.9);
      border: 1px solid rgba(74, 63, 92, 0.3);
      border-radius: 999px;
      padding: 0.45em 1.4em;
      text-decoration: none;
      font-size: 0.9rem;
    }
    .wl-cloud-close {
      position: absolute;
      left: 50%;
      bottom: -1.1rem;
      transform: translateX(-50%);
      width: 2.6rem;
      height: 2.6rem;
      border-radius: 50%;
      border: 1px solid rgba(74, 63, 92, 0.35);
      background: rgba(255, 250, 240, 0.96);
      color: #4a3f5c;
      font-size: 1.1rem;
      cursor: pointer;
      box-shadow: 0 2px 10px rgba(74, 63, 92, 0.25);
    }
    .wl-cloud-close:hover { background: rgba(255, 244, 214, 1); }
    @media (prefers-reduced-motion: reduce) {
      .wl-modal-backdrop, .wl-cloud { transition-duration: 0.01s; }
    }
  `;
  document.head.appendChild(style);
}

export interface CloudModalHandle {
  close(): void;
  /** Resolves once the modal has fully closed and been removed. */
  closed: Promise<void>;
}

export function openCloudModal(parent: HTMLElement, story: CloudStory): CloudModalHandle {
  ensureStyles();
  const backdrop = document.createElement('div');
  backdrop.className = 'wl-modal-backdrop';

  const cloud = document.createElement('div');
  cloud.className = 'wl-cloud';
  cloud.setAttribute('role', 'dialog');
  cloud.setAttribute('aria-modal', 'true');
  cloud.setAttribute('aria-label', story.title);

  const scroll = document.createElement('div');
  scroll.className = 'wl-cloud-scroll';

  const h = document.createElement('h3');
  h.textContent = story.title;
  scroll.appendChild(h);

  for (const line of story.body) {
    const p = document.createElement('p');
    p.textContent = line;
    scroll.appendChild(p);
  }

  const isVideo = (src: string): boolean => /\.(mp4|webm|mov)$/i.test(src);
  if (story.images?.length) {
    const media = document.createElement('div');
    media.className = 'wl-cloud-media';
    const strip = document.createElement('div');
    strip.className = 'wl-cloud-strip';
    for (const img of story.images) {
      const fig = document.createElement('figure');
      if (isVideo(img.src)) {
        const v = document.createElement('video');
        v.src = img.src;
        v.controls = true;
        v.playsInline = true;
        v.preload = 'metadata';
        v.setAttribute('aria-label', img.alt);
        fig.appendChild(v);
      } else {
        const el = document.createElement('img');
        el.src = img.src;
        el.alt = img.alt;
        el.loading = 'lazy';
        el.addEventListener('error', () => {
          // image not dropped in /assets yet — show a soft slot instead
          const slot = document.createElement('div');
          slot.className = 'wl-cloud-img-slot';
          slot.textContent = `${img.alt} — drop ${img.src.replace('assets/', '')} into public/assets`;
          el.replaceWith(slot);
        });
        fig.appendChild(el);
      }
      if (img.caption) {
        const cap = document.createElement('figcaption');
        cap.textContent = img.caption;
        fig.appendChild(cap);
      }
      strip.appendChild(fig);
    }
    media.appendChild(strip);

    // arrows appear only when the reel actually overflows
    const makeArrow = (dir: 'prev' | 'next'): HTMLButtonElement => {
      const btn = document.createElement('button');
      btn.className = 'wl-strip-arrow';
      btn.dataset.dir = dir;
      btn.textContent = dir === 'prev' ? '‹' : '›';
      btn.setAttribute('aria-label', dir === 'prev' ? 'previous photos' : 'more photos');
      btn.addEventListener('click', () =>
        strip.scrollBy({
          left: (dir === 'next' ? 1 : -1) * strip.clientWidth * 0.8,
          behavior: 'smooth',
        }),
      );
      return btn;
    };
    const prev = makeArrow('prev');
    const next = makeArrow('next');
    media.append(prev, next);
    const updateArrows = (): void => {
      const scrollable = strip.scrollWidth > strip.clientWidth + 4;
      prev.style.display = next.style.display = scrollable ? '' : 'none';
      prev.disabled = strip.scrollLeft < 8;
      next.disabled = strip.scrollLeft > strip.scrollWidth - strip.clientWidth - 8;
    };
    strip.addEventListener('scroll', updateArrows, { passive: true });
    // media sizes settle as files load; capture-phase catches both kinds
    strip.addEventListener('load', updateArrows, true);
    strip.addEventListener('loadedmetadata', updateArrows, true);
    requestAnimationFrame(updateArrows);

    scroll.appendChild(media);
  }

  if (story.embed) {
    const { src, width, height, label } = story.embed;
    const wrap = document.createElement('div');
    wrap.className = 'wl-cloud-embed';
    const frame = document.createElement('iframe');
    frame.src = src;
    frame.title = label;
    frame.loading = 'lazy';
    frame.style.width = `${width}px`;
    frame.style.height = `${height}px`;
    wrap.appendChild(frame);
    scroll.appendChild(wrap);
    // scale the prototype to the room the cloud actually has
    requestAnimationFrame(() => {
      const maxW = scroll.clientWidth * 0.96;
      const maxH = Math.max(cloud.clientHeight * 0.66, 260);
      const s = Math.min(maxW / width, maxH / height, 1);
      frame.style.transform = `scale(${s})`;
      wrap.style.width = `${Math.round(width * s)}px`;
      wrap.style.height = `${Math.round(height * s)}px`;
    });
  }

  if (story.links?.length) {
    const row = document.createElement('div');
    row.className = 'wl-cloud-links';
    for (const link of story.links) {
      const a = document.createElement('a');
      a.href = link.href;
      a.textContent = link.label;
      a.target = '_blank';
      a.rel = 'noreferrer';
      row.appendChild(a);
    }
    scroll.appendChild(row);
  }

  const closeBtn = document.createElement('button');
  closeBtn.className = 'wl-cloud-close';
  closeBtn.textContent = '✕';
  closeBtn.setAttribute('aria-label', 'close');

  cloud.append(scroll, closeBtn);
  backdrop.appendChild(cloud);
  parent.appendChild(backdrop);
  requestAnimationFrame(() => backdrop.classList.add('visible'));

  let resolveClosed!: () => void;
  const closed = new Promise<void>((res) => (resolveClosed = res));

  const close = (): void => {
    backdrop.querySelectorAll('video').forEach((v) => v.pause());
    backdrop.classList.remove('visible');
    window.removeEventListener('keydown', onKey);
    setTimeout(() => {
      backdrop.remove();
      resolveClosed();
    }, 520);
  };
  const onKey = (e: KeyboardEvent): void => {
    if (e.key === 'Escape') close();
  };

  closeBtn.addEventListener('click', close);
  backdrop.addEventListener('click', (e) => {
    if (e.target === backdrop) close();
  });
  window.addEventListener('keydown', onKey);
  closeBtn.focus();

  return { close, closed };
}
