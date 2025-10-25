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
} from 'recharts';
import { UserProgress } from '@/lib/types';
import { hasSufficientData } from '@/lib/irt';

interface PerformanceGraphsProps {
  userProgress: UserProgress | null;
}

export default function PerformanceGraphs({ userProgress }: PerformanceGraphsProps) {
  if (!userProgress || userProgress.totalQuestions === 0) {
    return (
      <div className="bg-gray-800 rounded-xl p-8 border border-gray-700 text-center">
        <p className="text-gray-400">Take quizzes to see your progress charts</p>
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

  // Graph 5: Questions Answered Over Time (Cumulative)
  let cumulative = 0;
  const questionsOverTime = userProgress.quizHistory.map((quiz, index) => {
    cumulative += quiz.questions.length;
    return {
      quiz: `Quiz ${index + 1}`,
      total: cumulative,
      date: new Date(quiz.endedAt || quiz.startedAt).toLocaleDateString(),
    };
  });

  const hasSufficientQuestions = hasSufficientData(userProgress.totalQuestions);

  // All Security+ SY0-701 Topics organized by domain (ONLY actual topics, no headings/groupings)
  const allTopicsByDomain: { [domain: string]: string[] } = {
    '1.0 General Security Concepts': [
      // 1.1 Compare and contrast various types of security controls
      'Technical', 'Managerial', 'Operational', 'Physical',
      'Preventive', 'Deterrent', 'Detective', 'Corrective', 'Compensating', 'Directive',
      // 1.2 Summarize fundamental security concepts
      'Confidentiality', 'Integrity', 'Availability', 'Non-repudiation',
      'Authentication', 'Authorization', 'Accounting', 'Authorization models',
      'Gap analysis', 'Zero Trust', 'Control Plane', 'Adaptive identity', 'Threat scope reduction', 'Policy-driven access control',
      'Policy Administrator', 'Policy Engine', 'Data Plane', 'Implicit trust zones', 'Subject/System', 'Policy Enforcement Point',
      'Bollards', 'Access control vestibule', 'Fencing', 'Video surveillance', 'Security guard', 'Access badge',
      'Lighting', 'Infrared', 'Pressure', 'Microwave', 'Ultrasonic',
      'Honeypot', 'Honeynet', 'Honeyfile', 'Honeytoken',
      // 1.3 Explain the importance of change management processes
      'Approval process', 'Ownership', 'Stakeholders', 'Impact analysis', 'Test results', 'Backout plan', 'Maintenance window',
      'Standard operating procedure', 'Allow lists', 'Deny lists', 'Restricted activities', 'Downtime', 'Service restart',
      'Application restart', 'Legacy applications', 'Dependencies', 'Updating diagrams', 'Updating policies/procedures', 'Version control',
      // 1.4 Explain the importance of using appropriate cryptographic solutions
      'Public key infrastructure (PKI)', 'Public key', 'Private key', 'Key escrow', 'Full-disk', 'Partition', 'File',
      'Volume', 'Database', 'Record', 'Transport/communication', 'Asymmetric', 'Symmetric', 'Key exchange', 'Algorithms', 'Key length',
      'Trusted Platform Module (TPM)', 'Hardware security module (HSM)', 'Key management system', 'Secure enclave',
      'Steganography', 'Tokenization', 'Data masking', 'Hashing', 'Salting', 'Digital signatures', 'Key stretching',
      'Blockchain', 'Open public ledger', 'Certificate authorities', 'Certificate revocation lists (CRLs)',
      'Online Certificate Status Protocol (OCSP)', 'Self-signed', 'Third-party', 'Root of trust',
      'Certificate signing request (CSR) generation', 'Wildcard'
    ],
    '2.0 Threats, Vulnerabilities, and Mitigations': [
      // 2.1 Compare and contrast common threat actors and motivations
      'Nation-state', 'Unskilled attacker', 'Hacktivist', 'Insider threat', 'Organized crime', 'Shadow IT',
      'Internal/external', 'Resources/funding', 'Level of sophistication/capability',
      'Data exfiltration', 'Espionage', 'Service disruption', 'Blackmail', 'Financial gain',
      'Philosophical/political beliefs', 'Ethical', 'Revenge', 'Disruption/chaos', 'War',
      // 2.2 Explain common threat vectors and attack surfaces
      'Email', 'Short Message Service (SMS)', 'Instant messaging (IM)', 'Image-based', 'File-based', 'Voice call', 'Removable device',
      'Vulnerable software', 'Client-based vs. agentless', 'Unsupported systems and applications', 'Unsecure networks',
      'Wireless', 'Wired', 'Bluetooth', 'Open service ports', 'Default credentials', 'Supply chain',
      'Managed service providers (MSPs)', 'Vendors', 'Suppliers', 'Human vectors/social engineering',
      'Phishing', 'Vishing', 'Smishing', 'Misinformation/disinformation', 'Impersonation', 'Business email compromise',
      'Pretexting', 'Watering hole', 'Brand impersonation', 'Typosquatting',
      // 2.3 Explain various types of vulnerabilities
      'Application', 'Memory injection', 'Buffer overflow', 'Race conditions', 'Time-of-check (TOC)', 'Time-of-use (TOU)',
      'Malicious update', 'Operating system (OS)-based', 'Web-based', 'Structured Query Language injection (SQLi)',
      'Cross-site scripting (XSS)', 'Hardware', 'Firmware', 'End-of-life', 'Legacy', 'Virtualization',
      'Virtual machine (VM) escape', 'Resource reuse', 'Cloud-specific', 'Service provider', 'Hardware provider',
      'Software provider', 'Cryptographic', 'Misconfiguration', 'Mobile device', 'Side loading', 'Jailbreaking', 'Zero-day',
      // 2.4 Given a scenario, analyze indicators of malicious activity
      'Malware attacks', 'Ransomware', 'Trojan', 'Worm', 'Spyware', 'Bloatware', 'Virus', 'Keylogger', 'Logic bomb', 'Rootkit',
      'Physical attacks', 'Brute force', 'Radio frequency identification (RFID) cloning', 'Environmental', 'Network attacks',
      'Distributed denial-of-service (DDoS)', 'Amplified', 'Reflected', 'Domain Name System (DNS) attacks',
      'On-path', 'Credential replay', 'Malicious code', 'Application attacks', 'Injection', 'Replay', 'Privilege escalation',
      'Forgery', 'Directory traversal', 'Cryptographic attacks', 'Downgrade', 'Collision', 'Birthday', 'Password attacks',
      'Spraying', 'Indicators', 'Account lockout', 'Concurrent session usage', 'Blocked content', 'Impossible travel',
      'Resource consumption', 'Resource inaccessibility', 'Out-of-cycle logging', 'Published/documented', 'Missing logs',
      // 2.5 Explain the purpose of mitigation techniques
      'Segmentation', 'Access control', 'Access control list (ACL)', 'Permissions', 'Application allow list', 'Isolation',
      'Patching', 'Monitoring', 'Least privilege', 'Configuration enforcement', 'Decommissioning', 'Hardening techniques',
      'Installation of endpoint protection', 'Host-based firewall', 'Host-based intrusion prevention system (HIPS)',
      'Disabling ports/protocols', 'Default password changes', 'Removal of unnecessary software'
    ],
    '3.0 Security Architecture': [
      // 3.1 Compare and contrast security implications of different architecture models
      'Architecture and infrastructure concepts', 'Cloud', 'Responsibility matrix', 'Hybrid considerations', 'Third-party vendors',
      'Infrastructure as code (IaC)', 'Serverless', 'Microservices', 'Network infrastructure', 'Physical isolation', 'Air-gapped',
      'Logical segmentation', 'Software-defined networking (SDN)', 'On-premises', 'Centralized vs. decentralized', 'Containerization',
      'Virtualization', 'IoT', 'Industrial control systems (ICS)', 'Supervisory control and data acquisition (SCADA)',
      'Real-time operating system (RTOS)', 'Embedded systems', 'High availability', 'Availability', 'Resilience', 'Cost',
      'Responsiveness', 'Scalability', 'Ease of deployment', 'Risk transference', 'Ease of recovery', 'Patch availability',
      'Inability to patch', 'Power', 'Compute',
      // 3.2 Given a scenario, apply security principles to secure enterprise infrastructure
      'Infrastructure considerations', 'Device placement', 'Security zones', 'Attack surface', 'Connectivity', 'Failure modes',
      'Fail-open', 'Fail-closed', 'Device attribute', 'Active vs. passive', 'Inline vs. tap/monitor', 'Network appliances',
      'Jump server', 'Proxy server', 'Intrusion prevention system (IPS)', 'Intrusion detection system (IDS)', 'Load balancer',
      'Sensors', 'Port security', '802.1X', 'Extensible Authentication Protocol (EAP)', 'Firewall types',
      'Web application firewall (WAF)', 'Unified threat management (UTM)', 'Next-generation firewall (NGFW)', 'Layer 4/Layer 7',
      'Secure communication/access', 'Virtual private network (VPN)', 'Remote access', 'Tunneling',
      'Transport Layer Security (TLS)', 'Internet protocol security (IPSec)', 'Software-defined wide area network (SD-WAN)',
      'Secure access service edge (SASE)', 'Selection of effective controls',
      // 3.3 Compare and contrast concepts and strategies to protect data
      'Data types', 'Regulated', 'Trade secret', 'Intellectual property', 'Legal information', 'Financial information',
      'Human- and non-human-readable', 'Data classifications', 'Sensitive', 'Confidential', 'Public', 'Restricted', 'Private',
      'Critical', 'General data considerations', 'Data states', 'Data at rest', 'Data in transit', 'Data in use',
      'Data sovereignty', 'Geolocation', 'Methods to secure data', 'Geographic restrictions', 'Hashing', 'Masking',
      'Obfuscation', 'Permission restrictions',
      // 3.4 Explain the importance of resilience and recovery in security architecture
      'Load balancing vs. clustering', 'Site considerations', 'Hot', 'Cold', 'Warm', 'Geographic dispersion', 'Platform diversity',
      'Multi-cloud systems', 'Continuity of operations', 'Capacity planning', 'People', 'Technology', 'Infrastructure', 'Testing',
      'Tabletop exercises', 'Fail over', 'Simulation', 'Parallel processing', 'Backups', 'Onsite/offsite', 'Frequency',
      'Snapshots', 'Recovery', 'Replication', 'Journaling', 'Generators', 'Uninterruptible power supply (UPS)'
    ],
    '4.0 Security Operations': [
      // 4.1 Given a scenario, apply common security techniques to computing resources
      'Secure baselines', 'Establish', 'Deploy', 'Maintain', 'Hardening targets', 'Mobile devices', 'Workstations', 'Switches',
      'Routers', 'Cloud infrastructure', 'Servers', 'ICS/SCADA', 'Embedded systems', 'RTOS', 'IoT devices', 'Wireless devices',
      'Installation considerations', 'Site surveys', 'Heat maps', 'Mobile solutions', 'Mobile device management (MDM)',
      'Deployment models', 'Bring your own device (BYOD)', 'Corporate-owned, personally enabled (COPE)', 'Choose your own device (CYOD)',
      'Connection methods', 'Cellular', 'Wi-Fi', 'Bluetooth', 'Wireless security settings', 'Wi-Fi Protected Access 3 (WPA3)',
      'AAA/Remote Authentication Dial-In User Service (RADIUS)', 'Cryptographic protocols', 'Authentication protocols',
      'Application security', 'Input validation', 'Secure cookies', 'Static code analysis', 'Code signing', 'Sandboxing',
      // 4.2 Explain the security implications of proper hardware, software, and data asset management
      'Acquisition/procurement process', 'Assignment/accounting', 'Ownership', 'Classification', 'Monitoring/asset tracking',
      'Inventory', 'Enumeration', 'Disposal/decommissioning', 'Sanitization', 'Destruction', 'Certification', 'Data retention',
      // 4.3 Explain various activities associated with vulnerability management
      'Identification methods', 'Vulnerability scan', 'Static analysis', 'Dynamic analysis', 'Package monitoring', 'Threat feed',
      'Open-source intelligence (OSINT)', 'Proprietary/third-party', 'Information-sharing organization', 'Dark web',
      'Penetration testing', 'Responsible disclosure program', 'Bug bounty program', 'System/process audit', 'Analysis',
      'Confirmation', 'False positive', 'False negative', 'Prioritize', 'Common Vulnerability Scoring System (CVSS)',
      'Common Vulnerability Enumeration (CVE)', 'Vulnerability classification', 'Exposure factor', 'Environmental variables',
      'Industry/organizational impact', 'Risk tolerance', 'Vulnerability response and remediation', 'Insurance',
      'Compensating controls', 'Exceptions and exemptions', 'Validation of remediation', 'Rescanning', 'Audit', 'Verification',
      'Reporting',
      // 4.4 Explain security alerting and monitoring concepts and tools
      'Monitoring computing resources', 'Systems', 'Applications', 'Infrastructure', 'Activities', 'Log aggregation', 'Alerting',
      'Scanning', 'Archiving', 'Alert response and remediation/validation', 'Quarantine', 'Alert tuning', 'Tools',
      'Security Content Automation Protocol (SCAP)', 'Benchmarks', 'Agents/agentless',
      'Security information and event management (SIEM)', 'Antivirus', 'Data loss prevention (DLP)',
      'Simple Network Management Protocol (SNMP) traps', 'NetFlow', 'Vulnerability scanners',
      // 4.5 Given a scenario, modify enterprise capabilities to enhance security
      'Firewall', 'Rules', 'Access lists', 'Ports/protocols', 'Screened subnets', 'IDS/IPS', 'Trends', 'Signatures', 'Web filter',
      'Agent-based', 'Centralized proxy', 'Universal Resource Locator (URL) scanning', 'Content categorization', 'Block rules',
      'Reputation', 'Operating system security', 'Group Policy', 'SELinux', 'Implementation of secure protocols',
      'Protocol selection', 'Port selection', 'Transport method', 'DNS filtering', 'Email security',
      'Domain-based Message Authentication Reporting and Conformance (DMARC)', 'DomainKeys Identified Mail (DKIM)',
      'Sender Policy Framework (SPF)', 'Gateway', 'File integrity monitoring', 'Network access control (NAC)',
      'Endpoint detection and response (EDR)', 'Extended detection and response (XDR)', 'User behavior analytics',
      // 4.6 Given a scenario, implement and maintain identity and access management
      'Provisioning/de-provisioning user accounts', 'Permission assignments and implications', 'Identity proofing', 'Federation',
      'Single sign-on (SSO)', 'Lightweight Directory Access Protocol (LDAP)', 'Open authorization (OAuth)',
      'Security Assertions Markup Language (SAML)', 'Interoperability', 'Attestation', 'Access controls', 'Mandatory',
      'Discretionary', 'Role-based', 'Rule-based', 'Attribute-based', 'Time-of-day restrictions', 'Least privilege',
      'Multifactor authentication', 'Implementations', 'Biometrics', 'Hard/soft authentication tokens', 'Security keys', 'Factors',
      'Something you know', 'Something you have', 'Something you are', 'Somewhere you are', 'Password concepts',
      'Password best practices', 'Length', 'Complexity', 'Reuse', 'Expiration', 'Age', 'Password managers', 'Passwordless',
      'Privileged access management tools', 'Just-in-time permissions', 'Password vaulting', 'Ephemeral credentials',
      // 4.7 Explain the importance of automation and orchestration related to secure operations
      'Use cases of automation and scripting', 'User provisioning', 'Resource provisioning', 'Guard rails', 'Security groups',
      'Ticket creation', 'Escalation', 'Enabling/disabling services and access', 'Continuous integration and testing',
      'Integrations and Application programming interfaces (APIs)', 'Benefits', 'Efficiency/time saving', 'Enforcing baselines',
      'Standard infrastructure configurations', 'Scaling in a secure manner', 'Employee retention', 'Reaction time',
      'Workforce multiplier', 'Other considerations', 'Complexity', 'Single point of failure', 'Technical debt',
      'Ongoing supportability',
      // 4.8 Explain appropriate incident response activities
      'Process', 'Preparation', 'Detection', 'Analysis', 'Containment', 'Eradication', 'Recovery', 'Lessons learned', 'Training',
      'Root cause analysis', 'Threat hunting', 'Digital forensics', 'Legal hold', 'Chain of custody', 'Acquisition',
      'Preservation', 'E-discovery',
      // 4.9 Given a scenario, use data sources to support an investigation
      'Log data', 'Firewall logs', 'Application logs', 'Endpoint logs', 'OS-specific security logs', 'IPS/IDS logs',
      'Network logs', 'Metadata', 'Data sources', 'Vulnerability scans', 'Automated reports', 'Dashboards', 'Packet captures'
    ],
    '5.0 Security Program Management and Oversight': [
      // 5.1 Summarize elements of effective security governance
      'Guidelines', 'Policies', 'Acceptable use policy (AUP)', 'Information security policies', 'Business continuity',
      'Disaster recovery', 'Incident response', 'Software development lifecycle (SDLC)', 'Change management', 'Standards',
      'Password', 'Access control', 'Physical security', 'Procedures', 'Onboarding/offboarding', 'Playbooks',
      'External considerations', 'Regulatory', 'Legal', 'Industry', 'Local/regional', 'National', 'Global',
      'Monitoring and revision', 'Types of governance structures', 'Boards', 'Committees', 'Government entities',
      'Centralized/decentralized', 'Roles and responsibilities for systems and data', 'Owners', 'Controllers', 'Processors',
      'Custodians/stewards',
      // 5.2 Explain elements of the risk management process
      'Risk identification', 'Risk assessment', 'Ad hoc', 'Recurring', 'One-time', 'Continuous', 'Risk analysis', 'Qualitative',
      'Quantitative', 'Single loss expectancy (SLE)', 'Annualized loss expectancy (ALE)', 'Annualized rate of occurrence (ARO)',
      'Probability', 'Likelihood', 'Impact', 'Risk register', 'Key risk indicators', 'Risk owners', 'Risk threshold',
      'Risk tolerance', 'Risk appetite', 'Expansionary', 'Conservative', 'Neutral', 'Risk management strategies', 'Transfer',
      'Accept', 'Exemption', 'Exception', 'Avoid', 'Mitigate', 'Risk reporting', 'Business impact analysis',
      'Recovery time objective (RTO)', 'Recovery point objective (RPO)', 'Mean time to repair (MTTR)',
      'Mean time between failures (MTBF)',
      // 5.3 Explain the processes associated with third-party risk assessment and management
      'Vendor assessment', 'Right-to-audit clause', 'Evidence of internal audits', 'Independent assessments',
      'Supply chain analysis', 'Vendor selection', 'Due diligence', 'Conflict of interest', 'Agreement types',
      'Service-level agreement (SLA)', 'Memorandum of agreement (MOA)', 'Memorandum of understanding (MOU)',
      'Master service agreement (MSA)', 'Work order (WO)', 'Statement of work (SOW)', 'Non-disclosure agreement (NDA)',
      'Business partners agreement (BPA)', 'Vendor monitoring', 'Questionnaires', 'Rules of engagement',
      // 5.4 Summarize elements of effective security compliance
      'Compliance reporting', 'Internal', 'External', 'Consequences of non-compliance', 'Fines', 'Sanctions',
      'Reputational damage', 'Loss of license', 'Contractual impacts', 'Compliance monitoring', 'Due diligence/care',
      'Attestation and acknowledgement', 'Internal and external', 'Privacy', 'Legal implications', 'Data subject',
      'Controller vs. processor', 'Ownership', 'Data inventory and retention', 'Right to be forgotten',
      // 5.5 Explain types and purposes of audits and assessments
      'Attestation', 'Compliance', 'Audit committee', 'Self-assessments', 'Examinations', 'Assessment',
      'Independent third-party audit', 'Physical', 'Offensive', 'Defensive', 'Integrated', 'Known environment',
      'Partially known environment', 'Unknown environment', 'Reconnaissance', 'Passive', 'Active',
      // 5.6 Given a scenario, implement security awareness practices
      'Phishing', 'Campaigns', 'Recognizing a phishing attempt', 'Responding to reported suspicious messages',
      'Anomalous behavior recognition', 'Risky', 'Unexpected', 'Unintentional', 'User guidance and training',
      'Policy/handbooks', 'Situational awareness', 'Insider threat', 'Password management', 'Removable media and cables',
      'Social engineering', 'Operational security', 'Hybrid/remote work environments', 'Reporting and monitoring', 'Initial',
      'Recurring', 'Development', 'Execution'
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
      } else {
        // Topic exists in user data but not in our master list - add it
        topicCoverageData[domain].push({
          topicName: topicPerf.topicName,
          count: topicPerf.questionsAnswered,
          accuracy: Math.round(topicPerf.accuracy)
        });
      }
    }
  });

  return (
    <div className="space-y-8">
      {/* Phase 1 Warning if insufficient data */}
      {!hasSufficientQuestions && (
        <div className="bg-yellow-900/20 border border-yellow-700/50 rounded-lg p-4">
          <p className="text-yellow-400 text-sm">
            <strong>Preliminary Estimates:</strong> Answer at least 15 questions for reliable IRT analysis.
            Current progress: {userProgress.totalQuestions}/15 questions
          </p>
        </div>
      )}

      {/* Graph 1: Ability Level Over Time */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <h3 className="text-xl font-bold text-white mb-4">Ability Level Over Time</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={abilityOverTime}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="quiz" stroke="#9CA3AF" />
            <YAxis domain={[-3, 3]} stroke="#9CA3AF" />
            <Tooltip
              contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
              labelStyle={{ color: '#F3F4F6' }}
              itemStyle={{ color: '#60A5FA' }}
            />
            <ReferenceLine y={0} stroke="#6B7280" strokeDasharray="3 3" label={{ value: 'Average', fill: '#9CA3AF' }} />
            <ReferenceLine y={1} stroke="#10B981" strokeDasharray="3 3" label={{ value: 'Target', fill: '#10B981' }} />
            <Line type="monotone" dataKey="ability" stroke="#60A5FA" strokeWidth={2} dot={{ fill: '#60A5FA', r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
        <p className="text-gray-400 text-sm mt-2">Your ability estimate (θ) ranges from -3 (beginner) to +3 (expert)</p>
      </div>

      {/* Graph 2: Predicted Score Over Time */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <h3 className="text-xl font-bold text-white mb-4">Predicted Score Over Time</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={scoreOverTime}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="quiz" stroke="#9CA3AF" />
            <YAxis domain={[100, 900]} stroke="#9CA3AF" />
            <Tooltip
              contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
              labelStyle={{ color: '#F3F4F6' }}
              itemStyle={{ color: '#10B981' }}
            />
            <ReferenceLine y={750} stroke="#10B981" strokeDasharray="3 3" label={{ value: 'Passing', fill: '#10B981', position: 'right' }} />
            <Line type="monotone" dataKey="score" stroke="#10B981" strokeWidth={2} dot={{ fill: '#10B981', r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
        <p className="text-gray-400 text-sm mt-2">Predicted Security+ exam score (750 required to pass)</p>
      </div>

      {/* Graph 3: Accuracy by Difficulty */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <h3 className="text-xl font-bold text-white mb-4">Accuracy by Difficulty Level</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={accuracyByDifficulty}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="difficulty" stroke="#9CA3AF" />
            <YAxis domain={[0, 100]} stroke="#9CA3AF" label={{ value: '% Correct', angle: -90, position: 'insideLeft', fill: '#9CA3AF' }} />
            <Tooltip
              contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
              labelStyle={{ color: '#F3F4F6' }}
              formatter={(value: any, name: string, props: any) => {
                if (name === 'accuracy') {
                  return [`${value}% (${props.payload.questions} questions)`, 'Accuracy'];
                }
                return [value, name];
              }}
            />
            <Bar dataKey="accuracy" fill="#60A5FA" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
        <p className="text-gray-400 text-sm mt-2">Performance breakdown by question difficulty</p>
      </div>

      {/* Graph 4: Topic Performance by Domain */}
      {domainPerformance.length > 0 && (
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h3 className="text-xl font-bold text-white mb-4">Performance by SY0-701 Domain</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={domainPerformance} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis type="number" domain={[0, 100]} stroke="#9CA3AF" label={{ value: '% Correct', position: 'insideBottom', offset: -5, fill: '#9CA3AF' }} />
              <YAxis type="category" dataKey="domain" stroke="#9CA3AF" width={200} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
                labelStyle={{ color: '#F3F4F6' }}
                formatter={(value: any, name: string, props: any) => {
                  if (name === 'accuracy') {
                    return [`${value}% (${props.payload.questions} questions)`, 'Accuracy'];
                  }
                  return [value, name];
                }}
              />
              <Bar dataKey="accuracy" fill="#10B981" radius={[0, 8, 8, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <p className="text-gray-400 text-sm mt-2">Coverage across the 5 Security+ SY0-701 domains</p>
        </div>
      )}

      {/* Graph 5: Questions Answered Over Time */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <h3 className="text-xl font-bold text-white mb-4">Study Volume Over Time</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={questionsOverTime}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="quiz" stroke="#9CA3AF" />
            <YAxis stroke="#9CA3AF" label={{ value: 'Total Questions', angle: -90, position: 'insideLeft', fill: '#9CA3AF' }} />
            <Tooltip
              contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
              labelStyle={{ color: '#F3F4F6' }}
              itemStyle={{ color: '#A78BFA' }}
            />
            <Line type="monotone" dataKey="total" stroke="#A78BFA" strokeWidth={2} dot={{ fill: '#A78BFA', r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
        <p className="text-gray-400 text-sm mt-2">Cumulative questions answered across all quiz sessions</p>
      </div>

      {/* Topic Coverage Tables by Domain */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <h3 className="text-xl font-bold text-white mb-4">Topic Coverage by Domain</h3>
        <p className="text-gray-400 text-sm mb-6">All Security+ SY0-701 topics organized by domain, showing coverage frequency</p>

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
                <div key={domain} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-lg font-semibold text-blue-400">
                      {domainNum} {domainName}
                    </h4>
                    <span className="text-sm text-gray-400">
                      {totalCovered} of {totalTopics} topics covered
                    </span>
                  </div>

                  <div className="border border-gray-700 rounded-lg overflow-hidden">
                    <div className="max-h-96 overflow-y-auto">
                      <table className="w-full">
                        <thead className="bg-gray-900 sticky top-0">
                          <tr>
                            <th className="text-left px-4 py-3 text-sm font-semibold text-gray-300 w-3/5">Topic</th>
                            <th className="text-center px-4 py-3 text-sm font-semibold text-gray-300 w-1/5">Times Covered</th>
                            <th className="text-center px-4 py-3 text-sm font-semibold text-gray-300 w-1/5">Accuracy</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-700">
                          {topics.map((topic, index) => (
                            <tr
                              key={index}
                              className={`${
                                topic.count > 0 ? 'bg-gray-800' : 'bg-gray-850'
                              } hover:bg-gray-750 transition-colors`}
                            >
                              <td className="px-4 py-2 text-sm text-gray-300">{topic.topicName}</td>
                              <td className={`px-4 py-2 text-sm text-center font-medium ${
                                topic.count === 0 ? 'text-gray-500' : 'text-blue-400'
                              }`}>
                                {topic.count}
                              </td>
                              <td className={`px-4 py-2 text-sm text-center font-medium ${
                                topic.count === 0
                                  ? 'text-gray-500'
                                  : topic.accuracy >= 80
                                  ? 'text-green-400'
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
