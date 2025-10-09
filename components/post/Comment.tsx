import ProfilePicture from "./ProfilePicture";
import UserLink from "./UserLink";
import DateDisplay from "../DateDisplay";

interface CommentProps {
  id: string;
  content: string;
  creationDate: Date | string;
  userId: string;
  userName: string | null;
  userImage?: string | null;
  className?: string;
  canDelete?: boolean;
  onDelete?: (id: string) => void;
}

export default function Comment({
  id,
  content,
  creationDate,
  userId,
  userName,
  userImage,
  className = "",
  canDelete = false,
  onDelete,
}: CommentProps) {
  return (
    <div className={`border-bpb-4 mb-4 ${className}`}>
      <div className="flex items-start space-x-3">
        <ProfilePicture 
          src={userImage || undefined}
          alt="Kommentar Profilbild"
          size="sm"
        />
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-1">
            <UserLink 
              userId={userId}
              userName={userName}
              className="text-sm"
            />
            <DateDisplay 
              date={creationDate}
              format="relative"
              className="text-xs"
            />
            {canDelete && (
              <button
                type="button"
                onClick={() => onDelete?.(id)}
                className="ml-auto text-xs text-red-500 hover:text-red-600 cursor-pointer"
                aria-label="Kommentar löschen"
                title="Kommentar löschen"
              >
                Löschen
              </button>
            )}
          </div>
          
          <p className="text-zinc-800 dark:text-zinc-200 text-sm leading-relaxed">
            {content}
          </p>
        </div>
      </div>
    </div>
  );
}