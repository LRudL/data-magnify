import React from 'react';

interface Highlight {
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

export const HighlightedText: React.FC<HighlightedTextProps> = ({ text, highlights }) => {
    // Add debug logging
    console.log('HighlightedText rendering with:', { text: text.slice(0, 50), highlightCount: highlights.length });
    
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

        // Add highlighted text with debug class
        segments.push(
            <span
                key={`highlight-${index}`}
                style={{ 
                    backgroundColor: highlight.color,
                    display: 'inline',  // Force inline display
                    padding: '2px 0',   // Add some padding
                }}
                title={highlight.tooltip}
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
