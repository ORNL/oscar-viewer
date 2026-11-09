# Contributing to ORNL/oscar-viewer

`ORNL/oscar-viewer` is the web UI submodule (`web/oscar-viewer`) of [`ORNL/oscar`](https://github.com/ORNL/oscar).

## Fork & Pull Request Workflow

1. Fork [`ORNL/oscar-viewer`](https://github.com/ORNL/oscar-viewer) to your GitHub account or organization.
2. Create a feature or bugfix branch from `main`.
3. Run `npm ci`, `npm run audit:dependencies`, `npm run lint`, `npm run test:component`, and `npm run build` on Node.js 22.12+ (even-numbered LTS/current line).
4. Open a Pull Request targeting `ORNL/oscar-viewer:main`. All changes require code-owner review and passing CI checks before merge.
