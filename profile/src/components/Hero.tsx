"use client";

import { motion } from "framer-motion";
import { ArrowDown, MapPin } from "lucide-react";
import { profile } from "@/data/profile";
import { SocialLinks } from "./SocialLinks";

export function Hero() {
  return (
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden px-6 pt-16">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-1/3 h-[480px] w-[480px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet-600/20 blur-[120px]" />
        <div className="absolute right-1/4 top-1/2 h-[320px] w-[320px] rounded-full bg-cyan-500/10 blur-[100px]" />
      </div>

      <div className="relative z-10 mx-auto flex max-w-3xl flex-col items-center text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="mb-8 h-28 w-28 overflow-hidden rounded-full border-2 border-violet-500/40 bg-zinc-900 shadow-2xl shadow-violet-500/20"
        >
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-violet-600 to-cyan-500 text-4xl font-bold text-white">
            {profile.name
              .split(" ")
              .map((n) => n[0])
              .join("")}
          </div>
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="mb-3 flex items-center gap-1.5 text-sm text-zinc-400"
        >
          <MapPin size={14} className="text-violet-400" />
          {profile.location}
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="mb-4 text-4xl font-bold tracking-tight text-white sm:text-6xl"
        >
          Hi, I&apos;m{" "}
          <span className="bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">
            {profile.name}
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="mb-2 text-lg font-medium text-zinc-300 sm:text-xl"
        >
          {profile.title}
        </motion.p>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="mb-8 max-w-xl text-base leading-relaxed text-zinc-400"
        >
          {profile.tagline}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="mb-10 flex flex-wrap items-center justify-center gap-4"
        >
          <a
            href="#projects"
            className="rounded-full bg-violet-500 px-6 py-3 text-sm font-medium text-white transition hover:bg-violet-400"
          >
            View my work
          </a>
          <a
            href="#contact"
            className="rounded-full border border-white/15 px-6 py-3 text-sm font-medium text-zinc-200 transition hover:border-white/30 hover:bg-white/5"
          >
            Contact me
          </a>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.5 }}
        >
          <SocialLinks />
        </motion.div>

        <motion.a
          href="#about"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9, duration: 0.5 }}
          className="absolute bottom-10 text-zinc-500 transition hover:text-zinc-300"
          aria-label="Scroll to about section"
        >
          <ArrowDown size={20} className="animate-bounce" />
        </motion.a>
      </div>
    </section>
  );
}
