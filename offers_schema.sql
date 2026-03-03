CREATE TABLE offers (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    application_id uuid NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    position VARCHAR(255) NOT NULL,
    salary VARCHAR(255) NOT NULL,
    start_date DATE NOT NULL,
    work_location VARCHAR(100),
    benefits_perks TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'refused')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE offers IS 'Stores job offers extended to candidates.';
COMMENT ON COLUMN offers.status IS 'The status of the offer: pending, accepted, or refused.';