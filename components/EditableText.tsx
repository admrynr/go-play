'use client';

import { useState, useEffect, useRef } from 'react';

interface EditableTextProps {
    value: string;
    onSave: (value: string) => void;
    isBuilderMode?: boolean;
    element?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'span' | 'div';
    className?: string;
    placeholder?: string;
}

export default function EditableText({
    value,
    onSave,
    isBuilderMode = false,
    element = 'span',
    className = '',
    placeholder = 'Enter text...'
}: EditableTextProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [currentValue, setCurrentValue] = useState(value);
    const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

    useEffect(() => {
        setCurrentValue(value);
    }, [value]);

    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
            // Move cursor to end
            const length = inputRef.current.value.length;
            inputRef.current.setSelectionRange(length, length);
        }
    }, [isEditing]);

    const handleBlur = () => {
        setIsEditing(false);
        if (currentValue !== value) {
            onSave(currentValue);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && element !== 'p' && element !== 'div') {
            e.preventDefault();
            inputRef.current?.blur();
        }
        if (e.key === 'Escape') {
            setCurrentValue(value);
            setIsEditing(false);
        }
    };

    const Element = element;

    if (!isBuilderMode) {
        return <Element className={className}>{value}</Element>;
    }

    if (isEditing) {
        // Use textarea for block elements, input for inline
        const isBlock = element === 'p' || element === 'div';
        const InputComponent = isBlock ? 'textarea' : 'input';

        return (
            <InputComponent
                ref={inputRef as any}
                value={currentValue}
                onChange={(e) => setCurrentValue(e.target.value)}
                onBlur={handleBlur}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                className={`bg-white/10 border-b-2 border-primary focus:outline-none focus:bg-white/20 px-1 py-0.5 rounded transition-colors w-full ${className}`}
                style={{ resize: isBlock ? 'vertical' : 'none' }}
                rows={isBlock ? 3 : undefined}
            />
        );
    }

    return (
        <Element
            className={`cursor-pointer hover:ring-2 hover:ring-primary/50 hover:bg-white/5 rounded px-1 transition-all ${className} ${!value ? 'italic opacity-50' : ''}`}
            onClick={(e: React.MouseEvent) => {
                e.preventDefault();
                e.stopPropagation();
                setIsEditing(true);
            }}
            title="Click to edit"
        >
            {value || placeholder}
        </Element>
    );
}
