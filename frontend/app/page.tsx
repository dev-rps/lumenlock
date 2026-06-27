import type { Metadata } from 'next';
import Link from 'next/link';
import {
  Shield,
  Clock,
  Milestone,
  ArrowRight,
  Zap,
  Users,
  CheckCircle2,
  Lock,
  Globe,
  TrendingUp,
  Code2,
  Gavel,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'LumenLock — Decentralized Escrow Marketplace on Stellar',
  description:
    'Trustless P2P marketplace with built-in Soroban escrow settlement. Bilateral confirmation, milestone releases, dispute arbitration — all on Stellar.',
};

const features = [
  {
    icon: Shield,
    title: 'Bilateral Confirmation',
    description:
      'Funds release only when BOTH buyer and seller independently confirm. No single point of trust.',
    color: 'text-violet-400',
    bg: 'bg-violet-400/10',
  },
  {
    icon: Milestone,
    title: 'Milestone Releases',
    description:
      'Split payments across project milestones. 30% on start, 70% on delivery — configurable per listing.',
    color: 'text-cyan-400',
    bg: 'bg-cyan-400/10',
  },
  {
    icon: Clock,
    title: 'Deadline Protection',
    description:
      "If the seller goes silent, buyer gets a full refund after the 7-day deadline. No funds locked forever.",
    color: 'text-amber-400',
    bg: 'bg-amber-400/10',
  },
  {
    icon: Gavel,
    title: 'Dispute Arbitration',
    description:
      'Disputes freeze funds and route to a designated arbiter. Resolution credits winner automatically.',
    color: 'text-emerald-400',
    bg: 'bg-emerald-400/10',
  },
  {
    icon: Globe,
    title: 'Multi-Asset Support',
    description:
      'Accept XLM, USDC, or any Stellar Asset Contract token. Any SEP-41 compliant token works.',
    color: 'text-blue-400',
    bg: 'bg-blue-400/10',
  },
  {
    icon: Code2,
    title: 'Composable Primitives',
    description:
      'Built as a reusable Soroban escrow layer. Any marketplace or P2P app on Stellar can build on top.',
    color: 'text-pink-400',
    bg: 'bg-pink-400/10',
  },
];

const stats = [
  { label: 'Contract Functions', value: '12+' },
  { label: 'State Transitions', value: '7' },
  { label: 'Supported Assets', value: '∞' },
  { label: 'Audit Tests', value: '15+' },
];

const howItWorks = [
  {
    step: '01',
    title: 'Seller Lists',
    description: 'Seller creates a listing with price, asset, and optional milestone config.',
    color: 'text-violet-400',
  },
  {
    step: '02',
    title: 'Buyer Opens Escrow',
    description: 'Buyer opens an escrow, locking the listing. Funds transferred to vault on fund().',
    color: 'text-cyan-400',
  },
  {
    step: '03',
    title: 'Both Confirm',
    description: 'Buyer receives product/service and confirms. Seller confirms delivery. Funds auto-release.',
    color: 'text-emerald-400',
  },
  {
    step: '04',
    title: 'Settled On-Chain',
    description: 'Funds go to seller. Listing marked Completed. Full audit trail on Stellar.',
    color: 'text-amber-400',
  },
];

export default function LandingPage() {
  return (
    <div className="overflow-hidden">
      {/* Hero */}
      <section className="relative min-h-[90vh] flex items-center">
        {/* Background Glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'var(--gradient-glow)' }}
        />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_80%_50%,rgba(6,182,212,0.1)_0%,transparent_60%)] pointer-events-none" />

        {/* Grid Pattern */}
        <div className="absolute inset-0 opacity-[0.02] pointer-events-none"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.3) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />

        <div className="container-wide relative z-10 py-32">
          <div className="max-w-4xl">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-violet-500/30 bg-violet-500/10 text-violet-300 text-sm font-medium mb-8 animate-fade-in">
              <Zap className="w-3.5 h-3.5" />
              Built on Stellar Soroban — Orange Belt Level
            </div>

            <h1 className="text-5xl md:text-7xl font-bold leading-tight mb-6 animate-fade-in">
              Trustless{' '}
              <span className="gradient-text">Escrow</span>
              <br />
              for Stellar
            </h1>

            <p className="text-xl text-zinc-400 max-w-2xl leading-relaxed mb-10 animate-fade-in">
              LumenLock brings bilateral confirmation, milestone-based releases, and
              dispute arbitration to the Stellar ecosystem — the missing escrow primitive
              that every P2P marketplace needs.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 animate-fade-in">
              <Link
                href="/marketplace"
                className="flex items-center justify-center gap-2 px-8 py-4 rounded-xl brand-gradient text-white font-semibold text-lg hover:opacity-90 transition-all glow-effect"
                id="explore-marketplace-btn"
              >
                Explore Marketplace
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="/dashboard"
                className="flex items-center justify-center gap-2 px-8 py-4 rounded-xl border border-zinc-700 text-zinc-300 font-semibold text-lg hover:bg-zinc-800/60 hover:border-zinc-600 transition-all"
                id="open-dashboard-btn"
              >
                Open Dashboard
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-zinc-800/50 bg-zinc-900/30 py-12">
        <div className="container-wide">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map(({ label, value }) => (
              <div key={label} className="text-center">
                <div className="text-3xl md:text-4xl font-bold gradient-text mb-1">{value}</div>
                <div className="text-sm text-zinc-500">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24" id="features">
        <div className="container-wide">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              The Escrow Primitive Stellar Was Missing
            </h2>
            <p className="text-zinc-400 text-lg max-w-2xl mx-auto">
              Stellar&apos;s native claimable balances support conditional release — but not bilateral
              confirmation, dispute freezing, or milestone-based partial releases.
              LumenLock fills that gap.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map(({ icon: Icon, title, description, color, bg }) => (
              <div
                key={title}
                className="glass-card p-6 hover:border-zinc-600/80 transition-all duration-300 group hover:-translate-y-1"
              >
                <div className={`w-12 h-12 rounded-xl ${bg} flex items-center justify-center mb-4`}>
                  <Icon className={`w-6 h-6 ${color}`} />
                </div>
                <h3 className="text-lg font-semibold mb-2">{title}</h3>
                <p className="text-zinc-400 text-sm leading-relaxed">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 bg-zinc-900/30 border-y border-zinc-800/50" id="how-it-works">
        <div className="container-wide">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">How It Works</h2>
            <p className="text-zinc-400 text-lg">
              Four steps from listing to settlement
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {howItWorks.map(({ step, title, description, color }) => (
              <div key={step} className="relative">
                <div className={`text-6xl font-black ${color} opacity-20 mb-4 leading-none`}>
                  {step}
                </div>
                <h3 className="text-lg font-semibold mb-2">{title}</h3>
                <p className="text-zinc-400 text-sm leading-relaxed">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24">
        <div className="container-wide text-center">
          <div className="glass-card max-w-2xl mx-auto p-12 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-cyan-500/5" />
            <div className="relative z-10">
              <h2 className="text-3xl font-bold mb-4">Ready to transact trustlessly?</h2>
              <p className="text-zinc-400 mb-8">
                Connect your Stellar wallet and start buying or selling on the decentralized marketplace.
              </p>
              <Link
                href="/marketplace"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-xl brand-gradient text-white font-semibold hover:opacity-90 transition-all"
                id="cta-marketplace-btn"
              >
                Get Started
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
