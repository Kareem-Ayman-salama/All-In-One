# AIN Platform — Service Level Agreement (SLA) & Support Policy
*Enterprise Academy Hosting, Uptime Commitments, Incident Management, and Technical Support*

---

## 1. Service Commitment & Availability

AIN Platform provides cloud infrastructure and software services for educational academies with a monthly uptime commitment of **99.9%** (excluding scheduled maintenance).

### Uptime Calculation:
$$\text{Uptime \%} = \frac{\text{Total Minutes in Month} - \text{Downtime Minutes}}{\text{Total Minutes in Month}} \times 100$$

### Service Credits:
If AIN Platform fails to meet the guaranteed monthly uptime, eligible academies receive subscription service credits:

| Monthly Uptime Percentage | Service Credit Percentage |
| :--- | :---: |
| < 99.9% but $\ge$ 99.0% | **10%** of monthly subscription fee |
| < 99.0% but $\ge$ 95.0% | **25%** of monthly subscription fee |
| < 95.0% | **50%** of monthly subscription fee |

---

## 2. Recovery Objectives (RPO & RTO)

| Metric | Target | Description |
| :--- | :---: | :--- |
| **RPO (Recovery Point Objective)** | **$\le$ 1 Hour** | Maximum potential data loss window in an extreme disaster event. Guaranteed by automated backups and WAL streaming. |
| **RTO (Recovery Time Objective)** | **$\le$ 4 Hours** | Maximum elapsed time to restore full platform operational capacity following a catastrophic node failure. |

---

## 3. Incident Severity Levels & Response Times

Technical support is provided via in-app tickets, dedicated email (`support@ainplatform.com`), and WhatsApp Business priority line for Enterprise tier.

| Severity | Definition | First Response Target | Resolution Target |
| :--- | :--- | :---: | :---: |
| **P1 - Critical** | Entire platform or payment processing is down; students cannot access live sessions or classes. | **$\le$ 30 Minutes** (24/7) | $\le$ 4 Hours |
| **P2 - High** | Significant feature impairment (e.g. video upload failing, malware scanner bottleneck), but core platform operational. | **$\le$ 2 Hours** (8am - 10pm CLT) | $\le$ 12 Hours |
| **P3 - Medium** | Minor bug, administrative dashboard glitch, or non-blocking UI/UX issue. | **$\le$ 6 Hours** (Business hours) | $\le$ 48 Hours |
| **P4 - Low** | Feature requests, general questions, onboarding inquiries. | **$\le$ 24 Hours** (Business days) | Next Release Cycle |

---

## 4. Maintenance Windows

1. **Routine Maintenance**:
   - Performed weekly during lowest traffic hours (Friday 03:00 AM – 06:00 AM Cairo Local Time CLT).
   - Academies receive at least **48 hours advance notice** via in-app dashboard banner and administrative email.
2. **Emergency Hotfixes**:
   - Security vulnerabilities, zero-day threat patches, or critical malware definitions may be deployed immediately without prior notice.

---

## 5. Security & Data Protection Guarantees

- **Fail-Closed Malware Scanning**: Every user-uploaded video, document, or audio file is streamed through ClamAV antivirus daemon. Any infected or unreachable state triggers immediate quarantine and blocks downloads.
- **Tenant Isolation**: Multi-tenant database partitioning ensures that Student, Exam, and Revenue data of Academy A is strictly inaccessible to Academy B.
- **Redundant Storage**: All media and course materials are stored in private cloud object storage (S3/Cloudflare R2) with server-side encryption at rest (AES-256) and TLS 1.3 encryption in transit.
