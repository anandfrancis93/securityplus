# Security+ SY0-701 Learning Platform - Comprehensive User Guide

## Application Structure (Real Component Mapping)

```
Security+ Learning Platform
│
├─ HomePage (Component: components/HomePage.tsx, Route: /)
│   │
│   ├─ <button> Hamburger Menu (className: text-gray-400 hover:text-white)
│   │   └─ Dropdown Menu (when menuOpen === true)
│   │       ├─ User Display Name (user?.displayName || 'User')
│   │       └─ <button> Sign Out (onClick: handleSignOut)
│   │
│   ├─ <h1> "Learning Hub" (className: text-5xl font-bold)
│   │
│   ├─ <p> "Select a subject to begin studying" (className: text-gray-400 text-lg)
│   │
│   └─ Subject Cards Grid (className: grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3)
│       ├─ <button> Cybersecurity Card (subjects[0], onClick: router.push('/cybersecurity'))
│       │   ├─ Icon: '🔒'
│       │   ├─ Name: 'Cybersecurity'
│       │   └─ disabled: false
│       ├─ <button> Networking Card (subjects[1], disabled: true)
│       │   ├─ Icon: '🌐'
│       │   ├─ Name: 'Networking'
│       │   ├─ Description: 'Coming soon'
│       │   └─ <span> "Coming Soon" Badge
│       ├─ <button> Maths Card (subjects[2], disabled: true)
│       ├─ <button> Physics Card (subjects[3], disabled: true)
│       └─ <button> English Card (subjects[4], disabled: true)
│
├─ CybersecurityPage (Component: components/CybersecurityPage.tsx, Route: /cybersecurity)
│   │
│   ├─ Initial View (selectedCard === null)
│   │   │
│   │   ├─ <button> Back Arrow (onClick: router.back())
│   │   │
│   │   ├─ <button> Hamburger Menu
│   │   │   └─ Dropdown Menu
│   │   │       ├─ User Display Name
│   │   │       └─ <button> Sign Out
│   │   │
│   │   ├─ <h1> "Cybersecurity" (className: text-4xl font-bold)
│   │   │
│   │   └─ Cards Grid (className: grid grid-cols-1 md:grid-cols-2 gap-6)
│   │       ├─ <button> Quiz Card (onClick: setSelectedCard('quiz'))
│   │       │   ├─ Icon: '❓'
│   │       │   ├─ Title: "Quiz"
│   │       │   └─ Description: "Test your knowledge with adaptive AI-generated questions"
│   │       ├─ <button> Flashcards Card (onClick: router.push('/cybersecurity/flashcards'))
│   │       │   ├─ Icon: '📚'
│   │       │   ├─ Title: "Flashcards"
│   │       │   ├─ Description: "Create and study flashcards with spaced repetition"
│   │       │   └─ <span> Badge: "X cards due"
│   │       ├─ <button> PBQ Card (disabled: true)
│   │       │   ├─ Icon: '💻'
│   │       │   ├─ Title: "PBQ"
│   │       │   ├─ Description: "Performance-Based Questions"
│   │       │   └─ <span> "Coming Soon" Badge
│   │       └─ <button> Simulate Exam Card (disabled: true)
│   │           ├─ Icon: '⏱️'
│   │           ├─ Title: "Simulate Exam"
│   │           ├─ Description: "Take a timed 90-minute exam"
│   │           └─ <span> "Coming Soon" Badge
│   │
│   ├─ Quiz Options View (selectedCard === 'quiz' && quizOption === null)
│   │   │
│   │   ├─ <button> Back Arrow (onClick: setSelectedCard(null))
│   │   │
│   │   ├─ <button> Hamburger Menu
│   │   │
│   │   ├─ <h1> "Quiz" (className: text-3xl font-bold)
│   │   │
│   │   └─ Options Grid (className: grid grid-cols-1 md:grid-cols-2 gap-6)
│   │       ├─ <button> Start New Quiz (onClick: handleStartQuiz)
│   │       │   ├─ Icon: '🚀'
│   │       │   ├─ Title: "Start New Quiz"
│   │       │   └─ Description: "Take 10 AI-generated synthesis questions"
│   │       └─ <button> Performance (onClick: setQuizOption('performance'))
│   │           ├─ Icon: '📊'
│   │           ├─ Title: "Performance"
│   │           └─ Description: "View your scores, IRT analysis, and history"
│   │
│   └─ Performance View (selectedCard === 'quiz' && quizOption === 'performance')
│       │
│       ├─ <button> Back Arrow (onClick: setQuizOption(null))
│       │
│       ├─ <button> Hamburger Menu
│       │
│       ├─ <h1> "Performance" (className: text-3xl font-bold)
│       │
│       └─ <PerformanceGraphs> Component (userProgress prop)
│           │
│           ├─ Predicted Score Card (<div> className: bg-gray-800 rounded-lg)
│           │   ├─ <h2> "Predicted Score" (className: text-xl text-gray-400)
│           │   ├─ Score Display (predictedScore variable)
│           │   └─ Hover Tooltip (<div> className: absolute bottom-full)
│           │       ├─ Green: 750 - 900
│           │       ├─ Yellow: 600 - 749
│           │       └─ Red: 100 - 599
│           │
│           ├─ Statistics Cards (<div> className: grid grid-cols-1 md:grid-cols-3)
│           │   ├─ Questions Answered Card
│           │   │   ├─ <h3> "Questions Answered"
│           │   │   └─ Value: totalAnswered
│           │   ├─ Overall Accuracy Card
│           │   │   ├─ <h3> "Overall Accuracy"
│           │   │   └─ Value: accuracy
│           │   └─ Current Ability (IRT) Card
│           │       ├─ <h3> "Current Ability (IRT)"
│           │       ├─ Value: estimatedAbility
│           │       └─ Phase 1 Warning (if !hasSufficientData)
│           │           ├─ <div> className: bg-yellow-900/20 border-yellow-600
│           │           └─ Text: "Phase 1: Need 15 questions for reliable estimates"
│           │
│           ├─ Interactive Performance Graphs
│           │   ├─ <LineChart> Ability Level Over Time (Recharts)
│           │   │   ├─ XAxis: Quiz number
│           │   │   ├─ YAxis: IRT Ability (θ)
│           │   │   ├─ <Line> dataKey="ability"
│           │   │   ├─ <ReferenceLine> y={0} label="Average"
│           │   │   └─ <ReferenceLine> y={1} label="Target"
│           │   ├─ <LineChart> Predicted Score Over Time
│           │   │   ├─ XAxis: Quiz number
│           │   │   ├─ YAxis: Predicted Score (100-900)
│           │   │   ├─ <Line> dataKey="predictedScore"
│           │   │   └─ <ReferenceLine> y={750} label="Passing (750)"
│           │   ├─ <BarChart> Accuracy by Difficulty
│           │   │   ├─ XAxis: Difficulty
│           │   │   ├─ YAxis: Accuracy %
│           │   │   └─ <Bar> dataKey="accuracy" fill="#3b82f6"
│           │   ├─ <BarChart> Performance by SY0-701 Domain
│           │   │   ├─ XAxis: Accuracy %
│           │   │   ├─ YAxis: Domain
│           │   │   ├─ <Bar> dataKey="accuracy"
│           │   │   └─ layout="vertical"
│           │   └─ <LineChart> Study Volume Over Time
│           │       ├─ XAxis: Quiz number
│           │       ├─ YAxis: Cumulative questions
│           │       └─ <Line> dataKey="cumulative"
│           │
│           ├─ Topic Coverage by Domain (5 tables)
│           │   ├─ Domain 1.0 Table
│           │   │   ├─ <h3> "1.0 General Security Concepts"
│           │   │   ├─ Coverage Summary (e.g., "45 of 93 topics covered")
│           │   │   └─ <table> className: w-full
│           │   │       ├─ <thead> (Topic, Times Covered, Accuracy)
│           │   │       └─ <tbody>
│           │   │           └─ Topic rows with color-coded accuracy
│           │   ├─ Domain 2.0 Table
│           │   ├─ Domain 3.0 Table
│           │   ├─ Domain 4.0 Table
│           │   └─ Domain 5.0 Table
│           │
│           ├─ IRT Explanation Section (Collapsible)
│           │   ├─ <button> Toggle (onClick: setIrtExpanded(!irtExpanded))
│           │   │   ├─ Icon: ChevronDown/ChevronUp
│           │   │   └─ Text: "What is IRT?"
│           │   └─ Content (if irtExpanded === true)
│           │       ├─ <h3> "Item Response Theory (IRT)"
│           │       ├─ Explanation text
│           │       └─ Ability scale description
│           │
│           ├─ Recent Quizzes Section (Collapsible)
│           │   ├─ <button> Toggle (onClick: setRecentQuizzesExpanded)
│           │   │   ├─ Icon: ChevronDown/ChevronUp
│           │   │   └─ Text: "Recent Quizzes (X)"
│           │   └─ Content (if recentQuizzesExpanded === true)
│           │       └─ Quiz List (userProgress?.quizHistory.slice(-5))
│           │           └─ <button> Quiz Item (onClick: setSelectedQuizForReview(quiz))
│           │               ├─ Date & Time (quiz.startedAt)
│           │               ├─ Question Count (quiz.questions.length)
│           │               ├─ Incomplete Badge (if questions.length < 10)
│           │               ├─ Time Taken (quiz.endedAt - quiz.startedAt)
│           │               └─ Score Display (quiz.score / quiz.questions.length)
│           │
│           └─ <button> Reset Progress (onClick: handleResetProgress)
│               ├─ className: bg-red-600 hover:bg-red-700
│               └─ Text: "Reset Progress"
│
├─ QuizPage (Component: components/QuizPage.tsx, Route: /cybersecurity/quiz)
│   │
│   ├─ <button> Hamburger Menu
│   │   └─ Dropdown Menu
│   │       ├─ User Display Name
│   │       └─ <button> Sign Out
│   │
│   ├─ <button> End Quiz (onClick: handleEndQuiz)
│   │   └─ Text: "End Quiz"
│   │
│   ├─ Progress Bar (<div> className: w-full bg-gray-700)
│   │   ├─ Text: "Question {currentQuestionIndex + 1} of {totalQuestions}"
│   │   └─ Progress Fill (style: width: percentage)
│   │
│   ├─ Question Card (if !showExplanation)
│   │   │
│   │   ├─ <h2> "Question {currentQuestionIndex + 1}"
│   │   │
│   │   ├─ <h2> Question Text (currentQuestion.question)
│   │   │
│   │   ├─ Multi-Select Notice (if currentQuestion.questionType === 'multiple')
│   │   │   └─ <div> className: bg-blue-900/20 border-blue-600
│   │   │       └─ Text: "Select all that apply - This question has multiple correct answers"
│   │   │
│   │   ├─ Answer Options (<div> className: space-y-3)
│   │   │   │
│   │   │   ├─ Single-Select (if questionType !== 'multiple')
│   │   │   │   └─ Radio Buttons (4 options)
│   │   │   │       └─ <button> Option (onClick: setSelectedAnswer(idx))
│   │   │   │           ├─ <div> Radio Circle (className: w-5 h-5 rounded-full)
│   │   │   │           ├─ Letter: String.fromCharCode(65 + idx)
│   │   │   │           └─ Text: currentQuestion.options[idx]
│   │   │   │
│   │   │   └─ Multi-Select (if questionType === 'multiple')
│   │   │       └─ Checkboxes (4 options)
│   │   │           └─ <button> Option (onClick: toggleMultipleAnswer(idx))
│   │   │               ├─ <div> Checkbox (className: w-5 h-5 rounded)
│   │   │               ├─ Letter: String.fromCharCode(65 + idx)
│   │   │               └─ Text: currentQuestion.options[idx]
│   │   │
│   │   └─ <button> Submit Answer (onClick: handleSubmitAnswer)
│   │       ├─ disabled: (selectedAnswer === null && selectedAnswers.length === 0)
│   │       └─ Text: "Submit Answer"
│   │
│   ├─ Explanation View (if showExplanation)
│   │   │
│   │   ├─ Color-Coded Answer Options
│   │   │   └─ Options with visual indicators
│   │   │       ├─ Green border/bg: Correct answers (✓)
│   │   │       ├─ Red border/bg: Incorrect selections (✗)
│   │   │       └─ Gray bg: Unselected options
│   │   │
│   │   ├─ Result Box (<div> with conditional border color)
│   │   │   ├─ Border: Green (correct), Yellow (partial), Red (incorrect)
│   │   │   ├─ <h3> Status: "✓ Correct!" / "◐ Partially Correct" / "✗ Incorrect"
│   │   │   ├─ Difficulty Badge (currentQuestion.difficulty)
│   │   │   │   ├─ Easy: bg-green-700/30 text-green-300
│   │   │   │   ├─ Medium: bg-yellow-700/30 text-yellow-300
│   │   │   │   └─ Hard: bg-red-700/30 text-red-300
│   │   │   ├─ Correct Answer(s) Section
│   │   │   │   ├─ <p> "Correct Answer:" or "Correct Answers:"
│   │   │   │   └─ Answer text with letter labels
│   │   │   └─ Explanation Section
│   │   │       ├─ <p> "Explanation:"
│   │   │       └─ currentQuestion.explanation
│   │   │
│   │   ├─ Why Others Wrong Box (<div> className: bg-gray-800 rounded-lg)
│   │   │   ├─ <h4> "Why Other Answers Are Incorrect:"
│   │   │   └─ Incorrect explanations list
│   │   │       └─ currentQuestion.incorrectExplanations[idx]
│   │   │
│   │   ├─ Domain & Topics Box (<div> className: bg-gray-800 rounded-lg)
│   │   │   ├─ Domain Line
│   │   │   │   ├─ <span> "Domain:"
│   │   │   │   └─ <span> getDomainFromTopics(currentQuestion.topics)
│   │   │   └─ Topics Line
│   │   │       ├─ <span> "Topics:"
│   │   │       └─ Topic badges (currentQuestion.topics.map)
│   │   │
│   │   └─ <button> Next (onClick: handleNextQuestion)
│   │       └─ Text: "Next"
│   │
│   └─ Quiz Complete Modal (if showCelebration)
│       ├─ Confetti Animation (<ReactConfetti>)
│       ├─ <h2> "Quiz Complete! 🎉"
│       ├─ Statistics
│       │   ├─ Questions answered
│       │   ├─ Correct answers
│       │   └─ Accuracy percentage
│       └─ <button> Return to Home (onClick: router.push('/cybersecurity'))
│
├─ QuizReviewModal (Component: components/QuizReviewModal.tsx, Modal)
│   │ Trigger: <button> Quiz Item in Recent Quizzes
│   │ Props: { quiz: QuizSession, onClose: () => void }
│   │
│   ├─ Modal Backdrop (<div> onClick: onClose, style: position: fixed, zIndex: 999998)
│   │
│   ├─ Modal Content (<div> style: position: fixed, zIndex: 999999)
│   │   │
│   │   ├─ Header (className: sticky top-0 bg-gray-800)
│   │   │   ├─ <h2> "Quiz Review"
│   │   │   ├─ Quiz Metadata
│   │   │   │   ├─ Date: new Date(quiz.startedAt).toLocaleDateString()
│   │   │   │   ├─ Time: new Date(quiz.startedAt).toLocaleTimeString()
│   │   │   │   ├─ Questions: quiz.questions.length
│   │   │   │   └─ Duration: (quiz.endedAt - quiz.startedAt) formatted
│   │   │   ├─ Score Display
│   │   │   │   └─ "{quiz.score} / {quiz.questions.length} ({percentage}%)"
│   │   │   ├─ Incomplete Badge (if !quiz.completed)
│   │   │   │   └─ <span> className: bg-yellow-700/30 text-yellow-400
│   │   │   └─ <button> Close (X) (onClick: onClose)
│   │   │
│   │   ├─ Questions List (className: p-6 space-y-8)
│   │   │   │
│   │   │   └─ quiz.questions.map((attempt, index) =>
│   │   │       │
│   │   │       ├─ Question Number Badge
│   │   │       │   └─ <div> className: w-8 h-8 rounded-full bg-blue-600
│   │   │       │       └─ Text: {index + 1}
│   │   │       │
│   │   │       ├─ Question Card (<div> className: bg-gray-800 rounded-lg)
│   │   │       │   ├─ <h2> attempt.question.question
│   │   │       │   └─ Answer Options (with color coding)
│   │   │       │       ├─ Radio/Checkbox indicators
│   │   │       │       ├─ Green: Correct (border-green-500 bg-green-900/20)
│   │   │       │       ├─ Red: Incorrect (border-red-500 bg-red-900/20)
│   │   │       │       └─ Gray: Unselected (border-gray-600 bg-gray-700/50)
│   │   │       │
│   │   │       ├─ Result Box (with conditional border)
│   │   │       │   ├─ Status Header (attempt.isCorrect)
│   │   │       │   ├─ Difficulty Badge (question.difficulty)
│   │   │       │   ├─ Correct Answer(s)
│   │   │       │   └─ Explanation (question.explanation)
│   │   │       │
│   │   │       ├─ Why Others Wrong Box
│   │   │       │   └─ question.incorrectExplanations.map()
│   │   │       │
│   │   │       └─ Domain & Topics Box
│   │   │           ├─ getDomainFromTopics(question.topics)
│   │   │           └─ question.topics.map()
│   │   │
│   │   └─ Footer (className: sticky bottom-0 bg-gray-800)
│   │       └─ <button> Close Review (onClick: onClose)
│   │
│   └─ Modal Features
│       ├─ Escape Key Listener (useEffect with window.addEventListener)
│       ├─ Body Scroll Lock (document.body.style.overflow = 'hidden')
│       └─ Mounted State (useState for portal rendering)
│
├─ FlashcardsPage (Component: app/cybersecurity/flashcards/page.tsx, Route: /cybersecurity/flashcards)
│   │
│   ├─ <button> Back Arrow (onClick: router.back())
│   │
│   ├─ <button> Hamburger Menu
│   │   └─ Dropdown Menu
│   │       ├─ User Display Name
│   │       └─ <button> Sign Out
│   │
│   ├─ <h1> "Flashcards"
│   │
│   ├─ Statistics Cards (<div> className: grid grid-cols-2 md:grid-cols-4)
│   │   ├─ Total Cards (<div> stats.total)
│   │   ├─ Learning Cards (<div> stats.learning)
│   │   ├─ Review Cards (<div> stats.reviewing)
│   │   └─ Mastered Cards (<div> stats.mastered)
│   │
│   ├─ Action Buttons Row (<div> className: flex flex-wrap gap-4)
│   │   │
│   │   ├─ <button> Create New Flashcard (onClick: setShowCreateForm(!showCreateForm))
│   │   │   └─ Text: "Create New Flashcard"
│   │   │
│   │   ├─ <button> Study Due Cards (onClick: router.push('/cybersecurity/flashcards/study'))
│   │   │   ├─ Text: "Study Due Cards ({dueCount})"
│   │   │   └─ disabled: dueCount === 0
│   │   │
│   │   └─ <button> Reset Progress (onClick: handleResetProgress)
│   │       └─ Text: "Reset Progress"
│   │
│   ├─ Create Form (if showCreateForm)
│   │   │
│   │   ├─ <input> Term (value: newCard.term, onChange: setNewCard)
│   │   │   ├─ type: "text"
│   │   │   ├─ required: true
│   │   │   └─ minLength: 2
│   │   │
│   │   ├─ <textarea> Definition (value: newCard.definition)
│   │   │   ├─ required: true
│   │   │   ├─ minLength: 10
│   │   │   └─ rows: 4
│   │   │
│   │   ├─ <textarea> Context (value: newCard.context, optional)
│   │   │   └─ rows: 2
│   │   │
│   │   ├─ <select> Domain (value: newCard.domain)
│   │   │   ├─ <option> "1.0 General Security Concepts"
│   │   │   ├─ <option> "2.0 Threats, Vulnerabilities, and Mitigations"
│   │   │   ├─ <option> "3.0 Security Architecture"
│   │   │   ├─ <option> "4.0 Security Operations"
│   │   │   └─ <option> "5.0 Security Program Management and Oversight"
│   │   │
│   │   ├─ Image Upload Section
│   │   │   ├─ <input> type="file" (onChange: handleImageSelect, ref: fileInputRef)
│   │   │   │   └─ accept: "image/*"
│   │   │   ├─ Image Preview (if selectedImage)
│   │   │   │   └─ <img> src: URL.createObjectURL(selectedImage)
│   │   │   └─ <button> Remove (X) (onClick: clearImage)
│   │   │
│   │   ├─ <button> Cancel (onClick: reset form, setShowCreateForm(false))
│   │   │
│   │   └─ <button> Create (onClick: handleCreateCard)
│   │       └─ disabled: !newCard.term || !newCard.definition
│   │
│   ├─ <input> Search (value: searchQuery, onChange: setSearchQuery)
│   │   ├─ type: "text"
│   │   └─ placeholder: "Search flashcards..."
│   │
│   └─ Flashcards List (<div> className: grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3)
│       │
│       └─ filteredCards.map(card =>
│           │
│           ├─ Card Container (<div> className: bg-gray-800 rounded-lg)
│           │   │
│           │   ├─ Domain Badge (<span> className: absolute top-4 right-4)
│           │   │   └─ Text: card.domain.split(' ')[0]
│           │   │
│           │   ├─ <h3> Term (card.term, className: text-xl font-bold)
│           │   │
│           │   ├─ Image (if card.imageUrl)
│           │   │   └─ <img> (onClick: open lightbox, src: card.imageUrl)
│           │   │       └─ Lightbox Modal (if selectedImageForLightbox)
│           │   │           ├─ <div> Backdrop (onClick: close)
│           │   │           ├─ <img> Full-size
│           │   │           └─ <button> Close (X)
│           │   │
│           │   ├─ Action Buttons (<div> className: flex gap-2)
│           │   │   ├─ <button> Edit (onClick: setEditingCard(card))
│           │   │   │   └─ Icon: Pencil SVG
│           │   │   └─ <button> Delete (onClick: handleDeleteCard)
│           │   │       └─ Icon: Trash SVG
│           │   │
│           │   └─ Review Status (<div> className: text-sm text-gray-400)
│           │       └─ Text: "New" or "Next review: {date}"
│           │
│           └─ Edit Modal (if editingCard === card)
│               ├─ Modal Backdrop (onClick: close)
│               ├─ Modal Content (style: position: fixed, zIndex: 999999)
│               │   ├─ <button> Close (X)
│               │   ├─ Form Fields (same as Create)
│               │   │   ├─ <input> Term (value: editingCard.term)
│               │   │   ├─ <textarea> Definition
│               │   │   ├─ <textarea> Context
│               │   │   ├─ <select> Domain
│               │   │   └─ Image Upload
│               │   │       ├─ Current Image Display
│               │   │       ├─ <button> Remove Current Image
│               │   │       └─ <input> Upload New Image
│               │   ├─ <button> Cancel
│               │   └─ <button> Save Changes (onClick: handleSaveEdit)
│               └─ Escape Key Listener
│
├─ StudyFlashcards (Component: app/cybersecurity/flashcards/study/page.tsx, Route: /cybersecurity/flashcards/study)
│   │
│   ├─ <button> Back Arrow (onClick: router.push('/cybersecurity/flashcards'))
│   │
│   ├─ <h1> "Study Flashcards"
│   │
│   ├─ Loading State (if loading)
│   │   └─ <div> Loading spinner
│   │
│   ├─ No Cards State (if !loading && dueCards.length === 0)
│   │   ├─ <p> "No cards due for review!"
│   │   └─ <button> Back to Flashcards
│   │
│   ├─ Active Study Session (if dueCards.length > 0)
│   │   │
│   │   ├─ Progress Display
│   │   │   ├─ <p> "Card {currentCardIndex + 1} of {dueCards.length}"
│   │   │   └─ Progress Bar (<div> style: width: percentage)
│   │   │
│   │   ├─ Flashcard Display (<div> onClick: setIsFlipped(!isFlipped))
│   │   │   │
│   │   │   ├─ Front Side (if !isFlipped)
│   │   │   │   ├─ Domain Badge (<span> className: absolute top-4 left-4)
│   │   │   │   │   └─ Text: currentCard.domain.split(' ')[0]
│   │   │   │   ├─ <div> "Term" Label (className: text-center text-gray-400)
│   │   │   │   ├─ <h2> Term (currentCard.term, className: text-3xl font-bold)
│   │   │   │   ├─ Image (if currentCard.imageUrl)
│   │   │   │   │   └─ <img> (onClick: open lightbox)
│   │   │   │   └─ <p> "Click to flip" (className: text-gray-500 text-sm)
│   │   │   │
│   │   │   └─ Back Side (if isFlipped)
│   │   │       ├─ Domain Badge
│   │   │       ├─ <div> "Definition" Label
│   │   │       ├─ <p> Definition (currentCard.definition)
│   │   │       ├─ Context (if currentCard.context)
│   │   │       │   └─ <p> className: italic text-gray-400
│   │   │       └─ Image (if currentCard.imageUrl)
│   │   │
│   │   └─ Rating Buttons (if isFlipped) (<div> className: grid grid-cols-4 gap-4)
│   │       │
│   │       ├─ <button> Again (onClick: handleRating('again'))
│   │       │   ├─ className: bg-red-600 hover:bg-red-700
│   │       │   ├─ Text: "Again"
│   │       │   └─ Subtext: "< 1 min"
│   │       │
│   │       ├─ <button> Hard (onClick: handleRating('hard'))
│   │       │   ├─ className: bg-orange-600 hover:bg-orange-700
│   │       │   ├─ Text: "Hard"
│   │       │   └─ Subtext: calculated interval
│   │       │
│   │       ├─ <button> Good (onClick: handleRating('good'))
│   │       │   ├─ className: bg-green-600 hover:bg-green-700
│   │       │   ├─ Text: "Good"
│   │       │   └─ Subtext: calculated interval
│   │       │
│   │       └─ <button> Easy (onClick: handleRating('easy'))
│   │           ├─ className: bg-blue-600 hover:bg-blue-700
│   │           ├─ Text: "Easy"
│   │           └─ Subtext: calculated interval
│   │
│   ├─ Session Complete (if studyComplete)
│   │   ├─ <h2> "Study session complete!"
│   │   ├─ Statistics
│   │   │   ├─ Cards reviewed
│   │   │   └─ Time spent
│   │   └─ <button> Back to Flashcards
│   │
│   └─ Keyboard Shortcuts (useEffect with window.addEventListener)
│       ├─ ' ' (Space): Toggle flip (setIsFlipped)
│       ├─ '1': Rate as Again
│       ├─ '2': Rate as Hard
│       ├─ '3': Rate as Good
│       └─ '4': Rate as Easy
│
├─ AuthModal (Component: components/AuthModal.tsx, Modal)
│   │ Props: { onClose: () => void, onSuccess?: () => void }
│   │ Trigger: Not authenticated
│   │
│   ├─ Modal Backdrop (onClick: onClose)
│   │
│   ├─ Modal Content (<div> className: bg-gray-800 rounded-lg)
│   │   ├─ <h2> "Sign in to continue"
│   │   ├─ <button> Google Sign In (onClick: handleGoogleSignIn)
│   │   │   ├─ Google Logo SVG
│   │   │   └─ Text: "Sign in with Google"
│   │   └─ <button> Close (X) (onClick: onClose)
│   │
│   └─ Escape Key Listener
│
└─ SyncDevicesModal (Component: components/SyncDevicesModal.tsx, Modal)
    │ Props: { onClose: () => void }
    │
    ├─ Modal Backdrop (onClick: onClose)
    │
    ├─ Modal Content (<div> className: bg-gray-800 rounded-lg)
    │   ├─ <h2> "Sync Across Devices"
    │   ├─ Instructions (<div> className: space-y-4)
    │   │   ├─ Step 1: Sign in with Google
    │   │   ├─ Step 2: Use same account on other devices
    │   │   └─ Step 3: Progress syncs automatically
    │   └─ <button> Close (onClick: onClose)
    │
    └─ Escape Key Listener
```

---

## Color Coding Reference

Performance Indicators
│
├─ Green
│   ├─ Accuracy ≥80%
│   ├─ Correct answers
│   ├─ Passing scores (≥750)
│   └─ Easy difficulty
│
├─ Yellow
│   ├─ Accuracy 60-79%
│   ├─ Partially correct (multi-select)
│   ├─ Medium difficulty
│   └─ Needs improvement scores (600-749)
│
├─ Red
│   ├─ Accuracy <60%
│   ├─ Incorrect answers
│   ├─ Hard difficulty
│   └─ Below passing scores (<600)
│
├─ Blue
│   ├─ Selected answers (before submission)
│   ├─ Interactive elements
│   └─ Primary action buttons
│
└─ Gray
    ├─ Unselected/neutral options
    ├─ Disabled buttons
    ├─ Secondary information
    └─ Unvisited topics (0 attempts)

---

## Keyboard Shortcuts

StudyFlashcards
│
├─ Spacebar: Toggle flip (setIsFlipped(!isFlipped))
├─ 1: Rate as Again (handleRating('again'))
├─ 2: Rate as Hard (handleRating('hard'))
├─ 3: Rate as Good (handleRating('good'))
└─ 4: Rate as Easy (handleRating('easy'))

Modals
│
└─ Escape: Close modal (onClose())

---

## Data Persistence

All user data is automatically saved to Firebase:

Quiz Progress
│
├─ Answer history
├─ Points earned
├─ IRT ability estimates
├─ Topic performance
└─ Quiz sessions

Flashcards
│
├─ Flashcard content (term, definition, context, domain, imageUrl)
├─ Review history
├─ Next review dates (nextReview)
├─ Ease factors (easeFactor)
└─ Repetition counts (repetitions)

Authentication
│
├─ Google account (user.displayName, user.email)
├─ User ID (userId)
└─ Session tokens

---

**End of User Guide**

*Last Updated: Based on actual codebase structure*
