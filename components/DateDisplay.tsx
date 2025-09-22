interface DateDisplayProps {
  date: Date | string;
  className?: string;
  format?: "short" | "long" | "relative";
}

export default function DateDisplay({ 
  date, 
  className = "",
  format = "short"
}: DateDisplayProps) {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  
  const formatDate = (date: Date, format: string) => {
    switch (format) {
      case "long":
        return date.toLocaleDateString("de-DE", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric"
        });
      case "relative":
        const now = new Date();
        const diffInMs = now.getTime() - date.getTime();
        const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
        const diffInHours = Math.floor(diffInMinutes / 60);
        const diffInDays = Math.floor(diffInHours / 24);
        
        if (diffInMinutes < 1) return "gerade eben";
        if (diffInMinutes < 60) return `vor ${diffInMinutes} Min`;
        if (diffInHours < 24) return `vor ${diffInHours} Std`;
        if (diffInDays < 7) return `vor ${diffInDays} Tag${diffInDays > 1 ? "en" : ""}`;
        return date.toLocaleDateString("de-DE");
      default: // "short"
        return date.toLocaleDateString("de-DE");
    }
  };

  return (
    <span className={`text-gray-500 text-sm ${className}`}>
      {formatDate(dateObj, format)}
    </span>
  );
}