'use client';

import React, { useState, useRef, useEffect, useId, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { usePathname } from 'next/navigation';
import { Icon } from '@/components/common/Icons';
import { SelectProps, SelectOption } from './Select.types';
import styles from './Select.module.css';

export function Select<T extends string | number = string>({
  id: explicitId,
  name,
  label,
  placeholder = 'Select an option...',
  value: controlledValue,
  defaultValue,
  options = [],
  onChange,
  error,
  disabled = false,
  required = false,
  searchable = false,
  searchPlaceholder = 'Search...',
  variant = 'default',
  size = 'md',
  className = '',
  triggerClassName = '',
  menuClassName = '',
  align = 'left',
  prefixIcon,
  ariaLabel,
  theme,
}: SelectProps<T>) {
  const pathname = usePathname();
  const [inAdminContext, setInAdminContext] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined') {
      const isRouteAdmin = window.location.pathname.startsWith('/admin');
      const isDomAdmin = !!document.querySelector('[data-theme="admin"]');
      const isClosestAdmin = !!containerRef.current?.closest('[data-theme="admin"]');
      if (isRouteAdmin || isDomAdmin || isClosestAdmin) {
        setInAdminContext(true);
      }
    }
  }, []);

  const effectiveIsAdmin =
    theme === 'admin'
      ? true
      : theme === 'dark'
        ? false
        : (
            inAdminContext ||
            pathname?.startsWith('/admin') ||
            (typeof window !== 'undefined' && window.location.pathname.startsWith('/admin')) ||
            (typeof document !== 'undefined' && (
              document.documentElement.getAttribute('data-theme') === 'admin' ||
              document.body.classList.contains('admin-theme') ||
              !!document.querySelector('[data-theme="admin"]')
            ))
          );

  const generatedId = useId();
  const id = explicitId || generatedId;
  const listboxId = `${id}-listbox`;

  const [internalValue, setInternalValue] = useState<T | undefined>(defaultValue);
  const isControlled = controlledValue !== undefined;
  const currentValue = isControlled ? controlledValue : internalValue;

  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isAlignRight, setIsAlignRight] = useState(align === 'right');
  const [mounted, setMounted] = useState(false);

  const [menuPosition, setMenuPosition] = useState<{
    top: number;
    left: number;
    width: number;
    maxHeight: number;
    isFlipped: boolean;
    isAlignRight: boolean;
  } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const listboxRef = useRef<HTMLUListElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Filter options based on search query
  const filteredOptions = useMemo(() => {
    if (!searchable || !searchTerm.trim()) {
      return options;
    }
    const term = searchTerm.toLowerCase();
    return options.filter((opt) => {
      const matchLabel = opt.label.toLowerCase().includes(term);
      const matchSub = opt.sublabel?.toLowerCase().includes(term);
      const matchVal = String(opt.value).toLowerCase().includes(term);
      return matchLabel || matchSub || matchVal;
    });
  }, [options, searchable, searchTerm]);

  // Selected option lookup
  const selectedOption = useMemo(() => {
    return options.find((opt) => opt.value === currentValue);
  }, [options, currentValue]);

  // Calculate dynamic floating coordinates relative to viewport
  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();

    if (rect.bottom < -40 || rect.top > window.innerHeight + 40) {
      setIsOpen(false);
      return;
    }

    const spaceBelow = window.innerHeight - rect.bottom - 10;
    const spaceAbove = rect.top - 10;
    const shouldFlip = spaceBelow < 220 && spaceAbove > spaceBelow;

    const availableHeight = shouldFlip ? spaceAbove : spaceBelow;
    const maxHeight = Math.min(320, Math.max(140, availableHeight));

    const isRight =
      align === 'right' || (window.innerWidth - rect.left < 280 && rect.right > 280);

    const top = shouldFlip ? rect.top - 4 : rect.bottom + 4;
    const left = isRight ? rect.right : rect.left;

    setIsFlipped(shouldFlip);
    setIsAlignRight(isRight);

    setMenuPosition({
      top,
      left,
      width: rect.width,
      maxHeight,
      isFlipped: shouldFlip,
      isAlignRight: isRight,
    });
  }, [align]);

  // Listen to window scroll & resize events (using capture to track nested scroll containers)
  useEffect(() => {
    if (!isOpen) return;
    updatePosition();

    const handleUpdate = () => {
      updatePosition();
    };

    window.addEventListener('resize', handleUpdate, { passive: true });
    window.addEventListener('scroll', handleUpdate, { passive: true, capture: true });

    return () => {
      window.removeEventListener('resize', handleUpdate);
      window.removeEventListener('scroll', handleUpdate, { capture: true });
    };
  }, [isOpen, updatePosition]);

  // Handle open / close
  const handleOpen = useCallback(() => {
    if (disabled) return;
    updatePosition();
    setIsOpen(true);
    setSearchTerm('');
    // Highlight currently selected item if exists
    const idx = filteredOptions.findIndex((opt) => opt.value === currentValue);
    setHighlightedIndex(idx >= 0 ? idx : 0);
  }, [disabled, updatePosition, filteredOptions, currentValue]);

  const handleClose = useCallback(() => {
    setIsOpen(false);
    setSearchTerm('');
    setHighlightedIndex(-1);
    triggerRef.current?.focus();
  }, []);

  const handleToggle = () => {
    if (isOpen) {
      handleClose();
    } else {
      handleOpen();
    }
  };

  const handleSelectOption = (option: SelectOption<T>) => {
    if (option.disabled) return;
    if (!isControlled) {
      setInternalValue(option.value);
    }
    onChange?.(option.value);
    handleClose();
  };

  // Click outside listener that supports both trigger container and ported popover
  useEffect(() => {
    if (!isOpen) return;

    function handlePointerDown(e: MouseEvent | TouchEvent) {
      const target = e.target as Node;
      const insideTrigger = containerRef.current && containerRef.current.contains(target);
      const insidePopover = popoverRef.current && popoverRef.current.contains(target);

      if (!insideTrigger && !insidePopover) {
        handleClose();
      }
    }

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
    };
  }, [isOpen, handleClose]);

  // Focus search input when opened
  useEffect(() => {
    if (isOpen && searchable) {
      // Small tick for DOM render
      const timer = setTimeout(() => {
        searchInputRef.current?.focus();
      }, 30);
      return () => clearTimeout(timer);
    }
  }, [isOpen, searchable]);

  // Scroll active item into view
  useEffect(() => {
    if (isOpen && highlightedIndex >= 0 && listboxRef.current) {
      const activeEl = listboxRef.current.children[highlightedIndex] as HTMLElement;
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [isOpen, highlightedIndex]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    if (!isOpen) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        handleOpen();
      }
      return;
    }

    switch (e.key) {
      case 'Escape':
        e.preventDefault();
        handleClose();
        break;

      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex((prev) => {
          let next = prev + 1;
          while (next < filteredOptions.length && filteredOptions[next]?.disabled) {
            next++;
          }
          return next < filteredOptions.length ? next : prev;
        });
        break;

      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex((prev) => {
          let next = prev - 1;
          while (next >= 0 && filteredOptions[next]?.disabled) {
            next--;
          }
          return next >= 0 ? next : prev;
        });
        break;

      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < filteredOptions.length) {
          const opt = filteredOptions[highlightedIndex];
          if (opt && !opt.disabled) {
            handleSelectOption(opt);
          }
        }
        break;

      case 'Home':
        e.preventDefault();
        setHighlightedIndex(0);
        break;

      case 'End':
        e.preventDefault();
        setHighlightedIndex(filteredOptions.length - 1);
        break;

      case 'Tab':
        handleClose();
        break;
    }
  };

  // Trigger variant class
  const variantClass =
    variant === 'compact'
      ? styles.variantCompact
      : variant === 'ghost'
      ? styles.variantGhost
      : '';

  // Trigger size class
  const sizeClass =
    size === 'sm' ? styles.sizeSm : size === 'lg' ? styles.sizeLg : styles.sizeMd;

  return (
    <div className={`${styles.container} ${className}`} ref={containerRef}>
      {label && (
        <label htmlFor={id} className={styles.label}>
          {label}
          {required && <span className={styles.requiredAsterisk}>*</span>}
        </label>
      )}

      {/* Hidden input for form capture */}
      {name && (
        <input
          type="hidden"
          name={name}
          value={currentValue !== undefined ? String(currentValue) : ''}
        />
      )}

      {/* Trigger Button */}
      <button
        ref={triggerRef}
        id={id}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={listboxId}
        aria-label={ariaLabel || label || placeholder}
        aria-disabled={disabled}
        disabled={disabled}
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        className={`
          ${styles.trigger}
          ${effectiveIsAdmin ? styles.triggerAdmin : styles.triggerPublic}
          ${sizeClass}
          ${variantClass}
          ${isOpen ? styles.triggerOpen : ''}
          ${error ? styles.triggerError : ''}
          ${triggerClassName}
        `}
      >
        <span className={styles.valueWrapper}>
          {(selectedOption?.icon || prefixIcon) && (
            <span className={styles.prefixIcon}>
              {selectedOption?.icon || prefixIcon}
            </span>
          )}
          {selectedOption ? (
            <span className={styles.valueText}>{selectedOption.label}</span>
          ) : (
            <span className={`${styles.valueText} ${styles.placeholder}`}>
              {placeholder}
            </span>
          )}
        </span>

        {selectedOption?.badge && (
          <span className={styles.optionBadge}>{selectedOption.badge}</span>
        )}

        <span className={styles.chevron}>
          <Icon.ChevronDown size={size === 'sm' ? 14 : 16} />
        </span>
      </button>

      {/* Popover Dropdown rendered into document.body portal */}
      {isOpen &&
        mounted &&
        menuPosition &&
        createPortal(
          <div
            ref={popoverRef}
            data-theme={effectiveIsAdmin ? 'admin' : 'dark'}
            className={`
              ${styles.popover}
              ${effectiveIsAdmin ? styles.popoverAdmin : styles.popoverDark}
              ${menuPosition.isFlipped ? styles.popoverFlip : ''}
              ${menuPosition.isAlignRight ? styles.popoverAlignRight : ''}
              ${menuClassName}
            `}
            style={{
              top: `${menuPosition.top}px`,
              left: `${menuPosition.left}px`,
              width: `${menuPosition.width}px`,
              minWidth: `${Math.min(menuPosition.width, 240)}px`,
              maxWidth: `min(94vw, 680px)`,
            }}
            onKeyDown={handleKeyDown}
          >
            {/* Optional Search Bar */}
            {searchable && (
              <div className={styles.searchContainer}>
                <div className={styles.searchInputWrapper}>
                  <span className={styles.searchIcon}>
                    <Icon.Search size={14} />
                  </span>
                  <input
                    ref={searchInputRef}
                    type="text"
                    className={styles.searchInput}
                    placeholder={searchPlaceholder}
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setHighlightedIndex(0);
                    }}
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              </div>
            )}

            {/* Options List */}
            <ul
              ref={listboxRef}
              id={listboxId}
              role="listbox"
              tabIndex={-1}
              aria-activedescendant={
                highlightedIndex >= 0 ? `${id}-opt-${highlightedIndex}` : undefined
              }
              className={styles.optionsList}
              style={{
                maxHeight: `${Math.max(100, menuPosition.maxHeight - (searchable ? 52 : 12))}px`,
              }}
            >
              {filteredOptions.length === 0 ? (
                <li className={styles.emptyState}>No matching options found</li>
              ) : (
                filteredOptions.map((opt, index) => {
                  const isSelected = opt.value === currentValue;
                  const isHighlighted = index === highlightedIndex;

                  return (
                    <li
                      key={String(opt.value)}
                      id={`${id}-opt-${index}`}
                      role="option"
                      aria-selected={isSelected}
                      aria-disabled={opt.disabled}
                      className={`
                        ${styles.option}
                        ${isSelected ? styles.optionSelected : ''}
                        ${isHighlighted ? styles.optionHighlighted : ''}
                        ${opt.disabled ? styles.optionDisabled : ''}
                      `}
                      onClick={() => handleSelectOption(opt)}
                      onMouseEnter={() => setHighlightedIndex(index)}
                    >
                      <div className={styles.optionLeft}>
                        {opt.icon && <span className={styles.optionIcon}>{opt.icon}</span>}
                        <div className={styles.optionTexts}>
                          <span className={styles.optionLabel}>{opt.label}</span>
                          {opt.sublabel && (
                            <span className={styles.optionSublabel}>{opt.sublabel}</span>
                          )}
                        </div>
                      </div>

                      <div className={styles.optionRight}>
                        {opt.badge && (
                          <span className={styles.optionBadge}>{opt.badge}</span>
                        )}
                        {isSelected && (
                          <span className={styles.checkmark}>
                            <Icon.Check size={14} />
                          </span>
                        )}
                      </div>
                    </li>
                  );
                })
              )}
            </ul>
          </div>,
          document.body
        )}

      {error && <span className={styles.errorText}>{error}</span>}
    </div>
  );
}
