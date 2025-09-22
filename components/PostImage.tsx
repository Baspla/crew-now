"use client";
import { motion } from 'motion/react';
import { init } from 'next/dist/compiled/webpack/webpack';
import React, { useState, useRef, useEffect } from 'react';

const fadeOutDelay = 600; // Zeit in ms, nach der das Overlay ausgeblendet wird

interface PostImageProps {
  imageUrl: string;
  frontImageUrl?: string | null;
  alt?: string;
  className?: string;
  style?: React.CSSProperties;
  overlayPosition?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  overlaySize?: 'small' | 'medium' | 'large';
  children?: React.ReactNode;
}

export default function PostImage({
  imageUrl,
  frontImageUrl,
  alt = "Post",
  className,
  style,
  overlayPosition = 'top-right',
  overlaySize = 'medium',
  children
}: PostImageProps) {
  // State für die beiden Bilder, um sie vertauschen zu können
  const [mainImage, setMainImage] = useState(imageUrl);
  const [overlayImage, setOverlayImage] = useState(frontImageUrl);
  
  // State für das Fade-Out des Overlay-Bildes
  const [overlayOpacity, setOverlayOpacity] = useState(1);
  const [isPressed, setIsPressed] = useState(false);
  const [isSwapping, setIsSwapping] = useState(false);
  const pressTimer = useRef<NodeJS.Timeout | null>(null);

  // Cleanup Timer beim Unmount
  useEffect(() => {
    return () => {
      if (pressTimer.current) {
        clearTimeout(pressTimer.current);
      }
    };
  }, []);

  // Funktion zum Vertauschen der Bilder mit Animation
  const swapImages = async () => {
    if (overlayImage && !isSwapping) {
      setIsSwapping(true);
      
      // Kurze Verzögerung für die Animation
      setTimeout(() => {
        const tempMain = mainImage;
        setMainImage(overlayImage);
        setOverlayImage(tempMain);
        setIsSwapping(false);
      }, 100); // Reduzierte Verzögerung
    }
  };

  // Handler für das Drücken des Hauptbildes
  const handlePressStart = () => {
    setIsPressed(true);
    pressTimer.current = setTimeout(() => {
      setOverlayOpacity(0);
    }, fadeOutDelay); // Fade-Out delay in ms
  };

  const handlePressEnd = () => {
    setIsPressed(false);
    if (pressTimer.current) {
      clearTimeout(pressTimer.current);
      pressTimer.current = null;
    }
    // Overlay wieder einblenden, falls es ausgeblendet wurde
    if (overlayOpacity === 0) {
      setOverlayOpacity(1);
    }
  };

  // Mouse Event Handler
  const handleMouseDown = () => {
    handlePressStart();
  };

  const handleMouseUp = () => {
    handlePressEnd();
  };

  const handleMouseLeave = () => {
    handlePressEnd();
  };

  // Touch Event Handler
  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault(); // Verhindert zusätzliche Mouse-Events
    handlePressStart();
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    e.preventDefault(); // Verhindert zusätzliche Mouse-Events
    handlePressEnd();
  };

  const handleTouchCancel = (e: React.TouchEvent) => {
    e.preventDefault(); // Verhindert zusätzliche Mouse-Events
    handlePressEnd();
  };
  const overlayPositionClasses = {
    'top-left': 'top-[2%] left-[2%]',
    'top-right': 'top-[2%] right-[2%]',
    'bottom-left': 'bottom-[2%] left-[2%]',
    'bottom-right': 'bottom-[2%] right-[2%]'
  };

  const overlaySizeClasses = {
    small: 'w-[20%]',
    medium: 'w-[25%]',
    large: 'w-[30%]'
  };

  // Vereinfachte Animation Varianten
  const imageVariants = {
    initial: { 
      opacity: 1 
    },
    swapping: { 
      opacity: 0.8
    },
    final: { 
      opacity: 1
    }
  };

  const overlayVariants = {
    visible: {
      opacity: overlayOpacity,
      x: 0
    },
    hidden: {
      opacity: 0,
      x: -20
    },
    swapping: {
      opacity: 0.7,
      x: -20
    }
  };

  return (
    <div 
      className={`relative inline-block ${className}`} 
      style={style}
      role="img"
      aria-label={overlayImage ? `${alt} mit Überlagerungsbild` : alt}
    >
      {/* Hauptbild */}
      <motion.img 
        src={mainImage} 
        alt={alt}
        variants={imageVariants}
        initial="initial"
        animate={isSwapping ? "swapping" : "final"}
        transition={{ 
          duration: 0.2, 
          ease: "easeOut"
        }}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchCancel}
        className="w-full h-auto block cursor-pointer rounded-lg"
        role="button"
        aria-label={`${alt} - Drücken und halten um Überlagerungsbild auszublenden`}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleMouseDown();
            setTimeout(handleMouseUp, 1000); // Simuliert ein kurzes Drücken
          }
        }}
      />
      
      {/* Overlay-Bild falls vorhanden */}
      {overlayImage && (
        <motion.img
          src={overlayImage}
          alt="Überlagerungsbild"
          variants={overlayVariants}
          initial="visible"
          animate={
            isSwapping 
              ? "swapping" 
              : overlayOpacity === 0 
                ? "hidden" 
                : "visible"
          }
          transition={{
            duration: 0.2,
            ease: "easeOut"
          }}
          onClick={swapImages}
          role="button"
          aria-label="Klicken um Haupt- und Überlagerungsbild zu vertauschen"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              swapImages();
            }
          }}
          className={`absolute h-auto rounded-lg border-2 border-white dark:border-zinc-800 object-cover z-10 cursor-pointer ${overlayPositionClasses[overlayPosition]} ${overlaySizeClasses[overlaySize]}`}
        />
      )}
      
      {/* Children/Slot content */}
      {children}
    </div>
  );
}