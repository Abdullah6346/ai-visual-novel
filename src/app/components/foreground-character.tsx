"use client";

import { useState, useEffect } from "react";
import { useGameState } from "@/app/context/GameContext";

const SVG_CHARACTERS = {
  default: "/characters/default.svg",
  happy: "/characters/happy.svg",
  sad: "/characters/sad.svg",
};

const EMOTION_MAPPING = {
  happy: "happy",
  sad: "sad",
  default: "default",
};

export default function ForegroundCharacter() {
  const { gameState } = useGameState();
  const [characterSrc, setCharacterSrc] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function fetchCharacter() {
      setLoading(true);

      // Get emotion
      let emotion = gameState.character?.toLowerCase() || "default";
      emotion = EMOTION_MAPPING[emotion] || "default";

      try {
        // Direct call to API - keeping this simple
        const response = await fetch("/api/generate-character", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            emotion,
            characterType: "anime",
            timestamp: Date.now(), // Prevent caching
          }),
        });

        if (!response.ok) throw new Error("API request failed");

        const data = await response.json();

        if (isMounted) {
          if (data.image && data.image.startsWith("data:")) {
            // Already a data URL
            setCharacterSrc(data.image);
          } else if (data.image) {
            // Convert to data URL
            setCharacterSrc(`data:image/png;base64,${data.image}`);
          } else {
            // Fallback
            setCharacterSrc(SVG_CHARACTERS[emotion]);
          }
          setLoading(false);
        }
      } catch (error) {
        console.error("Character fetch error:", error);
        if (isMounted) {
          setCharacterSrc(SVG_CHARACTERS[emotion]);
          setLoading(false);
        }
      }
    }

    fetchCharacter();

    return () => {
      isMounted = false;
    };
  }, [gameState.character]);

  return (
    <div className="absolute top-4 left-4 z-10">
      <div
        className="relative bg-slate-900 bg-opacity-70 rounded-lg p-2"
        style={{ width: "180px", height: "270px" }}
      >
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="text-white text-sm mb-2">Generating...</div>
            <div className="w-8 h-8 border-t-2 border-blue-500 border-solid rounded-full animate-spin"></div>
          </div>
        ) : (
          <img
            src={characterSrc}
            alt={`Character (${gameState.character || "default"})`}
            style={{
              maxWidth: "100%",
              maxHeight: "100%",
              objectFit: "contain",
            }}
            className="rounded"
            onError={(e) => {
              console.error("Image load error");
              e.target.src = SVG_CHARACTERS[gameState.character || "default"];
            }}
          />
        )}

        {/* <div className="text-xs bg-black bg-opacity-70 text-white p-1 rounded absolute bottom-0 left-1/2 transform -translate-x-1/2">
          {gameState.character || "default"}
        </div> */}
      </div>
    </div>
  );
}
