import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Apply global styles for the waveform animation
const globalStyles = document.createElement("style");
globalStyles.innerHTML = `
  @keyframes move-waveform {
    from { mask-position: 0px 0px; }
    to { mask-position: 1200px 0px; }
  }
`;
document.head.appendChild(globalStyles);

createRoot(document.getElementById("root")!).render(<App />);
