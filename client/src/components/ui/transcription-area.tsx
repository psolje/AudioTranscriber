import React, { useState, useRef, useEffect } from "react";
import { Button } from "./button";
import { Textarea } from "./textarea";
import { Info } from "lucide-react";

interface TranscriptionAreaProps {
  onSubmit: (text: string) => void;
  isDisabled?: boolean;
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  charCount?: number;
  reset?: boolean;
}

export const TranscriptionArea: React.FC<TranscriptionAreaProps> = ({
  onSubmit,
  isDisabled = false,
  placeholder = "Type the transcription here...",
  value,
  onChange,
  charCount,
  reset
}) => {
  const [text, setText] = useState("");
  const [count, setCount] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Reset text when reset prop changes
  useEffect(() => {
    if (reset) {
      setText("");
      setCount(0);
    }
  }, [reset]);

  // Update text and count when value prop changes
  useEffect(() => {
    if (value !== undefined) {
      setText(value);
      setCount(value.length);
    }
  }, [value]);

  // Focus on the textarea when it becomes enabled
  useEffect(() => {
    if (!isDisabled && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isDisabled]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    setText(newText);
    setCount(newText.length);
    
    if (onChange) {
      onChange(newText);
    }
  };

  const handleSubmit = () => {
    onSubmit(text);
  };

  // Calculate word count for display (optional)
  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex justify-between mb-2">
        <h2 className="text-lg font-medium">Your Transcription</h2>
        <div>
          <span className="text-sm text-muted-foreground">
            {charCount !== undefined ? charCount : count} characters
            {wordCount > 0 && ` (${wordCount} words)`}
          </span>
        </div>
      </div>
      
      <Textarea
        ref={textareaRef}
        value={value !== undefined ? value : text}
        onChange={handleChange}
        className="font-mono w-full h-48 p-3 focus:border-primary"
        placeholder={placeholder}
        disabled={isDisabled}
      />
      
      <div className="mt-4 flex justify-between items-center">
        <div className="text-sm text-muted-foreground flex items-center">
          <Info className="w-4 h-4 mr-1" />
          Type everything you hear in the audio
        </div>
        
        <Button
          onClick={handleSubmit}
          disabled={isDisabled || text.trim().length === 0}
          className="py-2 px-6 bg-primary hover:bg-primary-dark"
        >
          Submit
        </Button>
      </div>
    </div>
  );
};

export default TranscriptionArea;
