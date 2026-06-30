"use client";

import { motion } from "framer-motion";
import { Send } from "lucide-react";
import { profile } from "@/data/profile";
import { SectionHeading } from "./SectionHeading";
import { SocialLinks } from "./SocialLinks";

export function Contact() {
  return (
    <section id="contact" className="px-6 py-24">
      <div className="mx-auto max-w-5xl">
        <SectionHeading
          id="05"
          title="Get In Touch"
          subtitle="Have a project in mind or just want to say hello? I'd love to hear from you."
        />
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="rounded-2xl border border-white/8 bg-gradient-to-br from-violet-500/10 to-cyan-500/5 p-8 sm:p-12"
        >
          <div className="flex flex-col items-center text-center">
            <p className="mb-2 text-2xl font-semibold text-white sm:text-3xl">
              Let&apos;s build something great.
            </p>
            <p className="mb-8 max-w-md text-zinc-400">
              I&apos;m currently open to freelance projects and full-time
              opportunities. Drop me a line and I&apos;ll get back within 48
              hours.
            </p>
            <a
              href={`mailto:${profile.email}`}
              className="mb-8 inline-flex items-center gap-2 rounded-full bg-violet-500 px-8 py-3.5 text-sm font-medium text-white transition hover:bg-violet-400"
            >
              <Send size={16} />
              {profile.email}
            </a>
            <SocialLinks />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
