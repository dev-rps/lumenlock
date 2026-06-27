'use client';

import { useState } from 'react';
import { useCreateListing } from '../hooks/useListings';
import { SUPPORTED_TOKENS, type CreateListingForm } from '../types';
import { Loader2, Plus, X } from 'lucide-react';

interface CreateListingFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function CreateListingFormPanel({ onSuccess, onCancel }: CreateListingFormProps) {
  const createListing = useCreateListing();
  const [form, setForm] = useState<CreateListingForm>({
    title: '',
    description: '',
    price: '',
    assetSymbol: 'XLM',
    useMilestones: false,
    milestones: [
      { label: 'Start', percentage: 30 },
      { label: 'Complete', percentage: 70 },
    ],
  });
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await createListing.mutateAsync(form);
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="glass-card p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Create Listing</h2>
        {onCancel && (
          <button type="button" onClick={onCancel} className="text-zinc-500 hover:text-zinc-300">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <div className="space-y-4">
        <label className="block">
          <span className="text-sm text-zinc-400">Title</span>
          <input
            required
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="mt-1 w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm"
          />
        </label>

        <label className="block">
          <span className="text-sm text-zinc-400">Description</span>
          <textarea
            required
            rows={3}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="mt-1 w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm"
          />
        </label>

        <div className="grid grid-cols-2 gap-4">
          <label className="block">
            <span className="text-sm text-zinc-400">Price</span>
            <input
              required
              type="number"
              min="0"
              step="any"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              className="mt-1 w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm"
            />
          </label>
          <label className="block">
            <span className="text-sm text-zinc-400">Asset</span>
            <select
              value={form.assetSymbol}
              onChange={(e) => setForm({ ...form, assetSymbol: e.target.value })}
              className="mt-1 w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm"
            >
              {Object.keys(SUPPORTED_TOKENS).map((symbol) => (
                <option key={symbol} value={symbol}>{symbol}</option>
              ))}
            </select>
          </label>
        </div>

        <label className="flex items-center gap-2 text-sm text-zinc-300">
          <input
            type="checkbox"
            checked={form.useMilestones}
            onChange={(e) => setForm({ ...form, useMilestones: e.target.checked })}
          />
          Use milestone payments (30% / 70%)
        </label>
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <button
        type="submit"
        disabled={createListing.isPending}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl brand-gradient text-white font-medium disabled:opacity-50"
      >
        {createListing.isPending ? (
          <><Loader2 className="w-4 h-4 animate-spin" /> Creating…</>
        ) : (
          <><Plus className="w-4 h-4" /> Publish Listing</>
        )}
      </button>
    </form>
  );
}
