import type { Photo } from "@/lib/props/types";
import { LockIcon } from "../icons";
import { LockableCollection } from "../LockableCollection";
import type { AppProps } from "./types";

const DEFAULT_TINT: [string, string] = ["#3a3f4b", "#20242c"];

/** A photo's image, or a colored gradient placeholder when there isn't one. */
function PhotoArt({ photo, className = "" }: { photo: Photo; className?: string }) {
  const [a, b] = photo.tint ?? DEFAULT_TINT;
  const background = photo.src
    ? `center / cover no-repeat url(${JSON.stringify(photo.src)})`
    : `linear-gradient(135deg, ${a}, ${b})`;
  return <span role="img" aria-label={photo.caption} className={`block ${className}`} style={{ background }} />;
}

export function PhotosApp({ content, session, onHome }: AppProps) {
  return (
    <LockableCollection
      title="Photos"
      items={content.photos}
      session={session}
      onHome={onHome}
      layout="grid"
      emptyText="No photos."
      itemTitle={(photo, open) => (open ? photo.caption : "Hidden photo")}
      renderItem={(photo, open) =>
        open ? (
          <PhotoArt photo={photo} className="aspect-square" />
        ) : (
          <span className="grid aspect-square place-items-center bg-panel text-muted" aria-label="Locked photo">
            <LockIcon />
          </span>
        )
      }
      renderDetail={(photo) => (
        <figure>
          <PhotoArt photo={photo} className="aspect-[4/3] w-full" />
          <figcaption className="px-5 py-4">
            <p className="font-medium">{photo.caption}</p>
            <p className="mt-1 text-sm text-muted">{photo.takenAt}</p>
          </figcaption>
        </figure>
      )}
    />
  );
}