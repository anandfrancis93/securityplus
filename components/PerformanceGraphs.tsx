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
      'Confidentiality, Integrity, and Availability (CIA)', 'Non-repudiation',
      'Authentication, Authorization, and Accounting (AAA)', 'Gap analysis',
      'Zero Trust', 'Control Plane (Zero Trust)', 'Adaptive identity (Zero Trust)', 'Threat scope reduction (Zero Trust)',
      'Policy-driven access control (Zero Trust)', 'Policy Administrator (Zero Trust)', 'Policy Engine (Zero Trust)',
      'Data Plane (Zero Trust)', 'Implicit trust zones (Zero Trust)', 'Subject/System (Zero Trust)', 'Policy Enforcement Point (Zero Trust)',
      'Bollards', 'Access control vestibule', 'Fencing', 'Video surveillance', 'Security guard', 'Access badge',
      'Lighting (physical security)', 'Physical security sensors',
      'Infrared sensor', 'Pressure sensor', 'Microwave sensor', 'Ultrasonic sensor',
      'Honeypot', 'Honeynet', 'Honeyfile', 'Honeytoken',
      // From 1.3 - Change Management
      'Approval process (change management)', 'Ownership (change management)', 'Stakeholders (change management)',
      'Impact analysis (change management)', 'Test results (change management)', 'Backout plan', 'Maintenance window',
      'Standard operating procedure', 'Allow lists/deny lists', 'Restricted activities (change management)',
      'Downtime (change management)', 'Service restart', 'Application restart', 'Legacy applications (change management)',
      'Dependencies (change management)', 'Updating diagrams', 'Updating policies/procedures', 'Version control',
      // From 1.4 - Cryptographic Solutions
      'Public key infrastructure (PKI)', 'Public key (PKI)', 'Private key (PKI)', 'Key escrow',
      'Encryption', 'Full-disk encryption', 'Partition encryption', 'File encryption', 'Volume encryption',
      'Database encryption', 'Record encryption', 'Transport/communication encryption',
      'Asymmetric encryption', 'Symmetric encryption', 'Key exchange', 'Encryption algorithms', 'Key length',
      'Trusted Platform Module (TPM)', 'Hardware security module (HSM)', 'Key management system', 'Secure enclave',
      'Obfuscation', 'Steganography', 'Tokenization', 'Data masking',
      'Hashing', 'Salting', 'Digital signatures', 'Key stretching', 'Blockchain', 'Open public ledger',
      'Certificates', 'Certificate authorities', 'Certificate revocation lists (CRLs)',
      'Online Certificate Status Protocol (OCSP)', 'Self-signed certificates', 'Third-party certificates',
      'Root of trust', 'Certificate signing request (CSR) generation', 'Wildcard certificates'
    ],
    '2.0 Threats, Vulnerabilities, and Mitigations': [
      // From 2.1 - Threat Actors
      'Nation-state', 'Unskilled attacker', 'Hacktivist', 'Insider threat', 'Organized crime', 'Shadow IT',
      'Internal/external (threat actor attribute)', 'Resources/funding (threat actor attribute)', 'Level of sophistication/capability',
      'Data exfiltration', 'Espionage', 'Service disruption', 'Blackmail', 'Financial gain',
      'Philosophical/political beliefs', 'Ethical (motivation)', 'Revenge', 'Disruption/chaos', 'War (motivation)',
      // From 2.2 - Threat Vectors
      'Email (message-based)', 'Short Message Service (SMS)', 'Instant messaging (IM)',
      'Image-based (attack vector)', 'File-based (attack vector)', 'Voice call (attack vector)', 'Removable device',
      'Client-based vs. agentless', 'Unsupported systems and applications',
      'Wireless (unsecure network)', 'Wired (unsecure network)', 'Bluetooth (unsecure network)',
      'Open service ports', 'Default credentials',
      'Supply chain (threat vector)', 'Managed service providers (MSPs)', 'Vendors (supply chain)', 'Suppliers (supply chain)',
      'Phishing', 'Vishing', 'Smishing', 'Misinformation/disinformation', 'Impersonation', 'Business email compromise',
      'Pretexting', 'Watering hole', 'Brand impersonation', 'Typosquatting',
      // From 2.3 - Vulnerabilities
      'Memory injection', 'Buffer overflow (vulnerability)', 'Race conditions', 'Time-of-check (TOC)', 'Time-of-use (TOU)',
      'Malicious update', 'Operating system (OS)-based vulnerabilities', 'Structured Query Language injection (SQLi)',
      'Cross-site scripting (XSS)', 'Firmware vulnerabilities', 'End-of-life (hardware)', 'Legacy (hardware)',
      'Virtual machine (VM) escape', 'Resource reuse (virtualization)', 'Cloud-specific vulnerabilities',
      'Service provider (supply chain vulnerability)', 'Hardware provider (supply chain vulnerability)',
      'Software provider (supply chain vulnerability)', 'Cryptographic vulnerabilities', 'Misconfiguration',
      'Side loading', 'Jailbreaking', 'Zero-day',
      // From 2.4 - Malicious Activity
      'Ransomware', 'Trojan', 'Worm', 'Spyware', 'Bloatware', 'Virus', 'Keylogger', 'Logic bomb', 'Rootkit',
      'Brute force (physical attack)', 'Radio frequency identification (RFID) cloning', 'Environmental (physical attack)',
      'Distributed denial-of-service (DDoS)', 'Amplified (DDoS)', 'Reflected (DDoS)', 'Domain Name System (DNS) attacks',
      'Wireless (network attack)', 'On-path attack', 'Credential replay', 'Malicious code (network attack)',
      'Injection (application attack)', 'Buffer overflow (application attack)', 'Replay (application attack)',
      'Privilege escalation', 'Forgery', 'Directory traversal',
      'Downgrade (cryptographic attack)', 'Collision (cryptographic attack)', 'Birthday (cryptographic attack)',
      'Spraying (password attack)', 'Brute force (password attack)',
      'Account lockout (indicator)', 'Concurrent session usage', 'Blocked content (indicator)', 'Impossible travel',
      'Resource consumption (indicator)', 'Resource inaccessibility', 'Out-of-cycle logging',
      'Published/documented (indicator)', 'Missing logs',
      // From 2.5 - Mitigation Techniques
      'Segmentation (mitigation)', 'Access control (mitigation)', 'Access control list (ACL)',
      'Permissions (access control)', 'Application allow list', 'Isolation (mitigation)',
      'Patching (mitigation)', 'Encryption (mitigation)', 'Monitoring (mitigation)', 'Least privilege',
      'Configuration enforcement', 'Decommissioning (mitigation)', 'Hardening techniques',
      'Installation of endpoint protection', 'Host-based firewall',
      'Host-based intrusion prevention system (HIPS)', 'Disabling ports/protocols',
      'Default password changes', 'Removal of unnecessary software'
    ],
    '3.0 Security Architecture': [
      // From 3.1 - Architecture Models
      'Cloud (architecture)', 'Responsibility matrix (cloud)', 'Hybrid considerations (cloud)', 'Third-party vendors (cloud)',
      'Infrastructure as code (IaC)', 'Serverless', 'Microservices',
      'Physical isolation', 'Air-gapped', 'Logical segmentation', 'Software-defined networking (SDN)',
      'On-premises', 'Centralized vs. decentralized', 'Containerization', 'Virtualization (architecture)',
      'IoT', 'Industrial control systems (ICS)/supervisory control and data acquisition (SCADA)',
      'Real-time operating system (RTOS)', 'Embedded systems', 'High availability',
      'Availability (architecture)', 'Resilience', 'Cost (architecture consideration)', 'Responsiveness', 'Scalability',
      'Ease of deployment', 'Risk transference', 'Ease of recovery', 'Patch availability', 'Inability to patch',
      'Power (architecture consideration)', 'Compute (architecture consideration)',
      // From 3.2 - Enterprise Infrastructure
      'Device placement', 'Security zones', 'Attack surface', 'Connectivity (infrastructure)',
      'Fail-open', 'Fail-closed', 'Active vs. passive', 'Inline vs. tap/monitor',
      'Jump server', 'Proxy server', 'Intrusion prevention system (IPS)', 'Intrusion detection system (IDS)',
      'Load balancer', 'Sensors (network)', 'Port security', '802.1X', 'Extensible Authentication Protocol (EAP)',
      'Web application firewall (WAF)', 'Unified threat management (UTM)', 'Next-generation firewall (NGFW)',
      'Layer 4/Layer 7 firewall', 'Virtual private network (VPN)', 'Remote access', 'Tunneling',
      'Transport Layer Security (TLS)', 'Internet protocol security (IPSec)',
      'Software-defined wide area network (SD-WAN)', 'Secure access service edge (SASE)', 'Selection of effective controls',
      // From 3.3 - Data Protection
      'Regulated (data type)', 'Trade secret', 'Intellectual property', 'Legal information', 'Financial information',
      'Human- and non-human-readable', 'Sensitive (data classification)', 'Confidential (data classification)',
      'Public (data classification)', 'Restricted (data classification)', 'Private (data classification)',
      'Critical (data classification)', 'Data at rest', 'Data in transit', 'Data in use', 'Data sovereignty',
      'Geolocation (data)', 'Geographic restrictions (data protection)', 'Encryption (data protection)',
      'Hashing (data protection)', 'Masking (data protection)', 'Tokenization (data protection)',
      'Obfuscation (data protection)', 'Segmentation (data protection)', 'Permission restrictions',
      // From 3.4 - Resilience and Recovery
      'Load balancing vs. clustering', 'Hot (site)', 'Cold (site)', 'Warm (site)', 'Geographic dispersion',
      'Platform diversity', 'Multi-cloud systems', 'Continuity of operations', 'Capacity planning',
      'People (capacity planning)', 'Technology (capacity planning)', 'Infrastructure (capacity planning)',
      'Tabletop exercises', 'Fail over', 'Simulation (testing)', 'Parallel processing', 'Backups',
      'Onsite/offsite backups', 'Backup frequency', 'Backup encryption', 'Snapshots', 'Recovery (backups)',
      'Replication (backups)', 'Journaling', 'Generators', 'Uninterruptible power supply (UPS)'
    ],
    '4.0 Security Operations': [
      // From 4.1 - Security Techniques
      'Establish (secure baseline)', 'Deploy (secure baseline)', 'Maintain (secure baseline)',
      'Mobile devices (hardening)', 'Workstations (hardening)', 'Switches (hardening)', 'Routers (hardening)',
      'Cloud infrastructure (hardening)', 'Servers (hardening)', 'ICS/SCADA (hardening)', 'Embedded systems (hardening)',
      'RTOS (hardening)', 'IoT devices (hardening)', 'Site surveys', 'Heat maps', 'Mobile device management (MDM)',
      'Bring your own device (BYOD)', 'Corporate-owned, personally enabled (COPE)', 'Choose your own device (CYOD)',
      'Cellular (connection method)', 'Wi-Fi (connection method)', 'Bluetooth (connection method)',
      'Wi-Fi Protected Access 3 (WPA3)', 'AAA/Remote Authentication Dial-In User Service (RADIUS)',
      'Cryptographic protocols (wireless)', 'Authentication protocols (wireless)',
      'Input validation', 'Secure cookies', 'Static code analysis', 'Code signing', 'Sandboxing',
      'Monitoring (security operations)',
      // From 4.2 - Asset Management
      'Acquisition/procurement process', 'Ownership (asset management)', 'Classification (asset management)',
      'Inventory', 'Enumeration (asset tracking)', 'Sanitization', 'Destruction (disposal)',
      'Certification (disposal)', 'Data retention',
      // From 4.3 - Vulnerability Management
      'Vulnerability scan', 'Static analysis (application security)', 'Dynamic analysis (application security)',
      'Package monitoring', 'Threat feed', 'Open-source intelligence (OSINT)', 'Proprietary/third-party (threat feed)',
      'Information-sharing organization', 'Dark web', 'Penetration testing (vulnerability identification)',
      'Responsible disclosure program', 'Bug bounty program', 'System/process audit',
      'False positive', 'False negative', 'Prioritize (vulnerability analysis)',
      'Common Vulnerability Scoring System (CVSS)', 'Common Vulnerability Enumeration (CVE)',
      'Vulnerability classification', 'Exposure factor (vulnerability)', 'Environmental variables (vulnerability)',
      'Industry/organizational impact', 'Risk tolerance (vulnerability)',
      'Patching (vulnerability remediation)', 'Insurance (vulnerability response)', 'Segmentation (vulnerability response)',
      'Compensating controls', 'Exceptions and exemptions', 'Rescanning', 'Audit (validation)',
      'Verification (remediation)', 'Reporting (vulnerability)',
      // From 4.4 - Alerting and Monitoring
      'Systems (monitoring)', 'Applications (monitoring)', 'Infrastructure (monitoring)',
      'Log aggregation', 'Alerting', 'Scanning (monitoring activity)', 'Reporting (monitoring activity)', 'Archiving',
      'Quarantine (alert response)', 'Alert tuning', 'Security Content Automation Protocol (SCAP)', 'Benchmarks',
      'Agents/agentless (monitoring)', 'Security information and event management (SIEM)', 'Antivirus',
      'Data loss prevention (DLP)', 'Simple Network Management Protocol (SNMP) traps', 'NetFlow', 'Vulnerability scanners',
      // From 4.5 - Enterprise Capabilities
      'Firewall rules', 'Access lists (firewall)', 'Ports/protocols (firewall)', 'Screened subnets',
      'IDS/IPS trends', 'Signatures (IDS/IPS)', 'Agent-based (web filter)', 'Centralized proxy',
      'Universal Resource Locator (URL) scanning', 'Content categorization', 'Block rules (web filter)',
      'Reputation (web filter)', 'Group Policy', 'SELinux', 'Protocol selection', 'Port selection (secure protocols)',
      'Transport method', 'DNS filtering', 'Domain-based Message Authentication Reporting and Conformance (DMARC)',
      'DomainKeys Identified Mail (DKIM)', 'Sender Policy Framework (SPF)', 'Gateway (email security)',
      'File integrity monitoring', 'Data loss prevention (DLP operations)', 'Network access control (NAC)',
      'Endpoint detection and response (EDR)', 'Extended detection and response (XDR)', 'User behavior analytics',
      // From 4.6 - Identity and Access Management
      'Provisioning/de-provisioning user accounts', 'Permission assignments and implications', 'Identity proofing',
      'Federation', 'Single sign-on (SSO)', 'Lightweight Directory Access Protocol (LDAP)', 'Open authorization (OAuth)',
      'Security Assertions Markup Language (SAML)', 'Interoperability', 'Attestation (identity)',
      'Mandatory (access control)', 'Discretionary (access control)', 'Role-based (access control)',
      'Rule-based (access control)', 'Attribute-based (access control)', 'Time-of-day restrictions',
      'Least privilege (access control)', 'Biometrics', 'Hard/soft authentication tokens', 'Security keys (MFA)',
      'Something you know', 'Something you have', 'Something you are', 'Somewhere you are',
      'Password length', 'Password complexity', 'Password reuse', 'Password expiration', 'Password age',
      'Password managers', 'Passwordless', 'Just-in-time permissions', 'Password vaulting', 'Ephemeral credentials',
      // From 4.7 - Automation and Orchestration
      'User provisioning (automation)', 'Resource provisioning (automation)', 'Guard rails', 'Security groups (automation)',
      'Ticket creation (automation)', 'Escalation (automation)', 'Enabling/disabling services and access',
      'Continuous integration and testing', 'Integrations and Application programming interfaces (APIs)',
      'Efficiency/time saving', 'Enforcing baselines', 'Standard infrastructure configurations',
      'Scaling in a secure manner', 'Employee retention', 'Reaction time', 'Workforce multiplier',
      'Complexity (automation consideration)', 'Cost (automation consideration)', 'Single point of failure',
      'Technical debt', 'Ongoing supportability',
      // From 4.8 - Incident Response
      'Preparation (incident response)', 'Detection (incident response)', 'Analysis (incident response)',
      'Containment', 'Eradication', 'Recovery (incident response)', 'Lessons learned',
      'Training (incident response)', 'Tabletop exercise (incident response)', 'Simulation (incident response)',
      'Root cause analysis', 'Threat hunting', 'Digital forensics', 'Legal hold', 'Chain of custody',
      'Acquisition (forensics)', 'Reporting (forensics)', 'Preservation (forensics)', 'E-discovery',
      // From 4.9 - Investigation Data Sources
      'Firewall logs', 'Application logs', 'Endpoint logs', 'OS-specific security logs', 'IPS/IDS logs',
      'Network logs', 'Metadata (logs)', 'Vulnerability scans (data source)', 'Automated reports (data source)',
      'Dashboards (data source)', 'Packet captures'
    ],
    '5.0 Security Program Management and Oversight': [
      // From 5.1 - Security Governance
      'Guidelines (governance)',
      'Acceptable use policy (AUP)',
      'Information security policies',
      'Business continuity',
      'Disaster recovery',
      'Incident response (policy)',
      'Software development lifecycle (SDLC)',
      'Change management (policy)',
      'Password (standard)',
      'Access control (standard)',
      'Physical security (standard)',
      'Encryption (standard)',
      'Change management (procedure)',
      'Onboarding/offboarding',
      'Playbooks',
      'Regulatory (external consideration)',
      'Legal (external consideration)',
      'Industry (external consideration)',
      'Local/regional (external consideration)',
      'National (external consideration)',
      'Global (external consideration)',
      'Monitoring and revision (governance)',
      'Boards (governance structure)',
      'Committees (governance structure)',
      'Government entities',
      'Centralized/decentralized (governance)',
      'Owners (roles and responsibilities)',
      'Controllers (roles and responsibilities)',
      'Processors (roles and responsibilities)',
      'Custodians/stewards',
      // From 5.2 - Risk Management
      'Risk identification',
      'Ad hoc (risk assessment)',
      'Recurring (risk assessment)',
      'One-time (risk assessment)',
      'Continuous (risk assessment)',
      'Qualitative (risk analysis)',
      'Quantitative (risk analysis)',
      'Single loss expectancy (SLE)',
      'Annualized loss expectancy (ALE)',
      'Annualized rate of occurrence (ARO)',
      'Probability (risk)',
      'Likelihood (risk)',
      'Exposure factor (risk)',
      'Impact (risk)',
      'Risk register',
      'Key risk indicators',
      'Risk owners',
      'Risk threshold',
      'Risk tolerance',
      'Risk appetite',
      'Expansionary (risk appetite)',
      'Conservative (risk appetite)',
      'Neutral (risk appetite)',
      'Transfer (risk strategy)',
      'Accept (risk strategy)',
      'Exemption (risk acceptance)',
      'Exception (risk acceptance)',
      'Avoid (risk strategy)',
      'Mitigate (risk strategy)',
      'Risk reporting',
      'Business impact analysis',
      'Recovery time objective (RTO)',
      'Recovery point objective (RPO)',
      'Mean time to repair (MTTR)',
      'Mean time between failures (MTBF)',
      // From 5.3 - Third-Party Risk
      'Penetration testing (vendor assessment)',
      'Right-to-audit clause',
      'Evidence of internal audits',
      'Independent assessments',
      'Supply chain analysis',
      'Due diligence (vendor selection)',
      'Conflict of interest',
      'Service-level agreement (SLA)',
      'Memorandum of agreement (MOA)',
      'Memorandum of understanding (MOU)',
      'Master service agreement (MSA)',
      'Work order (WO)/statement of work (SOW)',
      'Non-disclosure agreement (NDA)',
      'Business partners agreement (BPA)',
      'Vendor monitoring',
      'Questionnaires (vendor)',
      'Rules of engagement (vendor)',
      // From 5.4 - Security Compliance
      'Internal (compliance reporting)',
      'External (compliance reporting)',
      'Fines',
      'Sanctions',
      'Reputational damage',
      'Loss of license',
      'Contractual impacts',
      'Due diligence/care (compliance)',
      'Attestation and acknowledgement',
      'Internal and external (compliance monitoring)',
      'Automation (compliance monitoring)',
      'Legal implications (privacy)',
      'Data subject',
      'Controller vs. processor',
      'Ownership (data privacy)',
      'Data inventory and retention',
      'Right to be forgotten',
      // From 5.5 - Audits and Assessments
      'Attestation (audit)',
      'Compliance (internal audit)',
      'Audit committee',
      'Self-assessments',
      'Regulatory (external audit)',
      'Examinations',
      'Assessment (external audit)',
      'Independent third-party audit',
      'Physical (penetration testing)',
      'Offensive (penetration testing)',
      'Defensive (penetration testing)',
      'Integrated (penetration testing)',
      'Known environment',
      'Partially known environment',
      'Unknown environment',
      'Passive (reconnaissance)',
      'Active (reconnaissance)',
      // From 5.6 - Security Awareness
      'Phishing campaigns',
      'Recognizing a phishing attempt',
      'Responding to reported suspicious messages',
      'Risky (anomalous behavior)',
      'Unexpected (anomalous behavior)',
      'Unintentional (anomalous behavior)',
      'Policy/handbooks (training)',
      'Situational awareness',
      'Insider threat (training)',
      'Password management (training)',
      'Removable media and cables',
      'Social engineering (training)',
      'Operational security',
      'Hybrid/remote work environments',
      'Initial (reporting and monitoring)',
      'Recurring (reporting and monitoring)',
      'Development (awareness)',
      'Execution (awareness)'
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
