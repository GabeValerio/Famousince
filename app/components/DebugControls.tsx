import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"

interface DebugControlsProps {
  debugMode: boolean;
  setDebugMode: (value: boolean) => void;
  topFontSize: number;
  setTopFontSize: (value: number) => void;
  bottomFontSize: number;
  setBottomFontSize: (value: number) => void;
}

export default function DebugControls({
  debugMode,
  setDebugMode,
  topFontSize,
  setTopFontSize,
  bottomFontSize,
  setBottomFontSize
}: DebugControlsProps) {
  return (
    <div className="w-full max-w-[600px] p-4 bg-white/10 rounded-md mt-4">
      <div className="flex items-center justify-between mb-4">
        <Label className="text-sm text-white">Debug Mode</Label>
        <Button
          variant="outline"
          className="bg-white/10 border-white/20 hover:bg-white/20"
          onClick={() => setDebugMode(!debugMode)}
        >
          {debugMode ? 'Hide Debug Info' : 'Show Debug Info'}
        </Button>
      </div>
      
      {debugMode && (
        <div className="space-y-4">
          <div>
            <Label className="text-sm text-white mb-2">Top Text Font Size: {topFontSize}px</Label>
            <input
              type="range"
              min="12"
              max="40"
              value={topFontSize}
              onChange={(e) => setTopFontSize(Number(e.target.value))}
              className="w-full"
            />
          </div>
          <div>
            <Label className="text-sm text-white mb-2">Bottom Text Font Size: {bottomFontSize}px</Label>
            <input
              type="range"
              min="12"
              max="40"
              value={bottomFontSize}
              onChange={(e) => setBottomFontSize(Number(e.target.value))}
              className="w-full"
            />
          </div>
        </div>
      )}
    </div>
  );
} 