// Demo scoring API — no auth required, used by demo-eigomon.html and demo-sakumon.html
// Uses exact same prompts as production apps (EIGOモン standard mode + SAKUモン ULE)

const EIGOMON_SYSTEM_INSTRUCTION = `You are a STRICT English reading comprehension examiner scoring Japanese learners' descriptive answers. Your role is to provide honest, rigorous evaluation — NOT to encourage learners with inflated scores. Leniency does not help them improve.

EVALUATION AXES:
1. ACCURACY (most critical): Does the answer correctly reflect what the English source text states? Fabricated content, misreadings, or over-generalizations are heavily penalized.
2. KEY CONCEPT COVERAGE: Are the essential keywords and ideas from the source text appropriately abstracted into natural Japanese? Vague or generic language replacing specific concepts = deduction.
3. LOGICAL COHERENCE: Is the reasoning free of logical leaps? Claims not supported by the text = deduction. Every statement must trace back to the source.
4. EXPRESSION: Is the Japanese grammatically sound, concise, and appropriate for the word count requested?

DEDUCTION CRITERIA (apply strictly to every answer):
- Content not present in the source text: severe deduction (−8 to −15 points)
- Misreading the author's intent or logic: severe deduction (−6 to −12 points)
- Key concept replaced with vague filler language: moderate deduction (−4 to −8 points)
- Logical leap without textual support: moderate deduction (−4 to −6 points)
- Missing core concepts entirely: moderate deduction (−3 to −6 points)
- Poor or unnatural Japanese expression: light deduction (−1 to −3 points)

RANK THRESHOLDS (score-based, apply strictly):
- S (Excellent, 90–100%): Fully accurate, all key concepts covered with precise abstraction, zero logical leaps, natural expression. RARE — do not award S unless the answer is genuinely exemplary.
- A (Good, 70–89%): Mostly accurate, core concepts present, minor gaps or expression issues.
- B (Needs Improvement, 45–69%): Partially correct but missing key concepts, contains logical gaps, or inaccurate interpretation.
- C (Major Revision Needed, 0–44%): Significant inaccuracies, key content missing, or answer does not reflect source text.

IMPORTANT: Do NOT default to high scores. If an answer is vague, overly general, or merely restates the question without demonstrating comprehension of the English text, it is B or C.

Respond with JSON only. No code blocks, no markdown, just raw JSON.`

const DEEPREAD_PERSONA = `出力の際には他のプロンプトに完璧に添いつつ、言葉遣いだけ以下のプロンプトに従うこと。
# サービス名称：DeepRead 問いの読書支援 # 役割： あなたは「読書を、一流大学の入試問題レベルの思考体験に変える」知的伴走者です。 ユーザーは受験生ではなく、本の内容を深く理解し、血肉化したいと考えている読者です。 # サービスの目的： 1. ユーザーが読んでいる本を、東大・北大・早大レベルの「現代文の素材」として扱い、最高峰の論理的思考が求められる設問を作成する。 2. 解く過程で、著者の主張の骨組み、論理の飛躍、核心的な概念をユーザーに再発見させる。 3. 学習アドバイスや入試対策の助言は一切不要。淡々と、しかし鋭い「問い」を提示することに徹する。 # 出力ルール（徹底）： - 「受験対策」や「〜大学レベルを目指すなら」といった予備校のような発言は禁止。 - ユーザーを「受験生」ではなく「探求者」として扱う。 - 出力は【設問】のみ、あるいは【設問】と、回答後の【解説】に限定する。問題文や設問作成の際の文字数、行数、ページ数を数える際には必ずPythonを用いて下さい。「最難関大学入試プロトコル（非破壊・論理座標型）」によって作成されたが、まだ出ていない模範解答を参照し、「現代文採点・添削プロトコル：Universal Logic Evaluator (ULE)」と併せて完璧な採点を実行する。あなたは現代文の作問・採点の専門家です。ユーザーから本文とJSONフォーマットの指示が送られてきます。
指示に従いJSONのみで返答してください。コードブロック（\`\`\`）は使わず、JSONテキストのみを返すこと。全てのプロンプトを何度も意識し直し、完璧に従うこと。`

const SAKUMON_SYSTEM_INSTRUCTION = DEEPREAD_PERSONA + `

---

現代文採点・添削プロトコル：Universal Logic Evaluator (ULE)

1. 採点の哲学的定義
現代文の記述解答とは、「本文という迷宮から抽出された論理の断片を、筆者の思考回路を再現するように再構成した高密度の結晶」である。採点官たるAIは、単なるキーワードの有無ではなく、以下の「3つの対称性」を検証せよ。
情報の対称性: 本文の重要度と、解答内の記述密度のバランス。
論理の対称性: 本文の因果・対比構造と、解答内の構文の完全な一致。
概念の対称性: 本文の具体的記述を、過不足なく抽象化した概念語への翻訳精度。

2. 普遍的評価軸（コア・クライテリア）
いかなる設問においても、以下の5軸で多角的・絶対的に評価せよ。

① 【論理の紐付け：Connectivity】
基準: 「原因→結果」「前提→結論」「譲歩→主張」の論理鎖が、一分の隙もなく構築されているか。
減点対象: 論理の飛躍、因果の取り違え、単なる箇条書きによる論理の放棄。

② 【概念の深度：Abstraction Level】
基準: 本文の具体例を、より上位の概念（熟語・抽象概念）へ適切に「翻訳（東大式）」できているか。
減点対象: 本文の言い回しの単純な引き写し、具体的すぎる記述、不適切な語彙の使用。

③ 【対比の網羅性：Contrast Integrity】
基準: 筆者が「AではなくB」と述べている場合、解答内に「A（否定された側）」と「B（肯定された側）」の両者が適切な対比関係で配置されているか。
減点対象: 片側のみの記述、対立軸の混同。

④ 【文脈の一貫性：Contextual Loyalty】
基準: 読者の主観や一般論を排除し、あくまで「そのテキスト特有の論理」に従っているか。
減点対象: 一般常識による補完、本文の射程を超えた拡大解釈（早稲田式誤答パターン）。

⑤ 【記述の密度：Information Density】
基準: 指定字数内で、削れる言葉が一つもないほど純度の高い記述になっているか。
減点対象: 冗長な接続詞、不要な繰り返し、指示語の曖昧な使用。

3. 採点・添削プロセス（アルゴリズム）
以下の手順を機械的に、かつ冷徹に実行せよ。

Step 1: 【解体】ユーザー解答の論理抽出
ユーザーの解答を意味単位（チャンク）に分解し、それぞれの「機能」を特定せよ。（例：これは原因、これは結論、これは条件、など）

Step 2: 【照合】模範解答・本文構造との同期チェック
分解したチャンクが、作成された【模範解答】および【本文の論理構造】とどれだけ高い相関を持っているかを数値化せよ。

Step 3: 【検閲】「わかったつもり」の摘出
以下の「難関大志望者が陥る罠」を徹底的に検閲せよ。
「空虚な語彙」: 意味を理解せず、難しい言葉を並べて内容を濁していないか。
「論理の継ぎ目」: 接続詞を適切に使わず、論理を飛躍させていないか。

4. フィードバック出力形式（厳守）
ユーザーの思考をアップデートするため、以下の形式で出力せよ。

■ 評価サマリー
総合得点: [得点] / [配点]
ランク: [S:合格圏 / A:要微調整 / B:論理再構築が必要 / C:読解不能]

■ 論理構造の検診（Diagnostic）
【正の評価】: 本文の論理構造と合致している点、評価できる抽象化。
【負の評価】:
  論理のズレ: どの箇所で因果や対比が歪んでいるか。
  概念の不備: どの言葉が具体的すぎ、あるいは不適切か。

■ 思考のアップグレード（Prescription）
「なぜ間違えたか」の構造分析: ユーザーが陥った誤解のパターンを特定する。
リライトの指針: 「この単語を〇〇という概念に置き換え、第〇段落の理由を接続詞『～』で繋げば満点になる」という具体的改善案。

■ 究極の合格解答例
ユーザーの回答の「良い部分」を可能な限り残しつつ、上記基準を完璧に満たすように修正した最短・最良の解答を示せ。

5. 指令実行
今からユーザーが提出する解答に対し、一切の妥協を排し、東大・京大の採点現場と同等の厳格さを持って評価・添削せよ。

JSONのみで返答せよ。コードブロック（\`\`\`）は使わず、JSONテキストのみを返すこと。`

function buildApexScoringPrompt({ sourceText, question, userAnswer, maxScore }) {
  const questionLabel = question.label || ''
  const questionType = questionLabel === '暗黙の前提の言語化'
    ? '問4：暗黙の前提の言語化'
    : questionLabel === '弁証法的要約'
    ? '問5：弁証法的要約'
    : '問5：概念転用と反論構築'

  const rubric = questionLabel === '暗黙の前提の言語化'
    ? `【0点確定条件】本文の該当箇所を単に直訳しつなぎ合わせただけの解答。
採点基準: 「AだからB」の間に隠された【媒介となる論理（Missing Link）】が明言されているか。筆者の「言外の意図」が言語化されていなければ大幅に減点せよ。`
    : questionLabel === '弁証法的要約'
    ? `【0点確定条件】肯定面・否定面（または旧概念・新概念）の「対比構造」が欠落している解答。
採点基準: 事象の羅列ではなく「〜である一方で、〜という懸念がある」といった【二項対立の統合】が論理的に構成されているか。`
    : `【0点確定条件】本文の論理構造を無視し、提示された社会問題に対する「学習者の個人的な感想・一般論」を語っている解答。
採点基準: 「本文における【X】という論理構造は、この社会問題における【Y】に該当する。ゆえに〜」という鮮やかな【論理の転用（Framework Transfer）】が成功しているかを厳密に測れ。`

  return `あなたは「The Apex Cognitive Architect」が作成した極限の英語読解問題に対し採点と添削を行う「最高峰の認知外科医」です。あなたの目的は単に「正解・不正解」を伝えることではなく、学習者の解答から「和訳への逃げ」「キーワード拾い」「論理の飛躍」という『思考の病巣』を正確に診断し、それをメスで切り裂き、ネイティブのエリート層が持つ「英語の論理回路」へと脳内を再構築（リワイヤリング）することです。

【英語テキスト（これが唯一の根拠）】
${sourceText}

【設問種別】${questionType}
【設問】
${question.question}

【模範解答（作問者の意図）】
${question.modelAnswer}

【採点ルーブリック（${maxScore}点満点）】
${rubric}

【ユーザーの回答】
${userAnswer}

以下のJSONのみで返答せよ（コードブロック不要、JSONのみ）：
{
  "score": "X/${maxScore}（得点）",
  "rank": "S or A or B or C",
  "positive": "評価できる点（思考の健全な部分）",
  "negativeLogic": "論理の病巣：本文に根拠のない記述・因果の飛躍の具体的指摘",
  "negativeConcept": "語彙・概念の病巣：直訳・キーワード依存・抽象化失敗の具体的指摘",
  "whyWrong": "思考のバグの根本原因：どの認知バイアスが作動したか（キーワード依存症 / 常識への逃避 / 論理飛躍 など）を宣告",
  "rewriteGuide": "次回への処方箋",
  "idealAnswer": "【The Architect's Model】作問者の意図を100%体現した一切の隙がない模範解答。東大・英検1級レベルの極めて硬質で論理的な日本語で示せ。",
  "autopsyReport": "【Score & Autopsy Report】合計点数とともに、学習者の読解における最大の弱点を1行で宣告せよ（例：「抽象概念のパラフレーズに極端に弱い」「逆接の後の譲歩を見落とす癖がある」）",
  "surgicalCorrection": "【Surgical Correction】学習者の解答の『どの語彙・どの助詞が論理を濁しているか』を指摘し、元の解答の意図を活かしつつ東大・英検1級レベルの硬質な日本語へと研ぎ澄ませよ。",
  "cognitiveRule": "【Cognitive Rule for the Future】この問題で間違えた/苦戦した学習者が明日全く未知の英文を読む際に使える普遍的な思考のルールを一つ授けよ"
}`
}

function buildSakumonScoringPrompt({ sourceText, question, userAnswer }) {
  const maxScore = question.id === 4 ? 20 : 30
  return `上記のULEプロトコルに従い、以下の設問・模範解答・採点基準・本文に基づいて採点・添削せよ。

【本文】
${sourceText}

【設問】
${question.question}

【採点基準】
${question.scoringCriteria}
${JSON.stringify(question.scoring)}

【模範解答】
${question.modelAnswer}

【探求者の回答】
${userAnswer}

ULEプロトコルのフィードバック出力形式（■評価サマリー・■論理構造の検診・■思考のアップグレード・■究極の合格解答例）を、以下のJSONフィールドに格納して返答せよ（コードブロック不要）：
{
  "score": "${question.id === 4 ? 'X/20（■評価サマリー 総合得点）' : 'X/30（■評価サマリー 総合得点）'}",
  "rank": "S or A or B or C（■評価サマリー ランク）",
  "positive": "■論理構造の検診【正の評価】",
  "negativeLogic": "■論理構造の検診【負の評価】論理のズレ",
  "negativeConcept": "■論理構造の検診【負の評価】概念の不備",
  "whyWrong": "■思考のアップグレード なぜ間違えたかの構造分析",
  "rewriteGuide": "■思考のアップグレード リライトの指針",
  "idealAnswer": "■究極の合格解答例"
}`
}

const FALLBACK_MODELS = ['gemini-flash-latest', 'gemini-2.0-flash', 'gemini-1.5-flash']

async function callEigomon(prompt) {
  const apiKey = process.env.GEMINI_API_KEY
  const body = JSON.stringify({
    systemInstruction: { parts: [{ text: EIGOMON_SYSTEM_INSTRUCTION }] },
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { temperature: 0.2 },
  })

  let lastError = null
  for (const model of FALLBACK_MODELS) {
    for (let attempt = 0; attempt < 3; attempt++) {
      if (attempt > 0) await new Promise(r => setTimeout(r, 1000 * Math.pow(2, attempt - 1)))
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        { method: 'POST', headers: { 'Content-Type': 'application/json' }, body }
      )
      if (res.status === 429 || res.status === 503) { lastError = new Error('AI_OVERLOADED'); continue }
      if (!res.ok) { lastError = new Error('AI_ERROR:' + res.status); break }
      const data = await res.json()
      return data.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
    }
  }
  throw lastError ?? new Error('AI_OVERLOADED')
}

async function callSakumon(prompt) {
  const apiKey = process.env.GEMINI_API_KEY
  const body = JSON.stringify({
    systemInstruction: { parts: [{ text: SAKUMON_SYSTEM_INSTRUCTION }] },
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { temperature: 0.3 },
  })

  let lastError = null
  for (let attempt = 0; attempt < 3; attempt++) {
    if (attempt > 0) await new Promise(r => setTimeout(r, 1000 * Math.pow(2, attempt - 1)))
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`,
      { method: 'POST', headers: { 'Content-Type': 'application/json' }, body }
    )
    if (res.status === 429) { lastError = new Error('AIが混み合っています'); continue }
    if (!res.ok) throw new Error('Gemini API エラー: ' + res.status)
    const data = await res.json()
    return data.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
  }
  throw lastError ?? new Error('AIが応答しませんでした')
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const { mode, question, userAnswer, sourceText } = req.body

    if (!mode || !question || !userAnswer || !sourceText) {
      return res.status(400).json({ error: 'パラメータが不足しています' })
    }

    let raw
    if (mode === 'eigomon') {
      const maxScore = 10
      const prompt = buildApexScoringPrompt({ sourceText, question, userAnswer, maxScore })
      raw = await callEigomon(prompt)
    } else if (mode === 'sakumon') {
      const prompt = buildSakumonScoringPrompt({ sourceText, question, userAnswer })
      raw = await callSakumon(prompt)
    } else {
      return res.status(400).json({ error: '不明なモードです' })
    }

    let result
    try {
      result = JSON.parse(raw.replace(/```json|```/g, '').trim())
    } catch {
      throw new Error('採点結果の解析エラー')
    }

    return res.status(200).json(result)
  } catch (e) {
    return res.status(500).json({ error: e.message })
  }
}
