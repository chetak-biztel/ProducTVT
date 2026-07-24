-- Adds the TAG value to SystemField. Split into its own migration because
-- Postgres won't let a newly-added enum value be used in the same
-- transaction that added it.
ALTER TYPE "SystemField" ADD VALUE 'TAG';
