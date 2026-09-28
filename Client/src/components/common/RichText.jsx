import { assetUrl } from "../../services/api";

//   ![caption](url) -> embedded image with caption
function renderInline(text) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith("**") && part.endsWith("**") ? <strong key={i}>{part.slice(2, -2)}</strong> : part
  );
}

function RichText({ text }) {
  const blocks = String(text || "")
    .replace(/\r/g, "")
    .split(/\n{2,}/)
    .flatMap((block) => {
      const lines = block.split("\n");
      const out = [];
      let buffer = [];
      lines.forEach((line) => {
        if (/^(##\s|!\[)/.test(line.trim())) {
          if (buffer.length) out.push(buffer.join(" "));
          out.push(line.trim());
          buffer = [];
        } else {
          buffer.push(line);
        }
      });
      if (buffer.length) out.push(buffer.join("\n"));
      return out;
    })
    .map((b) => b.trim())
    .filter(Boolean);

  return (
    <div className="fh-rich-text">
      {blocks.map((block, index) => {
        if (block.startsWith("## ")) return <h2 key={index}>{block.slice(3)}</h2>;

        const image = block.match(/^!\[([^\]]*)\]\(([^)\s]+)\)$/);
        if (image) {
          return (
            <figure key={index}>
              <img src={assetUrl(image[2])} alt={image[1]} loading="lazy" />
              {image[1] && <figcaption>{image[1]}</figcaption>}
            </figure>
          );
        }

        if (block.startsWith("> ")) return <blockquote key={index}>{renderInline(block.slice(2))}</blockquote>;

        if (block.split("\n").every((line) => /^[-*]\s/.test(line))) {
          return (
            <ul key={index}>
              {block.split("\n").map((line, i) => (
                <li key={i}>{renderInline(line.replace(/^[-*]\s/, ""))}</li>
              ))}
            </ul>
          );
        }

        return <p key={index}>{renderInline(block.replace(/\n/g, " "))}</p>;
      })}
    </div>
  );
}

export default RichText;
