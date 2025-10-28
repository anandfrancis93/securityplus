# Question Similarity Checking System

## Overview

This system prevents duplicate or nearly-identical questions from appearing in the same quiz by using semantic similarity detection with OpenAI embeddings.

## The Problem

Without similarity checking, the AI can generate questions that are semantically identical even if the wording differs slightly. For example:

**Question 1:**
> A security analyst discovers that an attacker captured valid authentication tokens from legitimate user sessions and is now resubmitting these tokens to gain unauthorized access to a web application...

**Question 2:**
> A security analyst discovers that an attacker intercepted authentication tokens from legitimate user sessions and is now submitting those captured tokens to gain unauthorized access to the application...

These questions are 95%+ similar despite using different words ("captured" vs "intercepted").

## How It Works

### 1. Embedding Generation
- When a new question is generated, it's converted to a vector embedding using OpenAI's `text-embedding-3-small` model
- The embedding captures the semantic meaning of the question and its options
- Cost: ~$0.000002 per question (~100 tokens)

### 2. Similarity Comparison
- The new question's embedding is compared to all existing questions in the quiz using cosine similarity
- Cosine similarity returns a score from 0 to 1:
  - `0.0` = Completely different
  - `0.5` = Somewhat similar
  - `0.85` = Very similar (our threshold)
  - `1.0` = Identical

### 3. Retry Logic
- If similarity > 85%, the question is rejected
- The system retries up to 3 times to generate a unique question
- Different topics/categories are selected on each retry
- If all retries fail, the last candidate is used (with a warning logged)

## Configuration

### Environment Variables

Add to your `.env.local`:

```bash
# OpenAI API Key (for embeddings - similarity checking)
OPENAI_API_KEY=sk-...your-key-here
```

### Adjustable Parameters

In `app/api/generate-single-question/route.ts`:

```typescript
const question = await generateUniqueQuestion(
  async () => { ... },
  existingQuestions,
  3,      // Max retries (default: 3)
  0.85    // Similarity threshold (default: 0.85)
);
```

**Threshold Guidelines:**
- `0.95+` = Nearly identical (too strict, will reject too many)
- `0.85` = Very similar (recommended)
- `0.75` = Somewhat similar (too lenient)
- `0.65` = Different topic area (too lenient)

## Cost Analysis

### Per Question
- **Claude generation**: $0.01-0.03 per question
- **Similarity checking**: $0.00002 per question
- **Total overhead**: <0.1% increase

### Per 10-Question Quiz
- **Without similarity checking**: $0.10-0.30
- **With similarity checking**: $0.10002-0.30002
- **Additional cost**: $0.0002 (negligible)

### Monthly (1000 quizzes)
- **Similarity checking cost**: ~$0.20/month
- **Prevents**: Dozens of duplicate questions
- **User experience**: Significantly improved

## Architecture

### Files Modified/Created

1. **`lib/similarityCheck.ts`** (NEW)
   - `generateQuestionEmbedding()` - Creates embedding for a question
   - `cosineSimilarity()` - Calculates similarity between embeddings
   - `checkQuestionSimilarity()` - Checks if question is too similar
   - `generateUniqueQuestion()` - Retry logic wrapper

2. **`app/api/generate-single-question/route.ts`** (MODIFIED)
   - Retrieves existing questions from quiz session
   - Uses `generateUniqueQuestion()` wrapper
   - Logs similarity scores for monitoring

3. **`.env.example`** (MODIFIED)
   - Added `OPENAI_API_KEY` documentation

## Logging

The system logs detailed information:

```
[SIMILARITY CHECK] Max similarity: 92.3% (threshold: 85%)
[UNIQUENESS] Attempt 1/3 to generate unique question
[UNIQUENESS] ✗ Question too similar (92.3%), retrying...
Similar to: "A security analyst discovers that an attacker captured..."
[UNIQUENESS] Attempt 2/3 to generate unique question
[UNIQUENESS] ✓ Question is unique (similarity: 67.4%)
```

## Failure Modes

### Graceful Degradation
- If OpenAI API is down: System allows questions through (fail open)
- If session retrieval fails: Skips similarity checking
- If all retries exhausted: Uses last candidate (with warning)

### Why Fail Open?
- Prevents entire quiz system from breaking due to OpenAI issues
- User experience: Better to have occasional duplicate than broken quiz
- Monitoring: Failures are logged for alerting

## Testing

### Manual Testing
1. Generate a quiz with 10 questions
2. Monitor logs for similarity scores
3. Look for rejected questions (should be rare)

### Expected Behavior
- Most questions: 30-70% similarity (different topics)
- Occasional: 75-84% similarity (related topics, still allowed)
- Rare: 85%+ similarity (rejected and regenerated)

### Testing Similar Questions
To test the system, you can temporarily lower the threshold to 0.70 and observe more rejections:

```typescript
const question = await generateUniqueQuestion(
  async () => { ... },
  existingQuestions,
  3,
  0.70  // Lower threshold for testing
);
```

## Performance Impact

### Latency
- Embedding generation: ~50-100ms per question
- Comparison: <1ms per existing question
- **Total added latency**: ~500ms for 10-question comparison

### Scalability
- Linear time complexity: O(n) where n = existing questions
- For 10-question quiz: ~500ms total
- For 100-question quiz: ~5s total (not a concern for our use case)

## Future Improvements

### Optimization Options
1. **Cache embeddings**: Store embeddings with questions in database
   - Saves API calls on comparison
   - Faster lookups
   - Requires database schema change

2. **Batch embedding generation**: Generate embeddings in parallel
   - Reduces latency
   - More efficient API usage

3. **Approximate similarity search**: Use vector database (Pinecone, Weaviate)
   - Sub-linear time complexity
   - Overkill for 10-question quizzes

4. **Adaptive thresholds**: Adjust based on question category
   - Stricter for single-domain questions
   - More lenient for cross-domain questions

## Troubleshooting

### "OPENAI_API_KEY environment variable is not set"
**Solution**: Add `OPENAI_API_KEY=sk-...` to your `.env.local` file

### Questions still appear similar
**Possible causes**:
1. Threshold too high (lower from 0.85 to 0.80)
2. Retry limit too low (increase from 3 to 5)
3. Check logs to verify similarity checking is running

### Slow question generation
**Possible causes**:
1. OpenAI API latency (check status.openai.com)
2. Multiple retries happening (check logs for rejection messages)
3. Network issues (check your connection)

## Monitoring

### Key Metrics to Track
1. **Rejection rate**: How often questions are rejected (should be <10%)
2. **Retry count**: How many retries per question (should average <0.5)
3. **Similarity distribution**: Most should be 30-70%
4. **API latency**: Embedding generation time (should be <100ms)

### Log Analysis
```bash
# Count rejections
grep "Question too similar" logs.txt | wc -l

# Check average similarity
grep "Max similarity" logs.txt | awk '{print $4}'

# Monitor retries
grep "Attempt" logs.txt | grep "Uniqueness"
```

## Cost Management

### If Costs Become an Issue
1. **Increase threshold** to 0.90 (fewer rejections = fewer retries)
2. **Reduce retries** to 2 instead of 3
3. **Cache embeddings** to avoid regenerating for existing questions
4. **Sample checking**: Only check against random subset of existing questions

### Current Cost Estimate
- 10,000 questions/month: ~$0.20/month
- Negligible compared to Claude API costs (~$100-300/month)

## Security Considerations

### API Key Protection
- Never commit `.env.local` to git
- Use environment variables in production
- Rotate keys periodically

### Rate Limiting
- OpenAI has rate limits (tier-dependent)
- Our usage: ~1-30 requests per minute (well below limits)
- No additional rate limiting needed

## Support

For issues or questions:
1. Check logs for error messages
2. Verify OpenAI API key is valid
3. Test with a simple embedding request
4. Check OpenAI status page

---

**Last Updated**: 2025-01-27
**Version**: 1.0.0
