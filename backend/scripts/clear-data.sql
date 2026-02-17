-- Clear Transactional Data script
-- Preserves Menu, Categories, Users, Roles, and Tables configuration.

BEGIN;

-- Disable triggers to avoid foreign key constraints during truncation if necessary
-- ( PostgreSQL specific: SET session_replication_role = 'replica'; )

-- Truncate transactional tables
TRUNCATE TABLE 
    order_items, 
    payments, 
    deliveries, 
    orders, 
    dues_payments, 
    expenses, 
    reservations, 
    notifications 
RESTART IDENTITY CASCADE;

-- Reset table statuses to FREE
UPDATE tables SET status = 'FREE';

-- Re-enable triggers
-- ( SET session_replication_role = 'origin'; )

COMMIT;
