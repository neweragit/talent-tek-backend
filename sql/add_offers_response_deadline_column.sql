-- Adds response deadline support for offers and expires old pending offers.
ALTER TABLE public.offers
ADD COLUMN IF NOT EXISTS response_deadline timestamp with time zone;

-- Any existing pending offer with a past deadline should become refused.
UPDATE public.offers
SET status = 'refused',
    updated_at = now()
WHERE status = 'pending'
  AND response_deadline IS NOT NULL
  AND response_deadline < now();
