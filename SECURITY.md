# Security Policy

## Reporting a vulnerability

If you've found a security issue in Reactwright, please **do not file a
public GitHub issue**. Instead, open a private security advisory via
GitHub's [security advisories](https://github.com/reactwright/reactwright/security/advisories/new)
flow. You can also email the maintainers via the address listed on the
GitHub organization profile.

Please include:

- A clear description of the issue
- Steps to reproduce, if applicable
- The affected package(s) and version(s)
- Your assessment of the impact

We aim to acknowledge reports within 5 business days and to release a
fix or mitigation within 30 days for confirmed vulnerabilities.

## Supported versions

Reactwright is pre-1.0; only the latest minor version of each package
receives security fixes. Once we ship 1.0, we will adopt a longer
support window and update this document.

## Scope

Reactwright runs at build time, not in a hostile multi-tenant
environment. The most relevant security concerns are:

- **HTML/CSS injection** through document content (e.g., user-supplied
  strings that bypass `escapeHtml`)
- **Dependency vulnerabilities** in the engine or its bundled tools
  (Paged.js, KaTeX, Puppeteer)
- **File-system or process-execution** issues in the CLI / scaffolder

Out of scope: misuse of the rendered PDF output by downstream tools.
