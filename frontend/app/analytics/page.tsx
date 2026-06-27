'use client';

import {
  BarChart3,
  TrendingUp,
  Package,
  ShoppingCart,
  Shield,
  Zap,
  Users,
  Activity,
} from 'lucide-react';
import { useActiveListings } from '../hooks/useListings';
import { useActivityStore } from '../state/txStore';

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
      color: 'text-violet-400',
      bg: 'bg-violet-400/10',
      description: 'Currently available',
    },
    {
      title: 'Escrow Events',
      value: escrowEvents.length,
      icon: Shield,
      color: 'text-cyan-400',
      bg: 'bg-cyan-400/10',
      description: 'Total on-chain events',
    },
    {
      title: 'Releases',
      value: releaseEvents.length,
      icon: TrendingUp,
      color: 'text-emerald-400',
      bg: 'bg-emerald-400/10',
      description: 'Successful settlements',
    },
    {
      title: 'Disputes',
      value: disputeEvents.length,
      icon: Activity,
      color: 'text-red-400',
      bg: 'bg-red-400/10',
      description: 'Raised disputes',
    },
    {
      title: 'Last Ledger',
      value: lastLedger || '—',
      icon: Zap,
      color: 'text-amber-400',
      bg: 'bg-amber-400/10',
      description: 'Last polled ledger',
    },
    {
      title: 'Event Types',
      value: new Set(events.map((e) => e.type)).size,
      icon: Users,
      color: 'text-blue-400',
      bg: 'bg-blue-400/10',
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

  return (
    <div className="container-wide py-12">
      <div className="mb-10">
        <h1 className="text-3xl font-bold">Analytics</h1>
        <p className="text-zinc-400 mt-1">
          Real-time marketplace statistics from on-chain data
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-10">
        {stats.map(({ title, value, icon: Icon, color, bg, description }) => (
          <div key={title} className="glass-card p-5">
            <div className="flex items-center justify-between mb-3">
              <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center`}>
                <Icon className={`w-4.5 h-4.5 ${color}`} />
              </div>
              <span className={`text-2xl font-bold ${color}`}>{value}</span>
            </div>
            <p className="text-sm font-medium text-zinc-300">{title}</p>
            <p className="text-xs text-zinc-600 mt-0.5">{description}</p>
          </div>
        ))}
      </div>

      {/* Event Breakdown */}
      <div className="glass-card p-6 mb-8">
        <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-violet-400" />
          Event Type Breakdown
        </h2>
        {eventBreakdown.length === 0 ? (
          <div className="text-center py-8 text-zinc-600 text-sm">
            No events captured yet — events appear as they occur on-chain
          </div>
        ) : (
          <div className="space-y-4">
            {eventBreakdown.map(([type, count]) => (
              <div key={type} className="flex items-center gap-4">
                <div className="w-32 text-xs text-zinc-400 shrink-0 truncate capitalize">
                  {type.replace(/_/g, ' ')}
                </div>
                <div className="flex-1 bg-zinc-800/50 rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full brand-gradient rounded-full transition-all duration-500"
                    style={{ width: `${(count / maxCount) * 100}%` }}
                  />
                </div>
                <span className="text-sm font-medium text-zinc-400 w-8 text-right shrink-0">
                  {count}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Contract Info */}
      <div className="glass-card p-6 bg-gradient-to-br from-violet-500/5 to-cyan-500/5">
        <h2 className="text-lg font-semibold mb-4">Ecosystem Fit</h2>
        <div className="grid md:grid-cols-2 gap-6 text-sm text-zinc-400 leading-relaxed">
          <div>
            <h3 className="text-zinc-200 font-medium mb-2">What Stellar Was Missing</h3>
            <p>
              Stellar&apos;s native claimable balances support conditional release but not bilateral
              confirmation, dispute freezing, or milestone-based partial releases. There is no
              first-class escrow primitive on Stellar that handles two-sided confirmation with
              arbitration.
            </p>
          </div>
          <div>
            <h3 className="text-zinc-200 font-medium mb-2">What LumenLock Adds</h3>
            <p>
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
