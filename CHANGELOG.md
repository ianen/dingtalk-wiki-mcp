# Changelog

## [1.0.0] - 2026-03-09

### Added
- Public open-source repository setup
- English and Chinese documentation split into separate files
- Positioning as a complement to DingTalk official MCP
- Demo assets for workspace listing, node browsing, and document creation
- FAQ
- Client integration examples
- Release notes and repository polish materials

### Changed
- README restructured for faster value comprehension
- Repository copy rewritten for higher trust and discoverability
- Documentation now highlights the Wiki / Docs read-write gap in the official DingTalk MCP

### Security
- Removed tenant-specific user metadata, workspace IDs, and local environment details from the public copy
- Replaced private config with `config.example.json`
- Ensured `config.json` and `.env` stay ignored by Git
