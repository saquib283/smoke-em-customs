import React from 'react';

export interface SelectOption<T = string> {
  value: T;
  label: string;
  sublabel?: string;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
  disabled?: boolean;
}

export type SelectVariant = 'default' | 'compact' | 'ghost' | 'status';
export type SelectSize = 'sm' | 'md' | 'lg';

export interface SelectProps<T = string> {
  id?: string;
  name?: string;
  label?: string;
  placeholder?: string;
  value?: T;
  defaultValue?: T;
  options: SelectOption<T>[];
  onChange?: (value: T) => void;
  error?: string;
  disabled?: boolean;
  required?: boolean;
  searchable?: boolean;
  searchPlaceholder?: string;
  variant?: SelectVariant;
  size?: SelectSize;
  className?: string;
  triggerClassName?: string;
  menuClassName?: string;
  align?: 'left' | 'right';
  prefixIcon?: React.ReactNode;
  ariaLabel?: string;
  theme?: 'admin' | 'dark' | 'auto';
}
