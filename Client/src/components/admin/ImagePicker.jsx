import { ImagePlus } from "lucide-react";

import { assetUrl } from "../../services/api";

function ImagePicker({ id, label = "Image", preview, onChange }) {
  return (
    <div className="manager-form-group">
      <label>{label}</label>
      <label htmlFor={id} className="fh-image-picker">
        {preview ? (
          <img src={assetUrl(preview)} alt="Preview" />
        ) : (
          <span className="fh-image-picker-empty">
            <ImagePlus size={22} />
          </span>
        )}
        <span>{preview ? "Click to change image" : "Click to upload an image (max 2 MB)"}</span>
      </label>
      <input
        id={id}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        hidden
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) onChange(file, URL.createObjectURL(file));
        }}
      />
    </div>
  );
}

export default ImagePicker;
