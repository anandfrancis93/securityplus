/**
 * Security+ SY0-701 Topic Data (Robust Version)
 *
 * Features:
 * - Stable IDs for each topic (e.g., "3.0.045")
 * - Canonical normalization to handle AI variations
 * - Rich metadata (domain, labels, aliases)
 * - Validation functions to catch errors
 * - Fuzzy matching for AI topic identification
 *
 * Safe to import in client components (no API dependencies)
 */

//////////////////////////////
// Types
//////////////////////////////

export type DomainId = "1.0" | "2.0" | "3.0" | "4.0" | "5.0";

export interface Topic {
  id: string;             // Stable ID: "3.0.045"
  label: string;          // Canonical exact string for tagging
  aliases?: string[];     // Common variations AI might return
  domainId: DomainId;
  domainLabel: string;    // "3.0 Security Architecture"
  isAbstract?: boolean;   // If true, avoid using as testable leaf topic
}

export interface DomainBlock {
  id: DomainId;
  label: string;
  topics: Topic[];
}

export interface TopicIndex {
  domains: Record<DomainId, DomainBlock>;
  byId: Record<string, Topic>;
  byLabel: Record<string, Topic>;
  allLabels: string[];  // For fuzzy matching
}

//////////////////////////////
// Canonical Fixes
//////////////////////////////

/**
 * CANONICAL_FIXES maps AI variations to exact topic labels.
 * Add entries whenever AI returns a variation that doesn't match exactly.
 */
const CANONICAL_FIXES: Record<string, string> = {
  // Common acronyms
  "WAF": "Web application firewall (WAF) (firewall type)",
  "CIA": "Confidentiality, Integrity, and Availability (CIA)",
  "AAA": "Authentication, Authorization, and Accounting (AAA)",
  "VPN": "Virtual private network (VPN) (secure communication)",
  "IDS": "Intrusion detection system (IDS) (network appliance)",
  "IPS": "Intrusion prevention system (IPS) (network appliance)",
  "PKI": "Public key infrastructure (PKI)",
  "TPM": "Trusted Platform Module (TPM)",
  "HSM": "Hardware security module (HSM)",
  "MDM": "Mobile device management (MDM) (mobile solution)",
  "NAC": "Network access control (NAC) (enterprise capability)",
  "EDR": "Endpoint detection and response (EDR) (enterprise capability)",
  "XDR": "Extended detection and response (XDR) (enterprise capability)",
  "DLP": "Data loss prevention (DLP) (enterprise capability)",
  "SIEM": "Security information and event management (SIEM) (monitoring tool)",
  "SCAP": "Security Content Automation Protocol (SCAP) (monitoring tool)",

  // Capitalization variations
  "Web Application Firewall": "Web application firewall (WAF) (firewall type)",
  "Zero Trust": "Zero Trust",
  "Public Key Infrastructure": "Public key infrastructure (PKI)",

  // Acronym spelling variations
  "IPSec": "Internet protocol security (IPSec) (secure communication)",
  "IPSEC": "Internet protocol security (IPSec) (secure communication)",
  "IPsec": "Internet protocol security (IPSec) (secure communication)",

  // SQL Injection variations
  "SQL Injection": "Structured Query Language injection (SQLi) (web-based vulnerability)",
  "SQLi": "Structured Query Language injection (SQLi) (web-based vulnerability)",
  "SQL injection": "Structured Query Language injection (SQLi) (web-based vulnerability)",

  // XSS variations
  "XSS": "Cross-site scripting (XSS) (web-based vulnerability)",
  "Cross-site scripting": "Cross-site scripting (XSS) (web-based vulnerability)",
  "Cross-Site Scripting": "Cross-site scripting (XSS) (web-based vulnerability)",

  // DDoS variations
  "DDoS": "Distributed denial-of-service (DDoS) (network attack)",
  "Distributed Denial of Service": "Distributed denial-of-service (DDoS) (network attack)",

  // Ambiguous terms (default to most common)
  "Encryption": "Encryption (mitigation)",
  "Segmentation": "Segmentation (mitigation)",
  "Monitoring": "Monitoring (mitigation)",
  "Patching": "Patching (mitigation)",
  "Access control": "Access control (mitigation)",
  "Isolation": "Isolation (mitigation)",

  // Firewall types
  "Layer 4/Layer 7": "Layer 4/Layer 7 (firewall type)",
  "NGFW": "Next-generation firewall (NGFW) (firewall type)",
  "UTM": "Unified threat management (UTM) (firewall type)",

  // MFA factors
  "Something You Know": "Something you know (MFA factor)",
  "Something You Have": "Something you have (MFA factor)",
  "Something You Are": "Something you are (MFA factor)",
  "Somewhere You Are": "Somewhere you are (MFA factor)",
};

/** Normalize a label (trim, apply canonical fix if available) */
function normalizeLabel(label: string): string {
  const trimmed = label.replace(/\s+/g, " ").trim();
  return CANONICAL_FIXES[trimmed] ?? trimmed;
}

/** Check if label is too vague to be testable */
function isAbstractLabel(label: string): boolean {
  return /selection of effective controls|continuity of operations/i.test(label);
}

//////////////////////////////
// RAW DATA (from original topicData.ts)
//////////////////////////////

type RawTopicMap = { [domainLabel: string]: string[] };

const RAW_TOPICS: RawTopicMap = {
  '1.0 General Security Concepts': [
    'Technical (control category)', 'Managerial (control category)', 'Operational (control category)', 'Physical (control category)',
    'Preventive (control type)', 'Deterrent (control type)', 'Detective (control type)', 'Corrective (control type)',
    'Compensating (control type)', 'Directive (control type)',
    'Confidentiality, Integrity, and Availability (CIA)',
    'Non-repudiation',
    'Authentication, Authorization, and Accounting (AAA)',
    'Gap analysis',
    'Zero Trust',
    'Control Plane (Zero Trust)', 'Adaptive identity (Zero Trust)', 'Threat scope reduction (Zero Trust)',
    'Policy-driven access control (Zero Trust)', 'Policy Administrator (Zero Trust)', 'Policy Engine (Zero Trust)',
    'Data Plane (Zero Trust)', 'Implicit trust zones (Zero Trust)', 'Subject/System (Zero Trust)',
    'Policy Enforcement Point (Zero Trust)',
    'Bollards (physical security)', 'Access control vestibule (physical security)', 'Fencing (physical security)',
    'Video surveillance (physical security)', 'Security guard (physical security)', 'Access badge (physical security)',
    'Lighting (physical security)',
    'Infrared sensor (physical security)', 'Pressure sensor (physical security)', 'Microwave sensor (physical security)',
    'Ultrasonic sensor (physical security)',
    'Honeypot (deception)', 'Honeynet (deception)', 'Honeyfile (deception)', 'Honeytoken (deception)',
    'Approval process (change management process)', 'Ownership (change management process)', 'Stakeholders (change management process)',
    'Impact analysis (change management process)', 'Test results (change management process)', 'Backout plan (change management process)',
    'Maintenance window (change management process)', 'Standard operating procedure (change management process)',
    'Allow lists/deny lists (technical implication)', 'Restricted activities (technical implication)',
    'Downtime (technical implication)', 'Service restart (technical implication)', 'Application restart (technical implication)',
    'Legacy applications (technical implication)', 'Dependencies (technical implication)',
    'Updating diagrams (documentation)', 'Updating policies/procedures (documentation)', 'Version control (documentation)',
    'Public key infrastructure (PKI)', 'Public key (PKI)', 'Private key (PKI)', 'Key escrow (PKI)',
    'Full-disk (encryption level)', 'Partition (encryption level)', 'File (encryption level)', 'Volume (encryption level)',
    'Database (encryption level)', 'Record (encryption level)', 'Transport/communication (encryption level)',
    'Asymmetric (encryption type)', 'Symmetric (encryption type)', 'Key exchange (encryption)', 'Algorithms (encryption)',
    'Key length (encryption)',
    'Trusted Platform Module (TPM)', 'Hardware security module (HSM)', 'Key management system', 'Secure enclave',
    'Steganography (obfuscation)', 'Tokenization (obfuscation)', 'Data masking (obfuscation)', 'Obfuscation',
    'Hashing', 'Salting (hashing)', 'Digital signatures', 'Key stretching',
    'Blockchain', 'Open public ledger (blockchain)',
    'Certificate authorities', 'Certificate revocation lists (CRLs)', 'Online Certificate Status Protocol (OCSP)',
    'Self-signed (certificate)', 'Third-party (certificate)', 'Root of trust (certificate)',
    'Certificate signing request (CSR) generation', 'Wildcard (certificate)'
  ],
  '2.0 Threats, Vulnerabilities, and Mitigations': [
    'Nation-state (threat actor)', 'Unskilled attacker (threat actor)', 'Hacktivist (threat actor)',
    'Insider threat (threat actor)', 'Organized crime (threat actor)', 'Shadow IT (threat actor)',
    'Internal/external (threat actor attribute)', 'Resources/funding (threat actor attribute)',
    'Level of sophistication/capability (threat actor attribute)',
    'Data exfiltration (motivation)', 'Espionage (motivation)', 'Service disruption (motivation)', 'Blackmail (motivation)',
    'Financial gain (motivation)', 'Philosophical/political beliefs (motivation)', 'Ethical (motivation)', 'Revenge (motivation)',
    'Disruption/chaos (motivation)', 'War (motivation)',
    'Email (message-based)', 'Short Message Service (SMS) (message-based)', 'Instant messaging (IM) (message-based)',
    'Image-based (threat vector)', 'File-based (threat vector)', 'Voice call (threat vector)', 'Removable device (threat vector)',
    'Client-based vs. agentless (vulnerable software)', 'Unsupported systems and applications (vulnerable software)',
    'Wireless (unsecure network)', 'Wired (unsecure network)', 'Bluetooth (unsecure network)',
    'Open service ports (attack surface)', 'Default credentials (attack surface)',
    'Supply chain (attack surface)', 'Managed service providers (MSPs) (supply chain)', 'Vendors (supply chain)',
    'Suppliers (supply chain)',
    'Phishing (social engineering)', 'Vishing (social engineering)', 'Smishing (social engineering)',
    'Misinformation/disinformation (social engineering)', 'Impersonation (social engineering)',
    'Business email compromise (social engineering)', 'Pretexting (social engineering)', 'Watering hole (social engineering)',
    'Brand impersonation (social engineering)', 'Typosquatting (social engineering)',
    'Memory injection (application vulnerability)', 'Buffer overflow (application vulnerability)',
    'Race conditions (application vulnerability)', 'Time-of-check (TOC) (race condition)', 'Time-of-use (TOU) (race condition)',
    'Malicious update (application vulnerability)',
    'Operating system (OS)-based (vulnerability)',
    'Structured Query Language injection (SQLi) (web-based vulnerability)',
    'Cross-site scripting (XSS) (web-based vulnerability)',
    'Firmware (hardware vulnerability)', 'End-of-life (hardware vulnerability)', 'Legacy (hardware vulnerability)',
    'Virtualization (vulnerability)', 'Virtual machine (VM) escape (virtualization vulnerability)',
    'Resource reuse (virtualization vulnerability)',
    'Cloud-specific (vulnerability)',
    'Service provider (supply chain vulnerability)', 'Hardware provider (supply chain vulnerability)',
    'Software provider (supply chain vulnerability)',
    'Cryptographic (vulnerability)', 'Misconfiguration (vulnerability)', 'Mobile device (vulnerability)',
    'Side loading (mobile device vulnerability)', 'Jailbreaking (mobile device vulnerability)', 'Zero-day (vulnerability)',
    'Ransomware (malware)', 'Trojan (malware)', 'Worm (malware)', 'Spyware (malware)', 'Bloatware (malware)',
    'Virus (malware)', 'Keylogger (malware)', 'Logic bomb (malware)', 'Rootkit (malware)',
    'Brute force (physical attack)', 'Radio frequency identification (RFID) cloning (physical attack)',
    'Environmental (physical attack)',
    'Distributed denial-of-service (DDoS) (network attack)', 'Amplified (DDoS)', 'Reflected (DDoS)',
    'Domain Name System (DNS) attacks (network attack)', 'Wireless (network attack)', 'On-path attack (network attack)',
    'Credential replay (network attack)', 'Malicious code (network attack)',
    'Injection (application attack)', 'Buffer overflow (application attack)', 'Replay (application attack)',
    'Privilege escalation (application attack)', 'Forgery (application attack)', 'Directory traversal (application attack)',
    'Downgrade (cryptographic attack)', 'Collision (cryptographic attack)', 'Birthday (cryptographic attack)',
    'Spraying (password attack)', 'Brute force (password attack)',
    'Account lockout (indicator)', 'Concurrent session usage (indicator)', 'Blocked content (indicator)',
    'Impossible travel (indicator)', 'Resource consumption (indicator)', 'Resource inaccessibility (indicator)',
    'Out-of-cycle logging (indicator)', 'Published/documented (indicator)', 'Missing logs (indicator)',
    'Segmentation (mitigation)',
    'Access control (mitigation)', 'Access control list (ACL) (access control)', 'Permissions (access control)',
    'Application allow list (application security)', 'Isolation (mitigation)',
    'Patching (mitigation)', 'Encryption (mitigation)', 'Monitoring (mitigation)', 'Least privilege (mitigation)',
    'Configuration enforcement (mitigation)', 'Decommissioning (mitigation)',
    'Installation of endpoint protection (hardening)', 'Host-based firewall (hardening)',
    'Host-based intrusion prevention system (HIPS) (hardening)', 'Disabling ports/protocols (hardening)',
    'Default password changes (hardening)', 'Removal of unnecessary software (hardening)'
  ],
  '3.0 Security Architecture': [
    'Cloud (architecture model)', 'Responsibility matrix (cloud)', 'Hybrid considerations (cloud)', 'Third-party vendors (cloud)',
    'Infrastructure as code (IaC) (architecture model)', 'Serverless (architecture model)', 'Microservices (architecture model)',
    'Physical isolation (network infrastructure)', 'Air-gapped (network infrastructure)', 'Logical segmentation (network infrastructure)',
    'Software-defined networking (SDN) (network infrastructure)',
    'On-premises (architecture model)', 'Centralized vs. decentralized (architecture model)', 'Containerization (architecture model)',
    'Virtualization (architecture model)',
    'IoT (architecture model)', 'Industrial control systems (ICS) (architecture model)',
    'Supervisory control and data acquisition (SCADA) (architecture model)',
    'Real-time operating system (RTOS) (architecture model)', 'Embedded systems (architecture model)',
    'High availability (architecture consideration)', 'Availability (architecture consideration)',
    'Resilience (architecture consideration)', 'Cost (architecture consideration)',
    'Responsiveness (architecture consideration)', 'Scalability (architecture consideration)',
    'Ease of deployment (architecture consideration)', 'Risk transference (architecture consideration)',
    'Ease of recovery (architecture consideration)', 'Patch availability (architecture consideration)',
    'Inability to patch (architecture consideration)', 'Power (architecture consideration)', 'Compute (architecture consideration)',
    'Device placement (infrastructure consideration)', 'Security zones (infrastructure consideration)',
    'Attack surface (infrastructure consideration)', 'Connectivity (infrastructure consideration)',
    'Failure modes (infrastructure consideration)',
    'Fail-open (failure mode)', 'Fail-closed (failure mode)',
    'Active vs. passive (device attribute)', 'Inline vs. tap/monitor (device attribute)',
    'Jump server (network appliance)', 'Proxy server (network appliance)', 'Intrusion prevention system (IPS) (network appliance)',
    'Intrusion detection system (IDS) (network appliance)', 'Load balancer (network appliance)', 'Sensors (network appliance)',
    'Port security', '802.1X (port security)', 'Extensible Authentication Protocol (EAP) (port security)',
    'Web application firewall (WAF) (firewall type)', 'Unified threat management (UTM) (firewall type)',
    'Next-generation firewall (NGFW) (firewall type)', 'Layer 4/Layer 7 (firewall type)',
    'Virtual private network (VPN) (secure communication)', 'Remote access (secure communication)', 'Tunneling (secure communication)',
    'Transport Layer Security (TLS) (secure communication)', 'Internet protocol security (IPSec) (secure communication)',
    'Software-defined wide area network (SD-WAN) (secure communication)', 'Secure access service edge (SASE) (secure communication)',
    'Selection of effective controls',
    'Regulated (data type)', 'Trade secret (data type)', 'Intellectual property (data type)', 'Legal information (data type)',
    'Financial information (data type)', 'Human- and non-human-readable (data type)',
    'Sensitive (data classification)', 'Confidential (data classification)', 'Public (data classification)',
    'Restricted (data classification)', 'Private (data classification)', 'Critical (data classification)',
    'Data at rest (data state)', 'Data in transit (data state)', 'Data in use (data state)',
    'Data sovereignty', 'Geolocation (data sovereignty)',
    'Geographic restrictions (data protection method)', 'Encryption (data protection method)', 'Hashing (data protection method)',
    'Masking (data protection method)', 'Tokenization (data protection method)', 'Obfuscation (data protection method)',
    'Segmentation (data protection method)', 'Permission restrictions (data protection method)',
    'Load balancing vs. clustering (resilience)',
    'Hot site (site consideration)', 'Cold site (site consideration)', 'Warm site (site consideration)',
    'Geographic dispersion (resilience)', 'Platform diversity (resilience)', 'Multi-cloud systems (resilience)',
    'Continuity of operations (resilience)',
    'Capacity planning (resilience)', 'People (capacity planning)', 'Technology (capacity planning)',
    'Infrastructure (capacity planning)',
    'Tabletop exercises (testing)', 'Fail over (testing)', 'Simulation (testing)', 'Parallel processing (testing)',
    'Backups', 'Onsite/offsite (backups)', 'Frequency (backups)', 'Encryption (backups)', 'Snapshots (backups)',
    'Recovery (backups)', 'Replication (backups)', 'Journaling (backups)',
    'Generators (power)', 'Uninterruptible power supply (UPS) (power)'
  ],
  '4.0 Security Operations': [
    'Establish (secure baseline)', 'Deploy (secure baseline)', 'Maintain (secure baseline)',
    'Mobile devices (hardening target)', 'Workstations (hardening target)', 'Switches (hardening target)',
    'Routers (hardening target)', 'Cloud infrastructure (hardening target)', 'Servers (hardening target)',
    'ICS/SCADA (hardening target)', 'Embedded systems (hardening target)', 'RTOS (hardening target)',
    'IoT devices (hardening target)', 'Wireless devices (hardening target)',
    'Site surveys (installation consideration)', 'Heat maps (installation consideration)',
    'Mobile device management (MDM) (mobile solution)',
    'Bring your own device (BYOD) (deployment model)', 'Corporate-owned, personally enabled (COPE) (deployment model)',
    'Choose your own device (CYOD) (deployment model)',
    'Cellular (connection method)', 'Wi-Fi (connection method)', 'Bluetooth (connection method)',
    'Wi-Fi Protected Access 3 (WPA3) (wireless security)', 'AAA/Remote Authentication Dial-In User Service (RADIUS) (wireless security)',
    'Cryptographic protocols (wireless security)', 'Authentication protocols (wireless security)',
    'Input validation (application security)', 'Secure cookies (application security)', 'Static code analysis (application security)',
    'Code signing (application security)', 'Sandboxing (application security)',
    'Acquisition/procurement process (asset management)', 'Assignment/accounting (asset management)',
    'Ownership (asset management)', 'Classification (asset management)', 'Monitoring/asset tracking (asset management)',
    'Inventory (asset management)', 'Enumeration (asset management)',
    'Disposal/decommissioning (asset management)', 'Sanitization (disposal)', 'Destruction (disposal)',
    'Certification (disposal)', 'Data retention (asset management)',
    'Vulnerability scan (identification method)', 'Application security (identification method)', 'Static analysis (identification method)',
    'Dynamic analysis (identification method)', 'Package monitoring (identification method)', 'Threat feed (identification method)',
    'Open-source intelligence (OSINT) (identification method)', 'Proprietary/third-party (threat feed)',
    'Information-sharing organization (identification method)', 'Dark web (identification method)',
    'Penetration testing (identification method)', 'Responsible disclosure program (identification method)',
    'Bug bounty program (identification method)', 'System/process audit (identification method)',
    'Confirmation (analysis)', 'False positive (analysis)', 'False negative (analysis)', 'Prioritize (analysis)',
    'Common Vulnerability Scoring System (CVSS) (analysis)', 'Common Vulnerability Enumeration (CVE) (analysis)',
    'Vulnerability classification (analysis)', 'Exposure factor (analysis)', 'Environmental variables (analysis)',
    'Industry/organizational impact (analysis)', 'Risk tolerance (analysis)',
    'Patching (remediation)', 'Insurance (remediation)', 'Segmentation (remediation)', 'Compensating controls (remediation)',
    'Exceptions and exemptions (remediation)',
    'Rescanning (validation)', 'Audit (validation)', 'Verification (validation)', 'Reporting (validation)',
    'Systems (monitoring resource)', 'Applications (monitoring resource)', 'Infrastructure (monitoring resource)',
    'Log aggregation (monitoring activity)', 'Alerting (monitoring activity)', 'Scanning (monitoring activity)',
    'Reporting (monitoring activity)', 'Archiving (monitoring activity)',
    'Quarantine (alert response)', 'Alert tuning (alert response)',
    'Security Content Automation Protocol (SCAP) (monitoring tool)', 'Benchmarks (monitoring tool)',
    'Agents/agentless (monitoring tool)', 'Security information and event management (SIEM) (monitoring tool)',
    'Antivirus (monitoring tool)', 'Data loss prevention (DLP) (monitoring tool)',
    'Simple Network Management Protocol (SNMP) traps (monitoring tool)', 'NetFlow (monitoring tool)',
    'Vulnerability scanners (monitoring tool)',
    'Firewall rules (firewall)', 'Access lists (firewall)', 'Ports/protocols (firewall)', 'Screened subnets (firewall)',
    'IDS/IPS trends (IDS/IPS)', 'Signatures (IDS/IPS)',
    'Agent-based (web filter)', 'Centralized proxy (web filter)', 'Universal Resource Locator (URL) scanning (web filter)',
    'Content categorization (web filter)', 'Block rules (web filter)', 'Reputation (web filter)',
    'Group Policy (operating system security)', 'SELinux (operating system security)',
    'Protocol selection (secure protocols)', 'Port selection (secure protocols)', 'Transport method (secure protocols)',
    'DNS filtering (enterprise capability)',
    'Domain-based Message Authentication Reporting and Conformance (DMARC) (email security)',
    'DomainKeys Identified Mail (DKIM) (email security)', 'Sender Policy Framework (SPF) (email security)',
    'Gateway (email security)',
    'File integrity monitoring (enterprise capability)', 'Data loss prevention (DLP) (enterprise capability)',
    'Network access control (NAC) (enterprise capability)', 'Endpoint detection and response (EDR) (enterprise capability)',
    'Extended detection and response (XDR) (enterprise capability)', 'User behavior analytics (enterprise capability)',
    'Provisioning/de-provisioning user accounts (IAM)', 'Permission assignments and implications (IAM)',
    'Identity proofing (IAM)', 'Federation (IAM)',
    'Single sign-on (SSO) (federation)', 'Lightweight Directory Access Protocol (LDAP) (federation)',
    'Open authorization (OAuth) (federation)', 'Security Assertions Markup Language (SAML) (federation)',
    'Interoperability (federation)', 'Attestation (IAM)',
    'Mandatory (access control)', 'Discretionary (access control)', 'Role-based (access control)',
    'Rule-based (access control)', 'Attribute-based (access control)', 'Time-of-day restrictions (access control)',
    'Least privilege (access control)',
    'Biometrics (MFA implementation)', 'Hard/soft authentication tokens (MFA implementation)', 'Security keys (MFA implementation)',
    'Something you know (MFA factor)', 'Something you have (MFA factor)', 'Something you are (MFA factor)',
    'Somewhere you are (MFA factor)',
    'Password length (password concept)', 'Password complexity (password concept)', 'Password reuse (password concept)',
    'Password expiration (password concept)', 'Password age (password concept)', 'Password managers (password concept)',
    'Passwordless (password concept)',
    'Just-in-time permissions (privileged access management)', 'Password vaulting (privileged access management)',
    'Ephemeral credentials (privileged access management)',
    'User provisioning (automation use case)', 'Resource provisioning (automation use case)', 'Guard rails (automation use case)',
    'Security groups (automation use case)', 'Ticket creation (automation use case)', 'Escalation (automation use case)',
    'Enabling/disabling services and access (automation use case)', 'Continuous integration and testing (automation use case)',
    'Integrations and Application programming interfaces (APIs) (automation use case)',
    'Efficiency/time saving (automation benefit)', 'Enforcing baselines (automation benefit)',
    'Standard infrastructure configurations (automation benefit)', 'Scaling in a secure manner (automation benefit)',
    'Employee retention (automation benefit)', 'Reaction time (automation benefit)', 'Workforce multiplier (automation benefit)',
    'Complexity (automation consideration)', 'Cost (automation consideration)', 'Single point of failure (automation consideration)',
    'Technical debt (automation consideration)', 'Ongoing supportability (automation consideration)',
    'Preparation (incident response process)', 'Detection (incident response process)', 'Analysis (incident response process)',
    'Containment (incident response process)', 'Eradication (incident response process)', 'Recovery (incident response process)',
    'Lessons learned (incident response process)',
    'Training (incident response)', 'Tabletop exercise (incident response testing)', 'Simulation (incident response testing)',
    'Root cause analysis (incident response)', 'Threat hunting (incident response)',
    'Digital forensics (incident response)', 'Legal hold (digital forensics)', 'Chain of custody (digital forensics)',
    'Acquisition (digital forensics)', 'Reporting (digital forensics)', 'Preservation (digital forensics)',
    'E-discovery (digital forensics)',
    'Firewall logs (log data)', 'Application logs (log data)', 'Endpoint logs (log data)', 'OS-specific security logs (log data)',
    'IPS/IDS logs (log data)', 'Network logs (log data)', 'Metadata (log data)',
    'Vulnerability scans (data source)', 'Automated reports (data source)', 'Dashboards (data source)', 'Packet captures (data source)'
  ],
  '5.0 Security Program Management and Oversight': [
    'Guidelines (governance)',
    'Acceptable use policy (AUP) (policy)',
    'Information security policies (policy)',
    'Business continuity (policy)',
    'Disaster recovery (policy)',
    'Incident response (policy)',
    'Software development lifecycle (SDLC) (policy)',
    'Change management (policy)',
    'Password (standard)',
    'Access control (standard)',
    'Physical security (standard)',
    'Encryption (standard)',
    'Change management (procedure)',
    'Onboarding/offboarding (procedure)',
    'Playbooks (procedure)',
    'Regulatory (external consideration)',
    'Legal (external consideration)',
    'Industry (external consideration)',
    'Local/regional (external consideration)',
    'National (external consideration)',
    'Global (external consideration)',
    'Monitoring and revision (governance)',
    'Boards (governance structure)',
    'Committees (governance structure)',
    'Government entities (governance structure)',
    'Centralized/decentralized (governance structure)',
    'Owners (roles and responsibilities)',
    'Controllers (roles and responsibilities)',
    'Processors (roles and responsibilities)',
    'Custodians/stewards (roles and responsibilities)',
    'Risk identification (risk management)',
    'Ad hoc (risk assessment)',
    'Recurring (risk assessment)',
    'One-time (risk assessment)',
    'Continuous (risk assessment)',
    'Qualitative (risk analysis)',
    'Quantitative (risk analysis)',
    'Single loss expectancy (SLE) (risk analysis)',
    'Annualized loss expectancy (ALE) (risk analysis)',
    'Annualized rate of occurrence (ARO) (risk analysis)',
    'Probability (risk analysis)',
    'Likelihood (risk analysis)',
    'Exposure factor (risk analysis)',
    'Impact (risk analysis)',
    'Risk register (risk management)',
    'Key risk indicators (risk management)',
    'Risk owners (risk management)',
    'Risk threshold (risk management)',
    'Risk tolerance (risk management)',
    'Risk appetite (risk management)',
    'Expansionary (risk appetite)',
    'Conservative (risk appetite)',
    'Neutral (risk appetite)',
    'Transfer (risk strategy)',
    'Accept (risk strategy)',
    'Exemption (risk acceptance)',
    'Exception (risk acceptance)',
    'Avoid (risk strategy)',
    'Mitigate (risk strategy)',
    'Risk reporting (risk management)',
    'Business impact analysis (risk management)',
    'Recovery time objective (RTO) (business impact analysis)',
    'Recovery point objective (RPO) (business impact analysis)',
    'Mean time to repair (MTTR) (business impact analysis)',
    'Mean time between failures (MTBF) (business impact analysis)',
    'Penetration testing (vendor assessment)',
    'Right-to-audit clause (vendor assessment)',
    'Evidence of internal audits (vendor assessment)',
    'Independent assessments (vendor assessment)',
    'Supply chain analysis (third-party risk)',
    'Due diligence (vendor selection)',
    'Conflict of interest (vendor selection)',
    'Service-level agreement (SLA) (agreement type)',
    'Memorandum of agreement (MOA) (agreement type)',
    'Memorandum of understanding (MOU) (agreement type)',
    'Master service agreement (MSA) (agreement type)',
    'Work order (WO)/statement of work (SOW) (agreement type)',
    'Non-disclosure agreement (NDA) (agreement type)',
    'Business partners agreement (BPA) (agreement type)',
    'Vendor monitoring (third-party risk)',
    'Questionnaires (vendor monitoring)',
    'Rules of engagement (vendor monitoring)',
    'Internal (compliance reporting)',
    'External (compliance reporting)',
    'Fines (consequence of non-compliance)',
    'Sanctions (consequence of non-compliance)',
    'Reputational damage (consequence of non-compliance)',
    'Loss of license (consequence of non-compliance)',
    'Contractual impacts (consequence of non-compliance)',
    'Due diligence/care (compliance monitoring)',
    'Attestation and acknowledgement (compliance monitoring)',
    'Internal and external (compliance monitoring)',
    'Automation (compliance monitoring)',
    'Legal implications (privacy)',
    'Data subject (privacy)',
    'Controller vs. processor (privacy)',
    'Ownership (privacy)',
    'Data inventory and retention (privacy)',
    'Right to be forgotten (privacy)',
    'Attestation (internal audit)',
    'Compliance (internal audit)',
    'Audit committee (internal audit)',
    'Self-assessments (internal audit)',
    'Regulatory (external audit)',
    'Examinations (external audit)',
    'Assessment (external audit)',
    'Independent third-party audit (external audit)',
    'Physical (penetration testing)',
    'Offensive (penetration testing)',
    'Defensive (penetration testing)',
    'Integrated (penetration testing)',
    'Known environment (penetration testing)',
    'Partially known environment (penetration testing)',
    'Unknown environment (penetration testing)',
    'Passive (reconnaissance)',
    'Active (reconnaissance)',
    'Phishing campaigns (security awareness)',
    'Recognizing a phishing attempt (phishing)',
    'Responding to reported suspicious messages (phishing)',
    'Risky (anomalous behavior)',
    'Unexpected (anomalous behavior)',
    'Unintentional (anomalous behavior)',
    'Policy/handbooks (user training)',
    'Situational awareness (user training)',
    'Insider threat (user training)',
    'Password management (user training)',
    'Removable media and cables (user training)',
    'Social engineering (user training)',
    'Operational security (user training)',
    'Hybrid/remote work environments (user training)',
    'Initial (reporting and monitoring)',
    'Recurring (reporting and monitoring)',
    'Development (awareness program)',
    'Execution (awareness program)'
  ]
};

//////////////////////////////
// Build Topic Index
//////////////////////////////

function buildTopicIndex(rawMap: RawTopicMap): TopicIndex {
  const domains = {} as TopicIndex["domains"];
  const byId: Record<string, Topic> = {};
  const byLabel: Record<string, Topic> = {};
  const allLabels: string[] = [];

  for (const domainLabel of Object.keys(rawMap)) {
    const domainId = domainLabel.split(" ")[0] as DomainId;
    const rawTopics = rawMap[domainLabel];

    const topics: Topic[] = rawTopics.map((raw, i) => {
      const label = normalizeLabel(raw);
      const id = `${domainId}.${String(i).padStart(3, "0")}`;

      const topic: Topic = {
        id,
        label,
        domainId,
        domainLabel,
        isAbstract: isAbstractLabel(label)
      };

      byId[id] = topic;
      byLabel[label] = topic;
      allLabels.push(label);

      return topic;
    });

    domains[domainId] = { id: domainId, label: domainLabel, topics };
  }

  return { domains, byId, byLabel, allLabels };
}

export const TOPIC_INDEX: TopicIndex = buildTopicIndex(RAW_TOPICS);

//////////////////////////////
// Backwards Compatibility
//////////////////////////////

/**
 * Legacy export for backwards compatibility
 * Maps domain labels to arrays of topic strings
 */
export const ALL_SECURITY_PLUS_TOPICS: { [domain: string]: string[] } = RAW_TOPICS;

/**
 * Get total count of all topics
 */
export function getTotalTopicCount(): number {
  return TOPIC_INDEX.allLabels.length;
}

//////////////////////////////
// Validation
//////////////////////////////

export interface ValidationResult {
  ok: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validate topic data integrity
 * Call this in CI/tests to catch errors early
 */
export function validateTopics(): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check for empty labels
  for (const topic of Object.values(TOPIC_INDEX.byId)) {
    if (!topic.label || topic.label.trim() === "") {
      errors.push(`Empty label for topic ID: ${topic.id}`);
    }
  }

  // Check for duplicate labels (should not happen)
  const labelCounts: Record<string, number> = {};
  for (const label of TOPIC_INDEX.allLabels) {
    labelCounts[label] = (labelCounts[label] || 0) + 1;
  }
  for (const [label, count] of Object.entries(labelCounts)) {
    if (count > 1) {
      errors.push(`Duplicate topic label found ${count} times: "${label}"`);
    }
  }

  // Check for style violations (common AI mistakes)
  for (const topic of Object.values(TOPIC_INDEX.byId)) {
    // IPSec should be lowercase "s"
    if (/\bIPSEC\b|\bIPSec\b/.test(topic.label) && !topic.label.includes("Internet protocol security (IPSec)")) {
      warnings.push(`Consider "IPsec" casing: "${topic.label}"`);
    }
  }

  return {
    ok: errors.length === 0,
    errors,
    warnings
  };
}

//////////////////////////////
// Fuzzy Matching
//////////////////////////////

/**
 * Calculate Levenshtein distance (edit distance) between two strings
 */
function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

/**
 * Calculate similarity score (0-1) between two strings
 * 1.0 = identical, 0.0 = completely different
 */
function similarityScore(a: string, b: string): number {
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1.0;
  const distance = levenshteinDistance(a.toLowerCase(), b.toLowerCase());
  return 1 - distance / maxLen;
}

export interface FuzzyMatchResult {
  match: string | null;
  score: number;
  confidence: 'exact' | 'high' | 'medium' | 'low' | 'none';
}

/**
 * Find best matching topic label for AI-returned string
 *
 * Strategy:
 * 1. Try exact match
 * 2. Try canonical fix
 * 3. Try case-insensitive exact match
 * 4. Try fuzzy match (Levenshtein distance)
 *
 * @param aiTopic - String returned by AI
 * @returns Best match with confidence score
 */
export function findBestTopicMatch(aiTopic: string): FuzzyMatchResult {
  const trimmed = aiTopic.trim();

  // 1. Exact match
  if (TOPIC_INDEX.byLabel[trimmed]) {
    return { match: trimmed, score: 1.0, confidence: 'exact' };
  }

  // 2. Canonical fix
  const canonical = CANONICAL_FIXES[trimmed];
  if (canonical && TOPIC_INDEX.byLabel[canonical]) {
    console.log(`✅ Canonical fix: "${trimmed}" → "${canonical}"`);
    return { match: canonical, score: 1.0, confidence: 'exact' };
  }

  // 3. Case-insensitive exact match
  const lowerTopic = trimmed.toLowerCase();
  for (const label of TOPIC_INDEX.allLabels) {
    if (label.toLowerCase() === lowerTopic) {
      console.log(`✅ Case-insensitive match: "${trimmed}" → "${label}"`);
      return { match: label, score: 0.95, confidence: 'high' };
    }
  }

  // 4. Fuzzy match
  let bestMatch: string | null = null;
  let bestScore = 0;

  for (const label of TOPIC_INDEX.allLabels) {
    const score = similarityScore(trimmed, label);
    if (score > bestScore) {
      bestScore = score;
      bestMatch = label;
    }
  }

  // Determine confidence based on score
  let confidence: FuzzyMatchResult['confidence'];
  if (bestScore >= 0.9) {
    confidence = 'high';
    console.log(`✅ Fuzzy match (high): "${trimmed}" → "${bestMatch}" (${(bestScore * 100).toFixed(1)}%)`);
  } else if (bestScore >= 0.75) {
    confidence = 'medium';
    console.warn(`⚠️ Fuzzy match (medium): "${trimmed}" → "${bestMatch}" (${(bestScore * 100).toFixed(1)}%)`);
  } else if (bestScore >= 0.6) {
    confidence = 'low';
    console.warn(`⚠️ Fuzzy match (low): "${trimmed}" → "${bestMatch}" (${(bestScore * 100).toFixed(1)}%)`);
  } else {
    confidence = 'none';
    console.error(`❌ No good match for: "${trimmed}" (best: "${bestMatch}" at ${(bestScore * 100).toFixed(1)}%)`);
    return { match: null, score: bestScore, confidence: 'none' };
  }

  return { match: bestMatch, score: bestScore, confidence };
}

/**
 * Validate and correct an array of AI-returned topics
 * Returns corrected topics and any unmatched ones
 */
export function validateAITopics(aiTopics: string[]): {
  matched: string[];
  unmatched: string[];
  corrections: Array<{ original: string; corrected: string; confidence: string }>;
} {
  const matched: string[] = [];
  const unmatched: string[] = [];
  const corrections: Array<{ original: string; corrected: string; confidence: string }> = [];

  for (const aiTopic of aiTopics) {
    const result = findBestTopicMatch(aiTopic);

    if (result.match && result.confidence !== 'none') {
      matched.push(result.match);

      if (result.confidence !== 'exact') {
        corrections.push({
          original: aiTopic,
          corrected: result.match,
          confidence: result.confidence
        });
      }
    } else {
      unmatched.push(aiTopic);
    }
  }

  return { matched, unmatched, corrections };
}
