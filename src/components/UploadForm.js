import { useState } from "react";

export default function UploadFolder( {folder} ) {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");

  const handleFileChange = (event) => {
    setFile(event.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file || !folder) {
      setMessage("Please select a file and enter a folder name.");
      return;
    }

    const formData = new FormData();
    formData.append("folder", folder);
    formData.append("image", file);

    // Debug: Check if formData contains correct values
    for (let [key, value] of formData.entries()) {
      console.log(`${key}:`, value);
    }

    setUploading(true);
    setMessage("");

    try {
      const response = await fetch("http://localhost:5001/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setMessage("Image uploaded successfully!");
        console.log("Upload success:", data);
      } else {
        setMessage(data.error || "Upload failed.");
      }
    } catch (error) {
      console.error("Error:", error);
      setMessage("An error occurred while uploading.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="upload-form">
      <div className="general">
        <h2>Upload an Image to the Ethical Family and Greater Kaleidoscope</h2>
      </div>
      <input
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="border p-2 w-full mb-2"
      />
      <button
        onClick={handleUpload}
        disabled={uploading}
        className="bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50"
      >
        {uploading ? "Uploading..." : "Upload"}
      </button>
      {message && <p className="mt-2 text-sm text-red-600">{message}</p>}
    </div>
  );
}
