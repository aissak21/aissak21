import { useState, useEffect } from "react";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import { Dialog, DialogTrigger, DialogContent } from "@radix-ui/react-dialog";
import Button from "../components/ui/Button";
import UploadForm from "./UploadForm";
import "../styles.css"; // Import the updated styles

export default function ImagePopup({ image, onClose }) {
  const [currentFolderImages, setCurrentFolderImages] = useState([]);
  const [initialIndex, setInitialIndex] = useState(0);
  const sliderSettings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    initialSlide: initialIndex, // Ensure correct initial slide
  };

  useEffect(() => {
    if (!image) return;
    fetch("/api/images")
      .then((res) => res.json())
      .then((data) => {
        const filteredImages = data.filter((img) => img.folder === image.folder);
        setCurrentFolderImages(filteredImages);

        // Find the index of the clicked image
        const index = filteredImages.findIndex((img) => img.path === image.path);
        setInitialIndex(index); // Default to 0 if not found
        console.log('index is',index)
      })
      .catch((error) => console.error("Error fetching images:", error));
  }, [image]);

  {/* Function to format text with line breaks and clickable URLs*/}
  const formatText = (text) => {
      if (!text) return "";
    
      // Convert URLs into clickable links
      const urlRegex = /(https?:\/\/[^\s]+)/g;
      return text
        .replace(/\n/g, "<br>") // Replace newlines with <br>
        .replace(urlRegex, '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>'); // Convert URLs into links
  };

  return (
    <Dialog open={!!image} onOpenChange={onClose}>
      <div className = "dialog-overlay">        
        <DialogContent className="dialog-content">
          {/* Image Grid */}
          <Slider key={initialIndex} {...sliderSettings}>
              {currentFolderImages.map((img, initialIndex) => (
                <div key={img.path} className="slide-container">
                  <img src={img.path} alt="sliding" className="slide-image" />
                </div>
              ))}
          </Slider>

          {/* Description Section */}
          <div className="description">
            <h3>Description</h3>
            <p dangerouslySetInnerHTML={{ __html: formatText(image.description) }}></p>
          </div>

          {/* Prompts Section */}
          <div className="prompt">
            <h3>Definition Prompt</h3>
            <p>{image.definition}</p>
            <h3>Practice Prompt</h3>
            <p>{image.practice}</p>
          </div>

          {/* Upload Form */}
          <div className="description">
            <UploadForm folder={image.folder} />
          </div>
        </DialogContent>
      </div>
    </Dialog>
  );
}
