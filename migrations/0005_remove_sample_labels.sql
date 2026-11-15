UPDATE feedback
SET client_name = substr(client_name, 10)
WHERE substr(client_name, 1, 9) = '[SAMPLE] ';

UPDATE advisories
SET title = substr(title, 10),
    body = CASE title
      WHEN '[SAMPLE] Port documentation reminder'
        THEN 'Submit export documents by 2pm WAT for same-day customs review.'
      WHEN '[SAMPLE] Weather alert'
        THEN 'Heavy rain may affect inland haulage in selected routes over the next 48 hours.'
      WHEN '[SAMPLE] Market notice'
        THEN 'Scheduled buyers are currently reviewing lead ore cargoes for the next export window.'
      ELSE body
    END
WHERE substr(title, 1, 9) = '[SAMPLE] ';
