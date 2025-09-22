import ProfilePicture from "./ProfilePicture";
import UserLink from "./UserLink";
import DateDisplay from "./DateDisplay";

interface CommentProps {
  id: string;
  content: string;
  creationDate: Date | string;
  userId: string;
  userName: string | null;
  userImage?: string | null;
  className?: string;
}

export default function Comment({
  id,
  content,
  creationDate,
  userId,
  userName,
  userImage,
  className = ""
}: CommentProps) {
  return (
    <div className={`border-b border-gray-100 pb-4 mb-4 last:border-b-0 last:pb-0 last:mb-0 ${className}`}>
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
          </div>
          
          <p className="text-gray-800 text-sm leading-relaxed">
            {content}
          </p>
        </div>
      </div>
    </div>
  );
}