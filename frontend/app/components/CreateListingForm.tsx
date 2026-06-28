'use client';

import { useState } from 'react';
import { useCreateListing } from '../hooks/useListings';
import { SUPPORTED_TOKENS, type CreateListingForm } from '../types';
import { Plus, X } from 'lucide-react';
import { SealIcon } from './ui/SealIcon';

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
    <form onSubmit={handleSubmit} className="ll-card p-6 space-y-5">
      {/* Form Header */}
      <div className="flex items-center justify-between pb-4" style={{ borderBottom: '1px solid var(--color-border)' }}>
        <h2
          className="type-heading"
          style={{ color: 'var(--color-ink)', fontFamily: 'var(--font-display)' }}
        >
          Create Listing
        </h2>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="p-1.5 rounded-lg transition-colors"
            style={{ color: 'var(--color-ink-faint)' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-ink-muted)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-ink-faint)')}
            aria-label="Close create listing form"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <div className="space-y-4">
        {/* Title */}
        <div>
          <label className="ll-label" htmlFor="listing-title">
            Title
          </label>
          <input
            id="listing-title"
            required
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="ll-input"
            placeholder="e.g. Smart Contract Audit"
          />
        </div>

        {/* Description */}
        <div>
          <label className="ll-label" htmlFor="listing-description">
            Description
          </label>
          <textarea
            id="listing-description"
            required
            rows={3}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="ll-input"
            placeholder="Describe what you're offering…"
            style={{ resize: 'vertical' }}
          />
        </div>

        {/* Price + Asset */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="ll-label" htmlFor="listing-price">
              Price
            </label>
            <input
              id="listing-price"
              required
              type="number"
              min="0"
              step="any"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              className="ll-input"
              placeholder="0.00"
            />
          </div>
          <div>
            <label className="ll-label" htmlFor="listing-asset">
              Asset
            </label>
            <select
              id="listing-asset"
              value={form.assetSymbol}
              onChange={(e) => setForm({ ...form, assetSymbol: e.target.value })}
              className="ll-input"
              style={{ cursor: 'pointer' }}
            >
              {Object.keys(SUPPORTED_TOKENS).map((symbol) => (
                <option key={symbol} value={symbol}>
                  {symbol}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Milestones toggle */}
        <label
          className="flex items-center gap-3 cursor-pointer"
          htmlFor="listing-milestones"
        >
          <div className="relative">
            <input
              id="listing-milestones"
              type="checkbox"
              checked={form.useMilestones}
              onChange={(e) => setForm({ ...form, useMilestones: e.target.checked })}
              className="sr-only"
            />
            <div
              className="w-10 h-5 rounded-full transition-colors duration-200"
              style={{
                backgroundColor: form.useMilestones ? 'var(--color-trust)' : 'var(--color-border)',
              }}
            >
              <div
                className="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200"
                style={{ transform: form.useMilestones ? 'translateX(20px)' : 'translateX(0)' }}
              />
            </div>
          </div>
          <span className="type-body-sm" style={{ color: 'var(--color-ink-muted)' }}>
            Use milestone payments (30% start / 70% delivery)
          </span>
        </label>
      </div>

      {/* Error */}
      {error && (
        <div
          className="p-3 rounded-lg type-body-sm"
          style={{ backgroundColor: 'var(--color-danger-soft)', color: 'var(--color-danger)' }}
        >
          {error}
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={createListing.isPending}
        className="btn-primary w-full justify-center"
        style={{ padding: '0.75rem 1.5rem' }}
      >
        {createListing.isPending ? (
          <>
            <SealIcon variant="loading" size={20} />
            Creating…
          </>
        ) : (
          <>
            <Plus className="w-4.5 h-4.5" />
            Publish Listing
          </>
        )}
      </button>
    </form>
  );
}
