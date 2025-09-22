interface ProfilePictureProps {
  src?: string;
  alt?: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

export default function ProfilePicture({ 
  src, 
  alt = "Profilbild", 
  size = "md",
  className = ""
}: ProfilePictureProps) {
  const sizeClasses = {
    sm: "w-6 h-6",
    md: "w-10 h-10", 
    lg: "w-16 h-16",
    xl: "w-30 h-30"
  };

  if (!src) {
    return (
      <div 
        className={`${sizeClasses[size]} rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center ${className}`}
        role="img"
        aria-label={alt || "Profilbild nicht verfügbar"}
      >
        <span className="text-gray-600 dark:text-gray-300 text-xs" aria-hidden="true">?</span>
      </div>
    );
  }

  return (
    <img 
      src={src} 
      alt={alt}
      className={`${sizeClasses[size]} rounded-full object-cover ${className}`}
      role="img"
      aria-label={alt}
    />
  );
}