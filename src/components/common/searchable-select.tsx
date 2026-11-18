"use client";

import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";

export type SearchableOption = {
  value: string;
  label: string;
};

type SearchableSelectProps = {
  options: SearchableOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  emptyMessage?: string;
  loading?: boolean;
  invalid?: boolean;
  disabled?: boolean;
  ariaLabel: string;
  /** Max rendered matches; the user narrows the rest by typing. */
  limit?: number;
};

/** Single-value select with a type-to-filter input, for option lists that can grow large. */
export function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = "Ketik untuk mencari…",
  emptyMessage = "Tidak ada hasil.",
  loading = false,
  invalid = false,
  disabled = false,
  ariaLabel,
  limit = 50,
}: SearchableSelectProps) {
  const selected = options.find((option) => option.value === value) ?? null;

  return (
    <Combobox<SearchableOption>
      items={options}
      value={selected}
      onValueChange={(next) => onChange(next?.value ?? "")}
      itemToStringLabel={(option) => option.label}
      itemToStringValue={(option) => option.value}
      isItemEqualToValue={(a, b) => a.value === b.value}
      limit={limit}
      autoHighlight
      disabled={disabled}
    >
      <ComboboxInput
        className="w-full"
        placeholder={loading ? "Memuat…" : placeholder}
        aria-label={ariaLabel}
        aria-invalid={invalid ? true : undefined}
        disabled={disabled}
      />
      <ComboboxContent>
        <ComboboxEmpty>{loading ? "Memuat…" : emptyMessage}</ComboboxEmpty>
        <ComboboxList>
          {(option: SearchableOption) => (
            <ComboboxItem key={option.value} value={option}>
              {option.label}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}
