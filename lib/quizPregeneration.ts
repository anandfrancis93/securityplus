import {
  UserProgress,
  Question,
  QuestionHistory,
  TopicCoverageStatus,
  CachedQuiz,
  QuizGenerationMetadata,
} from './types';
import { generateSynthesisQuestion, selectAdaptiveDifficulty, selectQuestionType } from './questionGenerator';

// All official Security+ SY0-701 topics organized by domain
const ALL_SECURITY_PLUS_TOPICS: { [domain: string]: string[] } = {
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
    'Client-based vs. agentless', 'Unsupported systems and applications',
    'Wireless', 'Wired', 'Bluetooth', 'Open service ports', 'Default credentials', 'Supply chain',
    'Managed service providers (MSPs)', 'Vendors', 'Suppliers',
    'Phishing', 'Vishing', 'Smishing', 'Misinformation/disinformation', 'Impersonation', 'Business email compromise',
    'Pretexting', 'Watering hole', 'Brand impersonation', 'Typosquatting',
    // 2.3 Explain various types of vulnerabilities
    'Memory injection', 'Buffer overflow', 'Race conditions', 'Time-of-check (TOC)', 'Time-of-use (TOU)',
    'Malicious update', 'Operating system (OS)-based', 'Structured Query Language injection (SQLi)',
    'Cross-site scripting (XSS)', 'Firmware', 'End-of-life', 'Legacy', 'Virtualization',
    'Virtual machine (VM) escape', 'Resource reuse', 'Cloud-specific', 'Service provider', 'Hardware provider',
    'Software provider', 'Cryptographic', 'Misconfiguration', 'Mobile device', 'Side loading', 'Jailbreaking', 'Zero-day',
    // 2.4 Given a scenario, analyze indicators of malicious activity
    'Ransomware', 'Trojan', 'Worm', 'Spyware', 'Bloatware', 'Virus', 'Keylogger', 'Logic bomb', 'Rootkit',
    'Brute force', 'Radio frequency identification (RFID) cloning', 'Environmental',
    'Distributed denial-of-service (DDoS)', 'Amplified', 'Reflected', 'Domain Name System (DNS) attacks',
    'On-path', 'Credential replay', 'Malicious code', 'Application attacks', 'Injection', 'Replay', 'Privilege escalation',
    'Forgery', 'Directory traversal', 'Cryptographic attacks', 'Downgrade', 'Collision', 'Birthday', 'Password attacks',
    'Spraying', 'Account lockout', 'Concurrent session usage', 'Blocked content', 'Impossible travel',
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

/**
 * Get total count of all official Security+ topics
 */
export function getTotalTopicCount(): number {
  return Object.values(ALL_SECURITY_PLUS_TOPICS).reduce((sum, topics) => sum + topics.length, 0);
}

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
      };
    });
  });

  return {
    totalQuizzesCompleted: 0,
    allTopicsCoveredOnce: false,
    questionHistory: {},
    topicCoverage,
  };
}

/**
 * Check if Phase 1 (covering all topics once) is complete
 */
export function isPhase1Complete(metadata: QuizGenerationMetadata): boolean {
  if (metadata.allTopicsCoveredOnce) {
    return true;
  }

  // Check if all topics have been covered at least once
  const allCovered = Object.values(metadata.topicCoverage).every(
    topic => topic.timesCovered > 0
  );

  return allCovered;
}

/**
 * Get list of topics that have never been covered
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

  const phase1Complete = isPhase1Complete(metadata);
  console.log(`Pregenerating quiz ${currentQuizNumber}, Phase 1 complete: ${phase1Complete}`);

  const questions: Question[] = [];
  const QUIZ_LENGTH = 10;

  if (!phase1Complete) {
    // PHASE 1: Prioritize uncovered topics, 100% new questions
    console.log('Phase 1: Generating questions to cover all topics');

    const uncoveredTopics = getUncoveredTopics(metadata);
    console.log(`Uncovered topics remaining: ${uncoveredTopics.length}/${getTotalTopicCount()}`);

    for (let i = 0; i < QUIZ_LENGTH; i++) {
      let question: Question | null = null;
      let attempts = 0;
      const MAX_ATTEMPTS = 5;

      while (!question && attempts < MAX_ATTEMPTS) {
        attempts++;

        // Use adaptive difficulty based on ability
        const difficulty = selectAdaptiveDifficulty(ability);
        const questionType = selectQuestionType();

        // Generate question with preference for uncovered topics
        const suggestedTopics = uncoveredTopics.length > 0
          ? uncoveredTopics.slice(0, 10) // Suggest first 10 uncovered topics
          : [];

        try {
          const generatedQuestion = await generateSynthesisQuestion(
            suggestedTopics, // This will guide AI to focus on these topics
            difficulty,
            questionType
          );

          // Check for duplicate using metadata
          if (generatedQuestion.metadata &&
              !isDuplicateQuestion(generatedQuestion.metadata, metadata.questionHistory)) {
            question = generatedQuestion;
            console.log(`Generated Q${i + 1}: ${difficulty} ${questionType}, Topics: ${generatedQuestion.topics.join(', ')}`);
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
    // PHASE 2: 70% new / 30% repeated (spaced repetition)
    console.log('Phase 2: Generating questions with spaced repetition');

    const newCount = 7; // 70%
    const repeatCount = 3; // 30%

    // Generate 7 new questions
    for (let i = 0; i < newCount; i++) {
      let question: Question | null = null;
      let attempts = 0;
      const MAX_ATTEMPTS = 5;

      while (!question && attempts < MAX_ATTEMPTS) {
        attempts++;

        const difficulty = selectAdaptiveDifficulty(ability);
        const questionType = selectQuestionType();

        try {
          const generatedQuestion = await generateSynthesisQuestion(
            [], // No restrictions on topics in Phase 2
            difficulty,
            questionType
          );

          // Check for duplicate using metadata
          if (generatedQuestion.metadata &&
              !isDuplicateQuestion(generatedQuestion.metadata, metadata.questionHistory)) {
            question = generatedQuestion;
            console.log(`Generated new Q${i + 1}: ${difficulty} ${questionType}`);
          } else {
            console.log(`Duplicate detected, regenerating (attempt ${attempts}/${MAX_ATTEMPTS})`);
          }
        } catch (error) {
          console.error(`Error generating question (attempt ${attempts}/${MAX_ATTEMPTS}):`, error);
        }
      }

      if (question) {
        questions.push(question);
      }
    }

    // Get 3 repeated questions (prioritize wrong answers)
    const eligibleRepeats = getEligibleRepeatQuestions(metadata, currentQuizNumber, true);

    if (eligibleRepeats.length >= repeatCount) {
      console.log(`Adding ${repeatCount} repeated questions from ${eligibleRepeats.length} eligible`);

      // Get the actual Question objects for the top 3 eligible repeats
      // Note: We would need to fetch these from Firebase or reconstruct them
      // For now, we'll just log that we would add them
      // TODO: Implement question retrieval from history
      console.log('Repeated question IDs:', eligibleRepeats.slice(0, repeatCount).map(h => h.questionId));
    } else {
      console.log(`Not enough eligible repeats (${eligibleRepeats.length}), generating more new questions`);

      // Generate additional new questions to make up the difference
      const additionalNew = repeatCount - eligibleRepeats.length;
      for (let i = 0; i < additionalNew; i++) {
        const difficulty = selectAdaptiveDifficulty(ability);
        const questionType = selectQuestionType();

        try {
          const question = await generateSynthesisQuestion([], difficulty, questionType);
          if (question.metadata && !isDuplicateQuestion(question.metadata, metadata.questionHistory)) {
            questions.push(question);
            console.log(`Generated additional new Q${newCount + i + 1}: ${difficulty} ${questionType}`);
          }
        } catch (error) {
          console.error(`Error generating additional question:`, error);
        }
      }
    }
  }

  // Shuffle questions to randomize order
  const shuffled = questions.sort(() => Math.random() - 0.5);

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

  // Update question history
  completedQuestions.forEach(({ questionId, question, isCorrect }) => {
    if (!updatedMetadata.questionHistory[questionId]) {
      // New question
      updatedMetadata.questionHistory[questionId] = {
        questionId,
        metadata: question.metadata,
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
