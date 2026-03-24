type MediaPlayerProps = {
  videoId: string;
  title?: string | null;
  className?: string;
};

/** BRD §8: YouTube iframe embed only (no redirect). */
export function MediaPlayer({ videoId, title, className }: MediaPlayerProps) {
  const src = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(videoId)}`;

  return (
    <figure className={className}>
      {title ? (
        <figcaption className="mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">{title}</figcaption>
      ) : null}
      <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-black shadow ring-1 ring-zinc-900/10 dark:ring-white/10">
        <iframe
          title={title ?? "YouTube video"}
          src={src}
          className="absolute inset-0 h-full w-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
        />
      </div>
    </figure>
  );
}
