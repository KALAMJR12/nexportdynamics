-- Publish clearly labeled placeholders until the owner replaces them.
UPDATE feedback
SET published = 1
WHERE client_name LIKE '[SAMPLE] %';

UPDATE advisories
SET body = CASE title
      WHEN '[SAMPLE] Port documentation reminder'
        THEN 'Sample notice: Submit export documents by 2pm WAT for same-day customs review.'
      WHEN '[SAMPLE] Weather alert'
        THEN 'Sample notice: Heavy rain may affect inland haulage in selected routes over the next 48 hours.'
      WHEN '[SAMPLE] Market notice'
        THEN 'Sample notice: Scheduled buyers are currently reviewing lead ore cargoes for the next export window.'
      ELSE body
    END,
    published = 1
WHERE title IN (
  '[SAMPLE] Port documentation reminder',
  '[SAMPLE] Weather alert',
  '[SAMPLE] Market notice'
);
