'use client';

import React from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Legend,
  TooltipProps,
  Cell,
} from 'recharts';
import { UserProgress } from '@/lib/types';
import { hasSufficientData } from '@/lib/irt';

interface PerformanceGraphsProps {
  userProgress: UserProgress | null;
}

// Custom tooltip component for bar charts
const CustomBarTooltip = ({ active, payload, label, color }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-black border border-gray-800 rounded-2xl p-4 shadow-xl shadow-black/50">
        <p className="text-slate-200 font-medium mb-2">{label}</p>
        <p className="text-sm mb-3" style={{ color: color || '#3b82f6' }}>
          Accuracy: {payload[0].value}% ({payload[0].payload.questions} questions)
        </p>
        <div className="border-t border-gray-800 pt-3 space-y-1">
          <p className="text-xs text-slate-400">Performance Ranges:</p>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: '#ef4444' }}></div>
            <span className="text-xs text-slate-300">&lt; 70% (Low)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: '#eab308' }}></div>
            <span className="text-xs text-slate-300">70-84% (Good)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: '#22c55e' }}></div>
            <span className="text-xs text-slate-300">≥ 85% (Excellent)</span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

export default function PerformanceGraphs({ userProgress }: PerformanceGraphsProps) {
  if (!userProgress || userProgress.totalQuestions === 0) {
    return (
      <div className="bg-black rounded-[28px] p-8 md:p-10 border border-gray-800 shadow-xl shadow-black/50 text-center">
        <p className="text-slate-400 text-base md:text-lg">Take quizzes to see your progress charts</p>
      </div>
    );
  }

  // Graph 1: Ability Level Over Time
  const abilityOverTime = userProgress.quizHistory.map((quiz, index) => {
    // Calculate ability up to this quiz
    const attemptsUpToNow = userProgress.quizHistory
      .slice(0, index + 1)
      .flatMap(q => q.questions);

    // Get the estimated ability from this quiz
    const ability = userProgress.quizHistory[index + 1]?.questions
      ? userProgress.estimatedAbility || 0
      : userProgress.estimatedAbility || 0;

    return {
      quiz: `Quiz ${index + 1}`,
      ability: parseFloat(ability.toFixed(2)),
      date: new Date(quiz.endedAt || quiz.startedAt).toLocaleDateString(),
    };
  });

  // Graph 2: Predicted Score Over Time
  const scoreOverTime = userProgress.quizHistory.map((quiz, index) => {
    const ability = abilityOverTime[index].ability;
    // Map ability to score (same logic as calculateIRTScore)
    const baseScore = 550;
    const scaleFactor = 130;
    const score = Math.max(100, Math.min(900, Math.round(baseScore + (ability * scaleFactor))));

    return {
      quiz: `Quiz ${index + 1}`,
      score,
      date: new Date(quiz.endedAt || quiz.startedAt).toLocaleDateString(),
    };
  });

  // Graph 3: Accuracy by Difficulty
  const difficultyStats: { [key: string]: { correct: number; total: number } } = {
    easy: { correct: 0, total: 0 },
    medium: { correct: 0, total: 0 },
    hard: { correct: 0, total: 0 },
  };

  userProgress.quizHistory.forEach(quiz => {
    quiz.questions.forEach(attempt => {
      const diff = attempt.question.difficulty || 'medium';
      difficultyStats[diff].total += 1;
      if (attempt.isCorrect) {
        difficultyStats[diff].correct += 1;
      }
    });
  });

  const accuracyByDifficulty = [
    {
      difficulty: 'Easy',
      accuracy: difficultyStats.easy.total > 0
        ? Math.round((difficultyStats.easy.correct / difficultyStats.easy.total) * 100)
        : 0,
      questions: difficultyStats.easy.total,
    },
    {
      difficulty: 'Medium',
      accuracy: difficultyStats.medium.total > 0
        ? Math.round((difficultyStats.medium.correct / difficultyStats.medium.total) * 100)
        : 0,
      questions: difficultyStats.medium.total,
    },
    {
      difficulty: 'Hard',
      accuracy: difficultyStats.hard.total > 0
        ? Math.round((difficultyStats.hard.correct / difficultyStats.hard.total) * 100)
        : 0,
      questions: difficultyStats.hard.total,
    },
  ];

  // Graph 4: Topic Performance Breakdown by Domain
  // Count unique questions per domain (not topic occurrences)
  const domainStats: { [domain: string]: { questionIds: Set<string>; correctQuestionIds: Set<string> } } = {};

  // Build a map of questionId -> domains for that question
  userProgress.quizHistory.forEach(quiz => {
    quiz.questions.forEach(attempt => {
      const topics = attempt.question.topics || [];
      const questionId = attempt.questionId;

      // Get all domains for this question's topics
      const domainsForQuestion = new Set<string>();
      Object.values(userProgress.topicPerformance || {}).forEach(topicPerf => {
        if (topics.includes(topicPerf.topicName)) {
          domainsForQuestion.add(topicPerf.domain);
        }
      });

      // Count this question once per domain it appears in
      domainsForQuestion.forEach(domain => {
        if (!domainStats[domain]) {
          domainStats[domain] = {
            questionIds: new Set<string>(),
            correctQuestionIds: new Set<string>()
          };
        }
        domainStats[domain].questionIds.add(questionId);
        if (attempt.isCorrect) {
          domainStats[domain].correctQuestionIds.add(questionId);
        }
      });
    });
  });

  const domainPerformance = Object.entries(domainStats).map(([domain, stats]) => {
    // Extract domain number (e.g., "1.0" from "1.0 General Security Concepts")
    const domainNum = domain.split(' ')[0];
    const domainName = domain.replace(/^\d+\.\d+\s+/, ''); // Remove "1.0 " prefix

    const totalQuestions = stats.questionIds.size;
    const correctQuestions = stats.correctQuestionIds.size;

    return {
      domain: domainName,
      domainNum,
      accuracy: totalQuestions > 0 ? Math.round((correctQuestions / totalQuestions) * 100) : 0,
      questions: totalQuestions,
    };
  }).sort((a, b) => a.domainNum.localeCompare(b.domainNum));

  const hasSufficientQuestions = hasSufficientData(userProgress.totalQuestions);

  // All Security+ SY0-701 Topics organized by domain (cleaned and disambiguated)
  const allTopicsByDomain: { [domain: string]: string[] } = {
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

  // Build coverage data for all topics
  const topicCoverageData: { [domain: string]: { topicName: string; count: number; accuracy: number }[] } = {};

  // Initialize all domains with all topics set to 0
  Object.entries(allTopicsByDomain).forEach(([domain, topics]) => {
    topicCoverageData[domain] = topics.map(topicName => ({
      topicName,
      count: 0,
      accuracy: 0
    }));
  });

  // Fill in actual coverage data from userProgress
  Object.values(userProgress.topicPerformance || {}).forEach(topicPerf => {
    const domain = topicPerf.domain;
    if (topicCoverageData[domain]) {
      const topicIndex = topicCoverageData[domain].findIndex(t => t.topicName === topicPerf.topicName);
      if (topicIndex !== -1) {
        topicCoverageData[domain][topicIndex] = {
          topicName: topicPerf.topicName,
          count: topicPerf.questionsAnswered,
          accuracy: Math.round(topicPerf.accuracy)
        };
      }
      // Ignore topics not in official list (AI-created topics)
    }
  });

  return (
    <div className="space-y-8">
      {/* Phase 1 Warning if insufficient data */}
      {!hasSufficientQuestions && (
        <div className="bg-black border border-yellow-500/30 rounded-[28px] p-6 md:p-8 shadow-xl shadow-black/50">
          <p className="text-yellow-300 text-base md:text-lg">
            <strong className="font-bold">Preliminary Estimates:</strong> Answer at least 15 questions for reliable IRT analysis.
            Current progress: {userProgress.totalQuestions}/15 questions
          </p>
        </div>
      )}

      {/* Graph 1: Ability Level Over Time */}
      <div className="bg-black rounded-[28px] p-8 md:p-10 border border-gray-700 hover:border-gray-600 shadow-xl shadow-black/50 transition-all duration-300">
        <h3 className="text-2xl md:text-3xl font-medium text-white mb-6 tracking-tight font-mono">Ability Level Over Time</h3>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={abilityOverTime}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
            <XAxis dataKey="quiz" stroke="#9ca3af" tick={false} label={{ value: 'Quiz', position: 'insideBottom', offset: 0, fill: '#9ca3af' }} />
            <YAxis domain={[-3, 3]} stroke="#9ca3af" label={{ value: 'Ability Level', angle: -90, position: 'insideLeft', fill: '#9ca3af', style: { textAnchor: 'middle' } }} />
            <Tooltip
              contentStyle={{ backgroundColor: '#000000', border: '1px solid #1f2937', borderRadius: '16px' }}
              labelStyle={{ color: '#F3F4F6' }}
              itemStyle={{ color: '#3b82f6' }}
            />
            <ReferenceLine y={0} stroke="#6b7280" strokeDasharray="3 3" label={{ value: 'Average', fill: '#9ca3af' }} />
            <ReferenceLine y={1} stroke="#10b981" strokeDasharray="3 3" label={{ value: 'Target', fill: '#10b981' }} />
            <Line
              type="monotone"
              dataKey="ability"
              stroke="#ffffff"
              strokeWidth={3}
              dot={(props: any) => {
                const { cx, cy, payload } = props;
                const ability = payload.ability;
                let fill = '#ef4444'; // Red for below average
                if (ability >= 1) fill = '#22c55e'; // Green for excellent
                else if (ability >= 0) fill = '#eab308'; // Yellow for average to good
                return <circle cx={cx} cy={cy} r={5} fill={fill} />;
              }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Graph 2: Predicted Score Over Time */}
      <div className="bg-black rounded-[28px] p-8 md:p-10 border border-gray-700 hover:border-gray-600 shadow-xl shadow-black/50 transition-all duration-300">
        <h3 className="text-2xl md:text-3xl font-medium text-white mb-6 tracking-tight font-mono">Predicted Score Over Time</h3>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={scoreOverTime}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
            <XAxis dataKey="quiz" stroke="#9ca3af" tick={false} label={{ value: 'Quiz', position: 'insideBottom', offset: 0, fill: '#9ca3af' }} />
            <YAxis domain={[100, 900]} stroke="#9ca3af" label={{ value: 'Exam Score', angle: -90, position: 'insideLeft', fill: '#9ca3af', style: { textAnchor: 'middle' } }} />
            <Tooltip
              contentStyle={{ backgroundColor: '#000000', border: '1px solid #1f2937', borderRadius: '16px' }}
              labelStyle={{ color: '#F3F4F6' }}
              itemStyle={{ color: '#10b981' }}
            />
            <ReferenceLine y={750} stroke="#10b981" strokeDasharray="3 3" label={{ value: 'Passing', fill: '#10b981', position: 'right' }} />
            <Line
              type="monotone"
              dataKey="score"
              stroke="#ffffff"
              strokeWidth={3}
              dot={(props: any) => {
                const { cx, cy, payload } = props;
                const score = payload.score;
                let fill = '#ef4444'; // Red for below passing
                if (score >= 800) fill = '#22c55e'; // Green for excellent
                else if (score >= 750) fill = '#eab308'; // Yellow for passing
                return <circle cx={cx} cy={cy} r={5} fill={fill} />;
              }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Graph 3: Accuracy by Difficulty */}
      <div className="bg-black rounded-[28px] p-8 md:p-10 border border-gray-700 hover:border-gray-600 shadow-xl shadow-black/50 transition-all duration-300">
        <h3 className="text-2xl md:text-3xl font-medium text-white mb-6 tracking-tight font-mono">Accuracy by Difficulty Level</h3>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={accuracyByDifficulty}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
            <XAxis dataKey="difficulty" stroke="#9ca3af" tickLine={false} />
            <YAxis domain={[0, 100]} stroke="#9ca3af" label={{ value: '% Correct', angle: -90, position: 'insideLeft', fill: '#9ca3af', style: { textAnchor: 'middle' } }} />
            <Tooltip content={(props) => {
              if (props.active && props.payload && props.payload.length) {
                const accuracy = props.payload[0].payload.accuracy;
                let color = '#ef4444'; // Red
                if (accuracy >= 85) color = '#22c55e'; // Green
                else if (accuracy >= 70) color = '#eab308'; // Yellow
                return <CustomBarTooltip {...props} color={color} />;
              }
              return null;
            }} cursor={{ fill: 'rgba(71, 85, 105, 0.1)' }} />
            <Bar dataKey="accuracy" radius={[8, 8, 0, 0]}>
              {accuracyByDifficulty.map((entry, index) => {
                const accuracy = entry.accuracy;
                let fill = '#ef4444'; // Red for low accuracy
                if (accuracy >= 85) fill = '#22c55e'; // Green for excellent
                else if (accuracy >= 70) fill = '#eab308'; // Yellow for good
                return <Cell key={`cell-${index}`} fill={fill} />;
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Graph 4: Topic Performance by Domain */}
      {domainPerformance.length > 0 && (
        <div className="bg-black rounded-[28px] p-8 md:p-10 border border-gray-700 hover:border-gray-600 shadow-xl shadow-black/50 transition-all duration-300">
          <h3 className="text-2xl md:text-3xl font-medium text-white mb-6 tracking-tight font-mono">Performance by SY0-701 Domain</h3>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={domainPerformance} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis type="number" domain={[0, 100]} stroke="#9ca3af" label={{ value: '% Correct', position: 'insideBottom', offset: -5, fill: '#9ca3af' }} />
              <YAxis type="category" dataKey="domain" stroke="#9ca3af" width={60} tick={false} label={{ value: 'Domains', angle: -90, position: 'insideLeft', fill: '#9ca3af', style: { textAnchor: 'middle' } }} />
              <Tooltip content={(props) => {
                if (props.active && props.payload && props.payload.length) {
                  const accuracy = props.payload[0].payload.accuracy;
                  let color = '#ef4444'; // Red
                  if (accuracy >= 85) color = '#22c55e'; // Green
                  else if (accuracy >= 70) color = '#eab308'; // Yellow
                  return <CustomBarTooltip {...props} color={color} />;
                }
                return null;
              }} cursor={{ fill: 'rgba(71, 85, 105, 0.1)' }} />
              <Bar dataKey="accuracy" radius={[0, 8, 8, 0]}>
                {domainPerformance.map((entry, index) => {
                  const accuracy = entry.accuracy;
                  let fill = '#ef4444'; // Red for low accuracy
                  if (accuracy >= 85) fill = '#22c55e'; // Green for excellent
                  else if (accuracy >= 70) fill = '#eab308'; // Yellow for good
                  return <Cell key={`cell-${index}`} fill={fill} />;
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Topic Coverage Tables by Domain */}
      <div className="bg-black rounded-[28px] p-8 md:p-10 border border-gray-700 shadow-xl shadow-black/50">
        <h3 className="text-2xl md:text-3xl font-medium text-white mb-6 tracking-tight font-mono">Topic Coverage by Domain</h3>
        <p className="text-slate-400 text-base md:text-lg mb-8">All Security+ SY0-701 topics organized by domain, showing coverage frequency</p>

        <div className="space-y-6">
          {Object.entries(topicCoverageData)
            .sort(([domainA], [domainB]) => {
              const numA = domainA.split(' ')[0];
              const numB = domainB.split(' ')[0];
              return numA.localeCompare(numB);
            })
            .map(([domain, topics]) => {
              const domainName = domain.replace(/^\d+\.\d+\s+/, '');
              const domainNum = domain.split(' ')[0];
              const totalCovered = topics.filter(t => t.count > 0).length;
              const totalTopics = topics.length;

              return (
                <div key={domain} className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xl md:text-2xl font-semibold text-blue-400 tracking-tight">
                      {domainNum} {domainName}
                    </h4>
                    <span className="text-sm md:text-base text-slate-400">
                      {totalCovered} of {totalTopics} topics covered
                    </span>
                  </div>

                  <div className="border border-gray-800 rounded-[20px] overflow-hidden bg-black">
                    <div className="max-h-96 overflow-y-auto">
                      <table className="w-full">
                        <thead className="bg-black border-b border-gray-800 sticky top-0">
                          <tr>
                            <th className="text-left px-4 py-3 text-sm md:text-base font-semibold text-slate-300 w-3/5">Topic</th>
                            <th className="text-center px-4 py-3 text-sm md:text-base font-semibold text-slate-300 w-1/5">Times Covered</th>
                            <th className="text-center px-4 py-3 text-sm md:text-base font-semibold text-slate-300 w-1/5">Accuracy</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800">
                          {topics.map((topic, index) => (
                            <tr
                              key={index}
                              className="bg-black hover:bg-gray-900/50 transition-all duration-200"
                            >
                              <td className="px-4 py-2 text-sm md:text-base text-slate-300">{topic.topicName}</td>
                              <td className={`px-4 py-2 text-sm md:text-base text-center font-medium ${
                                topic.count === 0 ? 'text-slate-500' : 'text-blue-400'
                              }`}>
                                {topic.count}
                              </td>
                              <td className={`px-4 py-2 text-sm md:text-base text-center font-medium ${
                                topic.count === 0
                                  ? 'text-slate-500'
                                  : topic.accuracy >= 80
                                  ? 'text-emerald-400'
                                  : topic.accuracy >= 60
                                  ? 'text-yellow-400'
                                  : 'text-red-400'
                              }`}>
                                {topic.count > 0 ? `${topic.accuracy}%` : '-'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
}
