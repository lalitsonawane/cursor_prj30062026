"use client";

import { motion } from "framer-motion";
import { BlogNavbar } from "@/components/blog/BlogNavbar";
import {
  AuthenticityInfographic,
  EconomyShiftInfographic,
  RedistributionInfographic,
  SandwichTopologyInfographic,
} from "@/components/blog/Infographics";
import {
  ArrowRight,
  BookOpen,
  Clock,
  Cpu,
  Scale,
  Shield,
  Sparkles,
} from "lucide-react";

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-60px" },
  transition: { duration: 0.5 },
};

function ModelSection({
  number,
  title,
  icon: Icon,
  accent,
  children,
}: {
  number: number;
  title: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  accent: string;
  children: React.ReactNode;
}) {
  return (
    <motion.section {...fadeUp} className="scroll-mt-24">
      <div className="mb-6 flex items-start gap-4">
        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border ${accent}`}
        >
          <Icon size={22} />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
            Model {number}
          </p>
          <h2 className="mt-1 text-2xl font-bold tracking-tight text-white sm:text-3xl">
            {title}
          </h2>
        </div>
      </div>
      <div className="prose-blog space-y-5 text-base leading-relaxed text-zinc-300">
        {children}
      </div>
    </motion.section>
  );
}

export default function AfterTheAlgorithmPage() {
  return (
    <>
      <BlogNavbar />

      <article className="relative overflow-hidden">
        {/* Hero */}
        <header className="relative px-6 pb-16 pt-32 sm:pt-40">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute left-1/2 top-1/4 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-violet-600/15 blur-[140px]" />
            <div className="absolute right-0 top-1/3 h-[300px] w-[300px] rounded-full bg-cyan-500/10 blur-[100px]" />
          </div>

          <div className="relative z-10 mx-auto max-w-3xl">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mb-6 flex flex-wrap items-center gap-4 text-sm text-zinc-400"
            >
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1">
                <BookOpen size={14} className="text-violet-400" />
                Essay
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Clock size={14} />
                12 min read
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.5 }}
              className="text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl"
            >
              After the Algorithm:{" "}
              <span className="bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">
                Redesigning Economics
              </span>{" "}
              for a Post-AGI World
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="mt-6 text-lg leading-relaxed text-zinc-400 sm:text-xl"
            >
              When the cost of intelligence drops to zero, the social contract
              that has held society together for centuries begins to unravel.
              Here are the economic models emerging to replace it.
            </motion.p>
          </div>
        </header>

        {/* Body */}
        <div className="mx-auto max-w-3xl px-6 pb-24">
          {/* Introduction */}
          <motion.div
            {...fadeUp}
            className="space-y-5 border-t border-white/10 pt-12 text-base leading-relaxed text-zinc-300"
          >
            <p>
              Imagine a world where the cost of intelligence effectively drops
              to zero. A world where Artificial General Intelligence (AGI) can
              draft legal contracts, discover new materials, and manage complex
              logistics better—and cheaper—than any human.
            </p>
            <p>
              For centuries, economics has been the study of scarcity: how we
              allocate limited resources like skilled labor, time, and capital.
              But AGI flips this script entirely. If a machine can perform any
              cognitive task (and eventually physical tasks via robotics), we move
              from an economy of scarcity to an economy of abundance.
            </p>
            <p>
              If cognitive labor is infinite, the current equation that holds
              society together—working for a wage to buy goods—collapses. We
              need entirely new frameworks. This isn&apos;t just a technological
              shift; it&apos;s a fundamental rewriting of the social contract.
              Here are the leading economic models emerging for a post-AGI
              future.
            </p>
          </motion.div>

          {/* Table of contents */}
          <motion.nav
            {...fadeUp}
            aria-label="Table of contents"
            className="my-12 rounded-2xl border border-white/10 bg-zinc-900/40 p-6"
          >
            <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-violet-400">
              In this essay
            </p>
            <ol className="space-y-2 text-sm">
              {[
                "The Compute & Energy Standard",
                "The Verification & Liability Economy",
                "The Redistributive Economy",
                "The Authenticity & Experience Premium",
              ].map((item, i) => (
                <li key={item}>
                  <a
                    href={`#model-${i + 1}`}
                    className="group flex items-center gap-2 text-zinc-400 transition hover:text-white"
                  >
                    <span className="font-mono text-xs text-zinc-600">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    {item}
                    <ArrowRight
                      size={14}
                      className="opacity-0 transition group-hover:opacity-100"
                    />
                  </a>
                </li>
              ))}
            </ol>
          </motion.nav>

          <div className="space-y-20">
            {/* Model 1 */}
            <div id="model-1">
              <ModelSection
                number={1}
                title="The Compute & Energy Standard (Resource-Based Economics)"
                icon={Cpu}
                accent="border-cyan-500/30 bg-cyan-500/10 text-cyan-400"
              >
                <p>
                  When cognitive skill is no longer scarce, the primary
                  bottlenecks in the economy become the physical resources needed
                  to run that intelligence. Forget currency pegged to gold or the
                  GDP of a nation; the future economy might be backed by
                  infrastructure.
                </p>
                <p>
                  In this model, wealth is measured in two key metrics:{" "}
                  <strong className="text-white">Compute Power</strong>{" "}
                  (processing capacity) and{" "}
                  <strong className="text-white">Energy</strong> (electricity
                  generation). Data centers and advanced power grids become the
                  new banks.
                </p>
                <p>
                  This represents a foundational shift in how we measure
                  economic value:
                </p>
                <EconomyShiftInfographic />
                <p>
                  Entities or nations that control advanced semiconductor
                  manufacturing and sustainable energy production will hold the
                  leverage. You might even see the rise of{" "}
                  <strong className="text-white">
                    &ldquo;Universal Basic Compute,&rdquo;
                  </strong>{" "}
                  where all citizens are allotted a specific quota of processing
                  time each month to generate their own goods, services, or
                  entertainment, rather than receiving a cash payment.
                </p>
              </ModelSection>
            </div>

            {/* Model 2 */}
            <div id="model-2">
              <ModelSection
                number={2}
                title="The Verification & Liability Economy"
                icon={Shield}
                accent="border-amber-500/30 bg-amber-500/10 text-amber-400"
              >
                <p>
                  If AGI can generate endless streams of code, complex drug
                  formulations, and legal documents in milliseconds, the
                  challenge isn&apos;t production—it&apos;s trust. How do we
                  know the generated code is secure? How do we know the drug is
                  safe?
                </p>
                <p>
                  The highest-paid human roles in a post-AGI economy will likely
                  not be about creating things, but about verifying them.
                  Economists predict a{" "}
                  <strong className="text-white">
                    &ldquo;sandwich topology&rdquo;
                  </strong>{" "}
                  workflow. Value migrates toward liability and cryptographic
                  provenance: proving that a system did exactly what it was
                  asked to do.
                </p>
                <p>This defines the new human role in high-value work:</p>
                <SandwichTopologyInfographic />
                <p>
                  The human auditor isn&apos;t just checking work; they are
                  lending their reputation and taking legal responsibility for
                  the AI&apos;s output. If a bridge designed by an AGI collapses,
                  it&apos;s the human verifier who faces consequences.
                </p>
              </ModelSection>
            </div>

            {/* Model 3 */}
            <div id="model-3">
              <ModelSection
                number={3}
                title="The Redistributive Economy (UBI, UBA, UBC)"
                icon={Scale}
                accent="border-violet-500/30 bg-violet-500/10 text-violet-400"
              >
                <p>
                  The risk of AGI is extreme wealth concentration. The capital
                  (the AGI models, data centers, and land) will be incredibly
                  productive, but if wages are zero, the vast majority of
                  consumers will have no money to buy the output. The entire
                  circular flow of the economy breaks down.
                </p>
                <p>
                  To manage abundance, deep redistribution is not just a moral
                  debate; it becomes an economic requirement. We must move past
                  traditional income taxes toward distributing the assets
                  themselves.
                </p>
                <RedistributionInfographic />
                <ul className="space-y-4 pl-0">
                  <li className="flex gap-3">
                    <span className="mt-1 font-mono text-sm font-bold text-violet-400">
                      UBI
                    </span>
                    <span>
                      <strong className="text-white">
                        Universal Basic Income:
                      </strong>{" "}
                      A regular, unconditional cash payment.
                    </span>
                  </li>
                  <li className="flex gap-3">
                    <span className="mt-1 font-mono text-sm font-bold text-cyan-400">
                      UBC
                    </span>
                    <span>
                      <strong className="text-white">
                        Universal Basic Compute:
                      </strong>{" "}
                      As mentioned above, a guaranteed quota of processing power.
                    </span>
                  </li>
                  <li className="flex gap-3">
                    <span className="mt-1 font-mono text-sm font-bold text-emerald-400">
                      UBA
                    </span>
                    <span>
                      <strong className="text-white">
                        Universal Basic Assets:
                      </strong>{" "}
                      This is the ultimate model for a post-work world. Instead
                      of receiving cash (which can inflate), governments
                      distribute direct equity in the AGI systems, the data
                      centers, or index funds of the fully automated economy.
                      Citizens become shareholders, receiving dividends from the
                      efficiency of the machine itself.
                    </span>
                  </li>
                </ul>
              </ModelSection>
            </div>

            {/* Model 4 */}
            <div id="model-4">
              <ModelSection
                number={4}
                title="The Authenticity & Experience Premium"
                icon={Sparkles}
                accent="border-rose-500/30 bg-rose-500/10 text-rose-400"
              >
                <p>
                  When utility is effectively zero cost—when an atomically
                  perfect, AGI-printed chair is nearly free—the economic value
                  of utility crashes. Value will then migrate to things that AGI
                  structurally cannot reproduce: human status, deep connection,
                  and verifiable authenticity.
                </p>
                <p>We will see an inverse relationship:</p>
                <AuthenticityInfographic />
                <ul className="space-y-3 pl-0">
                  <li className="flex gap-3">
                    <span className="text-zinc-500">→</span>
                    <span>
                      <strong className="text-white">
                        Mass-Produced Goods:
                      </strong>{" "}
                      Structurally worthless (atomic cost of materials).
                    </span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-zinc-500">→</span>
                    <span>
                      <strong className="text-white">Human-Made Goods:</strong>{" "}
                      Priceless (verifiably created through human time and
                      effort).
                    </span>
                  </li>
                </ul>
                <p>
                  A handmade ceramic mug will cost 100× more than an AI-printed
                  one, purely because a human spent time on it. The economy will
                  shift heavily toward hospitality, artisanal crafts, physical
                  experience, and high-level human care/mentorship—roles where
                  &ldquo;the human touch&rdquo; is the actual commodity.
                </p>
              </ModelSection>
            </div>
          </div>

          {/* Conclusion */}
          <motion.footer
            {...fadeUp}
            className="mt-20 border-t border-white/10 pt-12"
          >
            <h2 className="mb-6 text-2xl font-bold tracking-tight text-white sm:text-3xl">
              Conclusion
            </h2>
            <div className="space-y-5 text-base leading-relaxed text-zinc-300">
              <p>
                The transition to AGI means moving from an economy optimized for
                managing scarcity to one designed for distributing abundance. Our
                entire economic history is a guide for optimizing work; we have
                no map for optimizing leisure and distribution.
              </p>
              <p className="rounded-xl border border-violet-500/20 bg-violet-500/5 p-6 text-lg text-zinc-200">
                The technological challenge is building the AGI; the greater
                challenge will be ensuring the wealth it generates doesn&apos;t
                collapse the society it is meant to enhance.
              </p>
            </div>
          </motion.footer>
        </div>
      </article>
    </>
  );
}
