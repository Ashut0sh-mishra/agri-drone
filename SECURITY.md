# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| main    | :white_check_mark: |
| < main  | :x:                |

## Reporting a Vulnerability

**Do NOT open a public issue for security vulnerabilities.**

Instead, please report them responsibly via one of:

1. **GitHub Security Advisories** (preferred):
   Go to [Security → Advisories → New draft](https://github.com/Ashut0sh-mishra/agri-drone/security/advisories/new)

2. **Email**: Send details to the maintainer via GitHub profile contact.

### What to include

- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

### Response timeline

- **Acknowledgment**: within 48 hours
- **Assessment**: within 7 days
- **Fix release**: within 30 days for critical issues

## Security Measures

This project uses multiple layers of automated security:

| Layer | Tool | What it catches |
|-------|------|-----------------|
| Static Analysis | **CodeQL** | SQL injection, XSS, path traversal, code injection (OWASP Top 10) |
| Container Scanning | **Trivy** | CVEs in Docker base images and installed packages |
| Secret Detection | **Trivy Secrets** | Leaked API keys, tokens, passwords in code |
| Dependency Review | **GitHub Dependency Review** | Vulnerable or restrictively-licensed dependencies in PRs |
| Dependency Updates | **Dependabot** | Auto-PRs for outdated dependencies with known CVEs |
| Linting | **Ruff** | Code quality issues that can lead to bugs |
| Branch Protection | **GitHub Rules** | Requires PR reviews, passing CI, no force-push to main |

## Secrets Management

- All secrets (API keys, tokens) are stored in **GitHub Encrypted Secrets**, never in code.
- The CI/CD pipeline uses `${{ secrets.* }}` — secrets are masked in logs automatically.
- `.gitignore` excludes `.env`, `*.key`, `*.pem`, and credential files.

## For Contributors

- Never commit secrets, API keys, or tokens
- Never disable security checks (`--no-verify`, skip CI, etc.)
- All dependencies must be pinned to exact versions in `requirements.lock.txt`
- Docker images use non-root users
- All user input is validated at API boundaries (FastAPI/Pydantic)
