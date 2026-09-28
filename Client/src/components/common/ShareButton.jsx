import { useState } from "react";
import { Check, Share2 } from "lucide-react";

const isTouchDevice = () => window.matchMedia?.("(pointer: coarse)").matches;

async function copyText(text) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }
  const area = document.createElement("textarea");
  area.value = text;
  area.setAttribute("readonly", "");
  area.style.position = "fixed";
  area.style.opacity = "0";
  document.body.appendChild(area);
  area.select();
  const ok = document.execCommand("copy");
  area.remove();
  if (!ok) throw new Error("copy failed");
}

function ShareButton({ title, text, className = "fh-action-btn", label = "Share" }) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const url = window.location.href;

    if (navigator.share && isTouchDevice()) {
      try {
        await navigator.share({ title, text, url });
        return;
      } catch (err) {
        if (err.name === "AbortError") return;
      }
    }

    try {
      await copyText(url);
    } catch {
      window.prompt("Copy this link:", url);
      return;
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button type="button" className={className} onClick={handleShare} aria-label={`Share ${title}`}>
      {copied ? <Check size={16} /> : <Share2 size={16} />}
      {copied ? "Link copied" : label}
    </button>
  );
}

export default ShareButton;
