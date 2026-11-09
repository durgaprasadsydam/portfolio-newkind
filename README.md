# NewKind — static website

Plain HTML + Tailwind CSS + GSAP (ScrollTrigger, SplitText) + Lenis. No framework, no build step needed to run it.

## Pages
| File | Page |
|---|---|
| `index.html` | Home |
| `fertility.html` | Fertility programs (anchors: `#natural-fertility`, `#iui-ivf`, `#egg-freezing`, `#pmos-balance`) |
| `pregnancy-wellness.html` | Pregnancy Wellness |
| `postpartum-recovery.html` | Postpartum Recovery |
| `weight-loss.html` | Weight Loss (`#glp1`, `#sustainable`) |
| `contact.html` | Contact + 4-step Program Finder (`#program-finder`) |

## 1. Add your images
Copy your existing `assets/` folder (from the current Netlify site) into this folder. The pages use the **same file names and paths**, e.g. `assets/program-fertility.jpg`, `assets/care-sandeep.png`, `assets/fertility/concern-low-amh.jpg`, `assets/programs/postpartum-support.png`.
Until an image exists, a warm gradient placeholder is shown instead of a broken image.
Already included: `assets/newkind-logo.png` (your logo).

### Logo
The white logo PNG is used as a CSS mask (`.logo-mark` in `css/style.css`), so it automatically turns plum on the light menu bar and white on dark backgrounds.

### Home hero
A full-bleed photo (`assets/hero.jpg` — "Woman sitting on brown stone near green leaf trees" from Pexels, free licence, no attribution required; gently colour-graded for a soft misty-green mood) inside a rounded frame, with a light serif headline (Fraunces) at the bottom-left, a short intro and outline pill buttons. The photo has a slow Ken Burns drift and reacts slightly to the mouse; the headline reveals line by line on load.
The navigation is a floating, centred glass pill (uppercase links + "Book a call" pill) on every page; it turns light once you scroll past the hero.
`assets/hero.mp4` and `assets/hero-poster.jpg` are no longer used and can be deleted.

## 2. Run locally
```
npx serve .        # or: python3 -m http.server
```

## 3. Deploy
Drag the folder onto Netlify (or any static host). Both forms (`discovery-call`, `program-finder`) are already set up for **Netlify Forms** — submissions appear in your Netlify dashboard automatically.

## Brand colours
Two brand colours run through the whole site — **Rose is primary, Sage is secondary**. Ink and Page are neutrals for text and backgrounds.

| Role | Hex | Tailwind | Used for |
|---|---|---|---|
| Primary · Rose | #C16AA1 | `rose` | Buttons, links, highlighted heading words, active states |
| Primary · Rose deep | #A9548A | `rose-deep` | Gradients / hover |
| Primary · Rose tint | #F8EBF3 | `rose-50` | Soft section backgrounds |
| Secondary · Sage | #9AC1BE | `sage` | Secondary buttons (`.btn-secondary`), "whole picture" band, highlighted words on dark sections, icons, badges |
| Secondary · Sage deep | #4A7B77 | `sage-deep` | Small sage text on light backgrounds (readability) |
| Secondary · Sage tint | #EEF5F4 | `sage-50` | Alternate section backgrounds |
| Neutral · Ink | #242833 | `ink` | Text, dark sections, footer |
| Neutral · Page | #F8F9FB | `page` | Main background |

## Editing styles
- `css/style.css` — custom styles (buttons, nav, marquees, accordions…)
- `css/tailwind.css` — compiled Tailwind. If you add new Tailwind classes to the HTML, rebuild it:
  ```
  npx tailwindcss@3 -i src/input.css -o css/tailwind.css --minify
  ```
- Brand colours live in `tailwind.config.js` and the `:root` variables at the top of `css/style.css`.

## Animations (`js/main.js`)
Add these attributes to any element:
- `data-reveal` — fade up on scroll (`="left"`, `="right"`, `="scale"`; `data-delay=".2"`)
- `data-stagger` — children animate in one after another
- `data-split` — heading reveals line by line
- `data-img-reveal` — image wipes in with a zoom
- `data-parallax="20"` — parallax depth
- `data-count="100" data-suffix="%"` — number counter
- `data-scrub-text` — words brighten as you scroll
- `data-marquee` / `data-marquee="reverse"` — infinite scroller that speeds up with scroll velocity
- `data-open-call` (or `data-open-call="Fertility"`) — opens the Book-a-call dialog

Also included: page-transition curtain, smooth scroll, hiding/glass nav, stacking "How it works" cards, pinned horizontal scroll (Fertility → What's included), magnetic buttons, reduced-motion support.
