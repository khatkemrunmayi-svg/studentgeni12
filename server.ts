import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json());

// Initialize Google Gen AI client if key exists
let aiClient: GoogleGenAI | null = null;
const apiKey = process.env.GEMINI_API_KEY;
if (apiKey) {
  try {
    aiClient = new GoogleGenAI({ apiKey });
  } catch (err) {
    console.error('Failed to initialize GoogleGenAI client:', err);
  }
}

// AI Tutor chat endpoint
app.post('/api/tutor', async (req, res) => {
  try {
    const { message, subject, chapter, mode, board, history } = req.body;

    if (!message || typeof message !== 'string') {
      res.status(400).json({ error: 'Message is required' });
      return;
    }

    const targetBoard = board || 'Maharashtra SSC';
    const systemPrompt = `You are "StudyGenie", the AI Learning Assistant for Class 10 (EduAdapt 10), specialized in:
1. Maharashtra State Board (SSC Class 10 Balbharati curriculum)
2. CBSE (Class 10 NCERT curriculum)
3. ICSE (Class 10 CISCE curriculum)

Active Student Context:
- Target Board: ${targetBoard}
- Subject: ${subject || 'Class 10 Core'}
- Chapter: ${chapter || 'General'}
- Mode: ${mode || 'standard'} (Modes: 'explain_simple', 'step_by_step_numerical', 'board_exam_tips', 'memory_trick')
- Motto: "Don't study harder. Learn smarter."

Pedagogical Rules:
1. For Maharashtra State Board (SSC):
   - Align with Balbharati textbook standards, question bank blueprints, and official activity questions.
   - Use standard Balbharati conventions for Cramer's Rule, quadratic formula, BPT, Pythagoras, Kepler's laws, Hope's apparatus, and geography (India & Brazil).
2. For CBSE:
   - Align with NCERT Class 10 textbooks, official CBSE marking scheme rubrics (+½ mark formula, +1 mark calculation), and exemplar problems.
3. For ICSE:
   - Align with CISCE Class 10 standards (Concise Selina), compulsory Section A formatting, and exact scientific definitions.
4. For all numericals:
   - Always state given variables, formula, step-by-step substitution, and boxed final answer with SI units.
5. Tone: Encouraging, cheerful, clear, and structured with bold concepts and markdown lists. Always end with a "💡 ${targetBoard} Exam Tip" or "⚠️ Common Pitfall".`;

    if (aiClient) {
      try {
        const contents = [
          { role: 'user', parts: [{ text: `${systemPrompt}\n\nStudent question:\n${message}` }] }
        ];

        // Model selection following gemini-api guidelines: basic text tasks use gemini-3.8-flash
        const response = await aiClient.models.generateContent({
          model: 'gemini-3.8-flash',
          contents,
        });

        const reply = response.text || "I'm here to help you conquer your Class 10 concepts! Could you rephrase your question?";
        res.json({ reply, source: 'gemini' });
        return;
      } catch (geminiError: any) {
        console.warn('Gemini API call failed, falling back to intelligent knowledge base:', geminiError?.message);
      }
    }

    // Intelligent fallback curated responses for Class 10 when offline or without API key
    const fallbackResponse = generateCuratedResponse(message, subject, mode);
    res.json({ reply: fallbackResponse, source: 'curated' });
  } catch (error: any) {
    console.error('Error in /api/tutor:', error);
    res.status(500).json({ error: 'Internal server error', details: error?.message });
  }
});

// Quick question solver / hint generator
app.post('/api/hint', async (req, res) => {
  try {
    const { question, subject } = req.body;
    if (aiClient) {
      try {
        const response = await aiClient.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: `You are StudyGenie. Give a concise 2-sentence conceptual hint for this Class 10 ${subject} question without giving away the full answer immediately:\n\n"${question}"`,
        });
        res.json({ hint: response.text });
        return;
      } catch (err) {
        // Fall back below
      }
    }

    res.json({
      hint: "Identify the fundamental law or formula connecting the given variables, check unit consistency (SI units), and draw a rough mental diagram before solving!"
    });
  } catch (err: any) {
    res.status(500).json({ error: err?.message });
  }
});

// Helper for curated responses
function generateCuratedResponse(msg: string, subject?: string, mode?: string): string {
  const lower = msg.toLowerCase();

  if (lower.includes('quadratic') || lower.includes('root') || lower.includes('discriminant')) {
    return `### 📐 Quadratic Equations — Quick Mastery

For any quadratic equation $ax^2 + bx + c = 0$ ($a \\neq 0$):

1. **Discriminant ($D$):**
   $$D = b^2 - 4ac$$
2. **Nature of Roots (CBSE Must-Know):**
   - If $D > 0$: **Two distinct real roots**
   - If $D = 0$: **Two equal real roots** ($x = -b / 2a$)
   - If $D < 0$: **No real roots** (imaginary)
3. **Quadratic Formula:**
   $$x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$$

💡 **Exam Tip:** In board exams, examiners award 1 full mark just for writing the formula and calculating $D$ before writing the final roots!`;
  }

  if (lower.includes('trig') || lower.includes('sin') || lower.includes('cos') || lower.includes('tan')) {
    return `### 📐 Trigonometry Shortcuts & Key Identities

**The 3 Golden Identities:**
1. $\\sin^2 \\theta + \\cos^2 \\theta = 1$
2. $1 + \\tan^2 \\theta = \\sec^2 \\theta$
3. $1 + \\cot^2 \\theta = \\operatorname{cosec}^2 \\theta$

**Standard Values Memory Trick (Finger Rule for 0°, 30°, 45°, 60°, 90°):**
- $\\sin \\theta = \\frac{\\sqrt{\\text{fingers below}}}{2}$
- $\\cos \\theta = \\frac{\\sqrt{\\text{fingers above}}}{2}$
- $\\tan \\theta = \\frac{\\sin \\theta}{\\cos \\theta}$

💡 **Exam Tip:** When proving identities in Section D, always convert all trigonometric ratios into terms of $\\sin \\theta$ and $\\cos \\theta$ on the LHS first!`;
  }

  if (lower.includes('ohm') || lower.includes('resistance') || lower.includes('electricity') || lower.includes('circuit')) {
    return `### ⚡ Ohm's Law & Circuit Rules (Physics)

**Ohm's Law:** At constant temperature, the potential difference ($V$) across the ends of a metallic conductor is directly proportional to current ($I$) flowing through it.
$$V = I \\cdot R$$

**Combinations:**
- **Series:** $R_s = R_1 + R_2 + R_3$ (Current $I$ stays identical; voltage divides)
- **Parallel:** $\\frac{1}{R_p} = \\frac{1}{R_1} + \\frac{1}{R_2} + \\frac{1}{R_3}$ (Voltage $V$ stays identical; current divides)

**Joule's Law of Heating:**
$$H = I^2 R t = V I t = \\frac{V^2}{R} t$$

⚠️ **Common Pitfall:** Don't forget to convert time into seconds and resistance into ohms before applying $H = I^2 R t$!`;
  }

  if (lower.includes('chemical') || lower.includes('reaction') || lower.includes('acid') || lower.includes('salt')) {
    return `### 🧪 Chemical Reactions & Equations (Chemistry)

**Types of Reactions:**
1. **Combination:** $A + B \\rightarrow AB$ (e.g. $CaO(s) + H_2O(l) \\rightarrow Ca(OH)_2(aq) + \\text{Heat}$)
2. **Decomposition:** $AB \\xrightarrow{\\Delta} A + B$ (e.g. $2FeSO_4 \\xrightarrow{\\Delta} Fe_2O_3 + SO_2 + SO_3$)
3. **Displacement:** $Fe(s) + CuSO_4(aq) \\rightarrow FeSO_4(aq) + Cu(s)$ (Blue solution turns pale green!)
4. **Double Displacement / Precipitation:** $Na_2SO_4 + BaCl_2 \\rightarrow BaSO_4 \\downarrow (\\text{white ppt}) + 2NaCl$
5. **Redox:** Loss of electrons / gain of oxygen is Oxidation; gain of electrons / loss of oxygen is Reduction.

💡 **Exam Tip:** Always include state symbols like $(s), (l), (g), (aq)$ in CBSE answers to earn full marks!`;
  }

  if (lower.includes('life processes') || lower.includes('nephron') || lower.includes('heart') || lower.includes('photosynthesis')) {
    return `### 🧬 Life Processes High-Yield Summary (Biology)

**Key Systems to Master:**
1. **Human Alimentary Canal:**
   - Salivary amylase breaks starch $\\rightarrow$ maltose.
   - Stomach: HCl creates acidic medium, Pepsin digests proteins, Mucus protects inner lining.
   - Small Intestine: Bile salts emulsify fats; Trypsin (proteins), Lipase (fats).
2. **Double Circulation in Human Heart:**
   - Right atrium receives deoxygenated blood $\\rightarrow$ pumped to lungs via pulmonary artery.
   - Oxygenated blood enters left atrium $\\rightarrow$ pumped to systemic body via Aorta.
3. **Nephron (Excretion):**
   - Bowman's capsule $\\rightarrow$ Glomerular filtration $\\rightarrow$ Selective reabsorption of glucose, amino acids & water $\\rightarrow$ Collecting duct.

💡 **Exam Tip:** Always draw neat labeled diagrams for Nephron, Cross-section of Leaf, and Human Alimentary Canal!`;
  }

  return `### 🎓 Genie Study Assistant Guidance

Great question! Here is how we break this down for Class 10 success:

1. **Core Concept:** Class 10 questions test fundamental principles rather than rote memorization. Start by defining the primary law, theorem, or definition.
2. **Step-by-Step Approach:**
   - Write the relevant formula / principle clearly with standard notation.
   - Substitute given values in consistent SI units.
   - Box your final numerical answer or write a concluding statement.
3. **Board Exam Blueprint Strategy:**
   - For 1-mark questions: Precise single-line answer with reasoning.
   - For 3-mark questions: 3 distinct points or steps with units.
   - For 5-mark questions: Conceptual derivation + numerical application + neat diagram.

Feel free to ask a specific numerical problem, ask for a formula derivation, or request a quick quiz on this topic!`;
}

// Set up Vite in dev mode or static files in production
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`StudyGenie EduAdapt 10 server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
