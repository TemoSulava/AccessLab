# Security policy

This engineering beta accepts security reports about permission escalation, remote executable code, unsafe page-string rendering, sensitive-data collection/export, message validation and effects that survive disposal. Supported baseline is the current main branch with the committed dependency lockfile. There is no promised response SLA yet.

Use GitHub's private security reporting/advisory flow when enabled: https://github.com/TemoSulava/AccessLab/security/advisories/new. If unavailable, contact the maintainer through a private channel you already share; a public issue may request private contact without vulnerability details. Never post credentials, private reports or personal page captures publicly. Provide a minimal synthetic reproduction, version/browser, expected/actual behavior and impact.

Only locally bundled reviewed code is trusted. Shadow DOM provides style isolation, not a security boundary against a hostile host that can remove resources. Pages are untrusted data; they cannot send commands through a window-message bridge. Extension messages require validated schemas and extension sender identity. No telemetry/server or remote module downloads exist. Permissions are activeTab, scripting and storage; test-only host access/activation is absent from production artifacts. See docs/privacy-and-scope.md for data and coverage limits.

Dependency changes require the recorded supply-chain checks in ADR 003. Keep package integrity, signatures and TLS verification enabled. CI uses pinned official actions and a read-only token, avoids retained checkout credentials and uploads only synthetic failure artifacts with short retention. Investigate and replace compromised artifacts before using them.
