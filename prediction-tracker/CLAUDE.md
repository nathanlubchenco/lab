# Claude Code Development Notes

## Quiz Application Notes

### Real-Time Functionality
- The quiz application does not perform any real-time AI comparisons
- AI performance metrics shown are static historical benchmarks, not live comparisons
- Removed "real-time" references from user interface to avoid confusion
- AI scores displayed are based on published benchmark results, not dynamic evaluation

### Build and Testing Commands
- Build: `npm run build`
- Lint: `npm run lint`
- Development: `npm run dev`

### Architecture Notes
- Multi-benchmark quiz supporting MMLU, GPQA, and MATH datasets
- GPQA and MATH bypass difficulty selection and start quiz directly
- Uses Next.js 15 with App Router and TypeScript
- KaTeX integration for mathematical notation rendering

### Data Structure
- MMLU questions: organized by difficulty levels (easy, medium, hard)
- GPQA questions: 12 graduate-level science questions in src/data/gpqa_questions.json
- MATH questions: 15 competition mathematics questions in src/data/math_questions.json

### Question Coverage
- GPQA: 12 questions across Biology (4), Physics (4), Chemistry (4)
- MATH: 15 questions across Complex Numbers, Geometry, Algebra, Trigonometry, Number Theory, etc.
- MMLU: 150 questions across easy/medium/hard difficulties

### AI Performance Benchmarks (2025 State-of-Art)
- MMLU: ~92% (widely considered saturated, OpenAI o1 achieves 91.8%)
- GPQA Diamond: ~86% (Gemini 2.5 Pro, biology questions remain hardest)
- MATH 500: ~95% (Gemini 2.5 Pro, suggests heavy pre-training exposure)

### Benchmark Status Notes
- MMLU: Many labs treat ≥90% as solved, rely on harder private variants
- GPQA: Still differentiates models; tool-augmented runs can push >90%
- MATH: Labs pivoting to private "FrontierMath" or AIME-2025 for cleaner signals

### Debugging Black Screen Issues
If GPQA/MATH show black screens:
1. Check browser console for errors
2. Component now shows error messages if questions fail to load
3. Fallback state shows debug information including current screen and question count
4. Questions should load from src/data/benchmark_questions.json structure