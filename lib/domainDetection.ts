/**
 * Detects the Security+ SY0-701 domain based on question topics
 * Maps topics to one of the 5 main domains using keyword matching
 */
export function getDomainFromTopics(topics: string[]): string {
  const domainKeywords = {
    '1.0 General Security Concepts': [
      'security control', 'technical', 'managerial', 'operational', 'physical',
      'cia', 'confidentiality', 'integrity', 'availability', 'non-repudiation',
      'authentication', 'authorization', 'accounting', 'aaa',
      'zero trust', 'adaptive identity', 'policy', 'trust zone',
      'bollard', 'vestibule', 'fencing', 'surveillance', 'guard', 'badge', 'lighting', 'sensor',
      'honeypot', 'honeynet', 'honeyfile', 'honeytoken',
      'change management', 'approval', 'backout', 'maintenance window',
      'pki', 'encryption', 'cryptographic', 'tpm', 'hsm', 'hashing', 'salting',
      'certificate', 'crl', 'ocsp', 'blockchain'
    ],
    '2.0 Threats, Vulnerabilities, and Mitigations': [
      'threat actor', 'nation-state', 'hacktivist', 'insider threat', 'organized crime',
      'phishing', 'vishing', 'smishing', 'social engineering', 'pretexting',
      'vulnerability', 'buffer overflow', 'injection', 'xss', 'sqli', 'race condition',
      'malware', 'ransomware', 'trojan', 'worm', 'spyware', 'virus', 'keylogger', 'rootkit',
      'ddos', 'dns attack', 'brute force', 'password spray',
      'mitigation', 'segmentation', 'patching', 'hardening', 'least privilege'
    ],
    '3.0 Security Architecture': [
      'cloud', 'iaac', 'serverless', 'microservices', 'containerization',
      'virtualization', 'iot', 'ics', 'scada', 'rtos', 'embedded',
      'network infrastructure', 'sdn', 'air-gapped', 'segmentation',
      'data protection', 'data classification', 'data at rest', 'data in transit',
      'resilience', 'high availability', 'load balancing', 'clustering',
      'backup', 'replication', 'snapshot', 'disaster recovery'
    ],
    '4.0 Security Operations': [
      'baseline', 'hardening', 'mdm', 'byod', 'cope', 'cyod',
      'wpa3', 'radius', 'wireless',
      'asset management', 'inventory', 'disposal', 'sanitization',
      'vulnerability scan', 'penetration test', 'cvss', 'cve',
      'monitoring', 'siem', 'log', 'alert', 'dlp', 'netflow',
      'firewall', 'ips', 'ids', 'web filter', 'dns filtering',
      'identity', 'access management', 'provisioning', 'sso', 'ldap', 'oauth', 'saml',
      'mfa', 'biometric', 'password', 'privileged access',
      'automation', 'orchestration', 'api', 'ci/cd',
      'incident response', 'forensics', 'chain of custody'
    ],
    '5.0 Security Program Management and Oversight': [
      'governance', 'policy', 'aup', 'procedure', 'playbook',
      'compliance', 'regulatory', 'audit', 'attestation',
      'risk management', 'risk assessment', 'sle', 'ale', 'aro',
      'third-party', 'vendor', 'sla', 'mou', 'msa', 'nda',
      'privacy', 'gdpr', 'data subject', 'right to be forgotten',
      'penetration testing', 'security awareness', 'training'
    ]
  };

  const topicsLower = topics.map(t => t.toLowerCase());

  for (const [domain, keywords] of Object.entries(domainKeywords)) {
    for (const topic of topicsLower) {
      for (const keyword of keywords) {
        if (topic.includes(keyword)) {
          return domain;
        }
      }
    }
  }

  // Default to most general domain if no match
  return '1.0 General Security Concepts';
}

/**
 * Detects all unique Security+ domains covered by the given topics
 * Returns an array of domains, useful for cross-domain synthesis questions
 */
export function getDomainsFromTopics(topics: string[]): string[] {
  const domains = new Set<string>();

  // Get domain for each topic individually
  topics.forEach(topic => {
    const domain = getDomainFromTopics([topic]);
    domains.add(domain);
  });

  // Return sorted array of unique domains
  return Array.from(domains).sort();
}
