import ProfilePicture from "./ProfilePicture";
import UserLink from "./UserLink";
import DateDisplay from "../DateDisplay";
import { useMutation } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";
import { useRouter } from "next/navigation";

type PostHeaderProps = {
  postId: string;
  userId: string;
  userImage: string | null;
  userName: string | null;
  creationDate: string | Date;
  currentUserId?: string;
  isEditing?: boolean;
  onEditClick?: () => void;
};

export default function PostHeader({ postId, userId, userImage, userName, creationDate, currentUserId, isEditing, onEditClick }: PostHeaderProps) {
  const trpc = useTRPC();
  const router = useRouter();
  const deletePost = useMutation(trpc.posts.delete.mutationOptions());

  const handleDelete = () => {
    if (confirm("Möchtest du diesen Post wirklich löschen?")) {
      deletePost.mutate({ postId }, {
        onSuccess: () => {
          router.refresh();
        }
      });
    }
  };

  const isAuthor = currentUserId === userId;

  return (
    <div className="flex mb-2 justify-between items-start">
      <div className="flex space-x-3">
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
      {isAuthor && (
        <div className="self-center mx-2 my-1 flex items-center">
            <button
                onClick={onEditClick}
                className={`transition-colors cursor-pointer p-1 mr-1 ${isEditing ? 'text-blue-500' : 'text-gray-400 hover:text-blue-500'}`}
                title="Post bearbeiten"
            >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                </svg>
            </button>
          <button
            onClick={handleDelete}
            className="text-gray-400 hover:text-red-500 transition-colors cursor-pointer p-1"
            title="Post löschen"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
            </svg>
          </button>
        </div>
      )}

    </div>
  );
}
