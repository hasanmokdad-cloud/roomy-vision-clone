interface Props {
  categories: { id: string; label: string }[];
  activeCategory: string;
  onCategoryChange: (id: string) => void;
}

const FAQCategoryPills = ({ categories, activeCategory, onCategoryChange }: Props) => (
  <div className="flex justify-center">
    <div className="flex flex-wrap justify-center gap-2">
      {categories.map((cat) => {
        const isActive = activeCategory === cat.id;
        return (
          <button
            key={cat.id}
            onClick={() => onCategoryChange(cat.id)}
            className="transition-all"
            style={{
              padding: "8px 18px",
              borderRadius: "9999px",
              fontSize: "14px",
              fontWeight: 500,
              whiteSpace: "nowrap",
              cursor: "pointer",
              backgroundColor: isActive ? "#1D4ED8" : "#FFFFFF",
              color: isActive ? "#FFFFFF" : "#374151",
              border: isActive ? "1px solid #1D4ED8" : "1px solid #E5E7EB",
              boxShadow: isActive ? "0 1px 3px rgba(29,78,216,0.3)" : "none",
            }}
          >
            {cat.label}
          </button>
        );
      })}
    </div>
  </div>
);

export default FAQCategoryPills;
