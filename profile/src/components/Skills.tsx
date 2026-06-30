"use client";

import { motion } from "framer-motion";
import { profile } from "@/data/profile";
import { SectionHeading } from "./SectionHeading";

export function Skills() {
  return (
    <section id="skills" className="px-6 py-24">
      <div className="mx-auto max-w-5xl">
        <SectionHeading
          id="02"
          title="Skills & Technologies"
          subtitle="Tools and frameworks I use to build reliable, scalable products."
        />
        <div className="grid gap-6 md:grid-cols-3">
          {profile.skills.map((group, i) => (
            <motion.div
              key={group.category}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              className="rounded-2xl border border-white/8 bg-white/3 p-6"
            >
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-violet-400">
                {group.category}
              </h3>
              <ul className="flex flex-wrap gap-2">
                {group.items.map((skill) => (
                  <li
                    key={skill}
                    className="rounded-full border border-white/10 bg-zinc-900/60 px-3 py-1 text-sm text-zinc-300"
                  >
                    {skill}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
