import OpenAI from 'openai';
import { Question } from './types';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const SECURITY_PLUS_TOPICS = `
1.0 General Security Concepts
- Security controls (Technical, Managerial, Operational, Physical)
- CIA Triad, Non-repudiation, AAA
- Zero Trust architecture
- Physical security measures
- Deception and disruption technology
- Change management processes
- Cryptographic solutions (PKI, encryption, hashing, digital signatures)

2.0 Threats, Vulnerabilities, and Mitigations
- Threat actors and motivations
- Attack vectors and surfaces
- Vulnerability types (application, OS, web, hardware, cloud, mobile)
- Malicious activity indicators
- Mitigation techniques

3.0 Security Architecture
- Architecture models (Cloud, IaC, Serverless, Microservices, IoT, ICS/SCADA)
- Enterprise infrastructure security
- Data protection strategies
- Resilience and recovery

4.0 Security Operations
- Hardening techniques
- Asset management
- Vulnerability management
- Monitoring and alerting
- Identity and access management
- Incident response
- Automation and orchestration

5.0 Security Program Management and Oversight
- Security governance
- Risk management
- Third-party risk assessment
- Compliance
- Audits and assessments
- Security awareness practices
`;

export async function generateSynthesisQuestion(excludeTopics: string[] = []): Promise<Question> {
  const prompt = `Generate a single CompTIA Security+ SY0-701 synthesis question that combines multiple security concepts.

IMPORTANT REQUIREMENTS:
1. The question must be a SYNTHESIS question that combines 2-3 different security topics
2. It should present a realistic scenario requiring application of multiple concepts
3. Include 4 answer options (A, B, C, D)
4. Provide the correct answer index (0-3)
5. Explain why the correct answer is right
6. Explain why each incorrect answer is wrong
7. Tag the question with relevant topic areas

Example of a synthesis question:
"A financial institution is migrating its core banking application to a public cloud provider using an IaaS model. They need to ensure data confidentiality and integrity, meet regulatory compliance (PCI DSS, GDPR), and maintain control over cryptographic keys. Which of the following actions should be prioritized?"

Topics to cover:
${SECURITY_PLUS_TOPICS}

${excludeTopics.length > 0 ? `Avoid these previously used topics: ${excludeTopics.join(', ')}` : ''}

Return ONLY a valid JSON object in this exact format (no markdown, no extra text):
{
  "question": "the question text",
  "options": ["option A", "option B", "option C", "option D"],
  "correctAnswer": 0,
  "explanation": "why the correct answer is right",
  "incorrectExplanations": ["why A is wrong", "why B is wrong", "why C is wrong", "why D is wrong"],
  "topics": ["topic1", "topic2", "topic3"],
  "difficulty": "medium"
}`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a CompTIA Security+ SY0-701 exam expert. Generate high-quality synthesis questions that test understanding across multiple security domains. Return only valid JSON, no markdown formatting."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.8,
    });

    const content = completion.choices[0]?.message?.content?.trim() || '';

    // Remove markdown code blocks if present
    const jsonContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    const questionData = JSON.parse(jsonContent);

    return {
      id: `q_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      question: questionData.question,
      options: questionData.options,
      correctAnswer: questionData.correctAnswer,
      explanation: questionData.explanation,
      incorrectExplanations: questionData.incorrectExplanations,
      topics: questionData.topics,
      difficulty: questionData.difficulty,
      createdAt: Date.now(),
    };
  } catch (error) {
    console.error('Error generating question:', error);
    throw new Error('Failed to generate question');
  }
}

export async function generateQuestionBatch(count: number, excludeTopics: string[] = []): Promise<Question[]> {
  const questions: Question[] = [];
  const usedTopics = [...excludeTopics];

  for (let i = 0; i < count; i++) {
    try {
      const question = await generateSynthesisQuestion(usedTopics);
      questions.push(question);
      usedTopics.push(...question.topics);

      // Add a small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error(`Error generating question ${i + 1}:`, error);
    }
  }

  return questions;
}
