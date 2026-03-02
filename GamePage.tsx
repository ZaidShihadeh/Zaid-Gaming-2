import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Loader, Gamepad2, ArrowLeft, ExternalLink } from "lucide-react";

interface Game {
  id: number;
  category: string;
  name: string;
}

export default function GamePage() {
  const { gameId } = useParams<{ gameId: string }>();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [game, setGame] = useState<Game | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchGame();
  }, [gameId]);

  const fetchGame = async () => {
    try {
      setIsLoading(true);
      setError(false);
      const response = await fetch("/api/games");
      const data = await response.json();
      if (data.success && data.games) {
        const foundGame = data.games.find(
          (g: Game) => g.id === parseInt(gameId || "0"),
        );
        if (foundGame) {
          setGame(foundGame);
        } else {
          setError(true);
        }
      }
    } catch (err) {
      console.error("Failed to fetch game:", err);
      setError(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenInNewTab = () => {
    if (!game) return;

    const newWindow = window.open("about:blank", "_blank", "width=1200,height=800");
    if (!newWindow) {
      alert("Please allow popups to open games in new tabs");
      return;
    }

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${game.name}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { width: 100%; height: 100vh; overflow: hidden; background: #000; display: flex; align-items: center; justify-content: center; }
          iframe { border: none; width: 100%; height: 100%; }
        </style>
      </head>
      <body>
        <iframe 
          src="https://math321.lol/exercise-${game.id}.html"
          title="${game.name}"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
          allowfullscreen
          sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-top-navigation allow-popups-to-escape-sandbox"
        ></iframe>
        <script>
          // Wait for iframe to load then hide non-game elements
          document.querySelector('iframe').addEventListener('load', function() {
            try {
              const iframeDoc = this.contentDocument || this.contentWindow.document;
              // Hide everything except game elements
              iframeDoc.querySelector('header')?.style.setProperty('display', 'none', 'important');
              iframeDoc.querySelector('.topbar')?.style.setProperty('display', 'none', 'important');
              iframeDoc.querySelector('.side.left')?.style.setProperty('display', 'none', 'important');
              iframeDoc.querySelector('.side.right')?.style.setProperty('display', 'none', 'important');
              iframeDoc.querySelector('footer')?.style.setProperty('display', 'none', 'important');
              iframeDoc.querySelector('.site-footer')?.style.setProperty('display', 'none', 'important');
              iframeDoc.querySelector('.addelao')?.style.setProperty('display', 'none', 'important');
              
              // Hide ads
              const ads = iframeDoc.querySelectorAll('[id*="ad"], [class*="ad"], .advertisement');
              ads.forEach(ad => ad.style.setProperty('display', 'none', 'important'));
              
              // Make main game area full screen
              const main = iframeDoc.querySelector('main');
              if (main) {
                main.style.setProperty('width', '100%', 'important');
                main.style.setProperty('height', '100%', 'important');
                main.style.setProperty('margin', '0', 'important');
                main.style.setProperty('padding', '0', 'important');
              }
              
              // Center canvas
              const canvas = iframeDoc.querySelector('canvas');
              if (canvas) {
                canvas.style.setProperty('display', 'block', 'important');
                canvas.style.setProperty('margin', '0 auto', 'important');
              }
            } catch (e) {
              console.error('Could not modify iframe:', e);
            }
          });
        </script>
      </body>
      </html>
    `;

    newWindow.document.write(html);
    newWindow.document.close();
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        navigate("/games");
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [navigate]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="w-screen h-screen bg-black flex items-center justify-center">
        <div className="text-center text-white">
          <Loader className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading game...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error || !game) {
    return (
      <div className="w-screen h-screen bg-black flex items-center justify-center">
        <div className="text-center text-white">
          <Gamepad2 className="h-8 w-8 mx-auto mb-4 text-gray-400" />
          <p className="mb-4">Game not found</p>
          <button
            onClick={() => navigate("/games")}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-white"
          >
            Back to Games
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-screen h-screen bg-black overflow-hidden relative">
      <iframe
        ref={iframeRef}
        src={`https://math321.lol/exercise-${game.id}.html`}
        title={game.name}
        className="w-full h-full border-0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
        allowFullScreen
        sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-top-navigation allow-popups-to-escape-sandbox"
        onLoad={() => {
          // Hide website UI elements and show only game canvas
          try {
            const iframeDoc = iframeRef.current?.contentDocument;
            if (!iframeDoc) return;

            // Hide all non-game UI elements
            const elementsToHide = [
              'header',
              '.topbar',
              '.side.left',
              '.side.right',
              'footer',
              '.site-footer',
              '.addelao',
              '.addelao.v300',
              '.addelao.v300x250',
              '[id*="ad"]',
              '[class*="ad-"]',
              'ins',
              '.advertisement',
            ];

            elementsToHide.forEach(selector => {
              const elements = iframeDoc.querySelectorAll(selector);
              elements.forEach(el => {
                (el as HTMLElement).style.display = 'none';
              });
            });

            // Also hide by ID patterns
            const allElements = iframeDoc.querySelectorAll('*');
            allElements.forEach(el => {
              const id = el.id || '';
              const className = el.className || '';
              if (
                id.includes('ad') || 
                className.includes('topbar') ||
                className.includes('side') ||
                className.includes('footer') ||
                className.includes('nav') ||
                className.includes('menu')
              ) {
                if (!className.includes('game') && !id.includes('game')) {
                  (el as HTMLElement).style.display = 'none';
                }
              }
            });

            // Maximize main game area
            const main = iframeDoc.querySelector('main');
            if (main) {
              (main as HTMLElement).style.cssText = 'width: 100% !important; height: 100% !important; margin: 0 !important; padding: 0 !important; background: #000 !important;';
            }

            // Center the canvas
            const canvas = iframeDoc.querySelector('canvas');
            if (canvas) {
              (canvas as HTMLElement).style.cssText = 'display: block !important; margin: 0 auto !important; width: auto !important; height: auto !important; max-width: 100% !important; max-height: 100% !important;';
              
              // Make parent flex container to center canvas
              const parent = canvas.parentElement;
              if (parent) {
                (parent as HTMLElement).style.cssText = 'display: flex !important; align-items: center !important; justify-content: center !important; width: 100% !important; height: 100% !important; background: #000 !important; margin: 0 !important; padding: 0 !important;';
              }
            }
          } catch (e) {
            console.error('Could not modify iframe content:', e);
          }
        }}
      />

      {/* Always-visible control bar at top */}
      <div className="absolute top-0 left-0 right-0 z-50 bg-gradient-to-b from-black/80 to-transparent p-4 flex items-center justify-between">
        {/* Back Button */}
        <button
          onClick={() => navigate("/games")}
          className="flex items-center gap-2 px-3 py-2 bg-blue-600/30 hover:bg-blue-600/50 text-blue-400 rounded transition-colors"
          title="Back to games (ESC)"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="text-sm font-medium">Back</span>
        </button>

        {/* Game Title */}
        <div className="hidden sm:block text-white text-center text-sm">
          <p className="font-bold">{game.name}</p>
          <p className="text-xs text-gray-400">{game.category}</p>
        </div>

        {/* Open in New Tab Button */}
        <button
          onClick={handleOpenInNewTab}
          className="flex items-center gap-2 px-3 py-2 bg-purple-600/30 hover:bg-purple-600/50 text-purple-400 rounded transition-colors"
          title="Open in new tab"
        >
          <ExternalLink className="h-4 w-4" />
          <span className="text-sm font-medium">New Tab</span>
        </button>
      </div>

      {/* Bottom hint */}
      <div className="absolute bottom-4 left-4 text-white text-xs text-gray-400 animate-fade-out" style={{animation: 'fadeOut 5s ease-in-out forwards'}}>
        <style>{`
          @keyframes fadeOut {
            0% { opacity: 1; }
            80% { opacity: 1; }
            100% { opacity: 0; }
          }
        `}</style>
        <p>Press ESC to go back</p>
      </div>
    </div>
  );
}
