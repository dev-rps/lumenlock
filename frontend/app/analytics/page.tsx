'use client';

import {
  Package,
  Shield,
  TrendingUp,
  Activity,
  Zap,
  Users,
} from 'lucide-react';
import { useActiveListings } from '../hooks/useListings';
import { useActivityStore } from '../state/txStore';

// ─── Donut SVG ────────────────────────────────────────────────────────────────
function DonutChart({
  data,
  size = 120,
}: {
  data: Array<{ label: string; value: number; color: string }>;
  size?: number;
}) {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  if (total === 0) return null;

  const r = 40;
  const circumference = 2 * Math.PI * r;
  const cx = size / 2;
  const cy = size / 2;

  let offset = 0;
  const segments = data.map((d) => {
    const pct = d.value / total;
    const dash = pct * circumference;
    const gap = circumference - dash;
    const seg = { ...d, dash, gap, offset };
    offset += dash;
    return seg;
  });

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke="var(--color-surface-sunken)"
        strokeWidth={18}
      />
      {segments.map((seg, i) => (
        <circle
          key={i}
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke={seg.color}
          strokeWidth={18}
          strokeDasharray={`${seg.dash} ${seg.gap}`}
          strokeDashoffset={-seg.offset}
          transform={`rotate(-90, ${cx}, ${cy})`}
          strokeLinecap="butt"
          style={{ transition: 'stroke-dasharray 0.4s ease' }}
        />
      ))}
      {/* Center label */}
      <text
        x={cx}
        y={cy}
        textAnchor="middle"
        dominantBaseline="middle"
        style={{
          fontSize: '1.1rem',
          fontWeight: 600,
          fill: 'var(--color-ink)',
          fontFamily: 'var(--font-mono)',
        }}
      >
        {total}
      </text>
    </svg>
  );
}

// ─── Stat Number Card ─────────────────────────────────────────────────────────
function StatCard({
  title,
  value,
  description,
  icon: Icon,
  iconBg,
  iconColor,
}: {
  title: string;
  value: string | number;
  description: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  iconBg: string;
  iconColor: string;
}) {
  return (
    <div className="ll-card p-5">
      <div className="flex items-center gap-2 mb-3">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
          style={{ backgroundColor: iconBg }}
        >
          <Icon className="w-[18px] h-[18px] shrink-0" style={{ color: iconColor }} />
        </div>
        <span
          className="font-semibold text-2xl"
          style={{ color: 'var(--color-ink)', fontFamily: 'var(--font-mono)' }}
        >
          {value}
        </span>
      </div>
      <p className="font-medium text-sm mb-0.5" style={{ color: 'var(--color-ink)', fontFamily: 'var(--font-ui)' }}>
        {title}
      </p>
      <p className="type-caption" style={{ color: 'var(--color-ink-faint)', textTransform: 'none', letterSpacing: 0 }}>
        {description}
      </p>
    </div>
  );
}

// ─── Bar Chart Row ─────────────────────────────────────────────────────────────
function BarRow({
  label,
  count,
  max,
  color,
}: {
  label: string;
  count: number;
  max: number;
  color: string;
}) {
  const pct = max > 0 ? (count / max) * 100 : 0;
  return (
    <div className="flex items-center gap-4">
      <div className="w-36 text-xs truncate capitalize shrink-0" style={{ color: 'var(--color-ink-muted)' }}>
        {label.replace(/_/g, ' ')}
      </div>
      <div
        className="flex-1 rounded-full overflow-hidden"
        style={{ backgroundColor: 'var(--color-surface-sunken)', height: 8 }}
      >
        <div
          className="h-full rounded-full"
          style={{
            width: `${pct}%`,
            backgroundColor: color,
            transition: 'width 0.5s ease',
          }}
        />
      </div>
      <span
        className="w-8 text-right text-sm font-medium shrink-0"
        style={{ color: 'var(--color-ink-muted)', fontFamily: 'var(--font-mono)' }}
      >
        {count}
      </span>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function AnalyticsPage() {
  const { data: listings } = useActiveListings();
  const { events, lastLedger } = useActivityStore();

  const totalListings = listings?.length ?? 0;
  const escrowEvents = events.filter((e) =>
    ['escrow_opened', 'escrow_funded', 'funds_released', 'refund_claimed'].includes(e.type),
  );
  const disputeEvents = events.filter((e) => e.type === 'dispute_raised');
  const releaseEvents = events.filter((e) => e.type === 'funds_released');

  const stats = [
    {
      title: 'Active Listings',
      value: totalListings,
      icon: Package,
      iconBg: 'var(--color-trust-soft)',
      iconColor: 'var(--color-trust)',
      description: 'Currently available',
    },
    {
      title: 'Escrow Events',
      value: escrowEvents.length,
      icon: Shield,
      iconBg: 'var(--color-trust-soft)',
      iconColor: 'var(--color-trust)',
      description: 'Total on-chain events',
    },
    {
      title: 'Successful Releases',
      value: releaseEvents.length,
      icon: TrendingUp,
      iconBg: 'var(--color-success-soft)',
      iconColor: 'var(--color-success)',
      description: 'Funds released to seller',
    },
    {
      title: 'Disputes',
      value: disputeEvents.length,
      icon: Activity,
      iconBg: 'var(--color-danger-soft)',
      iconColor: 'var(--color-danger)',
      description: 'Raised disputes',
    },
    {
      title: 'Last Ledger',
      value: lastLedger || '—',
      icon: Zap,
      iconBg: 'var(--color-accent-soft)',
      iconColor: 'var(--color-accent)',
      description: 'Last polled ledger',
    },
    {
      title: 'Event Types',
      value: new Set(events.map((e) => e.type)).size,
      icon: Users,
      iconBg: 'var(--color-surface-sunken)',
      iconColor: 'var(--color-ink-faint)',
      description: 'Distinct event types seen',
    },
  ];

  // Event type breakdown
  const eventBreakdown = Object.entries(
    events.reduce<Record<string, number>>((acc, e) => {
      acc[e.type] = (acc[e.type] || 0) + 1;
      return acc;
    }, {}),
  ).sort(([, a], [, b]) => b - a);

  const maxCount = eventBreakdown[0]?.[1] || 1;

  // Status distribution for donut
  const statusCounts = {
    Active:    listings?.filter((l) => l.status === 'Active').length ?? 0,
    Completed: listings?.filter((l) => l.status === 'Completed').length ?? 0,
    Disputed:  listings?.filter((l) => l.status === 'Disputed').length ?? 0,
    Locked:    listings?.filter((l) => l.status === 'Locked').length ?? 0,
  };
  const donutData = [
    { label: 'Active',    value: statusCounts.Active,    color: 'var(--color-trust)' },
    { label: 'Completed', value: statusCounts.Completed, color: 'var(--color-success)' },
    { label: 'Locked',    value: statusCounts.Locked,    color: 'var(--color-warning)' },
    { label: 'Disputed',  value: statusCounts.Disputed,  color: 'var(--color-danger)' },
  ].filter((d) => d.value > 0);

  return (
    <div className="container-wide py-12">
      {/* Header */}
      <div className="mb-10">
        <p className="type-caption mb-2" style={{ color: 'var(--color-accent)' }}>
          Insights
        </p>
        <h1
          className="type-display-lg mb-1"
          style={{ color: 'var(--color-ink)', fontFamily: 'var(--font-display)' }}
        >
          Analytics
        </h1>
        <p className="type-body-sm" style={{ color: 'var(--color-ink-muted)' }}>
          Real-time marketplace statistics from on-chain data
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-10">
        {stats.map((s) => (
          <StatCard key={s.title} {...s} />
        ))}
      </div>

      {/* Charts row */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        {/* Event breakdown bar chart */}
        <div className="ll-card p-6 md:col-span-2">
          <h2
            className="type-heading mb-6"
            style={{ color: 'var(--color-ink)', fontFamily: 'var(--font-display)', fontSize: '1.1rem' }}
          >
            Event Type Breakdown
          </h2>
          {eventBreakdown.length === 0 ? (
            <div className="py-8 text-center">
              <p className="type-body-sm" style={{ color: 'var(--color-ink-faint)' }}>
                No events captured yet — events appear as they occur on-chain
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {eventBreakdown.map(([type, count], i) => (
                <BarRow
                  key={type}
                  label={type}
                  count={count}
                  max={maxCount}
                  color={i === 0 ? 'var(--color-trust)' : i === 1 ? 'var(--color-accent)' : 'var(--color-border)'}
                />
              ))}
            </div>
          )}
        </div>

        {/* Status donut */}
        <div className="ll-card p-6 flex flex-col">
          <h2
            className="type-heading mb-6"
            style={{ color: 'var(--color-ink)', fontFamily: 'var(--font-display)', fontSize: '1.1rem' }}
          >
            Listing Status
          </h2>
          {donutData.length > 0 ? (
            <div className="flex flex-col items-center gap-5 flex-1 justify-center">
              <DonutChart data={donutData} size={140} />
              <div className="space-y-2 w-full">
                {donutData.map((d) => (
                  <div key={d.label} className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: d.color }}
                      />
                      <span className="text-sm" style={{ color: 'var(--color-ink-muted)' }}>
                        {d.label}
                      </span>
                    </div>
                    <span
                      className="text-sm font-medium"
                      style={{ color: 'var(--color-ink)', fontFamily: 'var(--font-mono)' }}
                    >
                      {d.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center flex-1">
              <p className="type-body-sm text-center" style={{ color: 'var(--color-ink-faint)' }}>
                No listing data yet
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Ecosystem info */}
      <div
        className="ll-card p-6"
        style={{ backgroundColor: 'var(--color-trust-soft)', borderColor: 'rgba(43,58,143,0.15)' }}
      >
        <h2
          className="type-heading mb-5"
          style={{ color: 'var(--color-trust)', fontFamily: 'var(--font-display)', fontSize: '1.1rem' }}
        >
          Ecosystem Fit
        </h2>
        <div className="grid md:grid-cols-2 gap-6 text-sm leading-relaxed" style={{ color: 'var(--color-trust)' }}>
          <div>
            <h3 className="font-semibold mb-2" style={{ fontFamily: 'var(--font-ui)' }}>
              What Stellar Was Missing
            </h3>
            <p style={{ opacity: 0.8 }}>
              Stellar&apos;s native claimable balances support conditional release but not bilateral
              confirmation, dispute freezing, or milestone-based partial releases. There is no
              first-class escrow primitive on Stellar that handles two-sided confirmation with
              arbitration.
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-2" style={{ fontFamily: 'var(--font-ui)' }}>
              What LumenLock Adds
            </h3>
            <p style={{ opacity: 0.8 }}>
              LumenLock fills that gap as a reusable Soroban escrow layer. Any marketplace,
              freelance platform, or P2P payment app on Stellar can build on top of these
              two contracts — MarketplaceRegistry + EscrowVault — without re-implementing
              escrow logic.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
