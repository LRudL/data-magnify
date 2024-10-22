import React, { useState, useEffect } from 'react';
import { CollapsibleDiv } from './Components';

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
    setHighlightsA?: (highlights: Array<{ start: number; end: number; text: string; color: string; tooltip?: string; }>) => void;
    setHighlightsB?: (highlights: Array<{ start: number; end: number; text: string; color: string; tooltip?: string; }>) => void;
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
    setHighlightsA?: (highlights: Array<{ start: number; end: number; text: string; color: string; tooltip?: string; }>) => void;
    setHighlightsB?: (highlights: Array<{ start: number; end: number; text: string; color: string; tooltip?: string; }>) => void;
}> = ({ content, answerA, answerB, setHighlightsA, setHighlightsB }) => {
    const criteriaNames = Object.keys(content || {});
    const [selectedCriterion, setSelectedCriterion] = useState(criteriaNames[0] || '');

    // Function to find quote positions in text
    const findQuotePositions = (text: string, quote: string): number[] => {
        // Remove first and last quotes if they exist
        const cleanQuote = quote.replace(/^["']|["']$/g, '');
        const index = text.indexOf(cleanQuote);
        return index >= 0 ? [index, index + cleanQuote.length] : [-1, -1];
    };

    // Generate highlights for both texts
    const generateHighlights = (quotes: Quote[], text: string) => {
        return quotes.map((quote, index) => {
            const [start, end] = findQuotePositions(text, quote.quote);
            if (start === -1) return null;

            return {
                start,
                end,
                text: quote.quote,
                color: `hsla(${(index * 60) % 360}, 70%, 70%, 0.3)`, // Generate different colors
                tooltip: quote.comment || undefined
            };
        }).filter((h): h is NonNullable<typeof h> => h !== null);
    };

    // Update useEffect to set highlights when criterion changes
    useEffect(() => {
        const answers: CriteriaQuoteContent = content[selectedCriterion] || {
            'Text A': [],
            'Text B': []
        };

        const highlightsA = generateHighlights(answers['Text A'], answerA);
        const highlightsB = generateHighlights(answers['Text B'], answerB);

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
