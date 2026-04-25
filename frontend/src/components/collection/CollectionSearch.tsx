type CollectionSearchProps = {
  value: string;
  onChange: (value: string) => void;
  sortBy:
    | "name"
    | "set"
    | "price-desc"
    | "price-asc"
    | "copies-desc"
    | "copies-asc";
  onSortChange: (
    value:
      | "name"
      | "set"
      | "price-desc"
      | "price-asc"
      | "copies-desc"
      | "copies-asc",
  ) => void;
};

export function CollectionSearch({
  onChange,
  onSortChange,
  sortBy,
  value,
}: CollectionSearchProps) {
  return (
    <div className="collection-search">
      <label className="search-field search-field--collection">
        <span className="sr-only">Search collection</span>
        <input
          onChange={(event) => onChange(event.target.value)}
          placeholder="Search by name, set, or card number"
          type="search"
          value={value}
        />
      </label>
      <label className="collection-sort">
        <span>Sort by</span>
        <select
          onChange={(event) =>
            onSortChange(
              event.target.value as
                | "name"
                | "set"
                | "price-desc"
                | "price-asc"
                | "copies-desc"
                | "copies-asc",
            )
          }
          value={sortBy}
        >
          <option value="name">Name (A-Z)</option>
          <option value="set">Set (A-Z)</option>
          <option value="price-desc">Price (High to low)</option>
          <option value="price-asc">Price (Low to high)</option>
          <option value="copies-desc">Copies (High to low)</option>
          <option value="copies-asc">Copies (Low to high)</option>
        </select>
      </label>
    </div>
  );
}
