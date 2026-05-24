import React from 'react';

interface NlpAnalysis {
    readabilityScore: number;
    keywords: string[];
    wordCount: number;
    complexSentenceCount: number;
    sdgs: { goal: number; label: string }[];
}

const SDG_COLORS: Record<number, string> = {
    1: '#E5243B', 2: '#DDA63A', 3: '#4C9F38', 4: '#C5192D',
    5: '#FF3A21', 6: '#26BDE2', 7: '#FCC30B', 8: '#A21942',
    9: '#FD6925', 10: '#DD1367', 11: '#FD9D24', 12: '#BF8B2E',
    13: '#3F7E44', 14: '#0A97D9', 15: '#56C02B', 16: '#00689D', 17: '#19486A'
};

function ReadabilityBar({ score }: { score: number }) {
    const color = score >= 70 ? '#198754' : score >= 50 ? '#ffc107' : '#dc3545';
    const label = score >= 70 ? 'Easy' : score >= 50 ? 'Moderate' : 'Difficult';
    return (
        <div className="mb-3">
            <div className="d-flex justify-content-between align-items-center mb-1">
                <small className="fw-medium text-secondary">Readability</small>
                <small className="fw-bold" style={{ color }}>{score}/100 — {label}</small>
            </div>
            <div className="progress" style={{ height: '6px', borderRadius: '4px' }}>
                <div className="progress-bar" style={{ width: `${score}%`, backgroundColor: color, borderRadius: '4px' }} />
            </div>
        </div>
    );
}

export default function NlpInsights({ analysis }: { analysis: NlpAnalysis }) {
    return (
        <div className="card border-0 shadow-sm rounded-4 p-4 mb-4" style={{ background: 'linear-gradient(135deg, #f8f9fa 0%, #e8f5e9 100%)' }}>
            <h5 className="fw-semibold mb-3" style={{ color: '#1a5276' }}>
                🤖 AI Document Analysis
                <span className="ms-2 badge rounded-pill" style={{ background: '#1a5276', fontSize: '0.65rem' }}>NLP</span>
            </h5>

            <ReadabilityBar score={analysis.readabilityScore} />

            <div className="row g-3 mb-3">
                <div className="col-6">
                    <div className="rounded-3 p-2 text-center" style={{ background: 'rgba(25,135,84,0.1)' }}>
                        <div className="fw-bold text-success fs-5">{analysis.wordCount.toLocaleString()}</div>
                        <div className="text-muted" style={{ fontSize: '0.72rem' }}>Words</div>
                    </div>
                </div>
                <div className="col-6">
                    <div className="rounded-3 p-2 text-center" style={{ background: 'rgba(220,53,69,0.1)' }}>
                        <div className="fw-bold text-danger fs-5">{analysis.complexSentenceCount}</div>
                        <div className="text-muted" style={{ fontSize: '0.72rem' }}>Complex Sentences</div>
                    </div>
                </div>
            </div>

            {analysis.keywords.length > 0 && (
                <div className="mb-3">
                    <small className="fw-medium text-secondary d-block mb-2">🔑 Key Topics (TF-IDF)</small>
                    <div className="d-flex flex-wrap gap-1">
                        {analysis.keywords.map(kw => (
                            <span key={kw} className="badge rounded-pill"
                                style={{ background: '#1a5276', color: '#fff', fontSize: '0.72rem', fontWeight: 500 }}>
                                {kw}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {analysis.sdgs.length > 0 && (
                <div>
                    <small className="fw-medium text-secondary d-block mb-2">🌍 UN SDG Alignment</small>
                    <div className="d-flex flex-wrap gap-2">
                        {analysis.sdgs.map(sdg => (
                            <div key={sdg.goal} className="d-flex align-items-center gap-1 rounded-pill px-2 py-1"
                                style={{ background: SDG_COLORS[sdg.goal] || '#555', color: '#fff', fontSize: '0.72rem' }}>
                                <span className="fw-bold">SDG {sdg.goal}</span>
                                <span style={{ opacity: 0.9 }}>· {sdg.label}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
