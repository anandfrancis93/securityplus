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

  // All Security+ SY0-701 Topics organized by domain
  const allTopicsByDomain: { [domain: string]: string[] } = {
    '1.0 General Security Concepts': [
      'Security Controls', 'Technical Controls', 'Managerial Controls', 'Operational Controls', 'Physical Controls',
      'Preventive Controls', 'Deterrent Controls', 'Detective Controls', 'Corrective Controls', 'Compensating Controls',
      'CIA Triad', 'Confidentiality', 'Integrity', 'Availability', 'Non-repudiation',
      'Authentication', 'Authorization', 'Accounting', 'AAA Framework',
      'Zero Trust', 'Adaptive Identity', 'Threat Scope Reduction', 'Policy-driven Access Control',
      'Control Plane', 'Data Plane', 'Policy Enforcement Point',
      'Physical Security', 'Bollards', 'Access Control Vestibule', 'Fencing', 'Video Surveillance',
      'Security Guard', 'Access Badge', 'Lighting', 'Sensors', 'Infrared', 'Pressure Sensor', 'Microwave', 'Ultrasonic',
      'Honeypot', 'Honeynet', 'Honeyfile', 'Honeytoken', 'Deception Technology',
      'Change Management', 'Approval Process', 'Impact Analysis', 'Backout Plan', 'Maintenance Window',
      'Allow Lists', 'Deny Lists', 'Version Control',
      'PKI', 'Public Key Infrastructure', 'Public Key', 'Private Key', 'Key Escrow',
      'Encryption', 'Full-disk Encryption', 'File Encryption', 'Volume Encryption', 'Database Encryption',
      'Asymmetric Encryption', 'Symmetric Encryption', 'Key Exchange',
      'TPM', 'HSM', 'Key Management', 'Secure Enclave',
      'Obfuscation', 'Steganography', 'Tokenization', 'Data Masking',
      'Hashing', 'Salting', 'Digital Signatures', 'Key Stretching',
      'Blockchain', 'Public Ledger',
      'Certificates', 'Certificate Authority', 'CRL', 'OCSP', 'Self-signed Certificate', 'Root of Trust', 'CSR', 'Wildcard Certificate'
    ],
    '2.0 Threats, Vulnerabilities, and Mitigations': [
      'Threat Actors', 'Nation-state', 'Unskilled Attacker', 'Hacktivist', 'Insider Threat', 'Organized Crime', 'Shadow IT',
      'Threat Motivations', 'Data Exfiltration', 'Espionage', 'Service Disruption', 'Blackmail', 'Financial Gain',
      'Attack Vectors', 'Email', 'SMS', 'Phishing', 'Vishing', 'Smishing',
      'Social Engineering', 'Impersonation', 'Business Email Compromise', 'Pretexting', 'Watering Hole', 'Brand Impersonation', 'Typosquatting',
      'Removable Device', 'Voice Call', 'Instant Messaging',
      'Unsupported Systems', 'Default Credentials', 'Open Service Ports',
      'Supply Chain', 'MSP', 'Vendors', 'Suppliers',
      'Vulnerabilities', 'Buffer Overflow', 'Memory Injection', 'Race Conditions', 'TOC/TOU', 'Malicious Update',
      'SQL Injection', 'SQLi', 'XSS', 'Cross-site Scripting',
      'Firmware Vulnerabilities', 'End-of-life', 'Legacy Systems',
      'VM Escape', 'Resource Reuse', 'Cloud-specific Vulnerabilities',
      'Misconfiguration', 'Zero-day', 'Side Loading', 'Jailbreaking',
      'Malware', 'Ransomware', 'Trojan', 'Worm', 'Spyware', 'Bloatware', 'Virus', 'Keylogger', 'Logic Bomb', 'Rootkit',
      'Physical Attacks', 'Brute Force', 'RFID Cloning',
      'Network Attacks', 'DDoS', 'DNS Attacks', 'Wireless Attacks', 'On-path Attack', 'Credential Replay',
      'Application Attacks', 'Injection Attacks', 'Replay Attack', 'Privilege Escalation', 'Directory Traversal',
      'Cryptographic Attacks', 'Downgrade Attack', 'Collision Attack', 'Birthday Attack',
      'Password Attacks', 'Password Spraying', 'Brute Force Attack',
      'Indicators of Compromise', 'Account Lockout', 'Concurrent Sessions', 'Impossible Travel', 'Resource Consumption',
      'Mitigation Techniques', 'Segmentation', 'Access Control', 'ACL', 'Permissions',
      'Application Allow List', 'Isolation', 'Patching', 'Monitoring', 'Least Privilege',
      'Hardening', 'Endpoint Protection', 'Host-based Firewall', 'HIPS', 'Configuration Enforcement', 'Decommissioning'
    ],
    '3.0 Security Architecture': [
      'Cloud Architecture', 'Responsibility Matrix', 'Hybrid Cloud', 'Third-party Vendors',
      'IaC', 'Infrastructure as Code', 'Serverless', 'Microservices', 'Containerization', 'Virtualization',
      'Network Infrastructure', 'Physical Isolation', 'Air-gapped', 'Logical Segmentation', 'SDN',
      'On-premises', 'Centralized', 'Decentralized',
      'IoT', 'ICS', 'SCADA', 'RTOS', 'Embedded Systems',
      'High Availability', 'Resilience', 'Scalability', 'Risk Transference',
      'Infrastructure Considerations', 'Device Placement', 'Security Zones', 'Attack Surface', 'Connectivity',
      'Failure Modes', 'Fail-open', 'Fail-closed',
      'Active vs Passive', 'Inline', 'Tap', 'Monitor',
      'Network Appliances', 'Jump Server', 'Proxy Server', 'IPS', 'IDS', 'Load Balancer', 'Sensors',
      'Port Security', '802.1X', 'EAP',
      'Firewall', 'WAF', 'UTM', 'NGFW', 'Layer 4 Firewall', 'Layer 7 Firewall',
      'VPN', 'Remote Access', 'Tunneling', 'TLS', 'IPSec', 'SD-WAN', 'SASE',
      'Data Types', 'Regulated Data', 'Trade Secret', 'Intellectual Property', 'Financial Information',
      'Data Classification', 'Sensitive', 'Confidential', 'Public', 'Restricted', 'Private', 'Critical',
      'Data States', 'Data at Rest', 'Data in Transit', 'Data in Use',
      'Data Sovereignty', 'Geolocation',
      'Data Protection', 'Geographic Restrictions', 'Permission Restrictions',
      'Resilience and Recovery', 'Load Balancing', 'Clustering',
      'Site Considerations', 'Hot Site', 'Cold Site', 'Warm Site', 'Geographic Dispersion',
      'Platform Diversity', 'Multi-cloud', 'Continuity of Operations',
      'Capacity Planning', 'Backups', 'Onsite Backup', 'Offsite Backup', 'Snapshots', 'Replication', 'Journaling',
      'Power', 'Generators', 'UPS'
    ],
    '4.0 Security Operations': [
      'Secure Baselines', 'Hardening Targets', 'Mobile Devices', 'Workstations', 'Switches', 'Routers',
      'Cloud Infrastructure', 'Servers', 'Wireless Devices',
      'Mobile Solutions', 'MDM', 'BYOD', 'COPE', 'CYOD',
      'Cellular', 'Wi-Fi', 'Bluetooth',
      'WPA3', 'AAA', 'RADIUS', 'Cryptographic Protocols', 'Authentication Protocols',
      'Application Security', 'Input Validation', 'Secure Cookies', 'Static Code Analysis', 'Code Signing', 'Sandboxing',
      'Asset Management', 'Acquisition', 'Procurement', 'Assignment', 'Ownership Classification',
      'Monitoring', 'Asset Tracking', 'Inventory', 'Enumeration',
      'Disposal', 'Decommissioning', 'Sanitization', 'Destruction', 'Data Retention',
      'Vulnerability Management', 'Vulnerability Scan', 'Dynamic Analysis', 'Package Monitoring',
      'Threat Feed', 'OSINT', 'Information-sharing', 'Dark Web',
      'Penetration Testing', 'Bug Bounty', 'Responsible Disclosure',
      'CVSS', 'CVE', 'Vulnerability Classification', 'Risk Tolerance',
      'Vulnerability Response', 'Compensating Controls', 'Exceptions', 'Exemptions', 'Validation of Remediation',
      'Security Alerting', 'Log Aggregation', 'Alerting', 'Scanning', 'Reporting', 'Archiving',
      'SCAP', 'Benchmarks', 'Agents', 'Agentless', 'SIEM', 'Antivirus', 'DLP', 'SNMP', 'NetFlow',
      'Firewall Rules', 'Access Lists', 'Ports and Protocols', 'Screened Subnets',
      'IDS/IPS Signatures', 'Web Filter', 'URL Scanning', 'Content Categorization', 'Block Rules', 'Reputation',
      'Operating System Security', 'Group Policy', 'SELinux',
      'Secure Protocols', 'Protocol Selection', 'Port Selection', 'Transport Method',
      'DNS Filtering', 'Email Security', 'DMARC', 'DKIM', 'SPF', 'Gateway',
      'File Integrity Monitoring', 'NAC', 'EDR', 'XDR', 'User Behavior Analytics',
      'Identity and Access Management', 'Provisioning', 'De-provisioning', 'Permission Assignments',
      'Identity Proofing', 'Federation', 'Single Sign-on', 'SSO', 'LDAP', 'OAuth', 'SAML',
      'Interoperability', 'Attestation',
      'Access Controls', 'Mandatory Access Control', 'Discretionary Access Control', 'Role-based Access Control',
      'Rule-based Access Control', 'Attribute-based Access Control', 'Time-of-day Restrictions',
      'Multifactor Authentication', 'MFA', 'Biometrics', 'Hard Token', 'Soft Token', 'Security Keys',
      'Password Concepts', 'Password Length', 'Password Complexity', 'Password Reuse', 'Password Expiration',
      'Password Managers', 'Passwordless',
      'Privileged Access Management', 'Just-in-time Permissions', 'Password Vaulting', 'Ephemeral Credentials',
      'Automation', 'Orchestration', 'User Provisioning', 'Resource Provisioning', 'Guard Rails', 'Security Groups',
      'Ticket Creation', 'Escalation', 'Continuous Integration', 'APIs',
      'Incident Response', 'Preparation', 'Detection', 'Analysis', 'Containment', 'Eradication', 'Recovery', 'Lessons Learned',
      'Tabletop Exercise', 'Simulation', 'Root Cause Analysis', 'Threat Hunting',
      'Digital Forensics', 'Legal Hold', 'Chain of Custody', 'Acquisition', 'Preservation', 'E-discovery',
      'Log Data', 'Firewall Logs', 'Application Logs', 'Endpoint Logs', 'OS-specific Logs', 'IPS/IDS Logs', 'Network Logs', 'Metadata',
      'Data Sources', 'Automated Reports', 'Dashboards', 'Packet Captures'
    ],
    '5.0 Security Program Management and Oversight': [
      'Security Governance', 'Guidelines', 'Policies', 'AUP', 'Information Security Policies',
      'Business Continuity', 'Disaster Recovery', 'Incident Response Policy', 'SDLC', 'Change Management Policy',
      'Standards', 'Password Standards', 'Access Control Standards', 'Physical Security Standards', 'Encryption Standards',
      'Procedures', 'Onboarding', 'Offboarding', 'Playbooks',
      'Regulatory', 'Legal', 'Industry Standards', 'Local/Regional', 'National', 'Global',
      'Governance Structures', 'Boards', 'Committees', 'Government Entities',
      'Roles and Responsibilities', 'Owners', 'Controllers', 'Processors', 'Custodians', 'Stewards',
      'Risk Management', 'Risk Identification', 'Risk Assessment', 'Risk Analysis',
      'Qualitative Risk Analysis', 'Quantitative Risk Analysis', 'SLE', 'ALE', 'ARO', 'Exposure Factor',
      'Risk Register', 'Key Risk Indicators', 'Risk Owners', 'Risk Threshold',
      'Risk Tolerance', 'Risk Appetite', 'Risk Transfer', 'Risk Accept', 'Risk Avoid', 'Risk Mitigate',
      'Business Impact Analysis', 'RTO', 'RPO', 'MTTR', 'MTBF',
      'Third-party Risk', 'Vendor Assessment', 'Right-to-audit', 'Internal Audits', 'Independent Assessments',
      'Supply Chain Analysis', 'Vendor Selection', 'Due Diligence', 'Conflict of Interest',
      'Agreement Types', 'SLA', 'MOA', 'MOU', 'MSA', 'WO', 'SOW', 'NDA', 'BPA',
      'Vendor Monitoring', 'Questionnaires', 'Rules of Engagement',
      'Compliance', 'Compliance Reporting', 'Internal Compliance', 'External Compliance',
      'Consequences of Non-compliance', 'Fines', 'Sanctions', 'Reputational Damage', 'Loss of License',
      'Compliance Monitoring', 'Due Care', 'Due Diligence', 'Automation',
      'Privacy', 'Data Subject', 'Controller vs Processor', 'Data Ownership', 'Data Inventory', 'Data Retention', 'Right to be Forgotten',
      'Audits and Assessments', 'Internal Audits', 'Audit Committee', 'Self-assessments',
      'External Audits', 'Regulatory Audits', 'Independent Third-party Audit',
      'Penetration Testing Types', 'Physical Penetration Testing', 'Offensive', 'Defensive', 'Integrated',
      'Known Environment', 'Partially Known Environment', 'Unknown Environment',
      'Reconnaissance', 'Passive Reconnaissance', 'Active Reconnaissance',
      'Security Awareness', 'Phishing Campaigns', 'Recognizing Phishing', 'Reporting Suspicious Messages',
      'Anomalous Behavior', 'Risky Behavior', 'Unexpected Behavior', 'Unintentional Behavior',
      'User Training', 'Policy Handbooks', 'Situational Awareness', 'Insider Threat Awareness',
      'Password Management Training', 'Removable Media', 'Social Engineering Awareness', 'Operational Security',
      'Hybrid Work', 'Remote Work'
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
