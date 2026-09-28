import { useState } from "react";
import { Music2 } from "lucide-react";

import { assetUrl } from "../../services/api";

function youTubeId(url) {
  const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/);
  return match ? match[1] : null;
}

function vimeoId(url) {
  const match = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  return match ? match[1] : null;
}

function MediaPlayer({ item }) {
  const [failed, setFailed] = useState(false);
  const url = assetUrl(item.mediaUrl || "");

  if (!url) return <div className="fh-player-empty">No media attached yet.</div>;

  const yt = youTubeId(url);
  if (yt) {
    return (
      <div className="fh-player-frame">
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${yt}?rel=0`}
          title={item.title}
          allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }

  const vimeo = vimeoId(url);
  if (vimeo) {
    return (
      <div className="fh-player-frame">
        <iframe
          src={`https://player.vimeo.com/video/${vimeo}`}
          title={item.title}
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }

  if (failed) {
    return (
      <div className="fh-player-empty">
        This media couldn't be loaded. <a href={url} target="_blank" rel="noreferrer">Open it directly</a>.
      </div>
    );
  }

  const isAudio = item.type === "audio" || /\.(mp3|wav|ogg|m4a)(\?|$)/i.test(url);

  if (isAudio) {
    return (
      <div className="fh-player-audio">
        {item.imageUrl ? (
          <img src={assetUrl(item.imageUrl)} alt="" />
        ) : (
          <div className="fh-player-audio-art">
            <Music2 size={40} />
          </div>
        )}
        <audio controls preload="metadata" src={url} onError={() => setFailed(true)}>
          Your browser does not support audio playback.
        </audio>
      </div>
    );
  }

  return (
    <div className="fh-player-frame">
      <video
        controls
        preload="metadata"
        poster={item.imageUrl ? assetUrl(item.imageUrl) : undefined}
        src={url}
        onError={() => setFailed(true)}
      >
        Your browser does not support video playback.
      </video>
    </div>
  );
}

export default MediaPlayer;
