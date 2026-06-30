"use client";

import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { profile } from "@/data/profile";

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "border-b border-white/10 bg-[#09090b]/80 backdrop-blur-xl"
          : "bg-transparent"
      }`}
    >
      <nav className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6">
        <a
          href="#"
          className="text-sm font-semibold tracking-tight text-white"
        >
          {profile.name.split(" ")[0]}
          <span className="text-violet-400">.</span>
        </a>

        <ul className="hidden items-center gap-8 md:flex">
          {profile.nav.map((item) => (
            <li key={item.href}>
              <a
                href={item.href}
                className="text-sm text-zinc-400 transition-colors hover:text-white"
              >
                {item.label}
              </a>
            </li>
          ))}
        </ul>

        <a
          href="#contact"
          className="hidden rounded-full bg-violet-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-violet-400 md:inline-flex"
        >
          Get in touch
        </a>

        <button
          type="button"
          aria-label={open ? "Close menu" : "Open menu"}
          className="inline-flex text-zinc-300 md:hidden"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </nav>

      {open && (
        <div className="border-b border-white/10 bg-[#09090b]/95 px-6 py-4 backdrop-blur-xl md:hidden">
          <ul className="flex flex-col gap-4">
            {profile.nav.map((item) => (
              <li key={item.href}>
                <a
                  href={item.href}
                  className="block text-sm text-zinc-300"
                  onClick={() => setOpen(false)}
                >
                  {item.label}
                </a>
              </li>
            ))}
            <li>
              <a
                href="#contact"
                className="inline-flex rounded-full bg-violet-500 px-4 py-2 text-sm font-medium text-white"
                onClick={() => setOpen(false)}
              >
                Get in touch
              </a>
            </li>
          </ul>
        </div>
      )}
    </header>
  );
}
