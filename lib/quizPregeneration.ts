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
    'Bollards', 'Access control vestibule', 'Fencing', 'Video surveillance', 'Security guard', 'Access badge', 'Lighting',
    'Infrared sensor', 'Pressure sensor', 'Microwave sensor', 'Ultrasonic sensor',
    'Honeypot', 'Honeynet', 'Honeyfile', 'Honeytoken',
    // From 1.3 - Change Management
    'Approval process', 'Ownership (change management)', 'Stakeholders', 'Impact analysis', 'Test results', 'Backout plan',
    'Maintenance window', 'Standard operating procedure',
    'Allow lists (change management)', 'Deny lists (change management)', 'Restricted activities',
    'Downtime', 'Service restart', 'Application restart', 'Legacy applications', 'Dependencies',
    'Updating diagrams', 'Updating policies/procedures', 'Version control',
    // From 1.4 - Cryptographic Solutions
    'Public key infrastructure (PKI)', 'Public key', 'Private key', 'Key escrow',
    'Full-disk (encryption level)', 'Partition (encryption level)', 'File (encryption level)', 'Volume (encryption level)',
    'Database (encryption level)', 'Record (encryption level)', 'Transport/communication (encryption)',
    'Asymmetric', 'Symmetric', 'Key exchange', 'Algorithms', 'Key length',
    'Trusted Platform Module (TPM)', 'Hardware security module (HSM)', 'Key management system', 'Secure enclave',
    'Steganography', 'Tokenization', 'Data masking', 'Hashing', 'Salting', 'Digital signatures', 'Key stretching',
    'Blockchain', 'Open public ledger',
    'Certificate authorities', 'Certificate revocation lists (CRLs)', 'Online Certificate Status Protocol (OCSP)',
    'Self-signed', 'Third-party (certificates)', 'Root of trust', 'Certificate signing request (CSR) generation', 'Wildcard'
  ],
  '2.0 Threats, Vulnerabilities, and Mitigations': [
    // From 2.1 - Threat Actors and Motivations
    'Nation-state', 'Unskilled attacker', 'Hacktivist', 'Insider threat (actor)', 'Organized crime', 'Shadow IT',
    'Internal/external (threat actor attribute)', 'Resources/funding', 'Level of sophistication/capability',
    'Data exfiltration', 'Espionage', 'Service disruption', 'Blackmail', 'Financial gain',
    'Philosophical/political beliefs', 'Ethical', 'Revenge', 'Disruption/chaos', 'War',
    // From 2.2 - Threat Vectors and Attack Surfaces
    'Email (message-based)', 'Short Message Service (SMS)', 'Instant messaging (IM)', 'Image-based', 'File-based', 'Voice call',
    'Removable device', 'Unsecure networks', 'Wireless', 'Wired', 'Bluetooth',
    'Open service ports', 'Default credentials', 'Supply chain (attack surface)',
    'Managed service providers (MSPs)', 'Vendors (supply chain)', 'Suppliers',
    'Phishing', 'Vishing', 'Smishing', 'Misinformation/disinformation', 'Impersonation', 'Business email compromise',
    'Pretexting', 'Watering hole', 'Brand impersonation', 'Typosquatting',
    // From 2.3 - Vulnerabilities
    'Memory injection', 'Buffer overflow', 'Race conditions', 'Time-of-check (TOC)', 'Time-of-use (TOU)',
    'Malicious update', 'Operating system (OS)-based', 'Structured Query Language injection (SQLi)',
    'Cross-site scripting (XSS)',
    'Firmware (vulnerability)', 'End-of-life', 'Legacy (vulnerability)',
    'Virtualization (vulnerability)', 'Virtual machine (VM) escape', 'Resource reuse',
    'Cloud-specific (vulnerability)',
    'Cryptographic (vulnerability)', 'Misconfiguration', 'Mobile device (vulnerability)',
    'Side loading', 'Jailbreaking', 'Zero-day',
    // From 2.4 - Indicators of Malicious Activity
    'Ransomware', 'Trojan', 'Worm', 'Spyware', 'Bloatware', 'Virus', 'Keylogger', 'Logic bomb', 'Rootkit',
    'Brute force', 'Radio frequency identification (RFID) cloning', 'Environmental (attack)',
    'Distributed denial-of-service (DDoS)', 'Amplified (DDoS)', 'Reflected (DDoS)',
    'Domain Name System (DNS) attacks',
    'On-path attack', 'Credential replay', 'Malicious code',
    'Injection (application attack)', 'Replay (application attack)', 'Privilege escalation',
    'Forgery', 'Directory traversal',
    'Downgrade (cryptographic attack)', 'Collision (cryptographic attack)', 'Birthday (cryptographic attack)',
    'Spraying (password attack)', 'Brute force (password attack)',
    'Account lockout (indicator)', 'Concurrent session usage', 'Blocked content', 'Impossible travel',
    'Resource consumption', 'Resource inaccessibility',
    'Out-of-cycle logging', 'Published/documented (logs)', 'Missing logs',
    // From 2.5 - Mitigation Techniques
    'Segmentation (mitigation)',
    'Access control (mitigation)', 'Access control list (ACL)', 'Permissions (mitigation)',
    'Application allow list', 'Isolation',
    'Patching', 'Encryption (mitigation)', 'Monitoring (mitigation)', 'Least privilege (mitigation)',
    'Configuration enforcement', 'Decommissioning',
    'Installation of endpoint protection', 'Host-based firewall', 'Host-based intrusion prevention system (HIPS)',
    'Disabling ports/protocols', 'Default password changes', 'Removal of unnecessary software'
  ],
  '3.0 Security Architecture': [
    // From 3.1 - Architecture Models
    'Cloud (architecture)', 'Responsibility matrix (cloud)', 'Hybrid considerations (cloud)', 'Third-party vendors (cloud)',
    'Infrastructure as code (IaC)', 'Serverless', 'Microservices',
    'Physical isolation', 'Air-gapped', 'Logical segmentation', 'Software-defined networking (SDN)',
    'On-premises', 'Centralized vs. decentralized (architecture)', 'Containerization', 'Virtualization (architecture)',
    'IoT', 'Industrial control systems (ICS)', 'Supervisory control and data acquisition (SCADA)',
    'Real-time operating system (RTOS)', 'Embedded systems (architecture)',
    'High availability', 'Availability (architecture)', 'Resilience', 'Cost (consideration)',
    'Responsiveness', 'Scalability', 'Ease of deployment', 'Risk transference', 'Ease of recovery', 'Patch availability',
    'Inability to patch', 'Power (consideration)', 'Compute',
    // From 3.2 - Enterprise Infrastructure
    'Device placement', 'Security zones', 'Attack surface (infrastructure)', 'Connectivity', 'Failure modes',
    'Fail-open', 'Fail-closed',
    'Active vs. passive (device attribute)', 'Inline vs. tap/monitor',
    'Jump server', 'Proxy server', 'Intrusion prevention system (IPS)', 'Intrusion detection system (IDS)',
    'Load balancer', 'Sensors (network appliance)',
    'Port security', '802.1X', 'Extensible Authentication Protocol (EAP)',
    'Web application firewall (WAF)', 'Unified threat management (UTM)', 'Next-generation firewall (NGFW)', 'Layer 4/Layer 7',
    'Virtual private network (VPN)', 'Remote access', 'Tunneling',
    'Transport Layer Security (TLS)', 'Internet protocol security (IPSec)', 'Software-defined wide area network (SD-WAN)',
    'Secure access service edge (SASE)',
    'Selection of effective controls',
    // From 3.3 - Data Protection
    'Regulated', 'Trade secret', 'Intellectual property', 'Legal information', 'Financial information',
    'Human- and non-human-readable',
    'Sensitive', 'Confidential', 'Public', 'Restricted', 'Private', 'Critical',
    'Data at rest', 'Data in transit', 'Data in use',
    'Data sovereignty', 'Geolocation',
    'Geographic restrictions', 'Encryption (data protection)', 'Hashing (data protection)', 'Masking (data protection)',
    'Tokenization (data protection)', 'Obfuscation', 'Segmentation (data protection)', 'Permission restrictions',
    // From 3.4 - Resilience and Recovery
    'Load balancing vs. clustering',
    'Hot site', 'Cold site', 'Warm site',
    'Geographic dispersion', 'Platform diversity', 'Multi-cloud systems', 'Continuity of operations',
    'People (capacity planning)', 'Technology (capacity planning)', 'Infrastructure (capacity planning)',
    'Tabletop exercises (resilience)', 'Fail over', 'Simulation (resilience)', 'Parallel processing',
    'Onsite/offsite (backups)', 'Frequency (backups)', 'Encryption (backups)', 'Snapshots', 'Recovery (backups)',
    'Replication', 'Journaling',
    'Generators', 'Uninterruptible power supply (UPS)'
  ],
  '4.0 Security Operations': [
    // From 4.1 - Security Techniques for Computing Resources
    'Establish (secure baseline)', 'Deploy (secure baseline)', 'Maintain (secure baseline)',
    'Mobile devices (hardening)', 'Workstations (hardening)', 'Switches (hardening)', 'Routers (hardening)',
    'Cloud infrastructure (hardening)', 'Servers (hardening)', 'ICS/SCADA (hardening)',
    'Embedded systems (hardening)', 'RTOS (hardening)', 'IoT devices (hardening)',
    'Wireless devices (hardening)',
    'Site surveys', 'Heat maps',
    'Mobile device management (MDM)', 'Deployment models',
    'Bring your own device (BYOD)', 'Corporate-owned, personally enabled (COPE)', 'Choose your own device (CYOD)',
    'Cellular', 'Wi-Fi', 'Bluetooth (connection method)',
    'Wi-Fi Protected Access 3 (WPA3)', 'AAA/Remote Authentication Dial-In User Service (RADIUS)',
    'Cryptographic protocols', 'Authentication protocols',
    'Input validation', 'Secure cookies', 'Static code analysis', 'Code signing', 'Sandboxing',
    // From 4.2 - Asset Management
    'Acquisition/procurement process', 'Assignment/accounting', 'Ownership (asset management)', 'Classification (asset management)',
    'Monitoring/asset tracking', 'Inventory', 'Enumeration',
    'Disposal/decommissioning', 'Sanitization', 'Destruction', 'Certification (disposal)', 'Data retention',
    // From 4.3 - Vulnerability Management
    'Vulnerability scan', 'Application security (testing)', 'Static analysis (testing)', 'Dynamic analysis (testing)',
    'Package monitoring', 'Threat feed', 'Open-source intelligence (OSINT)', 'Proprietary/third-party (threat feed)',
    'Information-sharing organization', 'Dark web',
    'Penetration testing (vulnerability management)', 'Responsible disclosure program', 'Bug bounty program', 'System/process audit',
    'Confirmation', 'False positive', 'False negative',
    'Common Vulnerability Scoring System (CVSS)', 'Common Vulnerability Enumeration (CVE)', 'Vulnerability classification',
    'Exposure factor (vulnerability)', 'Environmental variables', 'Industry/organizational impact', 'Risk tolerance (vulnerability)',
    'Patching (remediation)', 'Insurance', 'Segmentation (remediation)', 'Compensating controls (vulnerability)',
    'Exceptions and exemptions (vulnerability)',
    'Rescanning', 'Audit (validation)', 'Verification', 'Reporting (validation)',
    // From 4.4 - Alerting and Monitoring
    'Systems (monitoring)', 'Applications (monitoring)', 'Infrastructure (monitoring)',
    'Log aggregation', 'Alerting', 'Scanning (monitoring activity)', 'Reporting (monitoring activity)', 'Archiving',
    'Quarantine (alert response)', 'Alert tuning',
    'Security Content Automation Protocol (SCAP)', 'Benchmarks', 'Agents/agentless (monitoring)',
    'Security information and event management (SIEM)', 'Antivirus', 'Data loss prevention (DLP)',
    'Simple Network Management Protocol (SNMP) traps', 'NetFlow', 'Vulnerability scanners',
    // From 4.5 - Enterprise Capabilities
    'Firewall rules', 'Access lists (firewall)', 'Ports/protocols (firewall)', 'Screened subnets',
    'IDS/IPS trends', 'Signatures (IDS/IPS)',
    'Agent-based (web filter)', 'Centralized proxy', 'Universal Resource Locator (URL) scanning',
    'Content categorization', 'Block rules (web filter)', 'Reputation (web filter)',
    'Group Policy', 'SELinux',
    'Protocol selection', 'Port selection (secure protocols)', 'Transport method',
    'DNS filtering',
    'Domain-based Message Authentication Reporting and Conformance (DMARC)', 'DomainKeys Identified Mail (DKIM)',
    'Sender Policy Framework (SPF)', 'Gateway (email security)',
    'File integrity monitoring', 'Data loss prevention (DLP operations)', 'Network access control (NAC)',
    'Endpoint detection and response (EDR)', 'Extended detection and response (XDR)', 'User behavior analytics',
    // From 4.6 - Identity and Access Management
    'Provisioning/de-provisioning user accounts', 'Permission assignments and implications',
    'Identity proofing', 'Federation', 'Single sign-on (SSO)',
    'Lightweight Directory Access Protocol (LDAP)', 'Open authorization (OAuth)',
    'Security Assertions Markup Language (SAML)', 'Interoperability', 'Attestation (identity)',
    'Mandatory (access control)', 'Discretionary (access control)', 'Role-based (access control)',
    'Rule-based (access control)', 'Attribute-based (access control)', 'Time-of-day restrictions',
    'Least privilege (access control)',
    'Biometrics', 'Hard/soft authentication tokens', 'Security keys (MFA)',
    'Something you know', 'Something you have', 'Something you are', 'Somewhere you are',
    'Password length', 'Password complexity', 'Password reuse', 'Password expiration', 'Password age',
    'Password managers', 'Passwordless',
    'Just-in-time permissions', 'Password vaulting', 'Ephemeral credentials',
    // From 4.7 - Automation and Orchestration
    'User provisioning (automation)', 'Resource provisioning (automation)', 'Guard rails',
    'Security groups (automation)', 'Ticket creation (automation)', 'Escalation (automation)',
    'Enabling/disabling services and access', 'Continuous integration and testing',
    'Integrations and Application programming interfaces (APIs)',
    'Efficiency/time saving', 'Enforcing baselines', 'Standard infrastructure configurations',
    'Scaling in a secure manner', 'Employee retention', 'Reaction time', 'Workforce multiplier',
    'Complexity (automation consideration)', 'Cost (automation consideration)', 'Single point of failure',
    'Technical debt', 'Ongoing supportability',
    // From 4.8 - Incident Response
    'Preparation (incident response)', 'Detection (incident response)', 'Analysis (incident response)',
    'Containment', 'Eradication', 'Recovery (incident response)', 'Lessons learned',
    'Training (incident response)', 'Tabletop exercise (incident response)', 'Simulation (incident response)',
    'Root cause analysis', 'Threat hunting',
    'Digital forensics', 'Legal hold', 'Chain of custody', 'Acquisition (forensics)',
    'Reporting (forensics)', 'Preservation (forensics)', 'E-discovery',
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
