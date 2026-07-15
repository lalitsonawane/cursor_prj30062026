import { Cpu, Zap, Users, Shield, Brain, CheckCircle2, Sparkles, Hand } from "lucide-react";

export function EconomyShiftInfographic() {
  return (
    <figure className="my-10 overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/50 p-6 sm:p-8">
      <figcaption className="mb-6 text-center text-sm font-medium text-zinc-400">
        The primary shift in the post-AGI world
      </figcaption>
      <div className="grid gap-6 md:grid-cols-[1fr_auto_1fr] md:items-center">
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-6 text-center">
          <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-red-400">
            Traditional Economy
          </p>
          <div className="flex flex-col items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-500/20">
              <Users className="text-red-400" size={24} />
            </div>
            <div>
              <p className="font-semibold text-white">Human Labor</p>
              <p className="mt-1 text-sm text-zinc-400">Scarce cognitive skill</p>
            </div>
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-500/20">
              <span className="text-lg font-bold text-red-400">$</span>
            </div>
            <div>
              <p className="font-semibold text-white">Physical Capital</p>
              <p className="mt-1 text-sm text-zinc-400">Factories, land, machinery</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center gap-2 px-4">
          <div className="hidden h-px w-16 bg-gradient-to-r from-red-500/50 to-cyan-500/50 md:block" />
          <span className="rounded-full border border-violet-500/30 bg-violet-500/10 px-4 py-2 text-xs font-bold uppercase tracking-wider text-violet-300">
            AGI Shift
          </span>
          <div className="hidden h-px w-16 bg-gradient-to-r from-violet-500/50 to-cyan-500/50 md:block" />
        </div>

        <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-6 text-center">
          <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-cyan-400">
            Resource-Based Economy
          </p>
          <div className="flex flex-col items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-cyan-500/20">
              <Cpu className="text-cyan-400" size={24} />
            </div>
            <div>
              <p className="font-semibold text-white">Compute Power</p>
              <p className="mt-1 text-sm text-zinc-400">Processing capacity</p>
            </div>
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-cyan-500/20">
              <Zap className="text-cyan-400" size={24} />
            </div>
            <div>
              <p className="font-semibold text-white">Energy</p>
              <p className="mt-1 text-sm text-zinc-400">Electricity generation</p>
            </div>
          </div>
        </div>
      </div>
    </figure>
  );
}

export function SandwichTopologyInfographic() {
  const steps = [
    {
      label: "Intent",
      sublabel: "Human sets direction",
      icon: Brain,
      color: "violet",
      position: "top",
    },
    {
      label: "Execution",
      sublabel: "AGI handles heavy lifting",
      icon: Cpu,
      color: "cyan",
      position: "middle",
    },
    {
      label: "Verification & Liability",
      sublabel: "Human accepts responsibility",
      icon: Shield,
      color: "amber",
      position: "bottom",
    },
  ];

  const colorMap = {
    violet: {
      border: "border-violet-500/30",
      bg: "bg-violet-500/10",
      text: "text-violet-400",
      icon: "bg-violet-500/20",
    },
    cyan: {
      border: "border-cyan-500/30",
      bg: "bg-cyan-500/10",
      text: "text-cyan-400",
      icon: "bg-cyan-500/20",
    },
    amber: {
      border: "border-amber-500/30",
      bg: "bg-amber-500/10",
      text: "text-amber-400",
      icon: "bg-amber-500/20",
    },
  };

  return (
    <figure className="my-10 overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/50 p-6 sm:p-8">
      <figcaption className="mb-6 text-center text-sm font-medium text-zinc-400">
        The human-in-the-loop &ldquo;sandwich topology&rdquo; workflow
      </figcaption>
      <div className="mx-auto flex max-w-md flex-col items-center gap-3">
        {steps.map((step, i) => {
          const colors = colorMap[step.color as keyof typeof colorMap];
          const Icon = step.icon;
          return (
            <div key={step.label} className="w-full">
              <div
                className={`flex items-center gap-4 rounded-xl border ${colors.border} ${colors.bg} p-4`}
              >
                <div
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${colors.icon}`}
                >
                  <Icon className={colors.text} size={22} />
                </div>
                <div>
                  <p className={`font-semibold ${colors.text}`}>{step.label}</p>
                  <p className="text-sm text-zinc-400">{step.sublabel}</p>
                </div>
                {step.position === "bottom" && (
                  <CheckCircle2 className="ml-auto shrink-0 text-amber-400" size={20} />
                )}
              </div>
              {i < steps.length - 1 && (
                <div className="flex justify-center py-1">
                  <div className="h-6 w-px bg-gradient-to-b from-white/20 to-white/5" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </figure>
  );
}

export function RedistributionInfographic() {
  const models = [
    {
      acronym: "UBI",
      name: "Universal Basic Income",
      description: "Regular, unconditional cash payment",
      color: "violet",
    },
    {
      acronym: "UBC",
      name: "Universal Basic Compute",
      description: "Guaranteed quota of processing power",
      color: "cyan",
    },
    {
      acronym: "UBA",
      name: "Universal Basic Assets",
      description: "Direct equity in AGI systems & data centers",
      color: "emerald",
    },
  ];

  const colorMap = {
    violet: "border-violet-500/30 bg-violet-500/5 text-violet-400",
    cyan: "border-cyan-500/30 bg-cyan-500/5 text-cyan-400",
    emerald: "border-emerald-500/30 bg-emerald-500/5 text-emerald-400",
  };

  return (
    <figure className="my-10 overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/50 p-6 sm:p-8">
      <figcaption className="mb-6 text-center text-sm font-medium text-zinc-400">
        Redistributive models for managing abundance
      </figcaption>
      <div className="grid gap-4 sm:grid-cols-3">
        {models.map((model) => (
          <div
            key={model.acronym}
            className={`rounded-xl border p-5 text-center ${colorMap[model.color as keyof typeof colorMap]}`}
          >
            <p className="text-2xl font-bold">{model.acronym}</p>
            <p className="mt-2 text-sm font-semibold text-white">{model.name}</p>
            <p className="mt-2 text-xs leading-relaxed text-zinc-400">
              {model.description}
            </p>
          </div>
        ))}
      </div>
    </figure>
  );
}

export function AuthenticityInfographic() {
  return (
    <figure className="my-10 overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/50 p-6 sm:p-8">
      <figcaption className="mb-6 text-center text-sm font-medium text-zinc-400">
        The inverse relationship: utility vs. authenticity
      </figcaption>
      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-xl border border-zinc-500/20 bg-zinc-800/30 p-6">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-700/50">
              <Sparkles className="text-zinc-400" size={18} />
            </div>
            <p className="font-semibold text-zinc-300">Mass-Produced (AGI)</p>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-zinc-400">Utility value</span>
              <span className="font-mono text-zinc-500">~$0</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-zinc-700">
              <div className="h-full w-[8%] rounded-full bg-zinc-500" />
            </div>
            <p className="text-xs text-zinc-500">
              Atomic cost of materials only
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-6">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-500/20">
              <Hand className="text-amber-400" size={18} />
            </div>
            <p className="font-semibold text-amber-300">Human-Made (Artisan)</p>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-zinc-400">Authenticity premium</span>
              <span className="font-mono text-amber-400">100×+</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-zinc-700">
              <div className="h-full w-full rounded-full bg-gradient-to-r from-amber-500 to-amber-300" />
            </div>
            <p className="text-xs text-zinc-500">
              Human time, effort, and verifiable craft
            </p>
          </div>
        </div>
      </div>
    </figure>
  );
}
