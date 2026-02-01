-- Migration: Add number_of_nights column to booking_options table
-- This column stores the number of nights for Outstation trips

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
        
        COMMENT ON COLUMN booking_options.number_of_nights IS 'Number of nights for Outstation trips. Only applicable when trip_type is "Outstation".';
    END IF;
END $$;
