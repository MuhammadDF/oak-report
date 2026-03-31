type LibrarySearchProps = {
  onChange: (value: string) => void;
  value: string;
};

export function LibrarySearch({ onChange, value }: LibrarySearchProps) {
  return (
    <label className="search-field">
      <span>Search</span>
      <input
        onChange={(event) => onChange(event.target.value)}
        placeholder="Search by card name and card number"
        type="search"
        value={value}
      />
    </label>
  );
}
