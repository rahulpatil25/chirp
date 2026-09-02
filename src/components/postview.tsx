import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import Image from "next/image";
import Link from "next/link";

import { type RouterOutputs } from "~/utils/api";

dayjs.extend(relativeTime);

type PostWithUser = RouterOutputs["posts"]["getAll"][number];

export const PostView = (props: PostWithUser) => {
  const { post, author } = props;

  // Only accounts with a username have a profile page, since that is what the route looks up.
  const displayName = author.username ?? author.firstName ?? "anonymous";

  return (
    <div key={post.id} className="flex gap-3 border-b border-slate-400 p-4">
      <Image
        src={author.imageUrl}
        className="h-14 w-14 rounded-full"
        alt={`${displayName}'s profile picture`}
        height={56}
        width={56}
      />
      <div className="flex flex-col">
        <div className="flex gap-1 text-slate-300">
          {author.username ? (
            <Link href={`/@${author.username}`}>
              <span>{`@${author.username} `}</span>
            </Link>
          ) : (
            <span>{displayName}</span>
          )}
          <Link href={`/post/${post.id}`}>
            <span className="font-thin">{` · ${dayjs(
              post.createdAt,
            ).fromNow()}`}</span>
          </Link>
        </div>
        <span className="text-2xl">{post.content}</span>
      </div>
    </div>
  );
};
