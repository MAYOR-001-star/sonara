-- ---------------------------------------------------------------------------
-- audiphile store - remove probe / test orders (and their line items)
-- Run after the order_items INSERT policy fix. Idempotent.
-- ---------------------------------------------------------------------------

delete from order_items
where order_id in (
  select id from orders
  where order_id in ('AP-TEST01', 'AP-PROBE2', 'AP-PROBE3', 'AP-7T7JZA')
);

delete from orders
where order_id in ('AP-TEST01', 'AP-PROBE2', 'AP-PROBE3', 'AP-7T7JZA');

-- ---------------------------------------------------------------------------
-- Remaining orders, for verification. Expect AP-YFXJBS only.
-- ---------------------------------------------------------------------------
select order_id, customer_email, grand_total, status, created_at
from orders
order by created_at desc;
