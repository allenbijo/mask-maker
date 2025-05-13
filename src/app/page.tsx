"use client";

import { useState, useRef, useCallback } from "react";
import Image from "next/image";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Download, UploadCloud, Image as ImageIcon, Palette, DownloadCloud } from "lucide-react";

import BrushControls from "@/components/maskify/BrushControls";
import DrawingArea, { type DrawingAreaRef } from "@/components/maskify/DrawingArea";

export default function MaskifyPage() {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [brushSize, setBrushSize] = useState(20);
  const [isErasing, setIsErasing] = useState(false);
  const { toast } = useToast();

  const drawingAreaRef = useRef<DrawingAreaRef>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        toast({
          title: "Invalid File Type",
          description: "Please upload an image file (e.g., PNG, JPG, GIF).",
          variant: "destructive",
        });
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImageSrc(e.target?.result as string);
        // Reset drawing state if a new image is uploaded
        if (drawingAreaRef.current) {
          drawingAreaRef.current.clearDrawing();
        }
        setIsErasing(false); 
      };
      reader.readAsDataURL(file);
       toast({
        title: "Image Uploaded",
        description: `${file.name} is ready for masking.`,
      });
    }
  };

  const handleDownloadMask = useCallback(() => {
    if (drawingAreaRef.current) {
      drawingAreaRef.current.downloadMask(
        imageFile ? `${imageFile.name.split('.')[0]}_mask.png` : "mask.png"
      );
      toast({
        title: "Mask Downloading",
        description: "Your mask has started downloading.",
      });
    } else {
       toast({
        title: "Error",
        description: "No drawing area found to download mask.",
        variant: "destructive",
      });
    }
  }, [drawingAreaRef, imageFile, toast]);

  const handleClearDrawing = useCallback(() => {
    if (drawingAreaRef.current) {
      drawingAreaRef.current.clearDrawing();
      toast({
        title: "Drawing Cleared",
        description: "The canvas has been cleared.",
      });
    }
  }, [drawingAreaRef, toast]);
  
  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <main className="min-h-screen bg-background text-foreground flex flex-col items-center py-8 px-4 sm:py-12 sm:px-6 lg:px-8">
      <header className="mb-8 sm:mb-12 text-center">
        <div className="inline-flex items-center justify-center p-3 bg-accent rounded-full mb-4 shadow-md">
          <Palette className="h-10 w-10 text-accent-foreground" />
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight">
          Maskify
        </h1>
        <p className="mt-3 text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
          Create custom image masks with ease. Upload, draw, and download your masterpiece.
        </p>
      </header>

      <div className="w-full max-w-5xl space-y-8">
        {/* Step 1: Upload Image */}
        {!imageSrc && (
           <Card className="shadow-xl border-2 border-dashed border-accent/50 hover:border-accent transition-all duration-300">
            <CardContent className="p-8 text-center">
              <UploadCloud className="mx-auto h-16 w-16 text-accent mb-4" />
              <h2 className="text-2xl font-semibold mb-2">Upload Your Image</h2>
              <p className="text-muted-foreground mb-6">
                Drag & drop or click to select an image file to start masking.
              </p>
              <Button onClick={triggerFileInput} size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground">
                <ImageIcon className="mr-2 h-5 w-5" /> Select Image
              </Button>
              <Input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                aria-label="Image upload input"
              />
            </CardContent>
          </Card>
        )}

        {imageSrc && (
          <>
           {/* Image Preview and Re-upload */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="text-xl flex items-center">
                  <ImageIcon className="mr-2 h-5 w-5 text-accent" /> Current Image
                </CardTitle>
                {imageFile && <CardDescription>{imageFile.name}</CardDescription>}
              </CardHeader>
              <CardContent className="text-center">
                 <Image
                    src={imageSrc}
                    alt="Uploaded preview"
                    width={400}
                    height={300}
                    className="rounded-md object-contain mx-auto max-h-60 mb-4 border shadow-sm"
                    data-ai-hint="user uploaded image"
                  />
                <Button onClick={triggerFileInput} variant="outline">
                  <UploadCloud className="mr-2 h-4 w-4" /> Change Image
                </Button>
                <Input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  aria-label="Change image input"
                />
              </CardContent>
            </Card>

            {/* Step 2: Draw Your Mask */}
            <BrushControls
              brushSize={brushSize}
              onBrushSizeChange={setBrushSize}
              isErasing={isErasing}
              onToggleErase={() => setIsErasing(!isErasing)}
              onClearDrawing={handleClearDrawing}
            />
            
            <Card className="shadow-lg overflow-hidden">
               <CardHeader>
                <CardTitle className="text-xl">Draw Your Mask</CardTitle>
                <CardDescription>
                  Use the tools to draw on your image. Black areas will be part of the mask.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <DrawingArea
                  ref={drawingAreaRef}
                  imageSrc={imageSrc}
                  brushSize={brushSize}
                  isErasing={isErasing}
                  className="aspect-[4/3] md:aspect-[16/9]" 
                />
              </CardContent>
            </Card>

            {/* Step 3: Download */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="text-xl flex items-center">
                  <DownloadCloud className="mr-2 h-5 w-5 text-accent" /> Download Your Mask
                </CardTitle>
                <CardDescription>
                  Once you're happy with your drawing, download the generated mask as a PNG file.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={handleDownloadMask} className="w-full bg-accent hover:bg-accent/90 text-accent-foreground" size="lg" disabled={!imageSrc}>
                  <Download className="mr-2 h-5 w-5" />
                  Download Mask (PNG)
                </Button>
              </CardContent>
            </Card>
          </>
        )}
      </div>
      <footer className="mt-16 text-center text-muted-foreground text-sm">
        <p>&copy; {new Date().getFullYear()} Maskify. All rights reserved.</p>
        <p>Built with Next.js and ShadCN UI.</p>
      </footer>
    </main>
  );
}
