"use client";

import { motion } from "framer-motion";
import { profile } from "@/data/profile";
import { SectionHeading } from "./SectionHeading";

export function About() {
  return (
    <section id="about" className="px-6 py-24">
      <div className="mx-auto max-w-5xl">
        <SectionHeading
          id="01"
          title="About Me"
          subtitle="A little background on who I am and what drives my work."
        />
        <div className="grid gap-8 md:grid-cols-2">
          {profile.about.map((paragraph, i) => (
            <motion.p
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              className="text-base leading-relaxed text-zinc-400"
            >
              {paragraph}
            </motion.p>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-4"
        >
          {[
            { value: "6+", label: "Years experience" },
            { value: "30+", label: "Projects shipped" },
            { value: "12", label: "Open source repos" },
            { value: "4", label: "Tech stacks" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-2xl border border-white/8 bg-white/3 p-5 text-center"
            >
              <p className="text-2xl font-bold text-white">{stat.value}</p>
              <p className="mt-1 text-xs text-zinc-500">{stat.label}</p>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
