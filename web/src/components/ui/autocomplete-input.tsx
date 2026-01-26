'use client';

import * as React from 'react';
import { Input } from './input';
import { Popover, PopoverContent, PopoverAnchor } from './popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from './command';

export interface AutocompleteInputProps {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  suggestions: string[];
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

const AutocompleteInput = React.forwardRef<HTMLInputElement, AutocompleteInputProps>(
  ({ value, onChange, onBlur, suggestions, placeholder, className, disabled }, ref) => {
    const [open, setOpen] = React.useState(false);
    const [inputValue, setInputValue] = React.useState(value);
    const inputRef = React.useRef<HTMLInputElement | null>(null);

    // Sync internal state with external value
    React.useEffect(() => {
      setInputValue(value);
    }, [value]);

    // Filter suggestions based on input value (case-insensitive)
    const filteredSuggestions = React.useMemo(() => {
      if (!inputValue) return suggestions;
      const lowerInput = inputValue.toLowerCase();
      return suggestions.filter((s) => s.toLowerCase().includes(lowerInput));
    }, [inputValue, suggestions]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      setInputValue(newValue);
      onChange(newValue);
      setOpen(true);
    };

    const handleSelect = (selectedValue: string) => {
      setInputValue(selectedValue);
      onChange(selectedValue);
      setOpen(false);
      inputRef.current?.focus();
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Escape') {
        setOpen(false);
        e.preventDefault();
      } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        if (!open && filteredSuggestions.length > 0) {
          setOpen(true);
        }
      }
    };

    const handleFocus = () => {
      if (suggestions.length > 0) {
        setOpen(true);
      }
    };

    const handleBlur = () => {
      // Delay closing to allow click on suggestion
      setTimeout(() => {
        setOpen(false);
        onBlur?.();
      }, 150);
    };

    // Combine refs using useCallback
    const combinedRef = React.useCallback(
      (node: HTMLInputElement | null) => {
        // Store in internal ref for focus handling
        inputRef.current = node;
        // Forward to external ref
        if (typeof ref === 'function') {
          ref(node);
        } else if (ref) {
          (ref as React.MutableRefObject<HTMLInputElement | null>).current = node;
        }
      },
      [ref]
    );

    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverAnchor asChild>
          <Input
            ref={combinedRef}
            value={inputValue}
            onChange={handleInputChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className={className}
            disabled={disabled}
            autoComplete="off"
          />
        </PopoverAnchor>
        <PopoverContent
          className="w-[var(--radix-popover-trigger-width)] p-0"
          align="start"
          sideOffset={4}
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <Command shouldFilter={false}>
            <CommandList>
              {filteredSuggestions.length === 0 ? (
                <CommandEmpty>沒有建議</CommandEmpty>
              ) : (
                <CommandGroup>
                  {filteredSuggestions.map((suggestion) => (
                    <CommandItem
                      key={suggestion}
                      value={suggestion}
                      onSelect={() => handleSelect(suggestion)}
                      role="option"
                    >
                      {suggestion}
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    );
  }
);

AutocompleteInput.displayName = 'AutocompleteInput';

export { AutocompleteInput };
