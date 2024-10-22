import React from 'react';

export interface Highlight {
    start: number;
    end: number;
    text: string;
    color: string;
    tooltip?: string;
}

interface HighlightedTextProps {
    text: string;
    highlights: Highlight[];
}

// Utility functions for highlighting
export const highlightUtils = {
    // Find positions of a quote in text
    findQuotePositions: (text: string, quote: string): [number, number] => {
        const cleanQuote = quote.replace(/^["']|["']$/g, '');
        const index = text.indexOf(cleanQuote);
        return index >= 0 ? [index, index + cleanQuote.length] : [-1, -1];
    },

    // Generate a consistent color based on a string
    getConsistentColor: (name: string): string => {
        // Generate a hash of the name
        const hash = name.split('').reduce((acc, char) => {
            return char.charCodeAt(0) + ((acc << 5) - acc);
        }, 0);
        
        // Use the hash to generate HSL color with fixed saturation and lightness
        const hue = Math.abs(hash % 360);
        return `hsla(${hue}, 70%, 70%, 0.3)`;
    },

    // Generate highlights for a text based on quotes
    generateHighlights: (quotes: Array<{ quote: string; comment?: string | null }>, text: string, colorKey: string): Highlight[] => {
        const color = highlightUtils.getConsistentColor(colorKey);
        return quotes
            .map((quote): Highlight | null => {
                const [start, end] = highlightUtils.findQuotePositions(text, quote.quote);
                if (start === -1) return null;

                return {
                    start,
                    end,
                    text: quote.quote,
                    color,
                    tooltip: quote.comment || undefined
                };
            })
            .filter((h): h is Highlight => h !== null);
    }
};

export const HighlightedText: React.FC<HighlightedTextProps> = ({ text, highlights }) => {
    if (!highlights || highlights.length === 0) {
        return <span>{text}</span>;
    }

    // Sort highlights by start position
    const sortedHighlights = [...highlights].sort((a, b) => a.start - b.start);

    const segments: JSX.Element[] = [];
    let lastIndex = 0;

    sortedHighlights.forEach((highlight, index) => {
        // Add non-highlighted text before this highlight
        if (highlight.start > lastIndex) {
            segments.push(
                <span key={`text-${index}`}>
                    {text.slice(lastIndex, highlight.start)}
                </span>
            );
        }

        // Add highlighted text
        segments.push(
            <span
                key={`highlight-${index}`}
                style={{ 
                    backgroundColor: highlight.color,
                    display: 'inline',
                    padding: '2px 0',
                    cursor: 'help',
                    position: 'relative',
                }}
                data-tooltip={highlight.tooltip}
                className="highlighted-text"
            >
                {text.slice(highlight.start, highlight.end)}
            </span>
        );

        lastIndex = highlight.end;
    });

    // Add any remaining text
    if (lastIndex < text.length) {
        segments.push(
            <span key="text-final">
                {text.slice(lastIndex)}
            </span>
        );
    }

    return <div className="highlighted-text-container">{segments}</div>;
};
