-- Migration: Create pricing table for cab_type + trip_type based pricing
-- This table stores base_fare for each combination of cab_type and trip_type

-- Create pricing table if it doesn't exist
CREATE TABLE IF NOT EXISTS pricing (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    cab_type TEXT NOT NULL,
    trip_type TEXT NOT NULL,
    base_fare NUMERIC(10, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure unique combination of cab_type and trip_type
    UNIQUE(cab_type, trip_type)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_pricing_cab_trip ON pricing(cab_type, trip_type);

-- Enable Row Level Security (RLS)
ALTER TABLE pricing ENABLE ROW LEVEL SECURITY;

-- Create policy to allow public read access (for pricing display)
CREATE POLICY "Allow public read access to pricing"
    ON pricing
    FOR SELECT
    USING (true);

-- Insert default pricing data
-- You can modify these values as needed

-- Maruti Swift Dzire Or Similar CNG
INSERT INTO pricing (cab_type, trip_type, base_fare) VALUES
    ('Maruti Swift Dzire Or Similar CNG', 'Airport Transfer', 1000),
    ('Maruti Swift Dzire Or Similar CNG', 'Local', 1000),
    ('Maruti Swift Dzire Or Similar CNG', 'Outstation', 1000),
    ('Maruti Swift Dzire Or Similar CNG', 'One Way', 1000)
ON CONFLICT (cab_type, trip_type) DO UPDATE SET base_fare = EXCLUDED.base_fare;

-- Maruti Swift Dzire Or Similar Diesel
INSERT INTO pricing (cab_type, trip_type, base_fare) VALUES
    ('Maruti Swift Dzire Or Similar Diesel', 'Airport Transfer', 1100),
    ('Maruti Swift Dzire Or Similar Diesel', 'Local', 1100),
    ('Maruti Swift Dzire Or Similar Diesel', 'Outstation', 1100),
    ('Maruti Swift Dzire Or Similar Diesel', 'One Way', 1100)
ON CONFLICT (cab_type, trip_type) DO UPDATE SET base_fare = EXCLUDED.base_fare;

-- Maruti Ertiga Or Similar
INSERT INTO pricing (cab_type, trip_type, base_fare) VALUES
    ('Maruti Ertiga Or Similar', 'Airport Transfer', 1300),
    ('Maruti Ertiga Or Similar', 'Local', 1300),
    ('Maruti Ertiga Or Similar', 'Outstation', 1300),
    ('Maruti Ertiga Or Similar', 'One Way', 1300)
ON CONFLICT (cab_type, trip_type) DO UPDATE SET base_fare = EXCLUDED.base_fare;

-- Toyota Innova | Mahindra Marazzo
INSERT INTO pricing (cab_type, trip_type, base_fare) VALUES
    ('Toyota Innova | Mahindra Marazzo', 'Airport Transfer', 1500),
    ('Toyota Innova | Mahindra Marazzo', 'Local', 1500),
    ('Toyota Innova | Mahindra Marazzo', 'Outstation', 1500),
    ('Toyota Innova | Mahindra Marazzo', 'One Way', 1500)
ON CONFLICT (cab_type, trip_type) DO UPDATE SET base_fare = EXCLUDED.base_fare;

-- Toyota Innova Crysta
INSERT INTO pricing (cab_type, trip_type, base_fare) VALUES
    ('Toyota Innova Crysta', 'Airport Transfer', 1600),
    ('Toyota Innova Crysta', 'Local', 1600),
    ('Toyota Innova Crysta', 'Outstation', 1600),
    ('Toyota Innova Crysta', 'One Way', 1600)
ON CONFLICT (cab_type, trip_type) DO UPDATE SET base_fare = EXCLUDED.base_fare;

-- Tempo Traveller 17 Seater
INSERT INTO pricing (cab_type, trip_type, base_fare) VALUES
    ('Tempo Traveller 17 Seater', 'Airport Transfer', 2000),
    ('Tempo Traveller 17 Seater', 'Local', 2000),
    ('Tempo Traveller 17 Seater', 'Outstation', 2000),
    ('Tempo Traveller 17 Seater', 'One Way', 2000)
ON CONFLICT (cab_type, trip_type) DO UPDATE SET base_fare = EXCLUDED.base_fare;

-- Tempo Traveller 26 Seater
INSERT INTO pricing (cab_type, trip_type, base_fare) VALUES
    ('Tempo Traveller 26 Seater', 'Airport Transfer', 2500),
    ('Tempo Traveller 26 Seater', 'Local', 2500),
    ('Tempo Traveller 26 Seater', 'Outstation', 2500),
    ('Tempo Traveller 26 Seater', 'One Way', 2500)
ON CONFLICT (cab_type, trip_type) DO UPDATE SET base_fare = EXCLUDED.base_fare;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update updated_at
DROP TRIGGER IF EXISTS update_pricing_updated_at ON pricing;
CREATE TRIGGER update_pricing_updated_at
    BEFORE UPDATE ON pricing
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
