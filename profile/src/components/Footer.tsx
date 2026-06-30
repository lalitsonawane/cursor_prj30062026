import { profile } from "@/data/profile";

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-white/8 px-6 py-8">
      <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 sm:flex-row">
        <p className="text-sm text-zinc-500">
          © {year} {profile.name}. Built with Next.js & Tailwind CSS.
        </p>
        <a
          href="#"
          className="text-sm text-zinc-500 transition hover:text-zinc-300"
        >
          Back to top ↑
        </a>
      </div>
    </footer>
  );
}
