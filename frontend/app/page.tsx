'use client';

import type { Metadata } from 'next';
import Link from 'next/link';
import { useRef, useEffect, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { SealIcon } from './components/ui/SealIcon';

// ─── Data ────────────────────────────────────────────────────────────────────
const stats = [
  { label: 'Contract Functions', value: '12+' },
  { label: 'State Transitions', value: '7' },
  { label: 'Supported Assets', value: '∞' },
  { label: 'Audit Tests', value: '15+' },
];

const features = [
  {
    icon: () => (
      // Two overlapping circles — bilateral confirmation
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
        <circle cx="9" cy="12" r="6" />
        <circle cx="15" cy="12" r="6" />
      </svg>
    ),
    title: 'Bilateral Confirmation',
    description:
      'Funds release only when BOTH buyer and seller independently confirm. No single point of trust.',
  },
  {
    icon: () => (
      // Milestone flag / checkpoint
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <line x1="5" y1="4" x2="5" y2="20" />
        <polyline points="5,4 19,4 15,10 19,16 5,16" />
      </svg>
    ),
    title: 'Milestone Releases',
    description:
      'Split payments across project milestones. 30% on start, 70% on delivery — configurable per listing.',
  },
  {
    icon: () => (
      // Clock — deadline protection
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
        <circle cx="12" cy="12" r="8" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="12" x2="15" y2="14" />
      </svg>
    ),
    title: 'Deadline Protection',
    description:
      'If the seller goes silent, buyer gets a full refund after the 7-day deadline. No funds locked forever.',
  },
  {
    icon: () => (
      // Scale / balance — dispute arbitration
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="4" x2="12" y2="20" />
        <line x1="4" y1="8" x2="20" y2="8" />
        <path d="M4,8 Q2,12 4,16 Q6,12 4,8" />
        <path d="M20,8 Q22,12 20,16 Q18,12 20,8" />
        <line x1="8" y1="20" x2="16" y2="20" />
      </svg>
    ),
    title: 'Dispute Arbitration',
    description:
      'Disputes freeze funds and route to a designated arbiter. Resolution credits winner automatically.',
  },
  {
    icon: () => (
      // Coin stack — multi-asset
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
        <ellipse cx="12" cy="7" rx="7" ry="2.5" />
        <path d="M5,7 Q5,11 12,11 Q19,11 19,7" />
        <path d="M5,11 Q5,15 12,15 Q19,15 19,11" />
        <path d="M5,15 Q5,19 12,19 Q19,19 19,15" />
      </svg>
    ),
    title: 'Multi-Asset Support',
    description:
      'Accept XLM, USDC, or any Stellar Asset Contract token. Any SEP-41 compliant token works.',
  },
  {
    icon: () => (
      // Stacked layers — composability
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="12,3 21,8.5 12,14 3,8.5 12,3" />
        <line x1="3" y1="13.5" x2="12" y2="19" />
        <line x1="21" y1="13.5" x2="12" y2="19" />
      </svg>
    ),
    title: 'Composable Primitives',
    description:
      'Built as a reusable Soroban escrow layer. Any marketplace or P2P app on Stellar can build on top.',
  },
];

const howItWorks = [
  {
    step: '01',
    title: 'Seller Lists',
    description: 'Seller creates a listing with price, asset, and optional milestone configuration.',
    useSeal: false,
  },
  {
    step: '02',
    title: 'Buyer Opens Escrow',
    description: 'Buyer opens an escrow, locking the listing. Funds transferred to vault on fund().',
    useSeal: false,
  },
  {
    step: '03',
    title: 'Both Confirm',
    description: 'Buyer receives product/service and confirms. Seller confirms delivery. Funds auto-release.',
    useSeal: true,
  },
  {
    step: '04',
    title: 'Settled On-Chain',
    description: 'Funds go to seller. Listing marked Completed. Full audit trail on Stellar.',
    useSeal: false,
  },
];

// ─── Scroll-reveal hook ───────────────────────────────────────────────────────
function useScrollReveal(threshold = 0.12) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect(); } },
      { threshold },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return { ref, visible };
}

// ─── Feature Card ─────────────────────────────────────────────────────────────
function FeatureCard({ feature, delay }: { feature: (typeof features)[number]; delay: number }) {
  const { ref, visible } = useScrollReveal();
  const Icon = feature.icon;
  return (
    <div
      ref={ref}
      className={`ll-card ll-card-trust-hover p-6 flex flex-col gap-4 ${visible ? 'animate-fade-up' : 'opacity-0'}`}
      style={{ animationDelay: `${delay}ms`, animationFillMode: 'both' }}
    >
      <div
        className="w-11 h-11 rounded-xl flex items-center justify-center"
        style={{ backgroundColor: 'var(--color-trust-soft)', color: 'var(--color-trust)' }}
      >
        <Icon />
      </div>
      <div>
        <h3
          className="type-heading mb-2"
          style={{ color: 'var(--color-ink)', fontFamily: 'var(--font-display)' }}
        >
          {feature.title}
        </h3>
        <p className="type-body-sm" style={{ color: 'var(--color-ink-muted)' }}>
          {feature.description}
        </p>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function LandingPage() {
  const [heroVisible, setHeroVisible] = useState(false);
  const hiw = useScrollReveal(0.1);

  useEffect(() => {
    // Slight delay so fonts have painted
    const t = setTimeout(() => setHeroVisible(true), 80);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="overflow-hidden">

      {/* ── Hero ─────────────────────────────────────────────────────────────── */}
      <section
        className="relative min-h-[88vh] flex items-center"
        style={{ backgroundColor: 'var(--color-surface)' }}
      >
        {/* Subtle ruled-paper lines for "ledger" feel */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: 'linear-gradient(var(--color-border) 1px, transparent 1px)',
            backgroundSize: '100% 48px',
            opacity: 0.35,
          }}
          aria-hidden="true"
        />

        <div className="container-wide relative z-10 py-24">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left: copy */}
            <div>
              {/* Eyebrow */}
              <p
                className={`type-caption mb-6 transition-all duration-500 ${heroVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
                style={{ color: 'var(--color-trust)', transitionDelay: '0ms' }}
              >
                Built on Stellar Soroban
              </p>

              {/* Headline */}
              <h1
                className={`type-display-xl mb-6 transition-all duration-600 ${heroVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
                style={{
                  color: 'var(--color-ink)',
                  transitionDelay: '80ms',
                  maxWidth: '16ch',
                  fontFamily: 'var(--font-display)',
                }}
              >
                Trustless Escrow{' '}
                <em
                  style={{ color: 'var(--color-accent)', fontStyle: 'italic' }}
                >
                  for Stellar
                </em>
              </h1>

              {/* Body */}
              <p
                className={`type-body mb-10 transition-all duration-500 ${heroVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
                style={{
                  color: 'var(--color-ink-muted)',
                  maxWidth: '55ch',
                  transitionDelay: '160ms',
                }}
              >
                LumenLock brings bilateral confirmation, milestone-based releases, and
                dispute arbitration to the Stellar ecosystem — the missing escrow primitive
                that every P2P marketplace needs.
              </p>

              {/* CTAs */}
              <div
                className={`flex flex-col sm:flex-row gap-3 transition-all duration-500 ${heroVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
                style={{ transitionDelay: '240ms' }}
              >
                <Link
                  href="/marketplace"
                  className="btn-primary"
                  id="explore-marketplace-btn"
                >
                  Explore Marketplace
                  <ArrowRight className="w-4.5 h-4.5" />
                </Link>
                <Link
                  href="/dashboard"
                  className="btn-secondary"
                  id="open-dashboard-btn"
                >
                  Open Dashboard
                </Link>
              </div>
            </div>

            {/* Right: Seal animation */}
            <div
              className={`flex items-center justify-center transition-all duration-700 ${heroVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
              style={{ transitionDelay: '300ms' }}
              aria-hidden="true"
            >
              <div className="relative flex items-center justify-center">
                {/* Background ring */}
                <div
                  className="absolute rounded-full"
                  style={{
                    width: 300,
                    height: 300,
                    background: 'radial-gradient(circle, var(--color-trust-soft) 0%, transparent 70%)',
                  }}
                />
                {heroVisible && (
                  <SealIcon variant="animated" size={200} className="relative z-10" />
                )}
                {/* Decorative caption */}
                <div
                  className="absolute -bottom-10 left-1/2 -translate-x-1/2 whitespace-nowrap type-caption"
                  style={{ color: 'var(--color-ink-faint)' }}
                >
                  Both parties confirm · Funds release
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats Strip ─────────────────────────────────────────────────────── */}
      <section
        className="py-10"
        style={{ borderTop: '1px solid var(--color-border)', borderBottom: '1px solid var(--color-border)' }}
      >
        <div className="container-wide">
          <div className="flex flex-col sm:flex-row items-center divide-y sm:divide-y-0 sm:divide-x divide-[var(--color-border)] w-full">
            {stats.map(({ label, value }) => (
              <div key={label} className="flex-1 flex flex-col items-center py-5 sm:py-0 px-8 text-center">
                <span
                  className="type-mono font-semibold text-3xl mb-1"
                  style={{ color: 'var(--color-trust)', fontFamily: 'var(--font-mono)' }}
                >
                  {value}
                </span>
                <span className="type-caption" style={{ color: 'var(--color-ink-faint)' }}>
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Feature Grid ────────────────────────────────────────────────────── */}
      <section className="py-24" id="features">
        <div className="container-wide">
          <div className="text-center mb-16">
            <p className="type-caption mb-3" style={{ color: 'var(--color-accent)' }}>
              What sets it apart
            </p>
            <h2
              className="type-display-lg mb-4"
              style={{ color: 'var(--color-ink)', fontFamily: 'var(--font-display)' }}
            >
              The Escrow Primitive Stellar Was Missing
            </h2>
            <p
              className="type-body mx-auto"
              style={{ color: 'var(--color-ink-muted)', maxWidth: '58ch' }}
            >
              Stellar&apos;s native claimable balances support conditional release — but not bilateral
              confirmation, dispute freezing, or milestone-based partial releases.
              LumenLock fills that gap.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <FeatureCard key={feature.title} feature={feature} delay={i * 60} />
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ────────────────────────────────────────────────────── */}
      <section
        className="py-24"
        id="how-it-works"
        style={{ backgroundColor: 'var(--color-surface)', borderTop: '1px solid var(--color-border)', borderBottom: '1px solid var(--color-border)' }}
      >
        <div className="container-wide">
          <div className="text-center mb-16">
            <p className="type-caption mb-3" style={{ color: 'var(--color-accent)' }}>
              The process
            </p>
            <h2
              className="type-display-lg mb-3"
              style={{ color: 'var(--color-ink)', fontFamily: 'var(--font-display)' }}
            >
              How It Works
            </h2>
            <p className="type-body" style={{ color: 'var(--color-ink-muted)' }}>
              Four steps from listing to settlement
            </p>
          </div>

          {/* Desktop timeline */}
          <div
            ref={hiw.ref}
            className={`hidden lg:flex items-start gap-0 transition-all duration-700 ${hiw.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
          >
            {howItWorks.map((step, i) => (
              <div key={step.step} className="flex items-start">
                {/* Step */}
                <div className="flex flex-col items-center px-4" style={{ minWidth: 220 }}>
                  {/* Marker + connector row */}
                  <div className="flex items-center w-full mb-6">
                    <div className="w-10 h-10 flex items-center justify-center shrink-0">
                      {step.useSeal ? (
                        <SealIcon variant="animated" size={40} />
                      ) : (
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm"
                          style={{
                            backgroundColor: 'var(--color-trust-soft)',
                            color: 'var(--color-trust)',
                            border: '1.5px solid rgba(43,58,143,0.25)',
                            fontFamily: 'var(--font-mono)',
                          }}
                        >
                          {step.step}
                        </div>
                      )}
                    </div>
                    {i < howItWorks.length - 1 && (
                      <div
                        className="h-px flex-1 ml-4"
                        style={{ backgroundColor: 'var(--color-border)' }}
                      />
                    )}
                  </div>
                  <h3
                    className="type-heading text-center mb-2"
                    style={{ color: 'var(--color-ink)', fontFamily: 'var(--font-display)', fontSize: '1.1rem' }}
                  >
                    {step.title}
                  </h3>
                  <p
                    className="type-body-sm text-center"
                    style={{ color: 'var(--color-ink-muted)' }}
                  >
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Mobile vertical timeline */}
          <div className="lg:hidden flex flex-col gap-0">
            {howItWorks.map((step, i) => (
              <div key={step.step} className="flex gap-6">
                {/* Left: number/seal + vertical line */}
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 flex items-center justify-center shrink-0">
                    {step.useSeal ? (
                      <SealIcon variant="animated" size={40} />
                    ) : (
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm"
                        style={{
                          backgroundColor: 'var(--color-trust-soft)',
                          color: 'var(--color-trust)',
                          border: '1.5px solid rgba(43,58,143,0.25)',
                          fontFamily: 'var(--font-mono)',
                        }}
                      >
                        {step.step}
                      </div>
                    )}
                  </div>
                  {i < howItWorks.length - 1 && (
                    <div
                      className="w-px flex-1 my-2"
                      style={{ backgroundColor: 'var(--color-border)', minHeight: 40 }}
                    />
                  )}
                </div>
                {/* Right: content */}
                <div className="pb-10 flex-1">
                  <h3
                    className="type-heading mb-2"
                    style={{ color: 'var(--color-ink)', fontFamily: 'var(--font-display)', fontSize: '1.1rem' }}
                  >
                    {step.title}
                  </h3>
                  <p className="type-body-sm" style={{ color: 'var(--color-ink-muted)' }}>
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Section ─────────────────────────────────────────────────────── */}
      <section
        className="py-24"
        style={{ backgroundColor: 'var(--color-trust)' }}
      >
        <div className="container-wide">
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
            {/* Text */}
            <div className="flex-1 text-center lg:text-left">
              <p
                className="type-caption mb-4"
                style={{ color: 'rgba(255,255,255,0.5)' }}
              >
                Get started today
              </p>
              <h2
                className="type-display-lg mb-4"
                style={{ color: '#FFFFFF', fontFamily: 'var(--font-display)' }}
              >
                Ready to transact trustlessly?
              </h2>
              <p
                className="type-body mb-8"
                style={{ color: 'rgba(255,255,255,0.7)', maxWidth: '48ch' }}
              >
                Connect your Stellar wallet and start buying or selling on the decentralized marketplace.
                Every trade is protected by an on-chain escrow vault.
              </p>
              <Link
                href="/marketplace"
                className="btn-primary inline-flex"
                id="cta-marketplace-btn"
                style={{ backgroundColor: 'var(--color-accent)', color: '#FFFFFF' }}
              >
                Get Started
                <ArrowRight className="w-4.5 h-4.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
