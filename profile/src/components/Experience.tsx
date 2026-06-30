"use client";

import { motion } from "framer-motion";
import { profile } from "@/data/profile";
import { SectionHeading } from "./SectionHeading";

export function Experience() {
  return (
    <section id="experience" className="px-6 py-24">
      <div className="mx-auto max-w-5xl">
        <SectionHeading
          id="03"
          title="Experience"
          subtitle="Roles where I've grown as an engineer and shipped meaningful work."
        />
        <div className="relative space-y-8 before:absolute before:inset-y-0 before:left-[7px] before:w-px before:bg-white/10 md:before:left-1/2 md:before:-translate-x-px">
          {profile.experience.map((job, i) => (
            <motion.div
              key={job.company}
              initial={{ opacity: 0, x: i % 2 === 0 ? -24 : 24 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5 }}
              className={`relative flex flex-col gap-4 md:w-1/2 ${
                i % 2 === 0
                  ? "md:mr-auto md:pr-12 md:text-right"
                  : "md:ml-auto md:pl-12"
              }`}
            >
              <div
                className={`absolute top-1 h-3.5 w-3.5 rounded-full border-2 border-violet-500 bg-[#09090b] ${
                  i % 2 === 0
                    ? "left-0 md:left-auto md:right-[-7px]"
                    : "left-0 md:left-[-7px]"
                }`}
              />
              <div className="rounded-2xl border border-white/8 bg-white/3 p-6 pl-8 md:pl-6">
                <p className="mb-1 text-xs font-medium uppercase tracking-wider text-violet-400">
                  {job.period}
                </p>
                <h3 className="text-lg font-semibold text-white">{job.role}</h3>
                <p className="mb-3 text-sm text-zinc-400">{job.company}</p>
                <p className="text-sm leading-relaxed text-zinc-500">
                  {job.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
