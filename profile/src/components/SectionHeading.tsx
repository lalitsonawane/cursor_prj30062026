"use client";

import { motion } from "framer-motion";

type SectionHeadingProps = {
  id: string;
  title: string;
  subtitle?: string;
};

export function SectionHeading({ id, title, subtitle }: SectionHeadingProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.5 }}
      className="mb-12"
    >
      <p className="mb-2 text-sm font-medium uppercase tracking-widest text-violet-400">
        {id}
      </p>
      <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
        {title}
      </h2>
      {subtitle && (
        <p className="mt-3 max-w-2xl text-zinc-400">{subtitle}</p>
      )}
    </motion.div>
  );
}
