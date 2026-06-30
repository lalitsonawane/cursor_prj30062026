"use client";

import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { profile } from "@/data/profile";
import { SectionHeading } from "./SectionHeading";

export function Projects() {
  return (
    <section id="projects" className="px-6 py-24">
      <div className="mx-auto max-w-5xl">
        <SectionHeading
          id="04"
          title="Featured Projects"
          subtitle="A selection of work I'm proud of — from prototypes to production systems."
        />
        <div className="grid gap-6 md:grid-cols-2">
          {profile.projects.map((project, i) => (
            <motion.a
              key={project.title}
              href={project.href}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              className={`group relative flex flex-col rounded-2xl border border-white/8 bg-white/3 p-6 transition hover:border-violet-500/30 hover:bg-violet-500/5 ${
                project.featured && i === 0 ? "md:col-span-2" : ""
              }`}
            >
              <div className="mb-4 flex items-start justify-between">
                <h3 className="text-lg font-semibold text-white group-hover:text-violet-300">
                  {project.title}
                </h3>
                <ArrowUpRight
                  size={18}
                  className="shrink-0 text-zinc-500 transition group-hover:text-violet-400"
                />
              </div>
              <p className="mb-5 flex-1 text-sm leading-relaxed text-zinc-400">
                {project.description}
              </p>
              <ul className="flex flex-wrap gap-2">
                {project.tech.map((t) => (
                  <li
                    key={t}
                    className="rounded-full bg-zinc-900/80 px-2.5 py-0.5 text-xs text-zinc-400"
                  >
                    {t}
                  </li>
                ))}
              </ul>
            </motion.a>
          ))}
        </div>
      </div>
    </section>
  );
}
