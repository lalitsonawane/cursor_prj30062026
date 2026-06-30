export const profile = {
  name: "Alex Morgan",
  title: "Full-Stack Developer & Product Builder",
  tagline:
    "I craft fast, accessible web experiences and ship products from idea to production.",
  location: "San Francisco, CA",
  email: "hello@alexmorgan.dev",
  avatar: "/avatar.svg",
  social: [
    { label: "GitHub", href: "https://github.com", icon: "github" as const },
    { label: "LinkedIn", href: "https://linkedin.com", icon: "linkedin" as const },
    { label: "X", href: "https://x.com", icon: "twitter" as const },
    { label: "Email", href: "mailto:hello@alexmorgan.dev", icon: "mail" as const },
  ],
  about: [
    "I'm a software engineer with 6+ years building products across startups and scale-ups. I care deeply about performance, developer experience, and interfaces that feel effortless.",
    "When I'm not coding, you'll find me contributing to open source, mentoring early-career developers, or exploring new frameworks at the edge of the web platform.",
  ],
  skills: [
  {
    category: "Frontend",
    items: ["React", "Next.js", "TypeScript", "Tailwind CSS", "React Native"],
  },
  {
    category: "Backend",
    items: ["Node.js", "Python", "FastAPI", "PostgreSQL", "GraphQL"],
  },
  {
    category: "Tools & Cloud",
    items: ["Docker", "AWS", "Vercel", "CI/CD", "Figma"],
  },
  ],
  experience: [
    {
      role: "Senior Software Engineer",
      company: "Nova Labs",
      period: "2022 — Present",
      description:
        "Lead frontend architecture for a B2B SaaS platform serving 50k+ users. Reduced page load times by 40% and introduced a design system adopted across 4 product teams.",
    },
    {
      role: "Software Engineer",
      company: "Pixel & Co.",
      period: "2019 — 2022",
      description:
        "Built customer-facing dashboards and internal tooling. Shipped a real-time analytics feature that became a core product differentiator.",
    },
    {
      role: "Junior Developer",
      company: "StartHub",
      period: "2018 — 2019",
      description:
        "Full-stack development on an early-stage marketplace. Owned the checkout flow and payment integrations from prototype to launch.",
    },
  ],
  projects: [
    {
      title: "Surroundings Scanner",
      description:
        "Hybrid mobile app with on-device vision overlays and GPU-powered cloud enrichment for real-time scene understanding.",
      tech: ["Expo", "FastAPI", "PyTorch", "TypeScript"],
      href: "#",
      featured: true,
    },
    {
      title: "DevPulse",
      description:
        "Developer productivity dashboard aggregating GitHub, CI, and incident data into a single real-time view.",
      tech: ["Next.js", "tRPC", "Prisma", "Redis"],
      href: "#",
      featured: true,
    },
    {
      title: "OpenForm",
      description:
        "Open-source form builder with drag-and-drop schema generation and embeddable React components.",
      tech: ["React", "Zod", "Tailwind"],
      href: "#",
      featured: false,
    },
  ],
  nav: [
    { label: "About", href: "#about" },
    { label: "Skills", href: "#skills" },
    { label: "Experience", href: "#experience" },
    { label: "Projects", href: "#projects" },
    { label: "Contact", href: "#contact" },
  ],
};
