
import ProfilePicture from "./ProfilePicture";
import UserLink from "./UserLink";
import DateDisplay from "../DateDisplay";

type PostHeaderProps = {
  userId: string;
  userImage: string | null;
  userName: string | null;
  creationDate: string | Date;
};

export default function PostHeader({ userId, userImage, userName, creationDate }: PostHeaderProps) {
    return (
        <div className="flex mb-2 space-x-3">
                <ProfilePicture
                  src={userImage || undefined}
                  alt="User Avatar"
                />
                <div className="flex flex-col justify-center">
                  {userName && userId && (
                  <UserLink
                    userId={userId}
                    userName={userName}
                  />
                  )}
                  {creationDate && (
                  <DateDisplay
                    date={creationDate}
                    format="relative"
                  />)}
                </div>
              </div>
    );
}