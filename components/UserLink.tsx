import Link from "next/link";

interface UserLinkProps {
  userId: string;
  userName: string | null;
  className?: string;
}

export default function UserLink({ 
  userId, 
  userName, 
  className = ""
}: UserLinkProps) {
  return (
    <Link 
      href={`/profile/${userId}`}
      className={`font-semibold hover:underline ${className}`}
    >
      {userName || "Unbekannter Benutzer"}
    </Link>
  );
}