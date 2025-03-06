import React from 'react';
import ReactMarkdown from 'react-markdown';
import { useTranslation } from 'react-i18next';
import remarkGfm from 'remark-gfm';
import { cn } from '@/lib/utils';

interface JobDescriptionProps {
  summary?: string;
  fallbackDescription?: string;
  className?: string;
}

/**
 * Component for rendering job descriptions with Markdown formatting
 * Uses the summary field if available, otherwise falls back to the regular description
 */
export const JobDescription: React.FC<JobDescriptionProps> = ({
  summary,
  fallbackDescription = '',
  className = '',
}) => {
  const { t } = useTranslation();

  const getTextContent = () => {
    // If summary is provided and not empty, use it
    if (summary) return summary;
    
    // Otherwise use fallback
    return fallbackDescription;
  };

  const isExtractionError = (content: string): boolean => {
    const errorIndicators = [
      '[Error extracting text from PDF',
      'EOF marker not found',
      '[PDF file not found:',
      '[No readable text content found in',
      'Error: Failed to extract text'
    ];
    
    return errorIndicators.some(indicator => content.includes(indicator));
  };

  const cleanContent = (content: string): string => {
    if (!content) return '';
    
    // Normalize spacing while preserving intentional formatting
    let cleaned = content;
    
    // Fix common formatting issues in French text
    cleaned = cleaned.replace(/(\w)'(\w)/g, "$1'$2"); // Fix apostrophes
    cleaned = cleaned.replace(/(\w) : /g, "$1 : "); // Fix French colon spacing
    
    // Replace excessive newlines (more than 2) with 2 newlines
    cleaned = cleaned.replace(/\n{3,}/g, '\n\n');
    
    // Replace excessive spaces (more than 2) with 2 spaces
    cleaned = cleaned.replace(/ {3,}/g, '  ');
    
    // Split into lines for better processing
    const lines = cleaned.split('\n');
    const processedLines = [];
    
    // Track if we're in a list
    let inList = false;
    let listIndentation = 0;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      if (!line) {
        // Empty line - add it to maintain paragraph breaks
        processedLines.push('');
        inList = false;
        continue;
      }
      
      // Check for list items
      const bulletMatch = line.match(/^[•\-\*\○\▪\◦\▸\►\·\–](\s+)(.+)$/);
      const numberedMatch = line.match(/^(\d+)[\.\)](\s+)(.+)$/);
      
      // Handle bullet points
      if (bulletMatch) {
        const itemContent = bulletMatch[2];
        processedLines.push(`- ${itemContent}`);
        inList = true;
        listIndentation = bulletMatch[1].length;
        continue;
      }
      
      // Handle numbered lists
      if (numberedMatch) {
        const number = numberedMatch[1];
        const itemContent = numberedMatch[3];
        processedLines.push(`${number}. ${itemContent}`);
        inList = true;
        listIndentation = numberedMatch[2].length;
        continue;
      }
      
      // Check for lines that look like they should be list items (indented after a list)
      if (inList && lines[i].startsWith(' ') && !bulletMatch && !numberedMatch) {
        const currentIndent = lines[i].search(/\S/);
        if (currentIndent > 0 && Math.abs(currentIndent - listIndentation) < 4) {
          // This is likely a continuation of the previous list item
          const lastItem: string = processedLines.pop() || '';
          processedLines.push(`${lastItem} ${line}`);
          continue;
        }
      }
      
      // Check for section headers (all caps or ending with colon)
      if (line.toUpperCase() === line && line.length > 5 && line.length < 50) {
        // All caps line - likely a header
        processedLines.push('');
        processedLines.push(`## ${line.charAt(0).toUpperCase() + line.slice(1).toLowerCase()}`);
        processedLines.push('');
        inList = false;
        continue;
      }
      
      // Check for lines ending with colon that might be section headers
      if (line.endsWith(':') && line.length < 50 && !line.startsWith('-') && !line.match(/^\d+\./)) {
        // Likely a section header
        if (processedLines.length > 0 && processedLines[processedLines.length - 1] !== '') {
          processedLines.push('');
        }
        processedLines.push(`### ${line}`);
        processedLines.push('');
        inList = false;
        continue;
      }
      
      // Regular line
      processedLines.push(line);
      inList = false;
    }
    
    // Join the processed lines
    cleaned = processedLines.join('\n');
    
    // Additional cleanup for common formatting issues
    cleaned = cleaned.replace(/\n\s*\n\s*\n/g, '\n\n'); // Remove triple line breaks
    
    return cleaned;
  };

  const renderContent = () => {
    const content = getTextContent();
    
    if (!content) {
      return (
        <div className="text-center p-4 border rounded-md bg-muted">
          <p>{t('jobs.no_description')}</p>
        </div>
      );
    }
    
    if (isExtractionError(content)) {
      return (
        <div className="text-center p-4 border rounded-md bg-muted">
          <p className="text-amber-600 font-medium mb-2">
            {t('jobs.extraction_error')}
          </p>
          {fallbackDescription ? (
            <div className="mt-4 text-left">
              <h3 className="font-medium mb-2">{t('jobs.fallback_description')}</h3>
              <p>{fallbackDescription}</p>
            </div>
          ) : (
            <p>{t('jobs.no_fallback_description')}</p>
          )}
        </div>
      );
    }
    
    const cleanedContent = cleanContent(content);
    
    return (
      <div className={cn("prose prose-slate dark:prose-invert max-w-none", 
                         "prose-headings:font-semibold prose-headings:text-primary",
                         "prose-p:my-3 prose-ul:my-3 prose-ol:my-3",
                         "prose-li:my-1 prose-li:pl-1",
                         "prose-h2:text-lg prose-h2:mt-6 prose-h2:mb-3",
                         "prose-h3:text-base prose-h3:mt-4 prose-h3:mb-2")}>
        <ReactMarkdown 
          remarkPlugins={[remarkGfm]}
          components={{
            ul: ({...props}) => (
              <ul className="list-disc pl-5 my-4 space-y-2" {...props} />
            ),
            ol: ({...props}) => (
              <ol className="list-decimal pl-5 my-4 space-y-2" {...props} />
            ),
            li: ({children, ...props}) => (
              <li className="pl-1 my-1" {...props}>
                {children}
              </li>
            )
          }}
        >
          {cleanedContent}
        </ReactMarkdown>
      </div>
    );
  };

  return (
    <div className={cn("job-description", className)}>
      {renderContent()}
    </div>
  );
};

export default JobDescription; 