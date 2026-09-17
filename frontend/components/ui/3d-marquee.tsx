"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export const ThreeDMarquee = ({
  items,
  className,
}: {
  items: React.ReactNode[];
  className?: string;
}) => {
  const chunkSize = Math.ceil(items.length / 4);
  const chunks = Array.from({ length: 4 }, (_, colIndex) => {
    const start = colIndex * chunkSize;
    return items.slice(start, start + chunkSize);
  });

  return (
    <div
      className={cn("relative overflow-hidden", className)}
      style={{ isolation: "isolate" }}
    >
      {/* Responsive scale via CSS vars */}
      <style>{`
        .marquee-canvas { --s: 0.72; }
        @media (max-width: 1280px) { .marquee-canvas { --s: 0.55; } }
        @media (max-width: 1024px) { .marquee-canvas { --s: 0.40; } }
        @media (max-width: 768px)  { .marquee-canvas { --s: 0.30; } }
        @media (max-width: 480px)  { .marquee-canvas { --s: 0.22; } }
      `}</style>

      {/*
        The 1800×1800 "design canvas" is absolutely centred in the parent,
        then scaled down responsively. The 3-D rotation + translation is
        applied on the grid inside so centering is preserved.
      */}
      <div
        className="marquee-canvas pointer-events-none"
        style={{
          position: "absolute",
          width: "1800px",
          height: "1800px",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%) scale(var(--s, 0.72))",
          transformOrigin: "center center",
        }}
      >
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: "28px",
            transform: "rotateX(55deg) rotateY(0deg) rotateZ(-45deg)",
            transformStyle: "preserve-3d",
            transformOrigin: "center center",
          }}
        >
          {chunks.map((subarray, colIndex) => (
            <motion.div
              key={colIndex + "col"}
              animate={{ y: colIndex % 2 === 0 ? 140 : -140 }}
              transition={{
                duration: colIndex % 2 === 0 ? 14 : 20,
                repeat: Infinity,
                repeatType: "reverse",
                ease: "easeInOut",
              }}
              style={{ display: "flex", flexDirection: "column", gap: "28px" }}
            >
              {subarray.map((item, idx) => (
                <motion.div
                  key={idx + "item"}
                  whileHover={{ y: -14, scale: 1.04 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                  style={{
                    width: "100%",
                    aspectRatio: "970 / 700",
                    borderRadius: "14px",
                    boxShadow: "0 10px 40px rgba(0,0,0,0.5)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    overflow: "hidden",
                    display: "block",
                  }}
                >
                  {item}
                </motion.div>
              ))}
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};
