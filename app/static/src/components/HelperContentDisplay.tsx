import React, { useState, useEffect } from 'react';
import { CollapsibleDiv } from './Components';
import { highlightUtils, Highlight } from './HighlightedText';

// Define all possible helper types
type HelperType = 'summarize' | 'compare' | 'criteria_quotes' | string;


// Define content types for each helper
interface SummarizeContent {
    [key: string]: string;
}

interface CompareItem {
    feature: string;
    a: string;
    b: string;
}

interface Quote {
    quote: string;
    comment: string | null;
}

interface CriteriaQuoteContent {
    [textKey: string]: Quote[];
}

interface CriteriaQuote {
    [criterionName: string]: CriteriaQuoteContent;
}

// Add this interface near the top with your other interfaces
interface SummaryData {
    A: string;
    B: string;
}

// Update the main props interface
interface HelperContentDisplayProps {
    helperType: HelperType;
    content: SummarizeContent | CompareItem[] | CriteriaQuote | any;
    answerA?: string;
    answerB?: string;
    setHighlightsA?: (highlights: Array<Highlight>) => void;
    setHighlightsB?: (highlights: Array<Highlight>) => void;
}

interface CompareRendererProps {
    content: CompareItem[];
}

// Renderer for summarize helper type
const SummarizeRenderer: React.FC<{ data: SummaryData }> = ({ data }) => {
    
    return (
        <div className="summary-content">
            <div className="summary-item">
                <h4>Summary A:</h4>
                <p>{data.A}</p>
            </div>
            <div className="summary-item">
                <h4>Summary B:</h4>
                <p>{data.B}</p>
            </div>
        </div>
    );
};

// Renderer for compare helper type
const CompareRenderer: React.FC<CompareRendererProps> = ({ content }) => {
    return (
        <table className="compare-table">
            <thead>
                <tr>
                    <th>Feature</th>
                    <th>Text A</th>
                    <th>Text B</th>
                </tr>
            </thead>
            <tbody>
                {content.map((item, index) => (
                    <tr key={index}>
                        <td>{item.feature}</td>
                        <td>{item.a}</td>
                        <td>{item.b}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
};

// New CriteriaQuotesRenderer
const CriteriaQuotesRenderer: React.FC<{ 
    content: CriteriaQuote; 
    answerA: string; 
    answerB: string;
    setHighlightsA?: (highlights: Array<Highlight>) => void;
    setHighlightsB?: (highlights: Array<Highlight>) => void;
}> = ({ content, answerA, answerB, setHighlightsA, setHighlightsB }) => {
    const criteriaNames = Object.keys(content || {});
    const [selectedCriterion, setSelectedCriterion] = useState(criteriaNames[0] || '');

    // Update highlights when criterion changes
    useEffect(() => {
        const answers: CriteriaQuoteContent = content[selectedCriterion] || {
            'Text A': [],
            'Text B': []
        };

        const highlightsA = highlightUtils.generateHighlights(answers['Text A'], answerA, selectedCriterion);
        const highlightsB = highlightUtils.generateHighlights(answers['Text B'], answerB, selectedCriterion);

        setHighlightsA?.(highlightsA);
        setHighlightsB?.(highlightsB);
    }, [selectedCriterion, content, answerA, answerB]);

    return (
        <div className="criteria-quotes">
            <div className="criteria-buttons">
                {criteriaNames.map(criterion => (
                    <button 
                        key={criterion}
                        onClick={() => setSelectedCriterion(criterion)}
                        className={selectedCriterion === criterion ? 'active' : ''}
                    >
                        {criterion}
                    </button>
                ))}
            </div>
            <div className="selected-criteria-content">
                {content && selectedCriterion && content[selectedCriterion] && 
                    Object.entries(content[selectedCriterion]).map(([answerKey, quotes]) => (
                        <CollapsibleDiv key={answerKey} title={answerKey} defaultOpen={false}>
                            <ul className="quotes-list">
                                {Array.isArray(quotes) && quotes.map((quote: Quote, index: number) => (
                                    <li key={index}>
                                        <p>{quote.quote}</p>
                                        {quote.comment && <p className="comment">{quote.comment}</p>}
                                    </li>
                                ))}
                            </ul>
                        </CollapsibleDiv>
                    ))}
            </div>
        </div>
    );
};

// Default renderer for unknown helper types
const DefaultRenderer: React.FC<{ content: any }> = ({ content }) => (
    <pre>{JSON.stringify(content, null, 2)}</pre>
);

export const HelperContentDisplay: React.FC<HelperContentDisplayProps> = ({ 
    helperType, 
    content,
    answerA = '',
    answerB = '',
    setHighlightsA,
    setHighlightsB
}) => {
    switch (helperType.toLowerCase()) {
        case 'summarize':
            return <SummarizeRenderer data={content} />;
        case 'compare':
            return <CompareRenderer content={content} />;
        case 'criteria_quotes':
            return <CriteriaQuotesRenderer 
                content={content} 
                answerA={answerA}
                answerB={answerB}
                setHighlightsA={setHighlightsA}
                setHighlightsB={setHighlightsB}
            />;
        default:
            return <DefaultRenderer content={content} />;
    }
};
