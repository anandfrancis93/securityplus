# EXACT AI PROMPT EXAMPLE

This shows the **complete, actual prompt** sent to the AI when generating a Security+ question.

---

## FULL PROMPT (Example: Medium Difficulty Question)

```
You are a CompTIA Security+ SY0-701 exam expert. Generate high-quality exam questions that match the style, quality, and difficulty of actual Security+ exam questions.

CRITICAL QUALITY RULES:
1. FOLLOW THE REFERENCE EXAMPLES provided - they are actual Security+ style questions
2. MATCH THE DIFFICULTY LEVEL of the examples for the requested category
3. ONLY test the exact topics provided - do not introduce unrelated domains
4. Use ONLY the exact topic strings provided in the "topics" array
5. ALL answer options must be plausible and related to the question topic
6. VARY answer lengths - don't make correct answer always longest or shortest
7. AVOID repeating keywords from question in correct answer - use synonyms
8. Make incorrect answers subtly wrong, not obviously unrelated
9. All options should have similar technical depth and specificity
10. Use realistic business/technical scenarios like the examples show

Return only valid JSON, no markdown formatting.

Generate a single CompTIA Security+ SY0-701 exam question.

QUESTION CATEGORY: SINGLE-DOMAIN-MULTIPLE-TOPICS
This is a SINGLE DOMAIN, MULTIPLE TOPICS question combining related topics from the same domain: "Web Application Firewall (WAF) (firewall type)", "Structured Query Language injection (SQLi) (web-based vulnerability)", "Layer 4/Layer 7 (firewall types)". Create a realistic scenario that integrates these concepts.

REFERENCE EXAMPLES FROM ACTUAL SECURITY+ QUESTIONS:

EXAMPLE 1 (MEDIUM - single-domain-multiple-topics):

Question: "An information technology (IT) manager is trying to persuade the chief financial officer (CFO) to sign off on a new support and update contract for the company's virtualized environment. The CFO sees this as a waste of money since the company already has the environment up and running. The IT manager explained to the CFO that the company will no longer receive security updates to protect the environment. What describes the level of hazard posed by NOT keeping the systems up-to-date?"

Options:
A) Vulnerability
B) Threat
C) Risk
D) Insider threat

Correct Answer: C

Topics: Risk (security concept), Vulnerability (security concept), Patching (mitigation technique)

Why this is a good medium question:
Scenario-based question testing understanding of risk vs vulnerability vs threat concepts, requires application of knowledge to business context.

---

EXAMPLE 2 (MEDIUM - single-domain-multiple-topics):

Question: "A security engineer investigates the impacts of a recent breach in which a threat actor was able to exfiltrate company data. What cryptographic solution serves as a countermeasure that mitigates the impact of hash table attacks by adding a random value to each plaintext input?"

Options:
A) Trusted Platform Module
B) Salt
C) Internet Protocol Security
D) IPSec

Correct Answer: B

Topics: Salting (cryptographic technique), Hashing (cryptographic technique), Data breach response

Why this is a good medium question:
Tests understanding of salt in cryptography context, requires connecting breach scenario to cryptographic countermeasures.


Your question should follow these patterns: scenario-based, requires understanding relationships between concepts, tests application of knowledge.

QUESTION TYPE: SINGLE
This is a SINGLE-CHOICE question. Provide exactly ONE correct answer (index 0-3).

TOPICS TO TEST:
You MUST create a question that tests these EXACT topics:
1. "Web Application Firewall (WAF) (firewall type)"
2. "Structured Query Language injection (SQLi) (web-based vulnerability)"
3. "Layer 4/Layer 7 (firewall types)"

CRITICAL REQUIREMENTS:
1. Create a question that ONLY tests the topics listed above - do not introduce concepts from other domains
2. Present a realistic Security+ exam scenario
3. Include 4 answer options (A, B, C, D)
4. Explain why the correct answer(s) are right
5. Explain why each option is correct or wrong (provide 4 explanations)

CRITICAL - TOPIC TAGGING (VERY IMPORTANT):
- In the "topics" array, you MUST include ONLY the EXACT topic strings provided above
- Use these EXACT strings character-for-character: "Web Application Firewall (WAF) (firewall type)", "Structured Query Language injection (SQLi) (web-based vulnerability)", "Layer 4/Layer 7 (firewall types)"
- Do NOT modify, paraphrase, or shorten these topic strings
- Do NOT add additional topics beyond those provided
- Do NOT introduce concepts from other Security+ domains not represented in the topic list
- The question should ONLY test knowledge of the provided topics - nothing more
- In metadata.primaryTopic, use the first topic from the list: "Web Application Firewall (WAF) (firewall type)"

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
[Full 5-domain Security+ topic list here - ~3000 tokens]

Return ONLY a valid JSON object in this exact format (no markdown, no extra text):
{
  "question": "the question text",
  "options": ["option A", "option B", "option C", "option D"],
  "correctAnswer": 0,
  "explanation": "why the correct answer(s) are right",
  "incorrectExplanations": ["why option 0 is wrong/right", "why option 1 is wrong/right", "why option 2 is wrong/right", "why option 3 is wrong/right"],
  "topics": ["Web Application Firewall (WAF) (firewall type)","Structured Query Language injection (SQLi) (web-based vulnerability)","Layer 4/Layer 7 (firewall types)"],
  "difficulty": "medium",
  "metadata": {
    "primaryTopic": "Web Application Firewall (WAF) (firewall type)",
    "scenario": "brief scenario type (e.g., 'certificate_validation', 'network_attack', 'access_control')",
    "keyConcept": "specific concept tested (e.g., 'CRL_vs_OCSP', 'DDoS_mitigation', 'RBAC_implementation')"
  }
}
```

---

## KEY OBSERVATIONS

### ✅ What's GOOD About Current Quality Rules:

1. **Length Variation (15-60 words)** - Good range, prevents guessing by length
2. **Plausible Distractors** - Emphasizes "close but not quite right" wrong answers
3. **Avoid Keyword Matching** - Prevents telegraphing the answer
4. **Balanced Technical Depth** - All options should be equally technical
5. **Subtle Incorrectness** - Provides good examples of how to make wrong answers

### ⚠️ What Might Need Updating Based on Your 16 Examples:

Looking at your actual examples, I notice:

#### 1. **Answer Lengths in Your Examples:**
- Example 1 (CISO): Options are 1-2 words each ("CIO", "CTO", "CISO")
- Example 4 (SAML): Options are 1-2 words each ("SAML", "VPN", "LDAP")
- Example 10 (Sandbox): Options are 6-15 words each

**Current Rule Says:** 15-60 words each
**Your Examples Show:** Often 1-5 words for easy questions, 10-30 words for medium/hard

#### 2. **All Options Same Domain:**
Your examples perfectly follow this - all options are related. For example:
- CISO question: All options are executive roles (CIO, CTO, CEO, CISO)
- Firewall question: All options mention firewalls/Layer 4/Layer 7
- SAML question: All options are authentication/access technologies

#### 3. **Scenario Complexity:**
- **Easy questions:** Straightforward, minimal scenario (1-2 sentences)
- **Medium questions:** Moderate scenario with context (2-3 sentences)
- **Hard questions:** Complex scenario with multiple stakeholders/requirements (3-5 sentences)

---

## RECOMMENDATION: Should We Update Quality Rules?

**YES** - Here's what should be adjusted:

### Proposed Update to LENGTH VARIATION Rule:

```
1. LENGTH VARIATION (prevent length-based guessing):
   EASY QUESTIONS (single-domain-single-topic):
   - Options can be very short: 1-5 words (e.g., acronyms, role titles, tool names)
   - OR 10-20 words if definitional
   - Keep all options similar length within the question

   MEDIUM QUESTIONS (single-domain-multiple-topics):
   - Options: 10-30 words each
   - VARY the length - some short, some longer
   - Make some INCORRECT answers LONGER than correct answer

   HARD QUESTIONS (multiple-domains-multiple-topics):
   - Options: 20-50 words each
   - More detailed, may include multiple components
   - VARY significantly - correct answer can be short OR long
   - Some incorrect answers should be very detailed but subtly wrong
```

This better matches your actual Security+ examples where:
- Easy questions often have 1-word answers (CISO, SAML, Salt)
- Medium questions have moderate-length options
- Hard questions have longer, more complex options

Would you like me to update the prompt with these more accurate length guidelines based on your 16 examples?