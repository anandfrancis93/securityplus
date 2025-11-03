import { Question } from './types';
import { calculateIRTParameters, categoryToDifficulty } from './irt';
import { ALL_SECURITY_PLUS_TOPICS, TOPIC_INDEX, validateAITopics, findBestTopicMatch } from './topicData';
import { getDomainsFromTopics } from './domainDetection';
import { UnifiedAIProvider, createAIProvider } from './ai-providers';
import { getRelevantExamples } from './questionExamples';

// Initialize AI provider from environment variables
// Set NEXT_PUBLIC_AI_PROVIDER to 'grok' to use Grok instead of Gemini
// Default is Gemini for backward compatibility
let aiProvider: UnifiedAIProvider;

try {
  aiProvider = createAIProvider();
  const info = aiProvider.getProviderInfo();
  console.log(`Using AI Provider: ${info.name} (${info.model})`);
} catch (error) {
  console.error('Failed to initialize AI provider:', error);
  // Fallback to direct Gemini initialization for backward compatibility
  const { GoogleGenerativeAI } = require('@google/generative-ai');
  const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || '');
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });

  // Create a simple wrapper to match our interface
  aiProvider = {
    generateContent: async (prompt: string) => {
      const result = await model.generateContent({
        contents: [{
          role: 'user',
          parts: [{ text: prompt }]
        }],
        generationConfig: {
          maxOutputTokens: 2048,
          temperature: 0.8,
        },
      });
      return result.response.text().trim();
    },
    getProviderInfo: () => ({ name: 'Google Gemini (fallback)', model: 'gemini-2.5-flash-lite' }),
    getPricingInfo: () => ({ input: 0.0375, output: 0.15, unit: '1M tokens' })
  } as UnifiedAIProvider;
}

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
 * PASS 2: Validate topic tags using AI editorial judgment
 * Takes initial topic tags and applies Removal/Knowledge/Causal tests
 * to filter out contextual mentions that shouldn't be tagged
 */
async function validateTopicTagsWithAI(
  questionText: string,
  options: string[],
  correctAnswer: number | number[],
  explanation: string,
  initialTopics: string[]
): Promise<string[]> {
  const correctAnswerText = Array.isArray(correctAnswer)
    ? correctAnswer.map(i => options[i]).join(', ')
    : options[correctAnswer];

  // Mark which options are correct for clarity
  const correctIndices = Array.isArray(correctAnswer) ? correctAnswer : [correctAnswer];
  const optionsWithMarkers = options.map((opt, i) => {
    const marker = correctIndices.includes(i) ? '✅ CORRECT' : '❌ INCORRECT';
    return `${String.fromCharCode(65 + i)}) ${opt} [${marker}]`;
  });

  const prompt = `You are a CompTIA Security+ topic tagging validator. You will review topic tags for a question and apply strict editorial tests to REJECT tags that are contextual mentions, not core intent.

QUESTION:
${questionText}

ALL OPTIONS (with correct/incorrect markers):
${optionsWithMarkers.join('\n')}

EXPLANATION OF CORRECT ANSWER:
${explanation}

INITIALLY TAGGED TOPICS:
${initialTopics.map((t, i) => `${i + 1}. "${t}"`).join('\n')}

YOUR TASK: Review each topic and apply these three tests. If ANY test fails, REJECT the tag.

CRITICAL: If the CORRECT ANSWER explicitly mentions or requires a concept, that topic MUST be kept.
- Example: If correct answer says "verify against asset inventory," then "Inventory" is CORE INTENT, not context
- Example: If correct answer says "implement baseline enforcement," then "Baselines" is CORE INTENT, not context
- The actions/concepts in the correct answer ARE what's being tested

✅ KEEP TAG if ALL THREE pass:
1. **Removal Test**: If you removed this concept from the question, would the answer change or become unclear?
2. **Knowledge Test**: Must the test-taker understand this concept to select the correct answer?
3. **Causal Test**: Is this concept WHY a particular answer is correct?

❌ REJECT TAG if ANY of these apply:
1. **Scenario Flavor**: It's just background context to make the question realistic
2. **Substitution Test**: You could replace it with something else and the question still works the same way
3. **Industry Context**: It's mentioned to set the scene but not tested

EXAMPLES OF APPLYING TESTS:

Example 1: Question mentions "procurement of wireless access points" and asks about automation benefits for baseline enforcement
Correct answer: "Ensures consistent security configurations across all devices automatically"
Initial tags: ["Enforcing baselines (automation benefit)", "Acquisition/procurement process (asset management)"]

Analysis:
- "Enforcing baselines (automation benefit)":
  ✅ Correct answer explicitly mentions "security configurations" (baselines)
  ✅ Removal test: Remove "baselines" → question has no answer
  ✅ Knowledge test: Must understand baseline enforcement to select correct answer
  → KEEP

- "Acquisition/procurement process (asset management)":
  ❌ Correct answer does NOT mention procurement - it mentions automation benefits
  ❌ Substitution test: Replace "procurement" with "deploying" or "managing" → question works identically
  ❌ Scenario flavor: Procurement just tells you WHEN this happens, not what's being tested
  → REJECT

Final tags: ["Enforcing baselines (automation benefit)"]

Example 1b: Same question, but correct answer: "Streamlines vendor evaluation and security requirements during procurement"
- In THIS case, "Acquisition/procurement process" WOULD be kept because the correct answer explicitly tests procurement knowledge
- The correct answer determines what's tested!

Example 2: Question about legacy ICS with vulnerabilities that can't be patched, asks for remediation strategy
Correct answer: "Purchase cyber insurance to transfer financial risk associated with potential breaches"
Initial tags: ["Legacy applications (technical implication)", "Insurance (remediation)", "Transfer (risk strategy)", "One-time (risk assessment)", "Industrial control systems (ICS) (architecture model)"]

Analysis:
- "Legacy applications (technical implication)":
  ✅ Correct answer is BECAUSE of legacy system limitations (can't patch)
  ✅ Removal test: Remove "legacy" → patching difficulty no longer makes sense
  → KEEP

- "Insurance (remediation)", "Transfer (risk strategy)", "One-time (risk assessment)":
  ✅ Correct answer explicitly says "Purchase cyber insurance to transfer risk"
  ✅ All three concepts directly mentioned or required to select this answer
  → KEEP ALL

- "Industrial control systems (ICS) (architecture model)":
  ❌ Correct answer does NOT require ICS-specific knowledge
  ❌ Substitution test: Replace "ICS" with "database server" or "legacy SCADA" → question works the same
  ❌ Scenario flavor: Just makes question realistic, not testing ICS concepts
  → REJECT

Final tags: ["Legacy applications (technical implication)", "Insurance (remediation)", "Transfer (risk strategy)", "One-time (risk assessment)"]

Example 3: Question about hospital compliance with patient data encryption regulations
Correct answer: "Implement AES-256 encryption for all patient records to meet regulatory requirements"
Initial tags: ["Encryption (data protection method)", "Regulated (data type)", "Legal implications (privacy)", "Healthcare"]

Analysis:
- "Encryption (data protection method)":
  ✅ Correct answer explicitly says "Implement AES-256 encryption"
  ✅ Must know encryption is required for compliance
  → KEEP

- "Regulated (data type)", "Legal implications (privacy)":
  ✅ Correct answer mentions "regulatory requirements" - testing compliance knowledge
  → KEEP ALL

- "Healthcare":
  ❌ Correct answer does NOT require healthcare-specific knowledge
  ❌ Substitution test: Replace "hospital/patient" with "bank/customer" → question works identically
  ❌ Industry context: Just scene-setting, not testing healthcare security
  → REJECT

Final tags: ["Encryption (data protection method)", "Regulated (data type)", "Legal implications (privacy)"]

Example 4: SIEM alert about unidentified device, asks for initial analysis step
Correct answer: "Verify the device's details against the organization's asset inventory to confirm its legitimacy"
Initial tags: ["Confirmation (analysis)", "Inventory (asset management)"]

Analysis:
- "Confirmation (analysis)":
  ✅ Question explicitly asks about "analysis process" initial step
  ✅ Correct answer is performing confirmation through verification
  → KEEP

- "Inventory (asset management)":
  ✅ Correct answer explicitly says "against the organization's asset inventory"
  ✅ Knowledge test: Must know to use inventory for device verification (NOT logs, NOT scanning, NOT isolation)
  ✅ The specific ACTION in the answer is checking inventory
  → KEEP

- Without seeing the correct answer, you might think "unidentified device" is just context
- But the correct answer REQUIRES knowing to use asset inventory specifically
- The answer IS NOT just "confirm it" (generic) - it IS "check inventory" (specific)

Final tags: ["Confirmation (analysis)", "Inventory (asset management)"]

CRITICAL RULES:
1. ALWAYS check if the CORRECT ANSWER explicitly mentions or requires the concept
2. If correct answer says "check inventory" → Inventory is CORE, not context
3. If correct answer says "enforce baselines" → Baselines is CORE, not context
4. Ask: "Can I select the correct answer without understanding this topic?" If NO → KEEP
5. Background industries, timing contexts that DON'T appear in correct answer → usually REJECT
6. Specific actions/tools in the correct answer → ALWAYS KEEP

Return ONLY a valid JSON object with two arrays:
{
  "keep": ["exact topic string 1", "exact topic string 2", ...],
  "reject": [
    {"topic": "exact topic string", "reason": "brief reason (e.g., 'Substitution test fails - could replace with any industry')"},
    ...
  ]
}

No explanation outside the JSON, just the JSON object.`;

  try {
    const textContent = await aiProvider.generateContent(prompt, {
      maxOutputTokens: 1024,
      temperature: 0, // Deterministic for consistency
      useReasoning: true // Use reasoning model for editorial judgment
    });
    const jsonContent = textContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    const result: { keep: string[], reject: Array<{ topic: string, reason: string }> } = JSON.parse(jsonContent);

    // Validation
    if (!Array.isArray(result.keep) || !Array.isArray(result.reject)) {
      throw new Error('AI did not return valid keep/reject arrays');
    }

    // Log rejections with more detail
    if (result.reject.length > 0) {
      console.log(`\n[PASS 2 VALIDATION] 🔍 Rejected ${result.reject.length} contextual tag(s):`);
      result.reject.forEach((r, i) => {
        console.log(`  ${i + 1}. ❌ "${r.topic}"`);
        console.log(`     Reason: ${r.reason}`);
      });
    } else {
      console.log(`\n[PASS 2 VALIDATION] ✅ All tags passed editorial tests - no rejections`);
    }

    console.log(`\n[PASS 2 VALIDATION] ✅ Kept ${result.keep.length} core intent tag(s):`);
    result.keep.forEach((topic, i) => {
      console.log(`  ${i + 1}. "${topic}"`);
    });

    return result.keep;

  } catch (error) {
    console.error('[PASS 2 VALIDATION] Error validating topic tags with AI:', error);
    // Fallback: return original topics if validation fails
    console.warn('[PASS 2 VALIDATION] ⚠️ Validation failed, keeping all initial topics');
    return initialTopics;
  }
}

/**
 * PASS 1: Use AI to identify which topics a generated question actually tests
 * This is more accurate than keyword matching as it understands context and semantics
 */
async function identifyTopicsWithAI(
  questionText: string,
  options: string[],
  correctAnswer: number | number[],
  explanation: string
): Promise<string[]> {
  const correctAnswerText = Array.isArray(correctAnswer)
    ? correctAnswer.map(i => options[i]).join(', ')
    : options[correctAnswer];

  const prompt = `You just generated this CompTIA Security+ SY0-701 question:

QUESTION:
${questionText}

OPTIONS:
${options.map((opt, i) => `${String.fromCharCode(65 + i)}) ${opt}`).join('\n')}

CORRECT ANSWER: ${correctAnswerText}

EXPLANATION:
${explanation}

Here is the COMPLETE list of Security+ SY0-701 topics (organized by domain):

${JSON.stringify(ALL_SECURITY_PLUS_TOPICS, null, 2)}

Your task: Identify the CORE TOPICS this question is PRIMARILY testing - focus on INTENT, not everything mentioned.

CRITICAL DISTINCTION:
- "What is a firewall?" → CORE: ["Firewall (network security)"]
  ❌ NOT: ["Layer 4/Layer 7", "Packet filtering", "Stateful inspection", "Rule sets"]
  (Those are MENTIONED but not the PRIMARY focus)

- "Which firewall type prevents SQL injection?" → CORE: ["Web application firewall (WAF) (firewall type)", "Structured Query Language injection (SQLi) (web-based vulnerability)"]
  ✅ Testing: Understanding of WAF purpose and SQL injection
  ❌ NOT: Generic "firewall" or "database security" unless central to the answer

TAGGING DECISION CRITERIA (CRITICAL - READ CAREFULLY):

Use these tests to decide if a topic should be tagged:

✅ TAG IT if:
1. **Removal Test**: If you removed this concept from the question, would the answer change or become unclear?
2. **Knowledge Test**: Must the test-taker understand this concept to select the correct answer?
3. **Causal Test**: Is this concept WHY a particular answer is correct?

❌ DON'T TAG if:
1. **Scenario Flavor**: It's just background context to make the question realistic
2. **Substitution Test**: You could replace it with something else and the question still works the same way
3. **Industry Context**: It's mentioned to set the scene but not tested (e.g., "healthcare company", "manufacturing plant")

EXAMPLES WITH DETAILED ANALYSIS:

Example 1: "A legacy ICS has known vulnerabilities that can't be patched due to cost. What remediation strategy?"
✅ TAG: "Legacy applications (technical implication)"
   - Removal test: Remove "legacy" → vulnerabilities and patching difficulty no longer make sense
   - Knowledge test: Must understand legacy systems have patching challenges
   - Causal test: Legacy nature is WHY risk transfer/insurance is the answer
✅ TAG: "Insurance (remediation)", "Transfer (risk strategy)", "One-time (risk assessment)"
   - These are directly being tested by the question
❌ DON'T TAG: "Industrial control systems (ICS) (architecture model)"
   - Substitution test: Replace with "database server" or "network appliance" - question still works
   - It's scenario flavor, not testing ICS-specific knowledge
   - Question isn't asking "What is ICS?" or "How to secure ICS?"

Example 2: "A company uses AES-256 encryption. An attacker intercepts encrypted data. What attack could compromise it?"
✅ TAG: "Downgrade (cryptographic attack)" [if this is the answer]
   - Testing understanding of cryptographic attacks
❌ DON'T TAG: "AES-256" or generic "Encryption"
   - Just an example cipher, could be any encryption
   - Not testing AES-specific knowledge

Example 3: "After a phishing campaign, employees clicked malicious links. What security awareness training is needed?"
✅ TAG: "Phishing campaigns (security awareness)", "Recognizing a phishing attempt (phishing)"
   - Removal test: Remove phishing → question doesn't work
   - Core intent is phishing awareness
❌ DON'T TAG: "Email (message-based)"
   - Just the delivery mechanism, not being tested
   - Could be SMS phishing (smishing) and question works the same

Example 4: "A hospital must comply with regulations requiring patient data encryption. What is being enforced?"
✅ TAG: "Encryption (data protection method)", "Regulated (data type)", "Legal implications (privacy)"
   - Testing understanding of compliance and data protection
❌ DON'T TAG: "Hospital" or healthcare-specific topics
   - Industry context only, could be any regulated industry

EDGE CASE GUIDANCE:
- If unsure, ask: "Is the question testing knowledge of this topic, or just using it as scenery?"
- When multiple similar topics exist (e.g., 3 types of "Encryption"), choose the one matching the context
- Background technologies (cloud, on-prem, etc.) are usually NOT tagged unless security implications of that specific tech are being tested

EXACT STRING MATCHING (CRITICAL):
⚠️ Your response will be validated against the exact topic list above. You MUST:
1. Copy topic strings EXACTLY character-for-character (including parentheses, capitalization, punctuation)
2. Do NOT use shortcuts like "WAF" - use full string: "Web application firewall (WAF) (firewall type)"
3. Do NOT use "SQL Injection" - use: "Structured Query Language injection (SQLi) (web-based vulnerability)"
4. Do NOT use "IPSec" variations - use: "Internet protocol security (IPSec) (secure communication)"
5. If ambiguous (e.g., "Encryption" appears 3 times), choose the context-specific one:
   - "Encryption (mitigation)" for security controls
   - "Encryption (data protection method)" for data protection
   - "Encryption (backups)" for backup contexts

Rules:
1. Focus on CORE INTENT: What knowledge is absolutely required to answer correctly?
2. Distinguish between:
   - PRIMARY topics (what's being tested)
   - CONTEXTUAL topics (mentioned in question/options but not the focus)
   - DISTRACTOR topics (appear in wrong answers only)
3. ⚠️ Return EXACT topic strings from the list above - COPY them exactly, don't paraphrase
4. PREFER FEWER, MORE SPECIFIC topics over many related ones
5. Typically:
   - Easy questions: 1 topic (basic understanding)
   - Medium questions: 2-3 topics (application/synthesis)
   - Hard questions: 3-4 topics across domains (complex scenarios)
6. Maximum 5 topics (if you find more, you're over-extracting)

VALIDATION WARNING:
If you return a topic that doesn't match exactly, our system will try fuzzy matching.
However, this may result in the wrong topic being selected. To avoid errors:
- Find the topic in the list above
- Copy it EXACTLY as shown (including all parentheses and context markers)

Return ONLY a valid JSON array of exact topic strings:
["exact topic string 1", "exact topic string 2", ...]

No explanation, just the JSON array.`;

  try {
    // Use unified AI provider for topic identification
    const textContent = await aiProvider.generateContent(prompt, {
      maxOutputTokens: 1024,
      temperature: 0, // Deterministic for consistency
      useReasoning: true // Use reasoning model for accurate topic identification
    });
    const jsonContent = textContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    const extractedTopics: string[] = JSON.parse(jsonContent);

    // Validation: Should be array of strings
    if (!Array.isArray(extractedTopics)) {
      throw new Error('AI did not return an array');
    }

    // Sanity check: No question should test more than 5 topics (core intent focus)
    if (extractedTopics.length > 5) {
      console.warn(`⚠️ AI extracted ${extractedTopics.length} topics (over-extraction detected!)`);
      console.warn(`   Topics: ${extractedTopics.join(', ')}`);
      console.warn(`   Consider: AI may be including contextual topics instead of core intent`);
    }

    console.log(`[AI TOPIC ID] Raw AI output: ${extractedTopics.join(', ')}`);

    // 🔧 NEW: Validate and correct AI-returned topics using fuzzy matching
    const validation = validateAITopics(extractedTopics);

    // Log corrections and unmatched topics
    if (validation.corrections.length > 0) {
      console.log(`[TOPIC VALIDATION] Applied ${validation.corrections.length} corrections:`);
      validation.corrections.forEach(c => {
        console.log(`  📝 "${c.original}" → "${c.corrected}" (${c.confidence} confidence)`);
      });
    }

    if (validation.unmatched.length > 0) {
      console.error(`[TOPIC VALIDATION] ❌ ${validation.unmatched.length} unmatched topics:`);
      validation.unmatched.forEach(topic => {
        console.error(`  ❌ "${topic}"`);
        // Try to suggest best match
        const suggestion = findBestTopicMatch(topic);
        if (suggestion.match && suggestion.score > 0.5) {
          console.error(`     💡 Did AI mean: "${suggestion.match}"? (${(suggestion.score * 100).toFixed(1)}% match)`);
        }
      });
    }

    console.log(`[PASS 1 VALIDATION] ✅ Validated topics (${validation.matched.length}): ${validation.matched.join(', ')}`);

    // 🔧 PASS 2: Apply editorial judgment to filter out contextual mentions
    // This separates string matching (Pass 1) from editorial judgment (Pass 2)
    console.log(`\n========== PASS 2 VALIDATION START ==========`);
    console.log(`[PASS 2 VALIDATION] Input topics from Pass 1: ${validation.matched.join(', ')}`);
    console.log(`[PASS 2 VALIDATION] Applying editorial tests (Removal/Knowledge/Causal)...`);

    const finalTopics = await validateTopicTagsWithAI(
      questionText,
      options,
      correctAnswer,
      explanation,
      validation.matched
    );

    console.log(`[PASS 2 VALIDATION] Final topics after filtering: ${finalTopics.join(', ')}`);
    console.log(`[PASS 2 VALIDATION] Removed ${validation.matched.length - finalTopics.length} contextual tags`);
    console.log(`========== PASS 2 VALIDATION END ==========\n`);

    // Return final validated topics after both passes
    return finalTopics;

  } catch (error) {
    console.error('Error identifying topics with AI:', error);
    // Fallback: return empty array (will trigger fallback to requested topics)
    return [];
  }
}

/**
 * LEGACY: Keyword-based topic extraction (no longer used, kept for reference)
 * Replaced by AI-based identification which is more accurate
 */
function analyzeQuestionForTopics_LEGACY(
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

  return extractedTopics;
}

/**
 * Validate that explanations are consistent with their options
 * Now that options include letters (A. B. C. D.), validation is simpler:
 * - Extract the letter from each option
 * - Check that explanation references that same letter
 * - Check that explanation sentiment matches option correctness
 *
 * Returns validation result with issues found
 */
function validateExplanations(
  options: string[],
  correctAnswer: number | number[],
  incorrectExplanations: string[]
): { isValid: boolean; issues: string[] } {
  const issues: string[] = [];
  const correctIndices = Array.isArray(correctAnswer) ? correctAnswer : [correctAnswer];
  const expectedLetters = ['A', 'B', 'C', 'D'];

  for (let i = 0; i < options.length; i++) {
    const option = options[i] || '';
    const explanation = incorrectExplanations[i] || '';
    const isCorrectOption = correctIndices.includes(i);

    // Skip empty explanations
    if (!explanation.trim()) continue;

    // Extract letter from option (should be "A. ", "B. ", etc.)
    const letterMatch = option.match(/^([A-D])\.\s/);
    if (!letterMatch) {
      issues.push(`⚠️ Option ${i} is missing required letter prefix (should start with "${expectedLetters[i]}. ")`);
      continue;
    }

    const optionLetter = letterMatch[1];
    const expectedLetter = expectedLetters[i];

    // Verify option has correct letter for its position
    if (optionLetter !== expectedLetter) {
      issues.push(`⚠️ Option ${i} has letter "${optionLetter}" but should have "${expectedLetter}"`);
    }

    // Check if explanation references the correct letter
    const explanationLower = explanation.toLowerCase();
    const letterReferencePattern = new RegExp(`\\b${optionLetter.toLowerCase()}\\b`);

    if (!letterReferencePattern.test(explanationLower)) {
      issues.push(`⚠️ Explanation for option ${i} (${optionLetter}) doesn't reference letter "${optionLetter}"`);
    }

    // Check for sentiment contradictions
    const negativePatterns = /\b(incorrect|wrong|fails? to|lacks?|doesn't|does not|unable to|cannot|insufficient|inadequate|not (correct|right|appropriate|suitable))\b/i;
    const positivePatterns = /\b(correct|right|appropriate|suitable|best (option|answer|choice))\b/i;

    const hasNegative = negativePatterns.test(explanationLower);
    const hasPositive = positivePatterns.test(explanationLower);

    // Correct option should have positive sentiment (or at least not primarily negative)
    if (isCorrectOption && hasNegative && !hasPositive) {
      const matchedPhrase = explanationLower.match(negativePatterns)?.[0];
      issues.push(`⚠️ ${optionLetter} is CORRECT but explanation uses negative criticism: "${matchedPhrase}"`);
    }

    // Incorrect option should have negative sentiment (or at least not claim to be correct)
    if (!isCorrectOption && hasPositive && !hasNegative) {
      const matchedPhrase = explanationLower.match(positivePatterns)?.[0];
      issues.push(`⚠️ ${optionLetter} is INCORRECT but explanation uses positive language: "${matchedPhrase}"`);
    }
  }

  return {
    isValid: issues.length === 0,
    issues
  };
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

  // Ensure incorrectExplanations has exactly 4 elements
  // Fill missing elements with a default explanation
  const explanations = questionData.incorrectExplanations || [];
  const filledExplanations = [...Array(4)].map((_, i) => {
    const exp = explanations[i];
    // Return existing explanation if it's a non-empty string, otherwise provide default
    return (exp && typeof exp === 'string' && exp.trim() !== '')
      ? exp
      : `This option is ${i === questionData.correctAnswer ? 'correct' : 'incorrect'} based on the question requirements.`;
  });

  // Reorder explanations to match new option order
  const shuffledExplanations = shuffledIndices.map(i => filledExplanations[i]);

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

  // Get relevant examples from the multishot library
  const relevantExamples = getRelevantExamples(questionCategory, questionType);

  const categoryGuidance = {
    'single-domain-single-topic': `This is a SINGLE DOMAIN, SINGLE TOPIC question testing: "${topicStrings[0]}". Focus the question specifically on this one concept.

REFERENCE EXAMPLES FROM ACTUAL SECURITY+ QUESTIONS:

${relevantExamples}

Your question should follow these patterns: simple definition/identification, straightforward correct answer, tests one core concept.`,

    'single-domain-multiple-topics': `This is a SINGLE DOMAIN, MULTIPLE TOPICS question combining related topics from the same domain: ${topicStrings.map(t => `"${t}"`).join(', ')}. Create a realistic scenario that integrates these concepts.

REFERENCE EXAMPLES FROM ACTUAL SECURITY+ QUESTIONS:

${relevantExamples}

Your question should follow these patterns: scenario-based, requires understanding relationships between concepts, tests application of knowledge.`,

    'multiple-domains-multiple-topics': `This is a MULTIPLE DOMAINS, MULTIPLE TOPICS question combining topics across different Security+ domains: ${topicStrings.map(t => `"${t}"`).join(', ')}. Create a complex scenario that requires understanding how these concepts work together across domains.

REFERENCE EXAMPLES FROM ACTUAL SECURITY+ QUESTIONS:

${relevantExamples}

Your question should follow these patterns: complex scenario, integrates concepts from multiple domains, requires synthesis and analysis across security areas.`
  };

  const typeGuidance = questionType === 'single'
    ? 'This is a SINGLE-CHOICE question. Provide exactly ONE correct answer (index 0-3).'
    : 'This is a MULTIPLE-RESPONSE question (select all that apply). Provide 2-3 correct answers as an array of indices (e.g., [0, 2] or [1, 2, 3]). The question should ask "Which of the following are..." and end with "(Select all that apply)" - note: no period inside the parentheses.';

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

CRITICAL - EXPLANATION CONSISTENCY (VERY IMPORTANT):
- Each explanation in "incorrectExplanations" array corresponds to an option at the SAME INDEX
- If option at index 0 is CORRECT, explanation at index 0 must say WHY IT IS CORRECT
- If option at index 1 is INCORRECT, explanation at index 1 must say WHY IT IS WRONG
- NEVER write an explanation that contradicts whether the option is correct/incorrect
- NEVER discuss a different option's content in another option's explanation
- Example: If "Option B: Form a committee" is correct, its explanation must explain why forming a committee is correct
- DO NOT say "this incorrectly limits scope" for the CORRECT answer
- DO NOT say "this is the correct answer" for an INCORRECT answer

CRITICAL - TOPIC TAGGING (VERY IMPORTANT):
- In the "topics" array, you MUST include ONLY the EXACT topic strings provided above
- Use these EXACT strings character-for-character: ${topicStrings.map(t => `"${t}"`).join(', ')}
- Do NOT modify, paraphrase, or shorten these topic strings
- Do NOT add additional topics beyond those provided
- Do NOT introduce concepts from other Security+ domains not represented in the topic list
- The question should ONLY test knowledge of the provided topics - nothing more
- In metadata.primaryTopic, use the first topic from the list: "${topicStrings[0]}"

CRITICAL - FOLLOW THESE EXACT PATTERNS FROM SECURITY+ EXAM QUESTIONS:

1. OPTION LENGTH (based on difficulty level):

   EASY Questions (single-domain-single-topic):
   - Usually 1-2 words per option (e.g., "CIO", "CTO", "CISO")
   - OR 8-12 words for purpose/function questions (e.g., "To isolate and contain malicious files or processes")
   - Keep ALL options the SAME length within the question
   - Examples: All single words, OR all brief phrases, OR all complete sentences

   MEDIUM Questions (single-domain-multiple-topics):
   - Typically 1-5 words per option (e.g., "SAML", "VPN", "LDAP")
   - Up to 10 words for more detailed scenarios (e.g., "Intrusion Prevention System (IPS)")
   - Keep options similar length (don't vary wildly)

   HARD Questions (multiple-domains-multiple-topics):
   - 7-20 words per option (complete strategies or solutions)
   - Example: "Deploy Layer 7 firewalls on all network edges"
   - Example: "Evaluating the potential vendors' security measures, regulatory compliance, and history of handling sensitive data"
   - All options should be substantive and detailed

2. ALL OPTIONS MUST BE "SIBLING CONCEPTS" (CRITICAL):
   - 100% of options must be from the SAME category/domain
   - Wrong answers are "close but not quite right" - NOT unrelated concepts
   - Examples of CORRECT option grouping:
     * If testing CISO role → ALL options are executive roles (CIO, CTO, CEO, CISO)
     * If testing protocols → ALL options are protocols (HTTP, FTP, SMTP, SFTP)
     * If testing firewall deployment → ALL options mention Layer 4 or Layer 7
     * If testing security concepts → ALL options are security concepts (Vulnerability, Threat, Risk, Insider threat)
   - DO NOT mix domains (e.g., don't put "Physical security guard" as option for cloud security question)

3. KEYWORD USAGE (moderate repetition is NORMAL):
   - EASY questions: Direct keyword matching is ACCEPTABLE and expected
     * "What is sandbox?" can have answer mentioning "isolate and contain"
   - MEDIUM questions: Technical terms naturally repeat in context
     * Question about "SSO using XML" → Answer "SAML" is fine
   - HARD questions: Less direct repetition, answer requires synthesis
   - DO NOT over-avoid keywords - Security+ exams use standard terminology consistently

4. CONSISTENT FORMAT WITHIN EACH QUESTION:
   - If one option is an acronym, ALL options should be acronyms
   - If one option is a full strategy sentence, ALL should be full strategy sentences
   - If one option includes parenthetical explanation, ALL should match that style
   - Examples:
     * All acronyms: "IDS", "IPS", "NIDS", "HIDS"
     * All phrases: "After the workday", "Off-peak times", "Peak times", "Maintenance windows"
     * All detailed: "Deploy X on Y", "Rely solely on X for Y", "Deploy Z on W", "Use X for Y"

5. WRONG ANSWERS ARE "SIBLINGS, NOT STRANGERS":
   - Incorrect options should be plausible alternatives from the same family
   - Examples from actual Security+ questions:
     * CISO question: CIO and CTO are wrong but they're related executive roles
     * Layer 7 question: Three options mention Layer 4 (wrong layer for app attacks, but right technology type)
     * Salt question: TPM and IPSec are security tools but don't add random values to hashes
     * Asset management: Network segmentation is a security practice but not asset management
   - Wrong answers test whether student understands the DISTINCTION, not just the concept

Security+ Topics Reference (for context only):
${SECURITY_PLUS_TOPICS}

CRITICAL - INCLUDE LETTER PREFIXES IN OPTIONS AND EXPLANATIONS:
- You MUST put "A. ", "B. ", "C. ", "D. " at the start of each option text
- These letters stay permanently bound to the content through shuffling
- In explanations, you MUST reference the letter (e.g., "A is correct because..." or "B is incorrect because...")
- This creates explicit binding between options and explanations, preventing contradictions
- CORRECT EXAMPLES:
  * options: ["A. CISO", "B. CTO", "C. CIO", "D. CEO"]
  * explanations: ["A is correct because the CISO...", "B is incorrect because the CTO...", ...]
- Format: Use "A. " with a period and space (not "A)" or "A:")

Return ONLY a valid JSON object in this exact format (no markdown, no extra text):
{
  "question": "the question text",
  "options": ["A. first option text", "B. second option text", "C. third option text", "D. fourth option text"],
  "correctAnswer": ${questionType === 'single' ? '0' : '[0, 2]'},
  "explanation": "why the correct answer(s) are right (reference letter: 'A is correct because...')",
  "incorrectExplanations": ["explanation referencing A (e.g., 'A is correct because...' or 'A is incorrect because...')", "explanation referencing B", "explanation referencing C", "explanation referencing D"],
  "topics": ${JSON.stringify(topicStrings)},
  "difficulty": "${difficulty}",
  "metadata": {
    "primaryTopic": "${topicStrings[0]}",
    "scenario": "brief scenario type (e.g., 'certificate_validation', 'network_attack', 'access_control')",
    "keyConcept": "specific concept tested (e.g., 'CRL_vs_OCSP', 'DDoS_mitigation', 'RBAC_implementation')"
  }
}`;

  try {
    const systemPrompt = `You are a CompTIA Security+ SY0-701 exam expert. Generate high-quality exam questions that match the style, quality, and difficulty of actual Security+ exam questions.

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

CRITICAL - LETTER BINDING (PREVENTS CONTRADICTIONS):
11. Each option MUST start with its letter (A. B. C. or D. with period and space)
12. Each explanation MUST reference that same letter (e.g., "A is correct because...")
13. This binding prevents explanation contradictions - the letter travels with the content
14. After shuffling, "A. CISO" might appear in position 3, but it's still labeled "A. CISO"
15. NEVER write "A is incorrect" if A is the correct answer
16. NEVER write "B is correct" if B is an incorrect answer
17. The letter creates an explicit binding that makes contradictions impossible

Return only valid JSON, no markdown formatting.`;

    const fullPrompt = `${systemPrompt}

${prompt}`;

    // Use unified AI provider
    const textContent = await aiProvider.generateContent(fullPrompt, {
      maxOutputTokens: 2048,
      temperature: 0.5,  // Lower temperature for stricter instruction following
      useReasoning: true  // Use reasoning model for better question generation
    });

    // Remove markdown code blocks if present
    const jsonContent = textContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    const questionData = JSON.parse(jsonContent);

    // Letter prefixes (A. B. C. D.) are now intentionally kept in options
    // They bind the option content to explanations and prevent contradictions

    // Validate and fix incorrectExplanations array
    if (!Array.isArray(questionData.incorrectExplanations)) {
      questionData.incorrectExplanations = [];
    }

    // Ensure exactly 4 explanations (one for each option)
    questionData.incorrectExplanations = [...Array(4)].map((_, i) => {
      const exp = questionData.incorrectExplanations[i];
      // Return existing explanation if valid, otherwise provide default
      return (exp && typeof exp === 'string' && exp.trim() !== '')
        ? exp
        : `This option is ${i === questionData.correctAnswer ? 'correct' : 'incorrect'} based on the question requirements.`;
    });

    // VALIDATION: Check for contradictory explanations BEFORE shuffling
    const validationResult = validateExplanations(
      questionData.options,
      questionData.correctAnswer,
      questionData.incorrectExplanations
    );

    if (!validationResult.isValid) {
      console.error('❌ Generated question has contradictory explanations:');
      validationResult.issues.forEach(issue => console.error(`   ${issue}`));
      console.error('   Question:', questionData.question);
      console.error('   This question will be rejected and regeneration will be attempted.');

      // Throw error to trigger retry logic
      throw new Error(`Explanation validation failed: ${validationResult.issues.join('; ')}`);
    }

    console.log('✅ Explanation validation passed');

    // Shuffle the answer options to randomize correct answer position
    // Only shuffle for single-choice questions
    const shuffledData = questionType === 'single' ? shuffleQuestionOptions(questionData) : questionData;

    // For multiple-response questions, also ensure incorrectExplanations are valid
    if (questionType === 'multiple' && shuffledData.incorrectExplanations) {
      shuffledData.incorrectExplanations = shuffledData.incorrectExplanations.map((exp: any, i: number) => {
        return (exp && typeof exp === 'string' && exp.trim() !== '')
          ? exp
          : `This option is ${Array.isArray(shuffledData.correctAnswer) && shuffledData.correctAnswer.includes(i) ? 'correct' : 'incorrect'} based on the question requirements.`;
      });
    }

    // AI-BASED TOPIC IDENTIFICATION
    // Use AI to identify which topics the question actually tests
    // This is more accurate than keyword matching as AI understands context and semantics
    const extractedTopics = await identifyTopicsWithAI(
      shuffledData.question,
      shuffledData.options,
      shuffledData.correctAnswer,
      shuffledData.explanation
    );

    // Get all valid topics from the predefined topic list
    const allValidTopics = Object.values(ALL_SECURITY_PLUS_TOPICS).flat();

    // Filter extracted topics to ONLY include topics from our predefined list
    // This prevents the AI from creating creative topic names
    const validExtractedTopics = extractedTopics.filter((topic): topic is string =>
      topic != null &&
      typeof topic === 'string' &&
      topic.trim() !== '' &&
      allValidTopics.includes(topic)
    );

    // Log if AI created non-standard topics
    if (extractedTopics.length > validExtractedTopics.length) {
      const invalidTopics = extractedTopics.filter(t => !allValidTopics.includes(t));
      console.warn(`⚠️ AI generated non-standard topics (filtered out): ${invalidTopics.join(', ')}`);
    }

    // Fallback to requested topics if AI extraction fails or returns no valid topics
    const finalTopics = validExtractedTopics.length > 0 ? validExtractedTopics : topicStrings
      .filter((topic): topic is string =>
        topic != null &&
        typeof topic === 'string' &&
        topic.trim() !== '' &&
        allValidTopics.includes(topic)
      );

    // Log if AI couldn't identify any valid topics
    if (validExtractedTopics.length === 0) {
      console.warn(`⚠️ AI topic identification returned no valid topics, falling back to requested topics: ${topicStrings.join(', ')}`);
    }

    // Determine domains from extracted topics
    const domains = getDomainsFromTopics(finalTopics);
    const uniqueDomains = [...new Set(domains)];

    // Use REQUESTED category for difficulty (don't let AI override the distribution)
    const actualCategory = questionCategory;
    const actualDifficulty = categoryToDifficulty(questionCategory);
    const irtParams = calculateIRTParameters(questionCategory);

    // Calculate what AI would suggest for logging/monitoring
    const aiSuggestedCategory: 'single-domain-single-topic' | 'single-domain-multiple-topics' | 'multiple-domains-multiple-topics' =
      (uniqueDomains.length > 1) ? 'multiple-domains-multiple-topics' :
      (finalTopics.length > 1) ? 'single-domain-multiple-topics' :
      'single-domain-single-topic';

    const correctAnswerDisplay = Array.isArray(shuffledData.correctAnswer)
      ? `[${shuffledData.correctAnswer.join(', ')}]`
      : shuffledData.correctAnswer;

    // Log if AI suggestion differs from requested (for monitoring)
    if (aiSuggestedCategory !== questionCategory) {
      console.log(`ℹ️ AI suggested ${aiSuggestedCategory} (${finalTopics.length} topics) but using requested ${questionCategory} for difficulty`);
      console.log(`   Requested topics: ${topicStrings.join(', ')}`);
      console.log(`   Extracted topics: ${finalTopics.join(', ')}`);
    }

    console.log(`✅ Question generated: Category=${actualCategory}, Type=${questionType}, Difficulty=${actualDifficulty}, Correct=${correctAnswerDisplay}, IRT(b=${irtParams.irtDifficulty}, a=${irtParams.irtDiscrimination}), Points=${irtParams.maxPoints}`);

    // Final validation to ensure clean data
    const cleanedIncorrectExplanations = (shuffledData.incorrectExplanations || [])
      .map((exp: any) => {
        return (exp && typeof exp === 'string' && exp.trim() !== '')
          ? exp
          : 'This option is based on the question requirements.';
      });

    // Ensure exactly 4 explanations
    while (cleanedIncorrectExplanations.length < 4) {
      cleanedIncorrectExplanations.push('This option is based on the question requirements.');
    }

    // Ensure exactly 4 options
    const cleanedOptions = (shuffledData.options || [])
      .filter((opt: any) => opt != null && typeof opt === 'string' && opt.trim() !== '')
      .slice(0, 4);

    while (cleanedOptions.length < 4) {
      cleanedOptions.push(`Option ${cleanedOptions.length + 1}`);
    }

    return {
      id: `q_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      question: shuffledData.question || 'Question text not available',
      options: cleanedOptions,
      correctAnswer: shuffledData.correctAnswer,
      explanation: shuffledData.explanation || 'Explanation not available',
      incorrectExplanations: cleanedIncorrectExplanations,
      topics: finalTopics, // Use extracted topics, not requested topics
      difficulty: actualDifficulty, // Use derived difficulty from actual category
      questionType: questionType,
      questionCategory: actualCategory, // Use actual category based on extracted topics
      irtDifficulty: irtParams.irtDifficulty,
      irtDiscrimination: irtParams.irtDiscrimination,
      maxPoints: irtParams.maxPoints,
      metadata: shuffledData.metadata || {},
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
