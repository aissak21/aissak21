import { useState } from "react";

export default function UploadFolder( {folder} ) {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [modelName, setModelName] = useState(""); // State to store model name

  const handleFileChange = (event) => {
    setFile(event.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file || !folder || !modelName) {
      setMessage("Please select a file and enter a folder name.");
      return;
    }

    const formData = new FormData();
    formData.append("folder", folder);
    formData.append("image", file);
    formData.append("name", modelName)

    // Debug: Check if formData contains correct values
    for (let [key, value] of formData.entries()) {
      console.log(`${key}:`, value);
    }

    setUploading(true);
    setMessage("");

    try {
      const response = await fetch("/api/upload", {
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

      {/* Input field for model name */}
      <input
        type="text"
        placeholder="Enter the name of the model"
        value={modelName}
        onChange={(e) => setModelName(e.target.value)}
        required
      />

      <button
        onClick={handleUpload}
        disabled={uploading || !modelName.trim()}
      >
        {uploading ? "Uploading..." : "Upload"}
      </button>
      {message && <p className="mt-2 text-sm text-red-600">{message}</p>}
    </div>
  );
}
