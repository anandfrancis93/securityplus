# AI Question Generation Prompt Structure

This document shows exactly what prompts are sent to the AI when generating Security+ quiz questions.

## Prompt Components

Each AI request consists of:

### 1. **System Prompt** (~150 tokens)
```
You are a CompTIA Security+ SY0-701 exam expert. Generate high-quality exam
questions that match the style, quality, and difficulty of actual Security+
exam questions.

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
```

### 2. **Category Guidance** (~50 tokens)
Explains the difficulty level and what type of question to create:

- **Easy (Single-Domain-Single-Topic)**: "Focus the question specifically on this one concept."
- **Medium (Single-Domain-Multiple-Topics)**: "Create a realistic scenario that integrates these concepts."
- **Hard (Multiple-Domains-Multiple-Topics)**: "Create a complex scenario that requires understanding how these concepts work together across domains."

### 3. **Reference Examples** (~800-1000 tokens)
**THIS IS THE KEY ADDITION - YOUR 16 MULTISHOT EXAMPLES**

The AI receives 2 actual Security+ questions matching the requested difficulty:

#### For Easy Questions:
- Example 1: CISO role identification
- Example 2: SCADA industrial sectors

#### For Medium Questions:
- Example 1: Risk vs Vulnerability vs Threat scenario
- Example 2: Cryptographic salt explanation
- Example 3: IPS vs IDS selection
- Example 4: SAML/SSO identification
- Example 5: SFTP protocol selection
- Example 6: Alert fatigue concept
- Example 7: Healthcare compliance (due diligence)

#### For Hard Questions:
- Example 1: Layer 7 firewall deployment
- Example 2: Zero Trust architecture implementation
- Example 3: Third-party vendor IP protection
- Example 4: Asset management best practices (multiple-response)
- Example 5: Supply chain security factors (multiple-response)

Each example shows:
```
Question: "..."
Options: A) ... B) ... C) ... D) ...
Correct Answer: X
Topics: [exact topic strings]
Why this is a good [difficulty] question: [rationale]
```

### 4. **Topic Requirements** (~100 tokens)
```
TOPICS TO TEST:
You MUST create a question that tests these EXACT topics:
1. "[Exact topic string from database]"
2. "[Exact topic string from database]"
3. ...

CRITICAL - TOPIC TAGGING:
- Use these EXACT strings character-for-character
- Do NOT modify, paraphrase, or shorten these topic strings
- Do NOT add additional topics beyond those provided
```

### 5. **Quality Requirements** (~1000 tokens)

#### Length Variation Rules
```
- VARY the length of ALL answer options (15-60 words each)
- Make some INCORRECT answers LONGER than correct answers
- The correct answer should NOT always be the longest option
- Some correct answers should be SHORT (15-25 words)
- Some incorrect answers should be LONG but subtly wrong (40-60 words)
```

#### Plausible Distractors
```
- ALL incorrect options must be related to the same topic/domain
- Wrong answers should be "close but not quite right"
- Use common misconceptions, partial solutions
- Example: If testing IaC, ALL options involve IaC/cloud/security
```

#### Anti-Keyword Matching
```
- DO NOT repeat exact keywords from question in correct answer
- If question mentions "encryption", correct answer uses
  "cryptographic protection" or "secure data at rest"
- Use synonyms and paraphrasing
- Incorrect answers CAN use question keywords (to make them plausible)
```

#### Balanced Technical Depth
```
- All 4 options should have similar technical specificity
- If one option mentions tools/protocols, others should too
- Don't make correct answer obviously more professional
```

#### Subtle Incorrectness
```
Examples of good subtle incorrectness:
- Right tool, wrong use case
- Right concept, wrong implementation order
- Partially correct but missing critical component
- Correct for different scenario but not this one
```

### 6. **Security+ Topics Reference** (~200 tokens - abbreviated)
```
[Security+ Topics Reference - 5 domains with ~400 topics total]
1.0 General Security Concepts (controls, CIA, zero trust, physical security)
2.0 Threats, Vulnerabilities, and Mitigations (threat actors, attack vectors)
3.0 Security Architecture (cloud, IaC, network infrastructure, data protection)
4.0 Security Operations (hardening, asset management, vulnerability management)
5.0 Security Program Management (governance, risk management, compliance)
```

### 7. **JSON Output Format** (~150 tokens)
```json
{
  "question": "the question text",
  "options": ["option A", "option B", "option C", "option D"],
  "correctAnswer": 0,
  "explanation": "why the correct answer(s) are right",
  "incorrectExplanations": [
    "why option 0 is wrong/right",
    "why option 1 is wrong/right",
    "why option 2 is wrong/right",
    "why option 3 is wrong/right"
  ],
  "topics": ["Exact topic string 1", "Exact topic string 2"],
  "difficulty": "easy",
  "metadata": {
    "primaryTopic": "Exact topic string 1",
    "scenario": "brief scenario type",
    "keyConcept": "specific concept tested"
  }
}
```

## Total Prompt Size

**Approximate token counts:**
- System Prompt: 150 tokens
- Category Guidance: 50 tokens
- **Reference Examples: 800-1000 tokens** ⭐ (Your multishot examples)
- Topic Requirements: 100 tokens
- Quality Requirements: 1000 tokens
- Topics Reference: 200 tokens
- JSON Format: 150 tokens

**Total: ~2,450-2,650 tokens per request**

With AI response (up to 2,048 tokens), total conversation is ~4,500-5,000 tokens per question.

## Example: Easy Question Generation

```
System Prompt: "You are a CompTIA Security+ SY0-701 exam expert..."

Category: SINGLE-DOMAIN-SINGLE-TOPIC
Topic: "Firewall (network security device)"

Reference Examples:
  EXAMPLE 1 (EASY):
  Question: "An IT department is growing... CEO should hire for which position?"
  Options: A) CIO  B) CTO  C) CEO  D) CISO
  Correct Answer: D
  Topics: Chief Information Security Officer (CISO)
  Rationale: Simple role identification, tests basic understanding

  EXAMPLE 2 (EASY):
  Question: "A software engineer reviews SCADA... what sector?"
  Options: A) Energy  B) Fabrication  C) Facilities  D) Industrial
  Correct Answer: B
  Topics: SCADA, Industrial sectors
  Rationale: Straightforward classification question

Requirements:
- Test ONLY: "Firewall (network security device)"
- Vary answer lengths (15-60 words)
- Make distractors plausible (all related to network security)
- Avoid keyword matching
- Balance technical depth

Output: JSON with question, 4 options, correct answer, explanations
```

## Key Improvements from Multishot Examples

### Before (Generic Guidance)
- AI had to guess what "easy", "medium", "hard" meant
- No concrete patterns to follow
- Inconsistent question structure
- Variable answer quality

### After (With Your 16 Examples)
- ✅ AI sees actual Security+ question patterns
- ✅ Clear difficulty calibration (easy = CISO role, hard = Zero Trust architecture)
- ✅ Realistic business/technical scenarios modeled
- ✅ Proper distractor patterns demonstrated
- ✅ Multiple-response question formatting shown
- ✅ Appropriate complexity for each level

## Impact on Question Quality

The multishot examples teach the AI to:

1. **Match Security+ Exam Style**: Questions follow actual exam patterns
2. **Calibrate Difficulty**: Clear examples show what easy/medium/hard means
3. **Write Realistic Scenarios**: Business context, job roles, technical situations
4. **Create Quality Distractors**: Plausible wrong answers that test understanding
5. **Balance Answer Lengths**: Prevent test-taking strategy exploitation
6. **Use Proper Terminology**: Security+ specific language and concepts

---

## Testing the Prompts

You can see the exact prompts by running:
```bash
npx tsx test-prompt-display.ts
```

This script generates example prompts for all difficulty levels and question types.
