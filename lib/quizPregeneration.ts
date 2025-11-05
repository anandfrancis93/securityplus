import {
  UserProgress,
  Question,
  QuestionHistory,
  TopicCoverageStatus,
  CachedQuiz,
  QuizGenerationMetadata,
} from './types';
import { generateQuestionWithTopics, generateSynthesisQuestion, selectQuestionType } from './questionGenerator';
import { ALL_SECURITY_PLUS_TOPICS as TOPIC_DATA, getTotalTopicCount as getTopicCount } from './topicData';

// Re-export topic data for backward compatibility
export const ALL_SECURITY_PLUS_TOPICS = TOPIC_DATA;
export const getTotalTopicCount = getTopicCount;

// Old topic definition removed - now imported from topicData.ts
/*
const ALL_SECURITY_PLUS_TOPICS_OLD: { [domain: string]: string[] } = {
  '1.0 General Security Concepts': [
    // From 1.1 - Security Controls
    'Technical (control category)', 'Managerial (control category)', 'Operational (control category)', 'Physical (control category)',
    'Preventive (control type)', 'Deterrent (control type)', 'Detective (control type)', 'Corrective (control type)',
    'Compensating (control type)', 'Directive (control type)',
    // From 1.2 - Fundamental Security Concepts
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
    // From 1.3 - Change Management
    'Approval process (change management process)', 'Ownership (change management process)', 'Stakeholders (change management process)',
    'Impact analysis (change management process)', 'Test results (change management process)', 'Backout plan (change management process)',
    'Maintenance window (change management process)', 'Standard operating procedure (change management process)',
    'Allow lists/deny lists (technical implication)', 'Restricted activities (technical implication)',
    'Downtime (technical implication)', 'Service restart (technical implication)', 'Application restart (technical implication)',
    'Legacy applications (technical implication)', 'Dependencies (technical implication)',
    'Updating diagrams (documentation)', 'Updating policies/procedures (documentation)', 'Version control (documentation)',
    // From 1.4 - Cryptographic Solutions
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
    // From 2.1 - Threat Actors and Motivations
    'Nation-state (threat actor)', 'Unskilled attacker (threat actor)', 'Hacktivist (threat actor)',
    'Insider threat (threat actor)', 'Organized crime (threat actor)', 'Shadow IT (threat actor)',
    'Internal/external (threat actor attribute)', 'Resources/funding (threat actor attribute)',
    'Level of sophistication/capability (threat actor attribute)',
    'Data exfiltration (motivation)', 'Espionage (motivation)', 'Service disruption (motivation)', 'Blackmail (motivation)',
    'Financial gain (motivation)', 'Philosophical/political beliefs (motivation)', 'Ethical (motivation)', 'Revenge (motivation)',
    'Disruption/chaos (motivation)', 'War (motivation)',
    // From 2.2 - Threat Vectors and Attack Surfaces
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
    // From 2.3 - Vulnerabilities
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
    // From 2.4 - Indicators of Malicious Activity
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
    // From 2.5 - Mitigation Techniques
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
    // From 3.1 - Architecture Models
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
    // From 3.2 - Enterprise Infrastructure
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
    // From 3.3 - Data Protection
    'Regulated (data type)', 'Trade secret (data type)', 'Intellectual property (data type)', 'Legal information (data type)',
    'Financial information (data type)', 'Human- and non-human-readable (data type)',
    'Sensitive (data classification)', 'Confidential (data classification)', 'Public (data classification)',
    'Restricted (data classification)', 'Private (data classification)', 'Critical (data classification)',
    'Data at rest (data state)', 'Data in transit (data state)', 'Data in use (data state)',
    'Data sovereignty', 'Geolocation (data sovereignty)',
    'Geographic restrictions (data protection method)', 'Encryption (data protection method)', 'Hashing (data protection method)',
    'Masking (data protection method)', 'Tokenization (data protection method)', 'Obfuscation (data protection method)',
    'Segmentation (data protection method)', 'Permission restrictions (data protection method)',
    // From 3.4 - Resilience and Recovery
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
    // From 4.1 - Security Techniques for Computing Resources
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
    // From 4.2 - Asset Management
    'Acquisition/procurement process (asset management)', 'Assignment/accounting (asset management)',
    'Ownership (asset management)', 'Classification (asset management)', 'Monitoring/asset tracking (asset management)',
    'Inventory (asset management)', 'Enumeration (asset management)',
    'Disposal/decommissioning (asset management)', 'Sanitization (disposal)', 'Destruction (disposal)',
    'Certification (disposal)', 'Data retention (asset management)',
    // From 4.3 - Vulnerability Management
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
    // From 4.4 - Alerting and Monitoring
    'Systems (monitoring resource)', 'Applications (monitoring resource)', 'Infrastructure (monitoring resource)',
    'Log aggregation (monitoring activity)', 'Alerting (monitoring activity)', 'Scanning (monitoring activity)',
    'Reporting (monitoring activity)', 'Archiving (monitoring activity)',
    'Quarantine (alert response)', 'Alert tuning (alert response)',
    'Security Content Automation Protocol (SCAP) (monitoring tool)', 'Benchmarks (monitoring tool)',
    'Agents/agentless (monitoring tool)', 'Security information and event management (SIEM) (monitoring tool)',
    'Antivirus (monitoring tool)', 'Data loss prevention (DLP) (monitoring tool)',
    'Simple Network Management Protocol (SNMP) traps (monitoring tool)', 'NetFlow (monitoring tool)',
    'Vulnerability scanners (monitoring tool)',
    // From 4.5 - Enterprise Capabilities
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
    // From 4.6 - Identity and Access Management
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
    // From 4.7 - Automation and Orchestration
    'User provisioning (automation use case)', 'Resource provisioning (automation use case)', 'Guard rails (automation use case)',
    'Security groups (automation use case)', 'Ticket creation (automation use case)', 'Escalation (automation use case)',
    'Enabling/disabling services and access (automation use case)', 'Continuous integration and testing (automation use case)',
    'Integrations and Application programming interfaces (APIs) (automation use case)',
    'Efficiency/time saving (automation benefit)', 'Enforcing baselines (automation benefit)',
    'Standard infrastructure configurations (automation benefit)', 'Scaling in a secure manner (automation benefit)',
    'Employee retention (automation benefit)', 'Reaction time (automation benefit)', 'Workforce multiplier (automation benefit)',
    'Complexity (automation consideration)', 'Cost (automation consideration)', 'Single point of failure (automation consideration)',
    'Technical debt (automation consideration)', 'Ongoing supportability (automation consideration)',
    // From 4.8 - Incident Response
    'Preparation (incident response process)', 'Detection (incident response process)', 'Analysis (incident response process)',
    'Containment (incident response process)', 'Eradication (incident response process)', 'Recovery (incident response process)',
    'Lessons learned (incident response process)',
    'Training (incident response)', 'Tabletop exercise (incident response testing)', 'Simulation (incident response testing)',
    'Root cause analysis (incident response)', 'Threat hunting (incident response)',
    'Digital forensics (incident response)', 'Legal hold (digital forensics)', 'Chain of custody (digital forensics)',
    'Acquisition (digital forensics)', 'Reporting (digital forensics)', 'Preservation (digital forensics)',
    'E-discovery (digital forensics)',
    // From 4.9 - Investigation Data Sources
    'Firewall logs (log data)', 'Application logs (log data)', 'Endpoint logs (log data)', 'OS-specific security logs (log data)',
    'IPS/IDS logs (log data)', 'Network logs (log data)', 'Metadata (log data)',
    'Vulnerability scans (data source)', 'Automated reports (data source)', 'Dashboards (data source)', 'Packet captures (data source)'
  ],
  '5.0 Security Program Management and Oversight': [
    // From 5.1 - Security Governance
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
    // From 5.2 - Risk Management
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
    // From 5.3 - Third-Party Risk
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
    // From 5.4 - Security Compliance
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
    // From 5.5 - Audits and Assessments
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
    // From 5.6 - Security Awareness
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
*/

/**
 * Initialize quiz generation metadata for a new user
 */
export function initializeQuizMetadata(): QuizGenerationMetadata {
  const topicCoverage: { [topicName: string]: TopicCoverageStatus } = {};

  // Initialize all topics with 0 coverage
  Object.entries(ALL_SECURITY_PLUS_TOPICS).forEach(([domain, topics]) => {
    topics.forEach(topicName => {
      topicCoverage[topicName] = {
        topicName,
        domain,
        firstCoveredQuiz: null,
        timesCovered: 0,
        lastCoveredQuiz: null,
        // Progressive difficulty tracking
        easyTimesCovered: 0,
        mediumTimesCovered: 0,
        hardTimesCovered: 0,
        easyFirstCovered: null,
        mediumFirstCovered: null,
        hardFirstCovered: null,
      };
    });
  });

  return {
    totalQuizzesCompleted: 0,
    allTopicsCoveredOnce: false,
    questionHistory: {},
    topicCoverage,
    // Progressive difficulty flags
    allTopicsCoveredEasy: false,
    allTopicsCoveredMedium: false,
    allTopicsCoveredHard: false,
  };
}

/**
 * Check if all topics are covered at a specific difficulty level
 */
export function isAllTopicsCoveredAtDifficulty(
  metadata: QuizGenerationMetadata,
  difficulty: 'easy' | 'medium' | 'hard'
): boolean {
  const fieldName = difficulty === 'easy' ? 'easyTimesCovered' :
                    difficulty === 'medium' ? 'mediumTimesCovered' :
                    'hardTimesCovered';

  return Object.values(metadata.topicCoverage).every(
    topic => topic[fieldName] > 0
  );
}

/**
 * Get uncovered topics at a specific difficulty level
 */
export function getUncoveredTopicsAtDifficulty(
  metadata: QuizGenerationMetadata,
  difficulty: 'easy' | 'medium' | 'hard'
): string[] {
  const fieldName = difficulty === 'easy' ? 'easyTimesCovered' :
                    difficulty === 'medium' ? 'mediumTimesCovered' :
                    'hardTimesCovered';

  return Object.values(metadata.topicCoverage)
    .filter(topic => topic[fieldName] === 0)
    .map(topic => topic.topicName);
}

/**
 * Determine current difficulty level to focus on (progressive difficulty)
 */
export function getCurrentDifficultyLevel(metadata: QuizGenerationMetadata): 'easy' | 'medium' | 'hard' | 'complete' {
  // Check flags first
  if (metadata.allTopicsCoveredEasy === false || !isAllTopicsCoveredAtDifficulty(metadata, 'easy')) {
    return 'easy';
  }

  if (metadata.allTopicsCoveredMedium === false || !isAllTopicsCoveredAtDifficulty(metadata, 'medium')) {
    return 'medium';
  }

  if (metadata.allTopicsCoveredHard === false || !isAllTopicsCoveredAtDifficulty(metadata, 'hard')) {
    return 'hard';
  }

  return 'complete'; // All difficulty levels completed
}

/**
 * Check if Phase 1 (covering all topics once at ALL difficulties) is complete
 */
export function isPhase1Complete(metadata: QuizGenerationMetadata): boolean {
  return getCurrentDifficultyLevel(metadata) === 'complete';
}

/**
 * Get list of topics that have never been covered (legacy - for backward compatibility)
 */
export function getUncoveredTopics(metadata: QuizGenerationMetadata): string[] {
  return Object.values(metadata.topicCoverage)
    .filter(topic => topic.timesCovered === 0)
    .map(topic => topic.topicName);
}

/**
 * Check if a question is a duplicate based on metadata
 */
export function isDuplicateQuestion(
  newMetadata: { primaryTopic: string; scenario: string; keyConcept: string },
  questionHistory: { [questionId: string]: QuestionHistory }
): boolean {
  // Check if any existing question has the same metadata combination
  return Object.values(questionHistory).some(history => {
    if (!history.metadata) return false;

    return (
      history.metadata.primaryTopic === newMetadata.primaryTopic &&
      history.metadata.scenario === newMetadata.scenario &&
      history.metadata.keyConcept === newMetadata.keyConcept
    );
  });
}

/**
 * Select random topics from a specific domain
 */
export function selectRandomTopicsFromDomain(domain: string, count: number): string[] {
  const topics = ALL_SECURITY_PLUS_TOPICS[domain];
  if (!topics || topics.length === 0) return [];

  const shuffled = [...topics].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, topics.length));
}

/**
 * Select random topics from multiple domains for cross-domain questions
 */
export function selectCrossDomainTopics(
  count: number,
  priorityTopics: string[] = [],
  metadata?: QuizGenerationMetadata
): string[] {
  const selectedTopics: string[] = [];

  // If we have priority topics, use them across multiple domains
  if (priorityTopics.length > 0 && metadata) {
    // Group priority topics by domain
    const topicsByDomain = new Map<string, string[]>();
    priorityTopics.forEach(topic => {
      const coverage = metadata.topicCoverage[topic];
      if (coverage) {
        if (!topicsByDomain.has(coverage.domain)) {
          topicsByDomain.set(coverage.domain, []);
        }
        topicsByDomain.get(coverage.domain)!.push(topic);
      }
    });

    // Try to select from at least 2 different domains
    const domainsWithPriority = Array.from(topicsByDomain.keys());

    if (domainsWithPriority.length >= 2) {
      // We have priority topics from multiple domains - use them
      const shuffledDomains = [...domainsWithPriority].sort(() => Math.random() - 0.5);

      // Round-robin selection from different domains
      let domainIndex = 0;
      while (selectedTopics.length < count && domainIndex < shuffledDomains.length * count) {
        const domain = shuffledDomains[domainIndex % shuffledDomains.length];
        const domainTopics = topicsByDomain.get(domain) || [];
        const available = domainTopics.filter(t => !selectedTopics.includes(t));

        if (available.length > 0) {
          selectedTopics.push(available[Math.floor(Math.random() * available.length)]);
        }

        domainIndex++;
      }

      // If we got enough topics, return them
      if (selectedTopics.length >= count) {
        return selectedTopics.slice(0, count);
      }
    } else if (domainsWithPriority.length === 1) {
      // Only 1 domain with priority topics - use what we have and supplement from other domains
      const priorityDomain = domainsWithPriority[0];
      const priorityDomainTopics = topicsByDomain.get(priorityDomain) || [];

      // Add 1 priority topic from this domain
      if (priorityDomainTopics.length > 0) {
        selectedTopics.push(priorityDomainTopics[Math.floor(Math.random() * priorityDomainTopics.length)]);
      }

      // Fill rest from other domains
      const otherDomains = Object.keys(ALL_SECURITY_PLUS_TOPICS).filter(d => d !== priorityDomain);
      const shuffledOtherDomains = [...otherDomains].sort(() => Math.random() - 0.5);

      let domainIndex = 0;
      while (selectedTopics.length < count && domainIndex < shuffledOtherDomains.length * count) {
        const domain = shuffledOtherDomains[domainIndex % shuffledOtherDomains.length];
        const topics = selectRandomTopicsFromDomain(domain, 1);
        if (topics.length > 0 && !selectedTopics.includes(topics[0])) {
          selectedTopics.push(topics[0]);
        }
        domainIndex++;
      }

      return selectedTopics.slice(0, count);
    }
  }

  // No priority topics or not enough - select randomly from multiple domains
  const domains = Object.keys(ALL_SECURITY_PLUS_TOPICS);
  const numDomains = Math.min(count, domains.length, Math.max(2, Math.ceil(count / 2)));
  const shuffledDomains = [...domains].sort(() => Math.random() - 0.5).slice(0, numDomains);

  const topicsPerDomain = Math.ceil(count / numDomains);

  shuffledDomains.forEach(domain => {
    const topics = selectRandomTopicsFromDomain(domain, topicsPerDomain);
    selectedTopics.push(...topics);
  });

  return selectedTopics.slice(0, count);
}

/**
 * Select question category based on distribution
 * 30% single-domain-single-topic (easy), 40% single-domain-multiple-topics (medium), 30% multiple-domains-multiple-topics (hard)
 * This gives a quiz distribution of approximately 3 easy, 4 medium, 3 hard questions per 10-question quiz
 */
export function selectQuestionCategory(): 'single-domain-single-topic' | 'single-domain-multiple-topics' | 'multiple-domains-multiple-topics' {
  const random = Math.random();
  if (random < 0.30) return 'single-domain-single-topic';      // 0.00 to 0.30 = 30% (easy)
  if (random < 0.70) return 'single-domain-multiple-topics';   // 0.30 to 0.70 = 40% (medium)
  return 'multiple-domains-multiple-topics';                    // 0.70 to 1.00 = 30% (hard)
}

/**
 * Select topics for a question based on category and priority topics
 * @param questionCategory - Type of question
 * @param priorityTopics - Topics to prioritize (e.g., uncovered topics)
 * @param metadata - Quiz generation metadata for domain-aware selection
 */
export function selectTopicsForQuestion(
  questionCategory: 'single-domain-single-topic' | 'single-domain-multiple-topics' | 'multiple-domains-multiple-topics',
  priorityTopics: string[] = [],
  metadata?: QuizGenerationMetadata
): string[] {
  if (questionCategory === 'single-domain-single-topic') {
    // Single domain, single topic: Select 1 topic
    if (priorityTopics.length > 0) {
      return [priorityTopics[Math.floor(Math.random() * priorityTopics.length)]];
    }
    // Random topic from any domain
    const allTopics = Object.values(ALL_SECURITY_PLUS_TOPICS).flat();
    return [allTopics[Math.floor(Math.random() * allTopics.length)]];
  }

  if (questionCategory === 'single-domain-multiple-topics') {
    // Single domain, multiple topics: Select 2-4 topics from the same domain
    const topicCount = 2 + Math.floor(Math.random() * 3); // 2, 3, or 4 topics

    if (priorityTopics.length > 0 && metadata) {
      // Try to find topics from the same domain in priority list
      const topicsByDomain = new Map<string, string[]>();
      priorityTopics.forEach(topic => {
        const coverage = metadata.topicCoverage[topic];
        if (coverage) {
          if (!topicsByDomain.has(coverage.domain)) {
            topicsByDomain.set(coverage.domain, []);
          }
          topicsByDomain.get(coverage.domain)!.push(topic);
        }
      });

      // Find a domain with enough topics
      for (const [domain, topics] of topicsByDomain) {
        if (topics.length >= topicCount) {
          return topics.slice(0, topicCount);
        }
      }

      // If no single domain has enough priority topics, pick the domain with most priority topics
      // and fill remaining slots with other topics from that same domain
      let bestDomain = '';
      let maxPriorityTopics: string[] = [];
      for (const [domain, topics] of topicsByDomain) {
        if (topics.length > maxPriorityTopics.length) {
          bestDomain = domain;
          maxPriorityTopics = topics;
        }
      }

      if (bestDomain && maxPriorityTopics.length > 0) {
        // Start with all available priority topics from this domain
        const selected = [...maxPriorityTopics];

        // Fill remaining slots with other topics from the same domain
        const allDomainTopics = ALL_SECURITY_PLUS_TOPICS[bestDomain] || [];
        const remainingTopics = allDomainTopics.filter(t => !selected.includes(t));

        while (selected.length < topicCount && remainingTopics.length > 0) {
          const randomIndex = Math.floor(Math.random() * remainingTopics.length);
          selected.push(remainingTopics[randomIndex]);
          remainingTopics.splice(randomIndex, 1);
        }

        return selected.slice(0, topicCount);
      }
    }

    // Select random domain and get topics from it
    const domains = Object.keys(ALL_SECURITY_PLUS_TOPICS);
    const randomDomain = domains[Math.floor(Math.random() * domains.length)];
    return selectRandomTopicsFromDomain(randomDomain, topicCount);
  }

  // Multiple domains, multiple topics: Select 2-3 topics from different domains
  const topicCount = 2 + Math.floor(Math.random() * 2); // 2 or 3 topics
  return selectCrossDomainTopics(topicCount, priorityTopics, metadata);
}

/**
 * Get questions eligible for repetition (spaced repetition logic)
 * Returns questions that haven't been asked in the last 3 quizzes
 */
export function getEligibleRepeatQuestions(
  metadata: QuizGenerationMetadata,
  currentQuizNumber: number,
  prioritizeWrong: boolean = true
): QuestionHistory[] {
  const COOLDOWN_QUIZZES = 3;

  const eligible = Object.values(metadata.questionHistory).filter(history => {
    // Must have cooldown of at least 3 quizzes
    const cooldown = currentQuizNumber - history.lastAskedQuiz;
    return cooldown >= COOLDOWN_QUIZZES;
  });

  // Sort by priority: wrong answers first, then least recently asked
  eligible.sort((a, b) => {
    if (prioritizeWrong) {
      // Check if last attempt was wrong
      const aLastWrong = a.correctHistory.length > 0 && !a.correctHistory[a.correctHistory.length - 1];
      const bLastWrong = b.correctHistory.length > 0 && !b.correctHistory[b.correctHistory.length - 1];

      if (aLastWrong && !bLastWrong) return -1;
      if (!aLastWrong && bLastWrong) return 1;
    }

    // Sort by least recently asked
    return a.lastAskedQuiz - b.lastAskedQuiz;
  });

  return eligible;
}

/**
 * Pre-generate a quiz with Phase 1 or Phase 2 logic
 */
export async function pregenerateQuiz(
  userProgress: UserProgress
): Promise<CachedQuiz> {
  const metadata = userProgress.quizMetadata || initializeQuizMetadata();
  const currentQuizNumber = metadata.totalQuizzesCompleted + 1;
  const ability = userProgress.estimatedAbility || 0;

  const questions: Question[] = [];
  const QUIZ_LENGTH = 10;

  // Determine current difficulty level (progressive difficulty)
  const currentDifficultyLevel = getCurrentDifficultyLevel(metadata);
  const phase1Complete = currentDifficultyLevel === 'complete';

  console.log(`Pregenerating quiz ${currentQuizNumber}, Current difficulty level: ${currentDifficultyLevel}`);

  if (!phase1Complete) {
    // PHASE 1: Progressive difficulty - focus on current level
    let questionCategory: 'single-domain-single-topic' | 'single-domain-multiple-topics' | 'multiple-domains-multiple-topics';
    let difficultyName: 'easy' | 'medium' | 'hard';

    if (currentDifficultyLevel === 'easy') {
      questionCategory = 'single-domain-single-topic';
      difficultyName = 'easy';
    } else if (currentDifficultyLevel === 'medium') {
      questionCategory = 'single-domain-multiple-topics';
      difficultyName = 'medium';
    } else { // hard
      questionCategory = 'multiple-domains-multiple-topics';
      difficultyName = 'hard';
    }

    const uncoveredTopicsAtLevel = getUncoveredTopicsAtDifficulty(metadata, difficultyName);
    console.log(`Phase 1 (${difficultyName} level): ${uncoveredTopicsAtLevel.length}/${getTotalTopicCount()} topics remaining`);

    // Generate ALL 10 questions at current difficulty level
    for (let i = 0; i < QUIZ_LENGTH; i++) {
      let question: Question | null = null;
      let attempts = 0;
      const MAX_ATTEMPTS = 5;

      while (!question && attempts < MAX_ATTEMPTS) {
        attempts++;

        // Select topics based on category, prioritizing uncovered topics at this level
        const selectedTopics = selectTopicsForQuestion(
          questionCategory,
          uncoveredTopicsAtLevel,
          metadata
        );

        // Select question type
        const questionType = selectQuestionType();

        try {
          const generatedQuestion = await generateQuestionWithTopics(
            selectedTopics,
            questionCategory,
            questionType
          );

          // Check for duplicate using metadata
          if (generatedQuestion.metadata &&
              !isDuplicateQuestion(generatedQuestion.metadata, metadata.questionHistory)) {
            question = generatedQuestion;
            console.log(`Generated Q${i + 1}: ${difficultyName} (${questionCategory}) ${questionType}, Topics: ${selectedTopics.join(', ')}`);
          } else {
            console.log(`Duplicate detected, regenerating (attempt ${attempts}/${MAX_ATTEMPTS})`);
          }
        } catch (error) {
          console.error(`Error generating question (attempt ${attempts}/${MAX_ATTEMPTS}):`, error);
        }
      }

      if (question) {
        questions.push(question);
      } else {
        console.error(`Failed to generate question ${i + 1} after ${MAX_ATTEMPTS} attempts`);
      }
    }
  } else {
    // PHASE 2: Mixed difficulty with spaced repetition (existing logic)
    // Deterministic difficulty distribution: exactly 3 easy, 4 medium, 3 hard
    const difficultyDistribution: Array<'single-domain-single-topic' | 'single-domain-multiple-topics' | 'multiple-domains-multiple-topics'> = [
      'single-domain-single-topic', 'single-domain-single-topic', 'single-domain-single-topic',           // 3 easy
      'single-domain-multiple-topics', 'single-domain-multiple-topics', 'single-domain-multiple-topics', 'single-domain-multiple-topics', // 4 medium
      'multiple-domains-multiple-topics', 'multiple-domains-multiple-topics', 'multiple-domains-multiple-topics'  // 3 hard
    ];

    // Shuffle using Fisher-Yates algorithm
    for (let i = difficultyDistribution.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [difficultyDistribution[i], difficultyDistribution[j]] = [difficultyDistribution[j], difficultyDistribution[i]];
    }

    console.log(`Phase 2: Mixed difficulty distribution - 3 easy, 4 medium, 3 hard`);

    const uncoveredTopics = getUncoveredTopics(metadata);
    // PHASE 2: 70% new / 30% repeated (spaced repetition)
    // IMPORTANT: Must maintain 3 easy, 4 medium, 3 hard regardless of new vs repeated
    console.log('Phase 2: Generating questions with spaced repetition (maintaining 3/4/3 distribution)');

    // Use the same full distribution (reused from Phase 1)
    // Already shuffled above, so just use it

    // Decide which question slots will be repeated vs new
    // We want ~30% repeated (3 out of 10), but need to match difficulty distribution
    const repeatIndices = new Set<number>();

    // Try to get 1 easy, 1 medium, 1 hard for repeats (balanced)
    const easyIndices = difficultyDistribution.map((cat, idx) => cat === 'single-domain-single-topic' ? idx : -1).filter(idx => idx !== -1);
    const mediumIndices = difficultyDistribution.map((cat, idx) => cat === 'single-domain-multiple-topics' ? idx : -1).filter(idx => idx !== -1);
    const hardIndices = difficultyDistribution.map((cat, idx) => cat === 'multiple-domains-multiple-topics' ? idx : -1).filter(idx => idx !== -1);

    // Pick one from each difficulty for repeats
    if (easyIndices.length > 0) repeatIndices.add(easyIndices[Math.floor(Math.random() * easyIndices.length)]);
    if (mediumIndices.length > 0) repeatIndices.add(mediumIndices[Math.floor(Math.random() * mediumIndices.length)]);
    if (hardIndices.length > 0) repeatIndices.add(hardIndices[Math.floor(Math.random() * hardIndices.length)]);

    console.log(`[DIFFICULTY DEBUG] Phase 2: Repeat slots: ${Array.from(repeatIndices).sort().join(', ')}`);
    console.log(`[DIFFICULTY DEBUG] Phase 2: New slots: ${Array.from({length: 10}, (_, i) => i).filter(i => !repeatIndices.has(i)).join(', ')}`);

    // Get eligible repeat questions from history
    const eligibleRepeats = getEligibleRepeatQuestions(metadata, currentQuizNumber, true);

    // Organize eligible repeats by category
    const repeatsByCategory: { [key: string]: QuestionHistory[] } = {
      'single-domain-single-topic': [],
      'single-domain-multiple-topics': [],
      'multiple-domains-multiple-topics': []
    };

    eligibleRepeats.forEach(history => {
      if (history.questionCategory && repeatsByCategory[history.questionCategory]) {
        repeatsByCategory[history.questionCategory].push(history);
      }
    });

    console.log(`[DIFFICULTY DEBUG] Phase 2: Available repeats: ${repeatsByCategory['single-domain-single-topic'].length} easy, ${repeatsByCategory['single-domain-multiple-topics'].length} medium, ${repeatsByCategory['multiple-domains-multiple-topics'].length} hard`);

    // Generate all 10 questions with correct distribution
    for (let i = 0; i < QUIZ_LENGTH; i++) {
      const questionCategory = difficultyDistribution[i];
      const isRepeatSlot = repeatIndices.has(i);

      let question: Question | null = null;

      if (isRepeatSlot && repeatsByCategory[questionCategory].length > 0) {
        // Try to use a repeated question
        console.log(`[DIFFICULTY DEBUG] Phase 2 Q${i + 1}: Attempting repeat ${questionCategory}`);
        // TODO: Implement actual question retrieval from history
        // For now, skip and generate new
        console.log(`[DIFFICULTY DEBUG] Phase 2 Q${i + 1}: Question retrieval not implemented, generating new instead`);
      }

      // Generate new question if we don't have a repeat
      if (!question) {
        let attempts = 0;
        const MAX_ATTEMPTS = 5;

        while (!question && attempts < MAX_ATTEMPTS) {
          attempts++;

          console.log(`[DIFFICULTY DEBUG] Phase 2 Q${i + 1}: Generating new ${questionCategory} (attempt ${attempts})`);

          const selectedTopics = selectTopicsForQuestion(
            questionCategory,
            [], // No restrictions on topics in Phase 2
            metadata
          );

          const questionType = selectQuestionType();

          try {
            const generatedQuestion = await generateQuestionWithTopics(
              selectedTopics,
              questionCategory,
              questionType
            );

            // Check for duplicate using metadata
            if (generatedQuestion.metadata &&
                !isDuplicateQuestion(generatedQuestion.metadata, metadata.questionHistory)) {
              question = generatedQuestion;
              console.log(`Generated new Q${i + 1}: ${questionCategory} (${generatedQuestion.difficulty}) ${questionType}, Topics: ${selectedTopics.join(', ')}`);
            } else {
              console.log(`Duplicate detected, regenerating (attempt ${attempts}/${MAX_ATTEMPTS})`);
            }
          } catch (error) {
            console.error(`Error generating question (attempt ${attempts}/${MAX_ATTEMPTS}):`, error);
          }
        }
      }

      if (question) {
        questions.push(question);
      } else {
        console.error(`Failed to generate question ${i + 1} (${questionCategory}) after all attempts`);
      }
    }
  }

  // Shuffle questions to randomize order
  const shuffled = questions.sort(() => Math.random() - 0.5);

  // Verify final distribution
  const finalCounts = {
    easy: shuffled.filter(q => q.questionCategory === 'single-domain-single-topic').length,
    medium: shuffled.filter(q => q.questionCategory === 'single-domain-multiple-topics').length,
    hard: shuffled.filter(q => q.questionCategory === 'multiple-domains-multiple-topics').length
  };
  console.log(`[DIFFICULTY DEBUG] FINAL QUIZ: ${finalCounts.easy} easy, ${finalCounts.medium} medium, ${finalCounts.hard} hard (Expected: 3/4/3)`);

  if (finalCounts.easy !== 3 || finalCounts.medium !== 4 || finalCounts.hard !== 3) {
    console.error(`⚠️ [DIFFICULTY DEBUG] DISTRIBUTION MISMATCH! Expected 3/4/3, got ${finalCounts.easy}/${finalCounts.medium}/${finalCounts.hard}`);
  } else {
    console.log(`✅ [DIFFICULTY DEBUG] Distribution verified: Perfect 3/4/3 split!`);
  }

  return {
    questions: shuffled,
    generatedAt: Date.now(),
    generatedForAbility: ability,
    generatedAfterQuiz: metadata.totalQuizzesCompleted,
  };
}

/**
 * Update metadata after a quiz is completed
 */
export function updateMetadataAfterQuiz(
  metadata: QuizGenerationMetadata,
  completedQuestions: { questionId: string; question: Question; isCorrect: boolean }[]
): QuizGenerationMetadata {
  const updatedMetadata = { ...metadata };
  updatedMetadata.totalQuizzesCompleted += 1;
  const currentQuizNumber = updatedMetadata.totalQuizzesCompleted;

  // Ensure questionHistory exists
  if (!updatedMetadata.questionHistory) {
    updatedMetadata.questionHistory = {};
  }

  // Update question history
  completedQuestions.forEach(({ questionId, question, isCorrect }) => {
    if (!updatedMetadata.questionHistory[questionId]) {
      // New question
      updatedMetadata.questionHistory[questionId] = {
        questionId,
        metadata: question.metadata,
        questionCategory: question.questionCategory,
        firstAskedQuiz: currentQuizNumber,
        lastAskedQuiz: currentQuizNumber,
        timesAsked: 1,
        correctHistory: [isCorrect],
        lastAskedDate: Date.now(),
      };
    } else {
      // Repeated question
      const history = updatedMetadata.questionHistory[questionId];
      history.lastAskedQuiz = currentQuizNumber;
      history.timesAsked += 1;
      history.correctHistory.push(isCorrect);
      history.lastAskedDate = Date.now();
    }
  });

  // Update topic coverage
  completedQuestions.forEach(({ question }) => {
    if (question.topics) {
      question.topics.forEach(topicName => {
        if (updatedMetadata.topicCoverage[topicName]) {
          const coverage = updatedMetadata.topicCoverage[topicName];

          if (coverage.firstCoveredQuiz === null) {
            coverage.firstCoveredQuiz = currentQuizNumber;
          }

          coverage.timesCovered += 1;
          coverage.lastCoveredQuiz = currentQuizNumber;
        }
      });
    }
  });

  // Check if Phase 1 is now complete
  if (!updatedMetadata.allTopicsCoveredOnce && isPhase1Complete(updatedMetadata)) {
    updatedMetadata.allTopicsCoveredOnce = true;
    console.log('🎉 Phase 1 complete! All topics covered once. Entering Phase 2 with spaced repetition.');
  }

  return updatedMetadata;
}
