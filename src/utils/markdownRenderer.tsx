import React from "react";
import DOMPurify from "dompurify";

/**
 * Safely renders markdown-like text to React elements.
 * Supports **bold**, *italic*, bullet lists, and line breaks.
 * Uses DOMPurify for XSS protection.
 */
export function renderMarkdown(text: string, isUser: boolean = false): React.ReactNode {
  // Don't process user messages
  if (isUser) return text;
  
  // Handle empty/null text
  if (!text) return null;

  return text.split("\n").map((line, i) => {
    // Bold: **text** → <strong>text</strong>
    let processed = line.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold">$1</strong>');
    
    // Italic: *text* (but not **) → <em>text</em>
    // Uses negative lookbehind and lookahead to avoid matching ** patterns
    processed = processed.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '<em>$1</em>');
    
    // Sanitize to prevent XSS
    const sanitized = DOMPurify.sanitize(processed, {
      ALLOWED_TAGS: ['strong', 'em', 'b', 'i'],
      ALLOWED_ATTR: ['class'],
    });
    
    // Check if line is a bullet point (•, -, or * at start)
    const trimmedLine = line.trim();
    if (trimmedLine.startsWith("•") || trimmedLine.startsWith("-") || 
        (trimmedLine.startsWith("*") && !trimmedLine.startsWith("**"))) {
      const bulletContent = sanitized.replace(/^[•\-\*]\s*/, '');
      return (
        <li 
          key={i} 
          className="ml-4 list-disc" 
          dangerouslySetInnerHTML={{ __html: bulletContent }} 
        />
      );
    }
    
    // Empty line = line break
    if (!trimmedLine) {
      return <br key={i} />;
    }
    
    // Regular line
    return (
      <p 
        key={i} 
        className={i > 0 ? "mt-1" : ""} 
        dangerouslySetInnerHTML={{ __html: sanitized }} 
      />
    );
  });
}
