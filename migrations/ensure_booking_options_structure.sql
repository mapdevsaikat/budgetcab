-- Migration: Ensure booking_options table has all required columns
-- This migration ensures the table structure matches what the application expects

-- Create booking_options table if it doesn't exist
CREATE TABLE IF NOT EXISTS booking_options (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    cab_type TEXT NOT NULL,
    trip_type TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NULL,
    number_of_nights INTEGER NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add number_of_nights column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'booking_options' 
        AND column_name = 'number_of_nights'
    ) THEN
        ALTER TABLE booking_options 
        ADD COLUMN number_of_nights INTEGER NULL;
    END IF;
END $$;

-- Add end_date column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'booking_options' 
        AND column_name = 'end_date'
    ) THEN
        ALTER TABLE booking_options 
        ADD COLUMN end_date DATE NULL;
    END IF;
END $$;

-- Create index on booking_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_booking_options_booking_id ON booking_options(booking_id);

-- Enable Row Level Security (RLS)
ALTER TABLE booking_options ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can insert their own booking options" ON booking_options;
DROP POLICY IF EXISTS "Users can read their own booking options" ON booking_options;

-- Create policy to allow users to insert their own booking options
CREATE POLICY "Users can insert their own booking options"
    ON booking_options
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM bookings
            WHERE bookings.id = booking_options.booking_id
            AND bookings.user_id = auth.uid()
        )
    );

-- Create policy to allow users to read their own booking options
CREATE POLICY "Users can read their own booking options"
    ON booking_options
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM bookings
            WHERE bookings.id = booking_options.booking_id
            AND bookings.user_id = auth.uid()
        )
    );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_booking_options_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update updated_at
DROP TRIGGER IF EXISTS update_booking_options_updated_at ON booking_options;
CREATE TRIGGER update_booking_options_updated_at
    BEFORE UPDATE ON booking_options
    FOR EACH ROW
    EXECUTE FUNCTION update_booking_options_updated_at();
