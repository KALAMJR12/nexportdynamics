-- Sample content for owner replacement.
INSERT INTO feedback (client_name, company, service, quote, rating, published) VALUES
  ('A. Hassan', 'Prime Agro Trade', 'Haulage', 'Very responsive and clear from first call to delivery.', 5, 1),
  ('M. Okafor', 'Westport Logistics', 'Ocean Freight', 'Their team kept our export schedule moving without surprises.', 4, 1),
  ('I. Musa', 'Blue Crest Metals', 'Minerals Resources', 'Good coordination and fast customs communication on a tight deadline.', 5, 1);

INSERT INTO advisories (title, body, severity, published, published_at) VALUES
  ('Port documentation reminder', 'Submit export documents by 2pm WAT for same-day customs review.', 'info', 1, datetime('now', '-2 days')),
  ('Weather alert', 'Heavy rain may affect inland haulage in selected routes over the next 48 hours.', 'warning', 1, datetime('now', '-4 days')),
  ('Market notice', 'Scheduled buyers are currently reviewing lead ore cargoes for the next export window.', 'info', 1, datetime('now', '-6 days'));
