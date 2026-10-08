# Local report export

Run an audit, open **Export report**, choose JSON or Markdown, and use **Preview export** before **Download report**. No downloads permission or upload service is used. Blob URLs are revoked after the download begins or on controller disposal.

JSON envelope schemaVersion is 1, with `audit` validated by the strict report schema and optional `observations` containing target-size and observed-focus data. Observations are heuristics, separate from automated violations and needsReview. Exports preserve engine/version/tags, viewport, timestamps, generation, revision, stale status, excluded-frame count, scope limits and every finding (including nullable severity and duplicate targets). Removed targets remain descriptive findings; export does not try to resolve them again. Import/replay is deferred.

URL query, fragment and user information are removed again at serialization. Page title, page text/HTML snippets, input values, cookies, tokens and screenshots are never collected into the report. Whitelisted fields and strict nested validation reject extra report fields. Descriptive locators may still reveal identifiers and page structure; the pathname can identify a private resource. Review and redact locally before sharing. A local download is the only transmission performed by this feature.

Markdown encodes untrusted punctuation and newlines as numeric character entities so strings cannot form HTML, Markdown links or injected headings. JSON uses ordinary JSON serialization; render it as text when consuming it. Both final serialized outputs have a 5 MiB UTF-8 budget. An oversized report produces an explicit error and no partial export; no findings are silently dropped. Display pagination does not limit export.
