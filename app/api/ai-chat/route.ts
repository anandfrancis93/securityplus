import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/apiAuth';
import { GrokProvider } from '@/lib/ai-providers/grok';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatRequest {
  messages: ChatMessage[];
  userId?: string;
}

export async function POST(request: NextRequest) {
  try {
    // SECURITY: Authenticate request
    const authResult = await authenticateRequest(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    // Parse request body
    const body: ChatRequest = await request.json();
    const { messages } = body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: 'Messages array is required' },
        { status: 400 }
      );
    }

    // Get Grok API key from environment
    const grokApiKey = process.env.GROK_API_KEY || process.env.XAI_API_KEY;
    if (!grokApiKey) {
      console.error('Grok API key not configured');
      return NextResponse.json(
        { error: 'AI service not configured' },
        { status: 500 }
      );
    }

    // Initialize Grok provider
    const grokProvider = new GrokProvider(grokApiKey);

    // Build conversation history for Grok
    const grokMessages = messages.map(msg => ({
      role: msg.role === 'user' ? 'user' as const : 'assistant' as const,
      content: msg.content
    }));

    // Add system prompt for Security+ context
    const systemPrompt = `You are an AI assistant specialized in CompTIA Security+ (SY0-701) certification topics. You have comprehensive knowledge of all five domains and their specific topics covered in the Security+ exam.

**Security+ SY0-701 Exam Domains:**

**1.0 General Security Concepts**
- Security Controls (Technical, Managerial, Operational, Physical)
- Control Types (Preventive, Deterrent, Detective, Corrective, Compensating, Directive)
- CIA Triad (Confidentiality, Integrity, Availability)
- Non-repudiation, AAA (Authentication, Authorization, Accounting)
- Zero Trust architecture and principles
- Physical security measures
- Deception technologies (honeypots, honeynets, honeyfiles, honeytokens)
- Change management processes
- Cryptographic solutions (PKI, encryption, hashing, digital signatures, blockchain, certificates)

**2.0 Threats, Vulnerabilities, and Mitigations**
- Threat actors (nation-state, unskilled attacker, hacktivist, insider threat, organized crime, shadow IT)
- Threat vectors (email, SMS, IM, removable devices, wireless, social engineering)
- Vulnerabilities (application, OS-based, web-based, hardware, cloud, supply chain, zero-day)
- Malware types (ransomware, trojan, worm, spyware, virus, keylogger, rootkit)
- Attack types (physical, network, application, cryptographic, password attacks)
- Indicators of malicious activity
- Mitigation techniques (segmentation, access control, patching, encryption, monitoring, least privilege, hardening)

**3.0 Security Architecture**
- Architecture models (cloud, IaC, serverless, microservices, IoT, ICS/SCADA, virtualization, containerization)
- Enterprise infrastructure (firewalls, IDS/IPS, VPN, proxies, load balancers, WAF)
- Secure network design (network segmentation, DMZ, VLANs, jump servers)
- Data protection (classification, encryption, masking, tokenization, obfuscation)
- Resilience and recovery (high availability, disaster recovery, backups, power management)

**4.0 Security Operations**
- Secure baselines and hardening (mobile, workstations, servers, network devices, cloud, IoT)
- Asset management lifecycle
- Vulnerability management (identification, analysis, remediation, validation)
- Monitoring and alerting (SIEM, log aggregation, SCAP, DLP)
- Identity and Access Management (IAM, federation, SSO, MFA, privileged access management)
- Automation and orchestration
- Incident response process (preparation, detection, analysis, containment, eradication, recovery)
- Digital forensics and investigation

**5.0 Security Program Management and Oversight**
- Security governance (policies, standards, procedures, regulations)
- Risk management (identification, assessment, analysis, treatment strategies)
- Third-party risk assessment
- Compliance monitoring and reporting
- Audits and assessments (internal, external, penetration testing)
- Security awareness and training

**When answering questions:**
- Provide clear, accurate, and exam-focused explanations
- Reference specific Security+ domains and exam objectives when relevant
- Use real-world examples to illustrate cybersecurity concepts
- Explain both the "what" and the "why" behind security concepts
- Be concise but thorough
- For Security+ topics, emphasize exam-relevant information and common exam scenarios
- For general questions, provide helpful and accurate answers
- Always maintain a professional and educational tone
- When discussing security controls or solutions, explain their practical implementation
- Help students understand the context and application of concepts, not just definitions`;

    // Call Grok API with conversation history
    const response = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${grokApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'grok-4-fast-non-reasoning',
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          ...grokMessages
        ],
        temperature: 0.7,
        max_tokens: 2048
      })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Grok API error:', response.status, error);
      return NextResponse.json(
        { error: 'Failed to generate response' },
        { status: response.status }
      );
    }

    const data = await response.json();

    if (!data.choices || data.choices.length === 0) {
      return NextResponse.json(
        { error: 'No response from AI' },
        { status: 500 }
      );
    }

    const aiMessage = data.choices[0].message.content;

    return NextResponse.json({
      message: aiMessage,
      usage: data.usage
    });

  } catch (error) {
    console.error('Error in AI chat API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
