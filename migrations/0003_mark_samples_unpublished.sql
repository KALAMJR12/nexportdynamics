-- Keep example data available in the admin dashboard, but never publish it as
-- genuine customer feedback or current operational advice.
UPDATE feedback
SET client_name = '[SAMPLE] ' || client_name, published = 0
WHERE (client_name, company) IN (
  ('A. Hassan', 'Prime Agro Trade'),
  ('M. Okafor', 'Westport Logistics'),
  ('I. Musa', 'Blue Crest Metals')
);

UPDATE advisories
SET title = '[SAMPLE] ' || title,
    body = 'Sample only — replace with a verified current operational notice before publishing.',
    published = 0
WHERE title IN ('Port documentation reminder', 'Weather alert', 'Market notice');

INSERT INTO feedback (client_name, company, service, quote, rating, published)
SELECT '[SAMPLE] A. Hassan', 'Prime Agro Trade', 'Haulage',
       'Very responsive and clear from first call to delivery.', 5, 0
WHERE NOT EXISTS (SELECT 1 FROM feedback WHERE client_name = '[SAMPLE] A. Hassan');

INSERT INTO feedback (client_name, company, service, quote, rating, published)
SELECT '[SAMPLE] M. Okafor', 'Westport Logistics', 'Ocean Freight',
       'Their team kept our export schedule moving without surprises.', 4, 0
WHERE NOT EXISTS (SELECT 1 FROM feedback WHERE client_name = '[SAMPLE] M. Okafor');

INSERT INTO feedback (client_name, company, service, quote, rating, published)
SELECT '[SAMPLE] I. Musa', 'Blue Crest Metals', 'Minerals Resources',
       'Good coordination and fast customs communication on a tight deadline.', 5, 0
WHERE NOT EXISTS (SELECT 1 FROM feedback WHERE client_name = '[SAMPLE] I. Musa');

INSERT INTO advisories (title, body, severity, published, published_at)
SELECT '[SAMPLE] Port documentation reminder',
       'Sample only — replace with a verified current operational notice before publishing.',
       'info', 0, datetime('now', '-2 days')
WHERE NOT EXISTS (SELECT 1 FROM advisories WHERE title = '[SAMPLE] Port documentation reminder');

INSERT INTO advisories (title, body, severity, published, published_at)
SELECT '[SAMPLE] Weather alert',
       'Sample only — replace with a verified current operational notice before publishing.',
       'warning', 0, datetime('now', '-4 days')
WHERE NOT EXISTS (SELECT 1 FROM advisories WHERE title = '[SAMPLE] Weather alert');

INSERT INTO advisories (title, body, severity, published, published_at)
SELECT '[SAMPLE] Market notice',
       'Sample only — replace with a verified current operational notice before publishing.',
       'info', 0, datetime('now', '-6 days')
WHERE NOT EXISTS (SELECT 1 FROM advisories WHERE title = '[SAMPLE] Market notice');
