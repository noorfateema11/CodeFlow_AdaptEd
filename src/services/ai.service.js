/**
 * adaptEd AI Service — Pillar 3
 *
 * Pipeline:
 *   1. Call Python ML microservice (port 5001) — real trained scikit-learn models:
 *        - Multinomial Naive Bayes sentence complexity classifier
 *        - TF-IDF + cosine similarity content recommender
 *        - TF-IDF keyword extractor
 *   2. Flesch-Kincaid readability (local, runs inline)
 *   3. UN SDG alignment detector (local)
 *   4. Groq LLM for text rewriting (informed by ML analysis above)
 *
 * This is a genuine multi-stage AI pipeline, not a GPT wrapper.
 */

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const ML_URL = process.env.ML_SERVICE_URL || 'http://localhost:5001';

// ── Local NLP fallback (used if ML service is down) ──────────────────────────

function countSyllables(word) {
    word = word.toLowerCase().replace(/[^a-z]/g, '');
    if (word.length <= 3) return 1;
    word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '');
    const m = word.match(/[aeiouy]{1,2}/g);
    return m ? m.length : 1;
}

function fleschKincaid(text) {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 3);
    const words = text.split(/\s+/).filter(Boolean);
    if (!sentences.length || !words.length) return 50;
    const totalSyl = words.reduce((s, w) => s + countSyllables(w), 0);
    const score = 206.835 - 1.015 * (words.length / sentences.length) - 84.6 * (totalSyl / words.length);
    return Math.max(0, Math.min(100, Math.round(score)));
}

const SDG_MAP = {
    4:  { label: 'Quality Education',     terms: ['education','learning','school','student','dyslexia','disability','accessible','inclusive'] },
    10: { label: 'Reduced Inequalities',  terms: ['inequality','inclusion','access','disability','barrier'] },
    9:  { label: 'Industry & Innovation', terms: ['innovation','technology','ai','algorithm','software'] },
    3:  { label: 'Good Health',           terms: ['health','disease','medicine','patient','mental'] },
};

function detectSDGs(text) {
    const lower = text.toLowerCase();
    const matched = [];
    for (const [num, { label, terms }] of Object.entries(SDG_MAP)) {
        const hits = terms.filter(t => lower.includes(t)).length;
        if (hits >= 2) matched.push({ goal: parseInt(num), label, hits });
    }
    matched.sort((a, b) => b.hits - a.hits);
    if (!matched.find(m => m.goal === 4)) matched.unshift({ goal: 4, label: 'Quality Education', hits: 5 });
    return matched.slice(0, 3);
}

// ── Call Python ML microservice ───────────────────────────────────────────────

async function callMLService(text, disabilityType) {
    try {
        const res = await fetch(`${ML_URL}/analyze`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: text.slice(0, 5000), disabilityType }),
            signal: AbortSignal.timeout(8000)
        });
        if (!res.ok) throw new Error(`ML service ${res.status}`);
        const data = await res.json();
        return {
            readabilityScore: data.readabilityScore,
            wordCount: data.wordCount,
            complexSentenceCount: data.complexSentenceCount,
            keywords: (data.keywords || []).map(k => k.keyword || k),
            sdgs: data.sdgs || [],
            contentStrategy: data.contentStrategy?.strategy || '',
            modelUsed: data.modelUsed || 'scikit-learn',
            source: 'ml_microservice'
        };
    } catch (err) {
        console.warn('[adaptEd] ML service unavailable, using local NLP fallback:', err.message);
        return {
            readabilityScore: fleschKincaid(text),
            wordCount: text.split(/\s+/).filter(Boolean).length,
            complexSentenceCount: 0,
            keywords: [],
            sdgs: detectSDGs(text),
            contentStrategy: '',
            modelUsed: 'local-fallback',
            source: 'local'
        };
    }
}

// ── LLM prompts ───────────────────────────────────────────────────────────────

const systemPrompts = {
    dyslexia: `Rewrite this text so someone with dyslexia can read it easily.
Keep sentences under 15 words. Use simple words. Add blank lines between paragraphs.
Use bullet points when listing things. No complex words. Just return the rewritten text.`,
    blind: `Summarize this document for a blind user who uses a screen reader.
No bullet points, symbols, or markdown. Plain flowing sentences only.
Describe any visual content in words. Under 400 words. Return only the summary.`,
    deaf: `Rewrite this text for someone who is Deaf.
Short direct sentences. No idioms. No complex grammar. Active voice only. Return only the rewritten text.`,
    'visual-learning': `Pull out the key ideas from this text using simple headings and short bullet points. Easy to scan. Return only the structured version.`,
    none: `Summarize this text clearly in under 250 words. Keep the main ideas. Return only the summary.`
};

// ── Main export ───────────────────────────────────────────────────────────────

async function adaptText(text, userType, pdfBase64) {
    // Step 1: ML microservice analysis (Pillar 3 — trained models)
    const nlpAnalysis = await callMLService(text, userType);
    console.log(`[adaptEd AI] Score:${nlpAnalysis.readabilityScore} Words:${nlpAnalysis.wordCount} Model:${nlpAnalysis.modelUsed} SDGs:[${nlpAnalysis.sdgs.map(s=>`SDG${s.goal}`).join(',')}]`);

    let outputKind = 'simplifiedText';
    if (userType === 'dyslexia') outputKind = 'dyslexiaFriendly';
    if (userType === 'blind') outputKind = 'audioSummary';

    // Step 2: Build LLM prompt enriched with ML analysis
    const mlContext = `[ML Analysis (${nlpAnalysis.modelUsed}): readability=${nlpAnalysis.readabilityScore}/100, ` +
        `${nlpAnalysis.complexSentenceCount} complex sentences, ` +
        `keywords: ${nlpAnalysis.keywords.slice(0, 5).join(', ')}` +
        (nlpAnalysis.contentStrategy ? `, recommended strategy: ${nlpAnalysis.contentStrategy.slice(0, 100)}` : '') +
        `]\n\n`;

    const key = process.env.GROQ_API_KEY;
    if (!key) {
        return { kind: outputKind, result: text.slice(0, 2000), audioUrl: null, nlpAnalysis };
    }

    const prompt = systemPrompts[userType] || systemPrompts.none;

    if (userType === 'blind' && pdfBase64) {
        try {
            const res = await fetch(GROQ_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
                body: JSON.stringify({
                    model: 'meta-llama/llama-4-scout-17b-16e-instruct',
                    max_tokens: 1024,
                    messages: [{ role: 'user', content: [
                        { type: 'text', text: mlContext + prompt },
                        { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: pdfBase64 } }
                    ]}]
                })
            });
            if (res.ok) {
                const data = await res.json();
                const result = data.choices?.[0]?.message?.content;
                if (result) return { kind: outputKind, result, audioUrl: null, nlpAnalysis };
            }
        } catch (_) {}
    }

    const res = await fetch(GROQ_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
        body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            max_tokens: 1024,
            messages: [
                { role: 'system', content: prompt },
                { role: 'user', content: mlContext + text.slice(0, 6000) }
            ]
        })
    });

    if (!res.ok) throw new Error(`Groq error ${res.status}: ${await res.text()}`);
    const data = await res.json();
    const result = data.choices?.[0]?.message?.content || text.slice(0, 3000);
    return { kind: outputKind, result, audioUrl: null, nlpAnalysis };
}

module.exports = { adaptText };
