/**
 * High-quality Security+ SY0-701 question examples
 * These serve as multishot examples for AI question generation
 * to ensure consistent quality and appropriate difficulty levels
 */

export const QUESTION_EXAMPLES = [
  {
    id: 1,
    difficulty: 'easy',
    category: 'single-domain-single-topic',
    question: "An information technology (IT) department is growing to a size where there is a need for a new group to manage security. The chief executive officer (CEO) wants to hire a new executive officer for the role and split it into its own department, separate from the IT department. The CEO should hire for which position?",
    options: [
      "CIO",
      "CTO",
      "CEO",
      "CISO"
    ],
    correctAnswer: 3, // CISO
    topics: ["Chief Information Security Officer (CISO) (security governance role)"],
    rationale: "Single topic (CISO role), straightforward definition/role identification, tests basic understanding of security governance positions."
  },
  {
    id: 2,
    difficulty: 'medium',
    category: 'single-domain-multiple-topics',
    question: "An information technology (IT) manager is trying to persuade the chief financial officer (CFO) to sign off on a new support and update contract for the company's virtualized environment. The CFO sees this as a waste of money since the company already has the environment up and running. The IT manager explained to the CFO that the company will no longer receive security updates to protect the environment. What describes the level of hazard posed by NOT keeping the systems up-to-date?",
    options: [
      "Vulnerability",
      "Threat",
      "Risk",
      "Insider threat"
    ],
    correctAnswer: 2, // Risk
    topics: ["Risk (security concept)", "Vulnerability (security concept)", "Patching (mitigation technique)"],
    rationale: "Scenario-based question testing understanding of risk vs vulnerability vs threat concepts, requires application of knowledge to business context."
  },
  {
    id: 3,
    difficulty: 'medium',
    category: 'single-domain-multiple-topics',
    question: "A security engineer investigates the impacts of a recent breach in which a threat actor was able to exfiltrate company data. What cryptographic solution serves as a countermeasure that mitigates the impact of hash table attacks by adding a random value to each plaintext input?",
    options: [
      "Trusted Platform Module",
      "Salt",
      "Internet Protocol Security",
      "IPSec"
    ],
    correctAnswer: 1, // Salt
    topics: ["Salting (cryptographic technique)", "Hashing (cryptographic technique)", "Data breach response"],
    rationale: "Tests understanding of salt in cryptography context, requires connecting breach scenario to cryptographic countermeasures."
  },
  {
    id: 4,
    difficulty: 'medium',
    category: 'single-domain-multiple-topics',
    question: "A real estate investment firm wants to implement Single Sign-On (SSO) for its dozens of services and software. The firm found a vendor to implement that request using the eXtensible Markup Language (XML) standard. What solution does this vendor use for SSO?",
    options: [
      "SAML",
      "VPN",
      "LDAP",
      "LSASS"
    ],
    correctAnswer: 0, // SAML
    topics: ["SAML (authentication protocol)", "Single sign-on (SSO) (authentication method)", "Federation (identity management)"],
    rationale: "Requires understanding SSO protocols and identifying SAML by its XML characteristic, tests protocol selection knowledge."
  },
  {
    id: 5,
    difficulty: 'hard',
    category: 'multiple-domains-multiple-topics',
    question: "The network security engineer at a financial corporation is reviewing the current firewall setup. The corporation faces threats from various cyberattacks, some of which leverage application-specific vulnerabilities. The engineer is considering whether to deploy Layer 4 or Layer 7 firewalls for enhanced security. If the primary concern is to secure against application-specific attacks, which of the following strategies should the network security engineer consider implementing?",
    options: [
      "Deploy Layer 4 firewalls on all network edges",
      "Rely solely on Layer 4 firewalls for internal traffic",
      "Deploy Layer 7 firewalls on all network edges",
      "Use Layer 4 firewalls for all internet-facing applications"
    ],
    correctAnswer: 2, // Deploy Layer 7 firewalls on all network edges
    topics: ["Layer 4/Layer 7 (firewall type)", "Application attacks", "Network security architecture", "Firewall placement"],
    rationale: "Complex scenario requiring understanding of OSI layers, firewall capabilities, threat types, and strategic deployment decisions across multiple security domains."
  },
  {
    id: 6,
    difficulty: 'easy',
    category: 'single-domain-single-topic',
    question: "A software engineer reviews the use of SCADA applications associated with various industries. What sector of industry refers specifically to mining and refining raw materials, involving hazardous high heat and pressure furnaces?",
    options: [
      "Energy",
      "Fabrication",
      "Facilities",
      "Industrial"
    ],
    correctAnswer: 1, // Fabrication
    topics: ["SCADA (industrial control system)", "Industrial sectors"],
    rationale: "Tests basic knowledge of SCADA applications in industrial sectors, straightforward classification question."
  },
  {
    id: 7,
    difficulty: 'hard',
    category: 'multiple-domains-multiple-topics',
    question: "An organization's security team is in the process of implementing new security measures for managing its hardware, software, and data assets, increasing its overall protection. The team plans to implement network segmentation, store passwords in plaintext in a secure server, establish a policy for outdated software disposal, and perform regular asset inventory audits. Considering the initiatives the security team proposes, what relevant and secure practices directly relate to managing hardware, software, and data assets effectively and efficiently while ensuring data protection? (Select the two best options.)",
    options: [
      "Network segmentation",
      "Storing passwords in plaintext on a secure server",
      "Establishing a policy disposing of outdated software",
      "Performing regular audits of asset inventory"
    ],
    correctAnswer: [2, 3], // Establishing policy for outdated software disposal AND performing regular audits
    questionType: 'multiple',
    topics: ["Asset management", "Disposal/decommissioning (asset management)", "Monitoring/asset tracking", "Security best practices"],
    rationale: "Multiple-response question requiring identification of secure practices while rejecting insecure ones (plaintext passwords), tests critical thinking across asset management domain."
  },
  {
    id: 8,
    difficulty: 'hard',
    category: 'multiple-domains-multiple-topics',
    question: "A large corporation is evaluating potential hardware suppliers and service providers for its new data center expansion. The IT team aims to select vendors that adhere to security best practices to minimize vulnerabilities. When assessing the security posture of hardware suppliers and service providers, which factors are essential for the corporation to consider to ensure reduced vulnerabilities in its data center operations? (Select the two best options.)",
    options: [
      "Supply chain verification processes in place",
      "Number of data centers the supplier operates",
      "Hardware components' origin transparency",
      "Annual revenue of the service provider"
    ],
    correctAnswer: [0, 2], // Supply chain verification AND hardware origin transparency
    questionType: 'multiple',
    topics: ["Supply chain (threat vector)", "Vendor assessment (third-party risk)", "Hardware provider (supply chain vulnerability)", "Due diligence (third-party risk)"],
    rationale: "Multiple-response question testing supply chain security knowledge, requires distinguishing security-relevant factors from business metrics."
  },
  {
    id: 9,
    difficulty: 'medium',
    category: 'single-domain-multiple-topics',
    question: "The network administrator for a large corporation recently detected multiple unauthorized intrusion attempts on the network. As a result, the team deployed an intrusion detection system (IDS) and an intrusion prevention system (IPS). The team aims to block malicious traffic and automatically receive alerts on suspicious activities. The administrator needs to choose an approach that offers real-time protection against active threats and can modify or reject traffic in the network. Based on the desired outcomes and functionality the network administrator requires, which system should the team primarily focus on for real-time traffic modification and blocking active threats?",
    options: [
      "Intrusion Detection System (IDS)",
      "Intrusion Prevention System (IPS)",
      "Network-based Intrusion Detection System (NIDS)",
      "Host-based Intrusion Detection System (HIDS)"
    ],
    correctAnswer: 1, // IPS
    topics: ["Intrusion Prevention System (IPS) (network appliance)", "Intrusion Detection System (IDS) (network appliance)", "Active vs. passive (device attribute)", "Inline vs. tap/monitor (device attribute)"],
    rationale: "Scenario requiring understanding of IDS vs IPS capabilities, tests ability to select appropriate technology based on requirements (blocking vs detection)."
  },
  {
    id: 10,
    difficulty: 'easy',
    category: 'single-domain-single-topic',
    question: "A large financial corporation wants to incorporate a sandbox in its network. What is the purpose of using a sandbox in endpoint security?",
    options: [
      "To isolate and contain malicious files or processes",
      "To restrict internet access on endpoint devices",
      "To enforce strong password policies for user accounts",
      "To manage group policies and access control lists"
    ],
    correctAnswer: 0, // To isolate and contain malicious files or processes
    topics: ["Sandboxing (security technique)"],
    rationale: "Direct question about sandbox purpose, tests basic understanding of isolation technique for endpoint security."
  },
  {
    id: 11,
    difficulty: 'medium',
    category: 'single-domain-multiple-topics',
    question: "A university's IT team must securely transfer large files containing sensitive financial data between two offices in different cities. Which protocol would be the MOST suitable and secure option for this file transfer?",
    options: [
      "HTTP",
      "FTP",
      "SMTP",
      "SFTP"
    ],
    correctAnswer: 3, // SFTP
    topics: ["SFTP (secure protocol)", "File transfer protocols", "Encryption (transport/communication)", "Secure communication"],
    rationale: "Protocol selection question requiring understanding of secure vs insecure file transfer methods, tests practical application of security principles."
  },
  {
    id: 12,
    difficulty: 'easy',
    category: 'single-domain-single-topic',
    question: "An analyst receives an overwhelming number of low-priority alerts that could potentially lead the analyst to disregard a critical high-impact alert. What may be occurring in this situation?",
    options: [
      "Alert tuning",
      "Alert fatigue",
      "Threat hunting",
      "False positive"
    ],
    correctAnswer: 1, // Alert fatigue
    topics: ["Alert fatigue (monitoring concept)", "Alert response and remediation (monitoring activity)"],
    rationale: "Tests understanding of alert fatigue concept in security operations, straightforward identification of monitoring problem."
  },
  {
    id: 13,
    difficulty: 'medium',
    category: 'single-domain-multiple-topics',
    question: "A new IT intern has been reviewing logs to gain familiarity and understanding of the systems they will support. During these reviews, the intern noticed that for the last few weeks, at the same time every day, several MBs of data are being sent out. What could this indicate? (Select the two best options.)",
    options: [
      "Denial of service",
      "Reconnaissance",
      "Teleworker",
      "Unauthorized data exfiltration"
    ],
    correctAnswer: [2, 3], // Teleworker AND Unauthorized data exfiltration
    questionType: 'multiple',
    topics: ["Data exfiltration (threat actor motivation)", "Log analysis", "Indicators of malicious activity", "Network monitoring"],
    rationale: "Multiple-response question requiring log analysis skills and understanding both legitimate (teleworker) and malicious (exfiltration) explanations for network patterns."
  },
  {
    id: 14,
    difficulty: 'medium',
    category: 'single-domain-multiple-topics',
    question: "A properly implemented change plan helps keep business operations moving forward. Restarts, dependencies, and downtime go hand-in-hand with change management. When is the BEST time to implement changes for an international organization? (Select the two best options.)",
    options: [
      "After the workday",
      "Off-peak times",
      "Peak times",
      "Maintenance windows"
    ],
    correctAnswer: [1, 3], // Off-peak times AND Maintenance windows
    questionType: 'multiple',
    topics: ["Change management (business process)", "Maintenance window (business process)", "Downtime (technical implication)", "Impact analysis (business process)"],
    rationale: "Multiple-response question testing change management best practices, requires understanding of business continuity considerations."
  },
  {
    id: 15,
    difficulty: 'hard',
    category: 'multiple-domains-multiple-topics',
    question: "A technology company is considering several third-party vendors for a critical software development project. The selected vendor will have access to sensitive intellectual property. The company needs to mitigate the risks associated with outsourcing this project. What would be the MOST critical step in the third-party vendor assessment process to ensure the protection of the company's intellectual property?",
    options: [
      "Analyzing the potential vendors' past project completion times",
      "Evaluating the potential vendors' security measures, regulatory compliance, and history of handling sensitive data",
      "Comparing the cost of services offered by the potential vendors",
      "Assessing the potential vendors' software development methodologies and programming languages"
    ],
    correctAnswer: 1, // Evaluating security measures, regulatory compliance, and history
    topics: ["Vendor assessment (third-party risk)", "Due diligence (vendor selection)", "Intellectual property (data type)", "Third-party risk assessment", "Security measures evaluation"],
    rationale: "Complex scenario integrating third-party risk management with data protection requirements, requires prioritizing security over cost/efficiency metrics."
  },
  {
    id: 16,
    difficulty: 'medium',
    category: 'single-domain-multiple-topics',
    question: "A healthcare provider is preparing for an upcoming audit of its patient data management system. The chief compliance officer focuses on ensuring that the organization has taken the necessary steps to identify and minimize risks related to the handling of patient data. What is the chief compliance officer primarily concentrating on?",
    options: [
      "Due diligence and care",
      "Attestation and acknowledgment",
      "Data encryption strategy",
      "Employee training program"
    ],
    correctAnswer: 0, // Due diligence and care
    topics: ["Due diligence/care (compliance monitoring)", "Compliance monitoring", "Risk identification", "Data management"],
    rationale: "Tests understanding of compliance concepts in healthcare context, requires connecting audit preparation to due diligence/care principles."
  }
];

/**
 * Format examples for AI prompt based on question category
 * Returns 2-3 relevant examples matching the requested difficulty
 */
export function getRelevantExamples(
  category: 'single-domain-single-topic' | 'single-domain-multiple-topics' | 'multiple-domains-multiple-topics',
  questionType: 'single' | 'multiple'
): string {
  // Filter examples by category
  const categoryExamples = QUESTION_EXAMPLES.filter(ex => ex.category === category);

  // Further filter by question type if we have enough examples
  let filteredExamples = categoryExamples;
  if (questionType === 'multiple') {
    const multipleExamples = categoryExamples.filter(ex => ex.questionType === 'multiple');
    if (multipleExamples.length > 0) {
      filteredExamples = multipleExamples;
    }
  } else {
    const singleExamples = categoryExamples.filter(ex => !ex.questionType || ex.questionType === 'single');
    if (singleExamples.length > 0) {
      filteredExamples = singleExamples;
    }
  }

  // Select up to 2 examples to keep prompt concise
  const selectedExamples = filteredExamples.slice(0, 2);

  if (selectedExamples.length === 0) {
    return "No specific examples available for this category.";
  }

  return selectedExamples.map((ex, idx) => {
    const correctAnswerDisplay = Array.isArray(ex.correctAnswer)
      ? `[${ex.correctAnswer.map(i => String.fromCharCode(65 + i)).join(', ')}]`
      : String.fromCharCode(65 + ex.correctAnswer);

    const optionsText = ex.options.map((opt, i) =>
      `${String.fromCharCode(65 + i)}) ${opt}`
    ).join('\n');

    return `EXAMPLE ${idx + 1} (${ex.difficulty.toUpperCase()} - ${ex.category}):

Question: "${ex.question}"

Options:
${optionsText}

Correct Answer: ${correctAnswerDisplay}

Topics: ${ex.topics.join(', ')}

Why this is a good ${ex.difficulty} question:
${ex.rationale}
`;
  }).join('\n---\n\n');
}
