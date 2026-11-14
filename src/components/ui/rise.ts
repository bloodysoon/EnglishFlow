import type { CSSProperties } from "react";

// Stagger index for the one-time `rise` entrance animation (globals.css):
// <h1 className="rise" style={riseStyle(1)}>
export const riseStyle = (index: number) => ({ "--i": index }) as CSSProperties;
