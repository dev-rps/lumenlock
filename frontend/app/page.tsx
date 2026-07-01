'use client';

import Link from 'next/link';
import { useRef, useEffect, useState } from 'react';
import { SealIcon } from './components/ui/SealIcon';

// ─── Data ─────────────────────────────────────────────────────────────────────
const stats = [
  { label: 'Contract Functions', value: '12+' },
  { label: 'State Transitions', value: '7' },
  { label: 'Supported Assets', value: '∞' },
  { label: 'Audit Tests', value: '15+' },
];

const features = [
  {
    icon: () => (
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

// ─── Scroll-reveal hook ────────────────────────────────────────────────────────
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

// ─── Feature Card ──────────────────────────────────────────────────────────────
function FeatureCard({ feature, delay }: { feature: (typeof features)[number]; delay: number }) {
  const { ref, visible } = useScrollReveal();
  const Icon = feature.icon;
  return (
    <div
      ref={ref}
      className={`ll-card flex flex-col gap-4 ${visible ? 'animate-fade-up' : 'opacity-0'}`}
      style={{
        padding: 'var(--spacing-3)',
        animationDelay: `${delay}ms`,
        animationFillMode: 'both',
      }}
    >
      <div
        className="card-slot-marker"
        style={{ backgroundColor: 'var(--color-surface-raised)', color: 'var(--color-accent)' }}
      >
        <Icon />
      </div>

      <div className="flex flex-col gap-2">
        <div className="card-slot-title">
          <h3 className="type-heading" style={{ color: 'var(--color-ink)' }}>
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

// ─── Page ──────────────────────────────────────────────────────────────────────
export default function LandingPage() {
  const [heroVisible, setHeroVisible] = useState(false);
  const hiw = useScrollReveal(0.1);

  useEffect(() => {
    const t = setTimeout(() => setHeroVisible(true), 80);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="overflow-hidden">

      {/* ── Hero ────────────────────────────────────────────────────────────── */}
      <section
        className="relative"
        style={{
          backgroundColor: 'var(--color-bg)',
          paddingTop: 'var(--spacing-12)',
          paddingBottom: 'var(--spacing-12)',
        }}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px)',
            backgroundSize: '100% 48px',
          }}
          aria-hidden="true"
        />

        <div className="container-wide relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 items-center" style={{ gap: 'var(--spacing-8)' }}>
            {/* Left: copy */}
            <div>
              <p
                className={`type-caption transition-all duration-500 ${heroVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
                style={{ color: 'var(--color-accent)', marginBottom: 'var(--spacing-2)', transitionDelay: '0ms' }}
              >
                BUILT ON STELLAR SOROBAN
              </p>

              <h1
                className={`type-display-xl transition-all duration-600 ${heroVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
                style={{
                  color: 'var(--color-ink)',
                  transitionDelay: '80ms',
                  maxWidth: '16ch',
                  marginBottom: 'var(--spacing-3)',
                }}
              >
                Trustless Escrow{' '}
                <em style={{ color: 'var(--color-accent)', fontStyle: 'italic' }}>
                  for Stellar
                </em>
              </h1>

              <p
                className={`type-body transition-all duration-500 ${heroVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
                style={{
                  color: 'var(--color-ink-muted)',
                  maxWidth: '52ch',
                  transitionDelay: '160ms',
                  marginBottom: 'var(--spacing-4)',
                }}
              >
                LumenLock brings bilateral confirmation, milestone-based releases, and
                dispute arbitration to the Stellar ecosystem — the missing escrow primitive
                that every P2P marketplace needs.
              </p>

              <div
                className={`flex flex-col sm:flex-row gap-3 transition-all duration-500 ${heroVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
                style={{ transitionDelay: '240ms' }}
              >
                <Link
                  href="/marketplace"
                  className="btn-primary"
                  id="explore-marketplace-btn"
                >
                  Explore Marketplace →
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
              className={`hidden lg:flex items-center justify-center transition-all duration-700 ${heroVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
              style={{ transitionDelay: '300ms' }}
              aria-hidden="true"
            >
              <div className="flex flex-col items-center" style={{ gap: 'var(--spacing-3)' }}>
                <div
                  className="relative overflow-hidden rounded-full"
                  style={{ width: 280, height: 280 }}
                >
                  <div
                    className="absolute inset-0 flex items-center justify-center pointer-events-none z-0"
                    style={{
                      background: 'radial-gradient(circle, var(--color-accent-soft) 0%, transparent 70%)',
                      borderRadius: '50%',
                    }}
                    aria-hidden="true"
                  />
                  {heroVisible && (
                    <div
                      className="absolute inset-0 flex items-center justify-center"
                      style={{ zIndex: 1 }}
                    >
                      <SealIcon variant="animated" size={200} />
                    </div>
                  )}
                </div>

                <p className="type-caption" style={{ color: 'var(--color-ink-faint)', whiteSpace: 'nowrap' }}>
                  BOTH PARTIES CONFIRM · FUNDS RELEASE
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats Strip ──────────────────────────────────────────────────────── */}
      <section>
        <div className="gold-line" />
        <div className="container-wide">
          <div
            className="flex flex-col sm:flex-row items-stretch"
            style={{ padding: 'var(--spacing-4) 0' }}
          >
            {stats.map(({ label, value }, i) => (
              <div
                key={label}
                className="stats-strip-cell"
                style={{
                  borderRight: i < stats.length - 1 ? '1px solid var(--color-border)' : undefined,
                }}
              >
                <span
                  style={{
                    color: 'var(--color-ink)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: 'clamp(1.6rem, 3vw, 2.25rem)',
                    fontWeight: 600,
                    lineHeight: 1.2,
                    marginBottom: '6px',
                    display: 'block',
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
        <div className="gold-line" />
      </section>

      {/* ── Feature Grid ─────────────────────────────────────────────────────── */}
      <section
        style={{ paddingTop: 'var(--spacing-12)', paddingBottom: 'var(--spacing-12)' }}
        id="features"
      >
        <div className="container-wide">
          <div className="text-center" style={{ marginBottom: 'var(--spacing-6)' }}>
            <p className="type-caption mb-3" style={{ color: 'var(--color-accent)' }}>
              WHAT SETS IT APART
            </p>
            <h2
              className="type-display-lg"
              style={{ color: 'var(--color-ink)', marginBottom: 'var(--spacing-3)' }}
            >
              The Escrow Primitive Stellar Was Missing
            </h2>
            <p
              className="type-body"
              style={{
                color: 'var(--color-ink-muted)',
                maxWidth: '60ch',
                margin: '0 auto',
                textAlign: 'center',
              }}
            >
              Stellar&apos;s native claimable balances support conditional release — but not bilateral
              confirmation, dispute freezing, or milestone-based partial releases.
              LumenLock fills that gap.
            </p>
          </div>

          <div
            className="card-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
            style={{ gap: 'var(--spacing-2)' }}
          >
            {features.map((feature, i) => (
              <FeatureCard key={feature.title} feature={feature} delay={i * 60} />
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ─────────────────────────────────────────────────────── */}
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
          <div className="text-center" style={{ marginBottom: 'var(--spacing-6)' }}>
            <p className="type-caption mb-3" style={{ color: 'var(--color-ink-faint)' }}>
              THE PROCESS
            </p>
            <h2
              className="type-display-lg"
              style={{ color: 'var(--color-ink)', marginBottom: 'var(--spacing-1)' }}
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
            <div
              className="absolute top-[22px] left-[22px] right-[22px] h-[1px] z-0"
              style={{ background: 'var(--color-border)' }}
            />

            {howItWorks.map((step) => (
              <div
                key={step.step}
                className="flex flex-col items-center flex-1 min-w-0"
                style={{ padding: '0 var(--spacing-2)' }}
              >
                <div
                  className="relative z-10 flex items-center justify-center shrink-0"
                  style={{ marginBottom: 'var(--spacing-3)' }}
                >
                  {step.useSeal ? (
                    <div
                      className="card-slot-marker"
                      style={{
                        backgroundColor: 'var(--color-surface-raised)',
                        border: '1px solid var(--color-border-strong)',
                      }}
                    >
                      <SealIcon variant="animated" size={32} />
                    </div>
                  ) : (
                    <div
                      className="card-slot-marker card-slot-marker--circle"
                      style={{
                        backgroundColor: 'var(--color-surface-raised)',
                        border: '1px solid var(--color-border-strong)',
                        fontFamily: 'var(--font-mono)',
                        fontWeight: 600,
                        fontSize: '0.875rem',
                        color: 'var(--color-accent)',
                      }}
                    >
                      {step.step}
                    </div>
                  )}
                </div>

                <div className="card-slot-title" style={{ width: '100%', justifyContent: 'center' }}>
                  <h3
                    className="type-heading text-center"
                    style={{ color: 'var(--color-ink)', fontSize: '1.1rem' }}
                  >
                    {step.title}
                  </h3>
                </div>

                <p className="type-body-sm text-center" style={{ color: 'var(--color-ink-muted)' }}>
                  {step.description}
                </p>
              </div>
            ))}
          </div>

          {/* Mobile vertical timeline */}
          <div className="lg:hidden flex flex-col" style={{ gap: 0 }}>
            {howItWorks.map((step, i) => (
              <div key={step.step} className="flex gap-6">
                <div className="flex flex-col items-center" style={{ flexShrink: 0 }}>
                  {step.useSeal ? (
                    <div
                      className="card-slot-marker"
                      style={{
                        backgroundColor: 'var(--color-surface-raised)',
                        border: '1px solid var(--color-border-strong)',
                      }}
                    >
                      <SealIcon variant="animated" size={32} />
                    </div>
                  ) : (
                    <div
                      className="card-slot-marker card-slot-marker--circle"
                      style={{
                        backgroundColor: 'var(--color-surface-raised)',
                        border: '1px solid var(--color-border-strong)',
                        fontFamily: 'var(--font-mono)',
                        fontWeight: 600,
                        fontSize: '0.875rem',
                        color: 'var(--color-accent)',
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

                <div style={{ paddingBottom: 'var(--spacing-4)', paddingTop: '8px', flex: 1, minWidth: 0 }}>
                  <h3
                    className="type-heading"
                    style={{ color: 'var(--color-ink)', fontSize: '1.1rem', marginBottom: 'var(--spacing-1)' }}
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

      {/* ── CTA Band ─────────────────────────────────────────────────────────── */}
      <section
        style={{
          backgroundColor: 'var(--color-surface)',
          borderTop: '1px solid var(--color-border)',
          borderBottom: '1px solid var(--color-border)',
          paddingTop: 'var(--spacing-12)',
          paddingBottom: 'var(--spacing-12)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Decorative SealIcon */}
        <div
          className="absolute pointer-events-none"
          style={{
            right: '-48px',
            top: '50%',
            transform: 'translateY(-50%)',
            opacity: 0.06,
            zIndex: 0,
          }}
          aria-hidden="true"
        >
          <SealIcon variant="static" size={280} />
        </div>

        <div className="container-wide" style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ maxWidth: '640px' }}>
            <p
              className="type-caption"
              style={{ color: 'var(--color-accent)', marginBottom: 'var(--spacing-2)' }}
            >
              GET STARTED TODAY
            </p>
            <h2
              className="type-display-lg"
              style={{ color: 'var(--color-ink)', marginBottom: 'var(--spacing-3)' }}
            >
              Ready to transact trustlessly?
            </h2>
            <p
              className="type-body"
              style={{
                color: 'var(--color-ink-muted)',
                maxWidth: '48ch',
                marginBottom: 'var(--spacing-4)',
              }}
            >
              Connect your Stellar wallet and start buying or selling on the decentralized marketplace.
              Every trade is protected by an on-chain escrow vault.
            </p>
            <Link
              href="/marketplace"
              className="btn-primary"
              id="cta-marketplace-btn"
              style={{ maxWidth: '280px' }}
            >
              Get Started →
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
