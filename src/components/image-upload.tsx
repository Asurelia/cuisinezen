"use client";

import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { useImageUpload } from '@/hooks/use-image-upload';
import { ImageUploadOptions, UploadResult } from '@/services/image.service';
import { Upload, X, Image as ImageIcon, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ImageUploadProps {
  category: 'product' | 'recipe';
  onUpload?: (result: UploadResult) => void;
  onError?: (error: string) => void;
  options?: ImageUploadOptions;
  multiple?: boolean;
  maxFiles?: number;
  className?: string;
  disabled?: boolean;
}

interface PreviewImage {
  file: File;
  url: string;
  id: string;
}

export function ImageUpload({
  category,
  onUpload,
  onError,
  options = {},
  multiple = false,
  maxFiles = 5,
  className,
  disabled = false
}: ImageUploadProps) {
  const [previews, setPreviews] = useState<PreviewImage[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploading, progress, error, uploadImage, uploadMultiple, reset } = useImageUpload();
  const { toast } = useToast();

  // Validation des fichiers
  const validateFile = (file: File): string | null => {
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

    if (file.size > maxSize) {
      return `${file.name}: Taille maximale autorisée 5MB`;
    }

    if (!allowedTypes.includes(file.type)) {
      return `${file.name}: Type de fichier non supporté. Utilisez JPG, PNG ou WebP`;
    }

    return null;
  };

  // Gestion des fichiers sélectionnés
  const handleFiles = useCallback((files: FileList) => {
    const newPreviews: PreviewImage[] = [];
    const errors: string[] = [];

    Array.from(files).forEach((file, index) => {
      // Vérifier la limite de fichiers
      if (!multiple && previews.length > 0) {
        errors.push('Un seul fichier autorisé en mode simple');
        return;
      }

      if (previews.length + newPreviews.length >= maxFiles) {
        errors.push(`Maximum ${maxFiles} fichiers autorisés`);
        return;
      }

      // Valider le fichier
      const validationError = validateFile(file);
      if (validationError) {
        errors.push(validationError);
        return;
      }

      // Créer l'aperçu
      const url = URL.createObjectURL(file);
      newPreviews.push({
        file,
        url,
        id: `${Date.now()}_${index}`
      });
    });

    if (errors.length > 0) {
      toast({
        title: "Erreurs de validation",
        description: errors.join('\n'),
        variant: "destructive"
      });
      onError?.(errors.join(', '));
    }

    if (newPreviews.length > 0) {
      setPreviews(prev => multiple ? [...prev, ...newPreviews] : newPreviews);
      reset(); // Reset du state d'upload précédent
    }
  }, [previews, multiple, maxFiles, toast, onError, reset]);

  // Gestion du clic sur le bouton d'upload
  const handleClick = () => {
    if (!disabled && !uploading) {
      fileInputRef.current?.click();
    }
  };

  // Gestion du drag & drop
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled && !uploading) {
      setDragOver(true);
    }
  }, [disabled, uploading]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    if (disabled || uploading) return;

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFiles(files);
    }
  }, [disabled, uploading, handleFiles]);

  // Suppression d'un aperçu
  const removePreview = (id: string) => {
    setPreviews(prev => {
      const updated = prev.filter(p => p.id !== id);
      // Libérer l'URL d'objet
      const toRemove = prev.find(p => p.id === id);
      if (toRemove) {
        URL.revokeObjectURL(toRemove.url);
      }
      return updated;
    });
  };

  // Upload effectif
  const handleUpload = async () => {
    if (previews.length === 0 || uploading) return;

    try {
      const files = previews.map(p => p.file);

      let result: UploadResult | UploadResult[] | null;

      if (multiple && files.length > 1) {
        result = await uploadMultiple(files, category, options);
        if (result && result.length > 0) {
          onUpload?.(result[0]); // Retourner le premier résultat
          toast({
            title: "Upload réussi",
            description: `${result.length} images uploadées avec succès`
          });
        }
      } else {
        result = await uploadImage(files[0], category, options);
        if (result) {
          onUpload?.(result);
          toast({
            title: "Upload réussi",
            description: "Image uploadée avec succès"
          });
        }
      }

      if (result) {
        // Nettoyer les aperçus
        previews.forEach(p => URL.revokeObjectURL(p.url));
        setPreviews([]);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Erreur inconnue';
      toast({
        title: "Erreur d'upload",
        description: errorMsg,
        variant: "destructive"
      });
      onError?.(errorMsg);
    }
  };

  // Nettoyage des URLs d'objet à la fermeture
  const cleanup = () => {
    previews.forEach(p => URL.revokeObjectURL(p.url));
    setPreviews([]);
    reset();
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Zone de drop */}
      <div
        className={cn(
          "border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer",
          dragOver && "border-primary bg-primary/5",
          !dragOver && !disabled && "border-muted-foreground/25 hover:border-primary/50",
          disabled && "border-muted-foreground/10 cursor-not-allowed opacity-50"
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp"
          multiple={multiple}
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
          className="hidden"
          disabled={disabled}
        />

        <div className="flex flex-col items-center gap-2">
          <Upload className="w-8 h-8 text-muted-foreground" />
          <div>
            <p className="text-sm font-medium">
              {multiple ? 'Sélectionnez ou glissez des images' : 'Sélectionnez ou glissez une image'}
            </p>
            <p className="text-xs text-muted-foreground">
              JPG, PNG, WebP - Max 5MB {multiple && `- Max ${maxFiles} fichiers`}
            </p>
          </div>
        </div>
      </div>

      {/* Aperçus des images */}
      {previews.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium">Aperçu ({previews.length})</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {previews.map((preview) => (
              <div key={preview.id} className="relative group">
                <div className="aspect-square rounded-lg overflow-hidden bg-muted">
                  <img
                    src={preview.url}
                    alt={preview.file.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removePreview(preview.id);
                  }}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  disabled={uploading}
                >
                  <X className="w-3 h-3" />
                </button>
                <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-1 truncate">
                  {preview.file.name}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Barre de progression */}
      {uploading && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <ImageIcon className="w-4 h-4" />
            <span className="text-sm">Upload en cours...</span>
          </div>
          <Progress value={progress} className="w-full" />
        </div>
      )}

      {/* Erreur */}
      {error && (
        <div className="flex items-center gap-2 text-destructive text-sm">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}

      {/* Boutons d'action */}
      {previews.length > 0 && (
        <div className="flex gap-2">
          <Button
            onClick={handleUpload}
            disabled={uploading || disabled}
            className="flex-1"
          >
            {uploading ? 'Upload...' : `Uploader ${multiple && previews.length > 1 ? `(${previews.length})` : ''}`}
          </Button>
          <Button
            variant="outline"
            onClick={cleanup}
            disabled={uploading}
          >
            Annuler
          </Button>
        </div>
      )}
    </div>
  );
}