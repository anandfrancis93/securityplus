import Anthropic from '@anthropic-ai/sdk';
import { Question } from './types';
import { calculateIRTParameters, categoryToDifficulty } from './irt';
import { ALL_SECURITY_PLUS_TOPICS } from './topicData';
import { getDomainsFromTopics } from './domainDetection';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Shuffle array using Fisher-Yates algorithm
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Extract keywords from a Security+ topic string for matching
 * Examples:
 * - "Structured Query Language injection (SQLi) (web-based vulnerability)"
 *   → ["sql injection", "sqli", "structured query language injection"]
 * - "Annualized loss expectancy (ALE) (risk analysis)"
 *   → ["ale", "annualized loss expectancy", "annual loss expectancy"]
 */
function extractTopicKeywords(topic: string): string[] {
  const keywords: string[] = [];

  // Add the full topic (lowercase)
  keywords.push(topic.toLowerCase());

  // Extract main term (before first parenthesis)
  const mainTerm = topic.split('(')[0].trim().toLowerCase();
  if (mainTerm) {
    keywords.push(mainTerm);
  }

  // Extract acronym from parentheses (if exists)
  const acronymMatch = topic.match(/\(([A-Z]{2,})\)/);
  if (acronymMatch) {
    keywords.push(acronymMatch[1].toLowerCase());
  }

  // Add common variations
  const variations: { [key: string]: string[] } = {
    'probability (risk analysis)': ['probability', 'likelihood', 'chance of'],
    'annualized loss expectancy (ALE) (risk analysis)': ['ale', 'annualized loss expectancy', 'annual loss expectancy'],
    'single loss expectancy (SLE) (risk analysis)': ['sle', 'single loss expectancy'],
    'exposure factor (risk analysis)': ['exposure factor', 'exposure'],
    'structured query language injection (SQLi) (web-based vulnerability)': ['sql injection', 'sqli'],
    'cross-site scripting (XSS) (web-based vulnerability)': ['cross-site scripting', 'xss'],
    'infrastructure as code (IaC) (architecture model)': ['infrastructure as code', 'iac'],
    'mobile device management (MDM) (mobile solution)': ['mobile device management', 'mdm'],
    'unified threat management (UTM) (firewall type)': ['unified threat management', 'utm'],
  };

  const topicLower = topic.toLowerCase();
  for (const [key, values] of Object.entries(variations)) {
    if (topicLower.includes(key.toLowerCase().split('(')[0].trim())) {
      keywords.push(...values);
    }
  }

  return [...new Set(keywords)]; // Remove duplicates
}

/**
 * Check if a topic is mentioned in question text with sufficient presence
 * Requires strong presence to avoid false positives from distractors
 */
function isTopicPresent(
  topic: string,
  questionText: string,
  options: string[],
  explanation: string
): boolean {
  const keywords = extractTopicKeywords(topic);
  const questionLower = questionText.toLowerCase();
  const explanationLower = explanation.toLowerCase();

  // Check if any keyword appears in question or explanation
  const inQuestion = keywords.some(keyword => questionLower.includes(keyword));
  const inExplanation = keywords.some(keyword => explanationLower.includes(keyword));

  if (!inQuestion && !inExplanation) return false;

  // Calculate presence score
  // Higher threshold to prevent false positives
  let presenceScore = 0;

  for (const keyword of keywords) {
    // Question presence = strong signal (concept is being tested)
    if (questionLower.includes(keyword)) presenceScore += 3;

    // Correct answer explanation = strong signal (concept is core to answer)
    if (explanationLower.includes(keyword)) presenceScore += 3;

    // Multiple options mention it = moderate signal
    const optionMatches = options.filter(opt => opt.toLowerCase().includes(keyword)).length;
    if (optionMatches >= 2) presenceScore += 1;
  }

  // Require score of at least 4 (e.g., in question AND explanation, or question with multiple options)
  // This filters out topics only mentioned in passing or in incorrect answer distractors
  return presenceScore >= 4;
}

/**
 * Analyze generated question and extract all Security+ topics actually tested
 * This provides deterministic tagging regardless of what topics were requested
 * Note: Only scans question text, options, and correct answer explanation
 * (incorrectExplanations are ignored as they contain distractor topics)
 */
function analyzeQuestionForTopics(
  questionText: string,
  options: string[],
  explanation: string,
  incorrectExplanations: string[]
): string[] {
  const extractedTopics: string[] = [];

  // Only use correct answer explanation, not incorrect ones (they're distractors)
  // Scan all 400+ topics from authoritative list
  for (const [domain, topics] of Object.entries(ALL_SECURITY_PLUS_TOPICS)) {
    for (const topic of topics) {
      if (isTopicPresent(topic, questionText, options, explanation)) {
        extractedTopics.push(topic);
      }
    }
  }

  // Sanity check: No question should test more than 8 topics
  // If we extracted more, something went wrong (too many false positives)
  if (extractedTopics.length > 8) {
    console.warn(`⚠️ Extracted ${extractedTopics.length} topics (too many!) - likely false positives`);
    console.warn(`   Topics: ${extractedTopics.join(', ')}`);
    // Could implement scoring/ranking here, but for now just warn
  }

  console.log(`Extracted ${extractedTopics.length} topics from generated question`);
  if (extractedTopics.length > 0) {
    console.log(`   Topics: ${extractedTopics.join(', ')}`);
  }

  return extractedTopics;
}

// Shuffle question options to randomize correct answer position
function shuffleQuestionOptions(questionData: any): any {
  // Create array of indices [0, 1, 2, 3]
  const indices = [0, 1, 2, 3];

  // Shuffle indices
  const shuffledIndices = shuffleArray(indices);

  // Reorder options based on shuffled indices
  const shuffledOptions = shuffledIndices.map(i => questionData.options[i]);

  // Find new position of correct answer
  const newCorrectAnswerIndex = shuffledIndices.indexOf(questionData.correctAnswer);

  // Reorder explanations to match new option order
  const shuffledExplanations = shuffledIndices.map(i => questionData.incorrectExplanations[i]);

  return {
    ...questionData,
    options: shuffledOptions,
    correctAnswer: newCorrectAnswerIndex,
    incorrectExplanations: shuffledExplanations
  };
}

const SECURITY_PLUS_TOPICS = `
1.0 General Security Concepts

1.1 Compare and contrast various types of security controls.
- Categories: Technical, Managerial, Operational, Physical
- Control types: Preventive, Deterrent, Detective, Corrective, Compensating, Directive

1.2 Summarize fundamental security concepts.
- Confidentiality, Integrity, and Availability (CIA)
- Non-repudiation
- Authentication, Authorization, and Accounting (AAA)
- Gap analysis
- Zero Trust: Control Plane (Adaptive identity, Threat scope reduction, Policy-driven access control), Data Plane (Implicit trust zones, Policy Enforcement Point)
- Physical security: Bollards, Access control vestibule, Fencing, Video surveillance, Security guard, Access badge, Lighting, Sensors (Infrared, Pressure, Microwave, Ultrasonic)
- Deception and disruption technology: Honeypot, Honeynet, Honeyfile, Honeytoken

1.3 Explain the importance of change management processes and the impact to security.
- Business processes: Approval process, Ownership, Stakeholders, Impact analysis, Test results, Backout plan, Maintenance window, Standard operating procedure
- Technical implications: Allow lists/deny lists, Restricted activities, Downtime, Service restart, Application restart, Legacy applications, Dependencies
- Documentation: Updating diagrams, Updating policies/procedures
- Version control

1.4 Explain the importance of using appropriate cryptographic solutions.
- Public key infrastructure (PKI): Public key, Private key, Key escrow
- Encryption: Full-disk, Partition, File, Volume, Database, Record, Transport/communication, Asymmetric, Symmetric, Key exchange, Algorithms, Key length
- Tools: TPM, HSM, Key management system, Secure enclave
- Obfuscation: Steganography, Tokenization, Data masking
- Hashing, Salting, Digital signatures, Key stretching
- Blockchain, Open public ledger
- Certificates: Certificate authorities, CRLs, OCSP, Self-signed, Third-party, Root of trust, CSR generation, Wildcard

2.0 Threats, Vulnerabilities, and Mitigations

2.1 Compare and contrast common threat actors and motivations.
- Threat actors: Nation-state, Unskilled attacker, Hacktivist, Insider threat, Organized crime, Shadow IT
- Attributes of actors: Internal/external, Resources/funding, Level of sophistication/capability
- Motivations: Data exfiltration, Espionage, Service disruption, Blackmail, Financial gain, Philosophical/political beliefs, Ethical, Revenge, Disruption/chaos, War

2.2 Explain common threat vectors and attack surfaces.
- Message-based: Email, SMS, Instant messaging
- Image-based, File-based, Voice call, Removable device
- Vulnerable software: Client-based vs. agentless
- Unsupported systems and applications
- Unsecure networks: Wireless, Wired, Bluetooth
- Open service ports, Default credentials
- Supply chain: MSPs, Vendors, Suppliers
- Human vectors/social engineering: Phishing, Vishing, Smishing, Misinformation/disinformation, Impersonation, Business email compromise, Pretexting, Watering hole, Brand impersonation, Typosquatting

2.3 Explain various types of vulnerabilities.
- Application: Memory injection, Buffer overflow, Race conditions (TOC/TOU), Malicious update
- Operating system (OS)-based
- Web-based: SQLi, XSS
- Hardware: Firmware, End-of-life, Legacy
- Virtualization: VM escape, Resource reuse
- Cloud-specific
- Supply chain: Service provider, Hardware provider, Software provider
- Cryptographic
- Misconfiguration
- Mobile device: Side loading, Jailbreaking
- Zero-day

2.4 Given a scenario, analyze indicators of malicious activity.
- Malware attacks: Ransomware, Trojan, Worm, Spyware, Bloatware, Virus, Keylogger, Logic bomb, Rootkit
- Physical attacks: Brute force, RFID cloning, Environmental
- Network attacks: DDoS (Amplified, Reflected), DNS attacks, Wireless, On-path, Credential replay, Malicious code
- Application attacks: Injection, Buffer overflow, Replay, Privilege escalation, Forgery, Directory traversal
- Cryptographic attacks: Downgrade, Collision, Birthday
- Password attacks: Spraying, Brute force
- Indicators: Account lockout, Concurrent session usage, Blocked content, Impossible travel, Resource consumption, Resource inaccessibility, Out-of-cycle logging, Published/documented, Missing logs

2.5 Explain the purpose of mitigation techniques used to secure the enterprise.
- Segmentation, Access control (ACL, Permissions)
- Application allow list, Isolation, Patching, Encryption, Monitoring, Least privilege
- Configuration enforcement, Decommissioning
- Hardening techniques: Encryption, Installation of endpoint protection, Host-based firewall, HIPS, Disabling ports/protocols, Default password changes, Removal of unnecessary software

3.0 Security Architecture

3.1 Compare and contrast security implications of different architecture models.
- Architecture concepts: Cloud (Responsibility matrix, Hybrid considerations, Third-party vendors), IaC, Serverless, Microservices
- Network infrastructure: Physical isolation (Air-gapped), Logical segmentation, SDN
- On-premises, Centralized vs. decentralized, Containerization, Virtualization
- IoT, ICS/SCADA, RTOS, Embedded systems, High availability
- Considerations: Availability, Resilience, Cost, Responsiveness, Scalability, Ease of deployment, Risk transference, Ease of recovery, Patch availability, Inability to patch, Power, Compute

3.2 Given a scenario, apply security principles to secure enterprise infrastructure.
- Infrastructure considerations: Device placement, Security zones, Attack surface, Connectivity, Failure modes (Fail-open, Fail-closed)
- Device attribute: Active vs. passive, Inline vs. tap/monitor
- Network appliances: Jump server, Proxy server, IPS/IDS, Load balancer, Sensors
- Port security: 802.1X, EAP
- Firewall types: WAF, UTM, NGFW, Layer 4/Layer 7
- Secure communication/access: VPN, Remote access, Tunneling (TLS, IPSec), SD-WAN, SASE
- Selection of effective controls

3.3 Compare and contrast concepts and strategies to protect data.
- Data types: Regulated, Trade secret, Intellectual property, Legal information, Financial information, Human- and non-human-readable
- Data classifications: Sensitive, Confidential, Public, Restricted, Private, Critical
- General data considerations: Data states (at rest, in transit, in use), Data sovereignty, Geolocation
- Methods to secure data: Geographic restrictions, Encryption, Hashing, Masking, Tokenization, Obfuscation, Segmentation, Permission restrictions

3.4 Explain the importance of resilience and recovery in security architecture.
- High availability: Load balancing vs. clustering
- Site considerations: Hot, Cold, Warm, Geographic dispersion
- Platform diversity, Multi-cloud systems, Continuity of operations
- Capacity planning: People, Technology, Infrastructure
- Testing: Tabletop exercises, Fail over, Simulation, Parallel processing
- Backups: Onsite/offsite, Frequency, Encryption, Snapshots, Recovery, Replication, Journaling
- Power: Generators, UPS

4.0 Security Operations

4.1 Given a scenario, apply common security techniques to computing resources.
- Secure baselines: Establish, Deploy, Maintain
- Hardening targets: Mobile devices, Workstations, Switches, Routers, Cloud infrastructure, Servers, ICS/SCADA, Embedded systems, RTOS, IoT devices
- Wireless devices: Installation considerations (Site surveys, Heat maps)
- Mobile solutions: MDM, Deployment models (BYOD, COPE, CYOD), Connection methods (Cellular, Wi-Fi, Bluetooth)
- Wireless security settings: WPA3, AAA/RADIUS, Cryptographic protocols, Authentication protocols
- Application security: Input validation, Secure cookies, Static code analysis, Code signing
- Sandboxing, Monitoring

4.2 Explain the security implications of proper hardware, software, and data asset management.
- Acquisition/procurement process
- Assignment/accounting: Ownership, Classification
- Monitoring/asset tracking: Inventory, Enumeration
- Disposal/decommissioning: Sanitization, Destruction, Certification, Data retention

4.3 Explain various activities associated with vulnerability management.
- Identification methods: Vulnerability scan, Application security (Static analysis, Dynamic analysis, Package monitoring), Threat feed (OSINT, Proprietary/third-party, Information-sharing organization, Dark web), Penetration testing, Responsible disclosure program (Bug bounty), System/process audit
- Analysis: Confirmation (False positive, False negative), Prioritize, CVSS, CVE, Vulnerability classification, Exposure factor, Environmental variables, Industry/organizational impact, Risk tolerance
- Vulnerability response and remediation: Patching, Insurance, Segmentation, Compensating controls, Exceptions and exemptions
- Validation of remediation: Rescanning, Audit, Verification
- Reporting

4.4 Explain security alerting and monitoring concepts and tools.
- Monitoring computing resources: Systems, Applications, Infrastructure
- Activities: Log aggregation, Alerting, Scanning, Reporting, Archiving, Alert response and remediation/validation (Quarantine, Alert tuning)
- Tools: SCAP, Benchmarks, Agents/agentless, SIEM, Antivirus, DLP, SNMP traps, NetFlow, Vulnerability scanners

4.5 Given a scenario, modify enterprise capabilities to enhance security.
- Firewall: Rules, Access lists, Ports/protocols, Screened subnets
- IDS/IPS: Trends, Signatures
- Web filter: Agent-based, Centralized proxy, URL scanning, Content categorization, Block rules, Reputation
- Operating system security: Group Policy, SELinux
- Implementation of secure protocols: Protocol selection, Port selection, Transport method
- DNS filtering
- Email security: DMARC, DKIM, SPF, Gateway
- File integrity monitoring, DLP, NAC, EDR/XDR, User behavior analytics

4.6 Given a scenario, implement and maintain identity and access management.
- Provisioning/de-provisioning user accounts
- Permission assignments and implications
- Identity proofing, Federation, Single sign-on (SSO): LDAP, OAuth, SAML
- Interoperability, Attestation
- Access controls: Mandatory, Discretionary, Role-based, Rule-based, Attribute-based, Time-of-day restrictions, Least privilege
- Multifactor authentication: Implementations (Biometrics, Hard/soft authentication tokens, Security keys), Factors (Something you know, have, are, Somewhere you are)
- Password concepts: Best practices (Length, Complexity, Reuse, Expiration, Age), Password managers, Passwordless
- Privileged access management tools: Just-in-time permissions, Password vaulting, Ephemeral credentials

4.7 Explain the importance of automation and orchestration related to secure operations.
- Use cases: User provisioning, Resource provisioning, Guard rails, Security groups, Ticket creation, Escalation, Enabling/disabling services and access, Continuous integration and testing, Integrations and APIs
- Benefits: Efficiency/time saving, Enforcing baselines, Standard infrastructure configurations, Scaling in a secure manner, Employee retention, Reaction time, Workforce multiplier
- Other considerations: Complexity, Cost, Single point of failure, Technical debt, Ongoing supportability

4.8 Explain appropriate incident response activities.
- Process: Preparation, Detection, Analysis, Containment, Eradication, Recovery, Lessons learned
- Training, Testing: Tabletop exercise, Simulation
- Root cause analysis, Threat hunting
- Digital forensics: Legal hold, Chain of custody, Acquisition, Reporting, Preservation, E-discovery

4.9 Given a scenario, use data sources to support an investigation.
- Log data: Firewall logs, Application logs, Endpoint logs, OS-specific security logs, IPS/IDS logs, Network logs, Metadata
- Data sources: Vulnerability scans, Automated reports, Dashboards, Packet captures

5.0 Security Program Management and Oversight

5.1 Summarize elements of effective security governance.
- Guidelines, Policies: AUP, Information security policies, Business continuity, Disaster recovery, Incident response, SDLC, Change management
- Standards: Password, Access control, Physical security, Encryption
- Procedures: Change management, Onboarding/offboarding, Playbooks
- External considerations: Regulatory, Legal, Industry, Local/regional, National, Global
- Monitoring and revision
- Types of governance structures: Boards, Committees, Government entities, Centralized/decentralized
- Roles and responsibilities for systems and data: Owners, Controllers, Processors, Custodians/stewards

5.2 Explain elements of the risk management process.
- Risk identification, Risk assessment: Ad hoc, Recurring, One-time, Continuous
- Risk analysis: Qualitative, Quantitative, SLE, ALE, ARO, Probability, Likelihood, Exposure factor, Impact
- Risk register: Key risk indicators, Risk owners, Risk threshold
- Risk tolerance, Risk appetite: Expansionary, Conservative, Neutral
- Risk management strategies: Transfer, Accept (Exemption, Exception), Avoid, Mitigate
- Risk reporting
- Business impact analysis: RTO, RPO, MTTR, MTBF

5.3 Explain the processes associated with third-party risk assessment and management.
- Vendor assessment: Penetration testing, Right-to-audit clause, Evidence of internal audits, Independent assessments, Supply chain analysis
- Vendor selection: Due diligence, Conflict of interest
- Agreement types: SLA, MOA, MOU, MSA, WO/SOW, NDA, BPA
- Vendor monitoring, Questionnaires, Rules of engagement

5.4 Summarize elements of effective security compliance.
- Compliance reporting: Internal, External
- Consequences of non-compliance: Fines, Sanctions, Reputational damage, Loss of license, Contractual impacts
- Compliance monitoring: Due diligence/care, Attestation and acknowledgement, Internal and external, Automation
- Privacy: Legal implications (Local/regional, National, Global), Data subject, Controller vs. processor, Ownership, Data inventory and retention, Right to be forgotten

5.5 Explain types and purposes of audits and assessments.
- Attestation, Internal: Compliance, Audit committee, Self-assessments
- External: Regulatory, Examinations, Assessment, Independent third-party audit
- Penetration testing: Physical, Offensive, Defensive, Integrated, Known environment, Partially known environment, Unknown environment, Reconnaissance (Passive, Active)

5.6 Given a scenario, implement security awareness practices.
- Phishing: Campaigns, Recognizing a phishing attempt, Responding to reported suspicious messages
- Anomalous behavior recognition: Risky, Unexpected, Unintentional
- User guidance and training: Policy/handbooks, Situational awareness, Insider threat, Password management, Removable media and cables, Social engineering, Operational security, Hybrid/remote work environments
- Reporting and monitoring: Initial, Recurring
- Development, Execution
`;

/**
 * Generate a Security+ question with exact topic strings
 * Difficulty is automatically derived from category (no AI interpretation)
 * @param topicStrings - Exact topic strings from the cleaned topic list
 * @param questionCategory - Type of question: single-domain-single-topic (easy), single-domain-multiple-topics (medium), or multiple-domains-multiple-topics (hard)
 * @param questionType - Single-choice or multiple-response
 */
export async function generateQuestionWithTopics(
  topicStrings: string[],
  questionCategory: 'single-domain-single-topic' | 'single-domain-multiple-topics' | 'multiple-domains-multiple-topics',
  questionType: 'single' | 'multiple' = 'single'
): Promise<Question> {

  if (!topicStrings || topicStrings.length === 0) {
    throw new Error('At least one topic string must be provided');
  }

  // Derive difficulty from category (deterministic, no AI interpretation)
  const difficulty = categoryToDifficulty(questionCategory);

  const categoryGuidance = {
    'single-domain-single-topic': `This is a SINGLE DOMAIN, SINGLE TOPIC question testing: "${topicStrings[0]}". Focus the question specifically on this one concept.`,
    'single-domain-multiple-topics': `This is a SINGLE DOMAIN, MULTIPLE TOPICS question combining related topics from the same domain: ${topicStrings.map(t => `"${t}"`).join(', ')}. Create a realistic scenario that integrates these concepts.`,
    'multiple-domains-multiple-topics': `This is a MULTIPLE DOMAINS, MULTIPLE TOPICS question combining topics across different Security+ domains: ${topicStrings.map(t => `"${t}"`).join(', ')}. Create a complex scenario that requires understanding how these concepts work together across domains.`
  };

  const typeGuidance = questionType === 'single'
    ? 'This is a SINGLE-CHOICE question. Provide exactly ONE correct answer (index 0-3).'
    : 'This is a MULTIPLE-RESPONSE question (select all that apply). Provide 2-3 correct answers as an array of indices (e.g., [0, 2] or [1, 2, 3]). The question should ask "Which of the following are..." or "Select all that apply".';

  const prompt = `Generate a single CompTIA Security+ SY0-701 exam question.

QUESTION CATEGORY: ${questionCategory.toUpperCase()}
${categoryGuidance[questionCategory]}

QUESTION TYPE: ${questionType.toUpperCase()}
${typeGuidance}

TOPICS TO TEST:
You MUST create a question that tests these EXACT topics:
${topicStrings.map((t, i) => `${i + 1}. "${t}"`).join('\n')}

CRITICAL REQUIREMENTS:
1. Create a question that ONLY tests the topics listed above - do not introduce concepts from other domains
2. Present a realistic Security+ exam scenario
3. Include 4 answer options (A, B, C, D)
4. Explain why the correct answer(s) are right
5. Explain why each option is correct or wrong (provide 4 explanations)

CRITICAL - TOPIC TAGGING (VERY IMPORTANT):
- In the "topics" array, you MUST include ONLY the EXACT topic strings provided above
- Use these EXACT strings character-for-character: ${topicStrings.map(t => `"${t}"`).join(', ')}
- Do NOT modify, paraphrase, or shorten these topic strings
- Do NOT add additional topics beyond those provided
- Do NOT introduce concepts from other Security+ domains not represented in the topic list
- The question should ONLY test knowledge of the provided topics - nothing more
- In metadata.primaryTopic, use the first topic from the list: "${topicStrings[0]}"

CRITICAL - ANSWER QUALITY AND ANTI-TELLTALE MEASURES:

1. LENGTH VARIATION (prevent length-based guessing):
   - VARY the length of ALL answer options (15-60 words each)
   - Make some INCORRECT answers LONGER than correct answers
   - Make some INCORRECT answers MORE DETAILED than correct answers
   - The correct answer should NOT always be the longest option
   - Some correct answers should be SHORT and concise (15-25 words)
   - Some incorrect answers should be LONG and detailed but subtly wrong (40-60 words)

2. PLAUSIBLE DISTRACTORS (prevent obvious elimination):
   - ALL incorrect options must be related to the same topic/domain as the question
   - Wrong answers should be "close but not quite right" - not completely unrelated
   - Use common misconceptions, partial solutions, or alternatives that seem reasonable
   - Example: If testing IaC security, ALL options should involve IaC/cloud/security concepts
   - DO NOT include options from completely different domains (e.g., physical security for a cloud question)

3. AVOID KEYWORD MATCHING (prevent telegraphing):
   - DO NOT repeat exact keywords from the question stem in the correct answer
   - If question mentions "encryption", correct answer should rephrase as "cryptographic protection" or "secure data at rest"
   - Use synonyms and paraphrasing to avoid obvious pattern matching
   - Incorrect answers can use question keywords to make them seem more plausible

4. BALANCED TECHNICAL DEPTH:
   - All 4 options should have similar levels of technical specificity
   - If one option mentions specific tools/protocols, others should too
   - Mix implementation details and conceptual approaches evenly across options
   - Don't make correct answer obviously more detailed/professional than others

5. SUBTLE INCORRECTNESS:
   - Wrong answers should be subtly wrong (wrong timing, wrong context, incomplete solution)
   - Not obviously absurd or unrelated
   - Examples of good subtle incorrectness:
     * Right tool, wrong use case
     * Right concept, wrong implementation order
     * Partially correct but missing critical component
     * Correct for different scenario but not this one

Security+ Topics Reference (for context only):
${SECURITY_PLUS_TOPICS}

Return ONLY a valid JSON object in this exact format (no markdown, no extra text):
{
  "question": "the question text",
  "options": ["option A", "option B", "option C", "option D"],
  "correctAnswer": ${questionType === 'single' ? '0' : '[0, 2]'},
  "explanation": "why the correct answer(s) are right",
  "incorrectExplanations": ["why option 0 is wrong/right", "why option 1 is wrong/right", "why option 2 is wrong/right", "why option 3 is wrong/right"],
  "topics": ${JSON.stringify(topicStrings)},
  "difficulty": "${difficulty}",
  "metadata": {
    "primaryTopic": "${topicStrings[0]}",
    "scenario": "brief scenario type (e.g., 'certificate_validation', 'network_attack', 'access_control')",
    "keyConcept": "specific concept tested (e.g., 'CRL_vs_OCSP', 'DDoS_mitigation', 'RBAC_implementation')"
  }
}`;

  try {
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 2048,
      temperature: 0.8,
      messages: [
        {
          role: "user",
          content: `You are a CompTIA Security+ SY0-701 exam expert. Generate high-quality exam questions that cannot be guessed through test-taking strategies.

CRITICAL QUALITY RULES:
1. ONLY test the exact topics provided - do not introduce unrelated domains
2. Use ONLY the exact topic strings provided in the "topics" array
3. ALL answer options must be plausible and related to the question topic
4. VARY answer lengths - don't make correct answer always longest or shortest
5. AVOID repeating keywords from question in correct answer - use synonyms
6. Make incorrect answers subtly wrong, not obviously unrelated
7. All options should have similar technical depth and specificity

Return only valid JSON, no markdown formatting.

${prompt}`
        }
      ]
    });

    const content = message.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude');
    }

    const textContent = content.text.trim();

    // Remove markdown code blocks if present
    const jsonContent = textContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    const questionData = JSON.parse(jsonContent);

    // Shuffle the answer options to randomize correct answer position
    // Only shuffle for single-choice questions
    const shuffledData = questionType === 'single' ? shuffleQuestionOptions(questionData) : questionData;

    // DETERMINISTIC TOPIC EXTRACTION
    // Extract actual topics from generated question (not just what we asked for)
    const extractedTopics = analyzeQuestionForTopics(
      shuffledData.question,
      shuffledData.options,
      shuffledData.explanation,
      shuffledData.incorrectExplanations
    );

    // Fallback to requested topics if extraction fails
    const finalTopics = extractedTopics.length > 0 ? extractedTopics : topicStrings;

    // Determine domains from extracted topics
    const domains = getDomainsFromTopics(finalTopics);
    const uniqueDomains = [...new Set(domains)];

    // Determine category based on actual topics/domains
    let actualCategory: 'single-domain-single-topic' | 'single-domain-multiple-topics' | 'multiple-domains-multiple-topics';
    if (uniqueDomains.length > 1) {
      actualCategory = 'multiple-domains-multiple-topics';
    } else if (finalTopics.length > 1) {
      actualCategory = 'single-domain-multiple-topics';
    } else {
      actualCategory = 'single-domain-single-topic';
    }

    // Derive difficulty from actual category (deterministic)
    const actualDifficulty = categoryToDifficulty(actualCategory);

    // Calculate IRT parameters based on actual category
    const irtParams = calculateIRTParameters(actualCategory);

    const correctAnswerDisplay = Array.isArray(shuffledData.correctAnswer)
      ? `[${shuffledData.correctAnswer.join(', ')}]`
      : shuffledData.correctAnswer;

    // Log comparison if category changed
    if (actualCategory !== questionCategory) {
      console.log(`⚠️ Category mismatch! Requested: ${questionCategory}, Actual: ${actualCategory}`);
      console.log(`   Requested topics: ${topicStrings.join(', ')}`);
      console.log(`   Extracted topics: ${finalTopics.join(', ')}`);
    }

    console.log(`Question generated: Category=${actualCategory}, Type=${questionType}, Difficulty=${actualDifficulty}, Correct=${correctAnswerDisplay}, IRT(b=${irtParams.irtDifficulty}, a=${irtParams.irtDiscrimination}), Points=${irtParams.maxPoints}`);

    return {
      id: `q_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      question: shuffledData.question,
      options: shuffledData.options,
      correctAnswer: shuffledData.correctAnswer,
      explanation: shuffledData.explanation,
      incorrectExplanations: shuffledData.incorrectExplanations,
      topics: finalTopics, // Use extracted topics, not requested topics
      difficulty: actualDifficulty, // Use derived difficulty from actual category
      questionType: questionType,
      questionCategory: actualCategory, // Use actual category based on extracted topics
      irtDifficulty: irtParams.irtDifficulty,
      irtDiscrimination: irtParams.irtDiscrimination,
      maxPoints: irtParams.maxPoints,
      metadata: shuffledData.metadata,
      createdAt: Date.now(),
    };
  } catch (error) {
    console.error('Error generating question:', error);
    throw new Error('Failed to generate question');
  }
}

/**
 * Legacy function - kept for backwards compatibility
 * Now wraps the new generateQuestionWithTopics function
 * Difficulty is automatically derived from category (medium for single-domain-multiple-topics)
 */
export async function generateSynthesisQuestion(
  excludeTopics: string[] = [],
  questionType: 'single' | 'multiple' = 'single'
): Promise<Question> {
  // For legacy calls, generate a synthesis question with generic topics
  // This should ideally not be used anymore, but keeping for compatibility
  const genericTopics = ['Security Concepts', 'Best Practices'];
  return generateQuestionWithTopics(
    genericTopics,
    'single-domain-multiple-topics',
    questionType
  );
}

/**
 * Generate a batch of questions with varied types
 * Difficulty is automatically derived from question category
 *
 * Legacy function - consider using pregenerateQuiz instead
 */
export async function generateQuestionBatch(count: number, excludeTopics: string[] = []): Promise<Question[]> {
  const usedTopics = [...excludeTopics];

  // Define question types (difficulty comes from category)
  const questionTypes: Array<'single' | 'multiple'> = [
    'single',
    'single',
    'single',
    'single',
    'single',
    'multiple',
    'multiple',
    'single',
    'single',
    'multiple',
  ];

  // Shuffle types to randomize question order
  const shuffledTypes = shuffleArray(questionTypes).slice(0, count);

  console.log(`Generating ${count} questions in parallel...`);

  // Generate all questions in parallel for much faster generation
  const questionPromises = shuffledTypes.map(async (type, index) => {
    // Retry up to 3 times if generation fails
    const maxRetries = 3;
    let lastError: any = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const question = await generateSynthesisQuestion(usedTopics, type);
        console.log(`Generated ${index + 1}/${count}: ${question.difficulty} ${type}-choice (${question.maxPoints} pts)`);
        return question;
      } catch (error) {
        lastError = error;
        console.error(`Error generating question ${index + 1} (attempt ${attempt}/${maxRetries}):`, error);

        // Wait a bit before retrying (exponential backoff)
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        }
      }
    }

    // All retries failed
    console.error(`Failed to generate question ${index + 1} after ${maxRetries} attempts`);
    return null;
  });

  // Wait for all questions to be generated
  const results = await Promise.all(questionPromises);

  // Filter out any failed generations
  const questions = results.filter((q): q is Question => q !== null);

  console.log(`Successfully generated ${questions.length}/${count} questions`);

  // If we didn't get enough questions, try to generate more to reach the target
  if (questions.length < count) {
    console.log(`Attempting to generate ${count - questions.length} more questions to reach target of ${count}...`);

    const additionalNeeded = count - questions.length;
    const additionalTypes = shuffleArray(questionTypes).slice(0, additionalNeeded);

    const additionalPromises = additionalTypes.map(async (type, index) => {
      try {
        const question = await generateSynthesisQuestion(usedTopics, type);
        console.log(`Generated additional ${index + 1}/${additionalNeeded}: ${question.difficulty} ${type}-choice`);
        return question;
      } catch (error) {
        console.error(`Error generating additional question ${index + 1}:`, error);
        return null;
      }
    });

    const additionalResults = await Promise.all(additionalPromises);
    const additionalQuestions = additionalResults.filter((q): q is Question => q !== null);

    questions.push(...additionalQuestions);
    console.log(`Final count: ${questions.length}/${count} questions`);
  }

  return questions;
}

/**
 * Generate questions progressively - first question immediately, then the rest
 * This allows the UI to show the first question while generating others in the background
 */
export async function generateProgressiveQuestions(
  count: number,
  excludeTopics: string[] = []
): Promise<Question[]> {
  const usedTopics = [...excludeTopics];

  // Define question types (difficulty comes from category)
  const questionTypes: Array<'single' | 'multiple'> = [
    'single',
    'single',
    'single',
    'single',
    'single',
    'multiple',
    'multiple',
    'single',
    'single',
    'multiple',
  ];

  // Shuffle types to randomize question order
  const shuffledTypes = shuffleArray(questionTypes).slice(0, count);

  console.log(`Generating first question immediately...`);

  // Generate first question immediately
  const firstType = shuffledTypes[0];
  const firstQuestion = await generateSynthesisQuestion(
    usedTopics,
    firstType
  );
  console.log(`First question ready: ${firstQuestion.difficulty} ${firstType}-choice`);

  // Start generating remaining questions in parallel (but don't wait for them)
  const remainingTypes = shuffledTypes.slice(1);
  console.log(`Generating remaining ${remainingTypes.length} questions in parallel...`);

  const remainingPromises = remainingTypes.map(async (type, index) => {
    // Retry up to 3 times if generation fails
    const maxRetries = 3;
    let lastError: any = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const question = await generateSynthesisQuestion(usedTopics, type);
        console.log(`Generated ${index + 2}/${count}: ${question.difficulty} ${type}-choice`);
        return question;
      } catch (error) {
        lastError = error;
        console.error(`Error generating question ${index + 2} (attempt ${attempt}/${maxRetries}):`, error);

        // Wait a bit before retrying (exponential backoff)
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        }
      }
    }

    // All retries failed
    console.error(`Failed to generate question ${index + 2} after ${maxRetries} attempts`);
    return null;
  });

  // Wait for all remaining questions
  const remainingResults = await Promise.all(remainingPromises);
  const remainingQuestions = remainingResults.filter((q): q is Question => q !== null);

  // Combine first question with remaining
  const allQuestions = [firstQuestion, ...remainingQuestions];

  console.log(`Progressive generation complete: ${allQuestions.length}/${count} questions`);

  // If we still don't have enough, generate more
  if (allQuestions.length < count) {
    console.log(`Generating ${count - allQuestions.length} additional questions...`);
    const additionalNeeded = count - allQuestions.length;
    const additionalTypes = shuffleArray(questionTypes).slice(0, additionalNeeded);

    const additionalPromises = additionalTypes.map(async (type) => {
      try {
        return await generateSynthesisQuestion(usedTopics, type);
      } catch (error) {
        console.error('Error generating additional question:', error);
        return null;
      }
    });

    const additionalResults = await Promise.all(additionalPromises);
    const additionalQuestions = additionalResults.filter((q): q is Question => q !== null);
    allQuestions.push(...additionalQuestions);
  }

  return allQuestions;
}

/**
 * Pseudo-Adaptive Question Selection
 * Selects question difficulty based on user's current ability level
 *
 * @param abilityLevel - Current estimated ability (theta) from -3 to +3
 * @returns Recommended difficulty level with probability distribution
 */
export function selectAdaptiveDifficulty(abilityLevel: number): 'easy' | 'medium' | 'hard' {
  // Determine difficulty probabilities based on ability level
  let easyProb, mediumProb, hardProb;

  if (abilityLevel < -0.5) {
    // Low ability: Focus on easy/medium questions
    easyProb = 0.70;
    mediumProb = 0.25;
    hardProb = 0.05;
  } else if (abilityLevel >= -0.5 && abilityLevel < 0.5) {
    // Average ability: Balanced distribution
    easyProb = 0.20;
    mediumProb = 0.60;
    hardProb = 0.20;
  } else {
    // High ability: Focus on medium/hard questions
    easyProb = 0.10;
    mediumProb = 0.30;
    hardProb = 0.60;
  }

  // Weighted random selection
  const random = Math.random();
  if (random < easyProb) {
    return 'easy';
  } else if (random < easyProb + mediumProb) {
    return 'medium';
  } else {
    return 'hard';
  }
}

/**
 * Select question type (single/multiple) with probability distribution
 * Security+ exam has more single-choice than multiple-response
 *
 * @returns 'single' (70%) or 'multiple' (30%)
 */
export function selectQuestionType(): 'single' | 'multiple' {
  return Math.random() < 0.70 ? 'single' : 'multiple';
}
