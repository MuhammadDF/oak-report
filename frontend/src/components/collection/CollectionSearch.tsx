type CollectionSearchProps = {
  value: string;
  onChange: (value: string) => void;
};

export function CollectionSearch({
  onChange,
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
    </div>
  );
}
