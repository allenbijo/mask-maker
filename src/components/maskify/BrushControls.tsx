"use client";

import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Pencil, Eraser, RotateCcw, Settings2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface BrushControlsProps {
  brushSize: number;
  onBrushSizeChange: (size: number) => void;
  isErasing: boolean;
  onToggleErase: () => void;
  onClearDrawing: () => void;
}

export default function BrushControls({
  brushSize,
  onBrushSizeChange,
  isErasing,
  onToggleErase,
  onClearDrawing,
}: BrushControlsProps) {
  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center text-xl">
          <Settings2 className="mr-2 h-5 w-5 text-accent" />
          Brush Settings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <Label htmlFor="brush-size" className="mb-2 block text-sm font-medium text-foreground/80">
            Brush Size: {brushSize}px
          </Label>
          <Slider
            id="brush-size"
            min={1}
            max={100}
            step={1}
            value={[brushSize]}
            onValueChange={(value) => onBrushSizeChange(value[0])}
            className="[&>span:first-child]:bg-accent"
          />
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            onClick={onToggleErase}
            variant={isErasing ? "outline" : "default"}
            className="w-full sm:flex-1"
            aria-label={isErasing ? "Switch to Draw mode" : "Switch to Erase mode"}
          >
            {isErasing ? (
              <Pencil className="mr-2 h-4 w-4" />
            ) : (
              <Eraser className="mr-2 h-4 w-4" />
            )}
            {isErasing ? "Draw" : "Erase"}
          </Button>
          <Button
            onClick={onClearDrawing}
            variant="outline"
            className="w-full sm:flex-1"
            aria-label="Clear current drawing"
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            Clear
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
