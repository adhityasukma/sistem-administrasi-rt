import { useState, useRef } from 'react';
import { HiCloudArrowUp, HiXMark } from 'react-icons/hi2';
import './FileUpload.css';

export default function FileUpload({
  onFileSelect,
  onRemove,
  currentImage,
  accept = 'image/jpeg,image/png,image/jpg',
}) {
  const [preview, setPreview] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [isRemoved, setIsRemoved] = useState(false);
  const inputRef = useRef(null);

  const handleFile = (file) => {
    if (!file) return;
    setPreview(URL.createObjectURL(file));
    setIsRemoved(false);
    onFileSelect?.(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      handleFile(file);
    }
  };

  const handleChange = (e) => {
    handleFile(e.target.files[0]);
  };

  const handleRemove = (e) => {
    e.stopPropagation();
    setPreview(null);
    setIsRemoved(true);
    onFileSelect?.(null);
    onRemove?.();
    if (inputRef.current) inputRef.current.value = '';
  };

  const displayImage = preview || (!isRemoved && currentImage);

  return (
    <div
      className={`file-upload ${dragOver ? 'dragover' : ''}`}
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleChange}
      />
      {displayImage ? (
        <div className="file-upload-preview">
          <img src={displayImage} alt="Preview" />
          <button type="button" className="file-upload-remove" onClick={handleRemove}>
            <HiXMark />
          </button>
        </div>
      ) : (
        <>
          <div className="file-upload-icon">
            <HiCloudArrowUp />
          </div>
          <div className="file-upload-text">
            Klik atau seret foto ke sini
          </div>
          <div className="file-upload-hint">
            JPG, PNG (maks. 2MB)
          </div>
        </>
      )}
    </div>
  );
}
