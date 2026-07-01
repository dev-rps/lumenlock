'use client';

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
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
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
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
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
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
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
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
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
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
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
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
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
// Uses the slot system: card-slot-marker (fixed 44px icon) + card-slot-title
// (min-height for titles) to guarantee all 6 cards share one baseline.
function FeatureCard({ feature, delay }: { feature: (typeof features)[number]; delay: number }) {
  const { ref, visible } = useScrollReveal();
  const Icon = feature.icon;
  return (
    <div
      ref={ref}
      className={`ll-card ll-card-trust-hover flex flex-col gap-4 ${visible ? 'animate-fade-up' : 'opacity-0'}`}
      style={{
        padding: 'var(--spacing-3)', /* 24px — consistent on every card */
        animationDelay: `${delay}ms`,
        animationFillMode: 'both',
      }}
    >
      {/*
       * card-slot-marker: fixed 44×44px with overflow:hidden.
       * The icon (22px) fits inside. Even if Icon were 100px, it would be
       * clipped to the slot — sibling cards are NEVER pushed out of alignment.
       */}
      <div
        className="card-slot-marker"
        style={{ backgroundColor: 'var(--color-trust-soft)', color: 'var(--color-trust)' }}
      >
        <Icon />
      </div>

      <div className="flex flex-col gap-2">
        {/*
         * card-slot-title: min-height:3.5rem means even if one title wraps to
         * 2 lines and another is 1 line, the description starts at the same
         * y-offset across all cards in the row.
         */}
        <div className="card-slot-title">
          <h3
            className="type-heading"
            style={{ color: 'var(--color-ink)', fontFamily: 'var(--font-display)' }}
          >
            {feature.title}
          </h3>
        </div>
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

      {/* ── Hero ────────────────────────────────────────────────────────────── */}
      <section
        className="relative"
        style={{
          backgroundColor: 'var(--color-surface)',
          minHeight: '88vh',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        {/* Subtle ruled-paper lines for "ledger" feel — always safe, pointer-events-none */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: 'linear-gradient(var(--color-border) 1px, transparent 1px)',
            backgroundSize: '100% 48px',
            opacity: 0.35,
          }}
          aria-hidden="true"
        />

        <div className="container-wide relative z-10" style={{ paddingTop: 'var(--spacing-12)', paddingBottom: 'var(--spacing-12)' }}>
          <div
            className="grid hero-grid items-center"
            style={{ gap: 'var(--spacing-8)' }}
          >
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
                <em style={{ color: 'var(--color-accent)', fontStyle: 'italic' }}>
                  for Stellar
                </em>
              </h1>

              {/* Body */}
              <p
                className={`type-body transition-all duration-500 ${heroVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
                style={{
                  color: 'var(--color-ink-muted)',
                  maxWidth: '55ch',
                  transitionDelay: '160ms',
                  marginTop: 'var(--stack-md)', /* 24px: heading → body */
                }}
              >
                LumenLock brings bilateral confirmation, milestone-based releases, and
                dispute arbitration to the Stellar ecosystem — the missing escrow primitive
                that every P2P marketplace needs.
              </p>

              {/* CTAs */}
              <div
                className={`flex flex-col sm:flex-row gap-3 transition-all duration-500 ${heroVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
                style={{ transitionDelay: '240ms', marginTop: 'var(--stack-lg)' /* 32px: body → buttons */ }}
              >
                <Link
                  href="/marketplace"
                  className="btn-primary"
                  id="explore-marketplace-btn"
                >
                  Explore Marketplace
                  <ArrowRight style={{ width: 17, height: 17 }} />
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

            {/* Right: Seal animation — hero-seal-col hides on mobile/tablet */}
            <div
              className={`hero-seal-col items-center justify-center transition-all duration-700 ${heroVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
              style={{ transitionDelay: '300ms' }}
              aria-hidden="true"
            >
              {/*
               * deco-container: fixed 300×300px box.
               * The radial gradient glow is deco-absolute (no layout impact).
               * The SealIcon sits on top via relative z-index.
               * The caption is outside the deco-container so it flows normally.
               */}
              <div className="flex flex-col items-center gap-6">
                <div
                  className="deco-container rounded-full"
                  style={{ width: 280, height: 280 }}
                >
                  {/* Background glow — absolutely positioned, never affects layout */}
                  <div
                    className="deco-absolute"
                    style={{
                      background: 'radial-gradient(circle, var(--color-trust-soft) 0%, transparent 70%)',
                      borderRadius: '50%',
                    }}
                    aria-hidden="true"
                  />
                  {/* Seal — centered, z-index:1, inside the fixed container */}
                  {heroVisible && (
                    <div
                      className="absolute inset-0 flex items-center justify-center"
                      style={{ zIndex: 1 }}
                    >
                      <SealIcon variant="animated" size={180} />
                    </div>
                  )}
                </div>

                {/* Caption: outside the deco-container, flows normally */}
                <p className="type-caption" style={{ color: 'var(--color-ink-faint)', whiteSpace: 'nowrap' }}>
                  Both parties confirm · Funds release
                </p>
              </div>
            </div>
          </div>

          {/* Responsive: stack on mobile — handled by .hero-grid CSS class */}
        </div>
      </section>

      {/* ── Stats Strip ─────────────────────────────────────────────────────── */}
      <section
        style={{
          borderTop: '1px solid var(--color-border)',
          borderBottom: '1px solid var(--color-border)',
          backgroundColor: 'var(--color-surface)',
        }}
      >
        <div className="container-wide">
          {/*
           * Stats strip: flex row with stretch so all cells share the same height.
           * On mobile, stacks vertically with horizontal separators instead.
           */}
          <div
            className="flex flex-col sm:flex-row items-stretch"
            style={{ borderColor: 'var(--color-border)' }}
          >
            {stats.map(({ label, value }, i) => (
              <div
                key={label}
                className="stats-strip-cell"
                style={{
                  borderRight: i < stats.length - 1 ? '1px solid var(--color-border)' : undefined,
                  borderBottom: undefined,
                }}
              >
                <span
                  className="font-semibold mb-1"
                  style={{
                    color: 'var(--color-trust)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '1.875rem', /* 30px — on grid */
                    lineHeight: 1.2,
                  }}
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

      {/* ── Feature Grid ──────────────────────────────────────────────────────── */}
      <section style={{ paddingTop: 'var(--spacing-12)', paddingBottom: 'var(--spacing-12)' }} id="features">
        <div className="container-wide">

          {/* Section header — all children centered to match the heading */}
          <div className="section-header">
            <p className="type-caption mb-3" style={{ color: 'var(--color-accent)' }}>
              What sets it apart
            </p>
            <h2
              className="type-display-lg"
              style={{ color: 'var(--color-ink)', fontFamily: 'var(--font-display)', marginBottom: 'var(--stack-sm)' }}
            >
              The Escrow Primitive Stellar Was Missing
            </h2>
            {/* Description: text-align:center + mx-auto matches the centered heading above */}
            <p
              className="type-body"
              style={{
                color: 'var(--color-ink-muted)',
                maxWidth: '58ch',
                margin: '0 auto',         /* center as block */
                textAlign: 'center',      /* match heading alignment */
              }}
            >
              Stellar&apos;s native claimable balances support conditional release — but not bilateral
              confirmation, dispute freezing, or milestone-based partial releases.
              LumenLock fills that gap.
            </p>
          </div>

          {/*
           * card-grid + feature-grid: CSS classes in globals.css handle
           * 1-col (mobile) → 2-col (tablet) → 3-col (desktop) responsively.
           * align-items:stretch (from .card-grid) forces equal-height siblings.
           */}
          <div
            className="card-grid feature-grid"
            style={{ gap: 'var(--spacing-3)' }}
          >
            {features.map((feature, i) => (
              <FeatureCard key={feature.title} feature={feature} delay={i * 60} />
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ──────────────────────────────────────────────────────── */}
      <section
        style={{
          paddingTop: 'var(--spacing-12)',
          paddingBottom: 'var(--spacing-12)',
          backgroundColor: 'var(--color-surface)',
          borderTop: '1px solid var(--color-border)',
          borderBottom: '1px solid var(--color-border)',
        }}
        id="how-it-works"
      >
        <div className="container-wide">

          {/* Section header */}
          <div className="section-header">
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
            className={`hidden lg:flex gap-0 transition-all duration-700 ${hiw.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
            style={{ position: 'relative' }}
          >
            {/*
             * Single connector track spanning all markers.
             * Position:absolute at top:22px (half the 44px marker slot).
             * This replaces the per-gap connector hack that was vulnerable to
             * the SealIcon pushing the line offset in step 03.
             */}
            <div className="hiw-connector-track" style={{ left: '22px', right: '22px' }} />

            {howItWorks.map((step) => (
              <div key={step.step} className="hiw-step" style={{ padding: '0 var(--spacing-2)' }}>

                {/* Marker slot — fixed 44×44, overflow:hidden */}
                <div className="hiw-marker-wrap" style={{ marginBottom: 'var(--spacing-3)' }}>
                  {step.useSeal ? (
                    /*
                     * SealIcon inside card-slot-marker.
                     * overflow:hidden clips it to 44px regardless of animation.
                     * It will NOT push the title below its siblings' titles.
                     */
                    <div
                      className="card-slot-marker"
                      style={{
                        backgroundColor: 'var(--color-trust-soft)',
                        border: '1.5px solid rgba(43,58,143,0.25)',
                      }}
                    >
                      <SealIcon variant="animated" size={32} />
                    </div>
                  ) : (
                    <div
                      className="card-slot-marker card-slot-marker--circle"
                      style={{
                        backgroundColor: 'var(--color-trust-soft)',
                        color: 'var(--color-trust)',
                        border: '1.5px solid rgba(43,58,143,0.25)',
                        fontFamily: 'var(--font-mono)',
                        fontWeight: 600,
                        fontSize: '0.875rem',
                      }}
                    >
                      {step.step}
                    </div>
                  )}
                </div>

                {/* Title — card-slot-title ensures same baseline across all 4 steps */}
                <div className="card-slot-title" style={{ width: '100%', justifyContent: 'center' }}>
                  <h3
                    className="type-heading text-center"
                    style={{
                      color: 'var(--color-ink)',
                      fontFamily: 'var(--font-display)',
                      fontSize: '1.1rem',
                    }}
                  >
                    {step.title}
                  </h3>
                </div>

                {/* Description */}
                <p
                  className="type-body-sm text-center"
                  style={{ color: 'var(--color-ink-muted)' }}
                >
                  {step.description}
                </p>
              </div>
            ))}
          </div>

          {/* Mobile vertical timeline */}
          <div className="lg:hidden flex flex-col" style={{ gap: 0 }}>
            {howItWorks.map((step, i) => (
              <div key={step.step} className="flex gap-6">
                {/* Left: marker + vertical line */}
                <div className="flex flex-col items-center" style={{ flexShrink: 0 }}>
                  {step.useSeal ? (
                    <div
                      className="card-slot-marker"
                      style={{
                        backgroundColor: 'var(--color-trust-soft)',
                        border: '1.5px solid rgba(43,58,143,0.25)',
                      }}
                    >
                      <SealIcon variant="animated" size={32} />
                    </div>
                  ) : (
                    <div
                      className="card-slot-marker card-slot-marker--circle"
                      style={{
                        backgroundColor: 'var(--color-trust-soft)',
                        color: 'var(--color-trust)',
                        border: '1.5px solid rgba(43,58,143,0.25)',
                        fontFamily: 'var(--font-mono)',
                        fontWeight: 600,
                        fontSize: '0.875rem',
                      }}
                    >
                      {step.step}
                    </div>
                  )}
                  {i < howItWorks.length - 1 && (
                    <div
                      style={{
                        width: '1px',
                        flex: 1,
                        minHeight: '40px',
                        marginTop: '8px',
                        marginBottom: '8px',
                        backgroundColor: 'var(--color-border)',
                      }}
                    />
                  )}
                </div>

                {/* Right: content */}
                <div style={{ paddingBottom: 'var(--spacing-4)', paddingTop: '8px', flex: 1, minWidth: 0 }}>
                  <h3
                    className="type-heading mb-2"
                    style={{
                      color: 'var(--color-ink)',
                      fontFamily: 'var(--font-display)',
                      fontSize: '1.1rem',
                    }}
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

      {/* ── CTA Band ──────────────────────────────────────────────────────────── */}
      <section
        style={{
          paddingTop: 'var(--spacing-12)',
          paddingBottom: 'var(--spacing-12)',
          backgroundColor: 'var(--color-trust)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/*
         * Decorative SealIcon motif — §3.3 compliant:
         * Inside deco-container (position:relative, overflow:hidden).
         * Uses deco-absolute — pointer-events:none, z-index:0.
         * Cannot clip text or affect layout.
         */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ zIndex: 0 }}
          aria-hidden="true"
        >
          <div
            style={{
              position: 'absolute',
              right: '-48px',
              top: '50%',
              transform: 'translateY(-50%)',
              opacity: 0.08,
            }}
          >
            <SealIcon variant="static" size={240} />
          </div>
        </div>

        <div className="container-wide" style={{ position: 'relative', zIndex: 1 }}>
          <div
            className="flex flex-col lg:flex-row items-center"
            style={{ gap: 'var(--spacing-8)' }}
          >
            {/* Text block */}
            <div className="flex-1 text-center lg:text-left">
              <p
                className="type-caption"
                style={{ color: 'rgba(255,255,255,0.5)', marginBottom: 'var(--stack-xs)' }}
              >
                Get started today
              </p>
              <h2
                className="type-display-lg"
                style={{ color: '#FFFFFF', fontFamily: 'var(--font-display)', marginBottom: 'var(--stack-md)' }}
              >
                Ready to transact trustlessly?
              </h2>
              <p
                className="type-body"
                style={{ color: 'rgba(255,255,255,0.7)', maxWidth: '48ch', marginBottom: 'var(--stack-lg)' }}
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
                <ArrowRight style={{ width: 17, height: 17 }} />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
