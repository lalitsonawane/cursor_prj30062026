# Personal Profile Website

A modern single-page personal portfolio built with the latest web stack.

## Stack

- **Next.js 16** — App Router, React Server Components, Turbopack
- **React 19** — Latest React with concurrent features
- **TypeScript** — Type-safe development
- **Tailwind CSS v4** — Utility-first styling with CSS-first config
- **Framer Motion** — Smooth scroll-triggered animations
- **Lucide React** — Clean, consistent icons

## Sections

1. **Hero** — Name, title, CTA buttons, social links
2. **About** — Bio and key stats
3. **Skills** — Technology categories and tags
4. **Experience** — Timeline of roles
5. **Projects** — Featured work with tech stacks
6. **Contact** — Email CTA and social links

## Customize

Edit `src/data/profile.ts` to update your name, bio, skills, experience, projects, and social links. No other files need to change for basic personalization.

## Commands

```bash
cd profile
npm install
npm run dev      # http://localhost:3000
npm run build
npm run start
npm run lint
```

## Deploy

Deploy to [Vercel](https://vercel.com) with root directory set to `profile`, or any platform that supports Next.js.
