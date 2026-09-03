"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MediaUploader, type UploadedMedia } from "@/components/ui/media-uploader";

export function ImageUploadField(props: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  accept?: string;
  previewAlt?: string;
  previewClassName?: string;
  /** Optional trailing control rendered inline with the upload/clear buttons (e.g. an AI Studio launcher). */
  action?: ReactNode;
}) {
  const acceptTypes: ("image" | "video" | "model")[] = props.accept?.includes("video") ? ["image", "video"] : ["image"];
  
  // Sync MediaUploader state with the string value
  const [mediaState, setMediaState] = useState<UploadedMedia[]>([]);

  useEffect(() => {
    if (props.value) {
      if (mediaState.length === 0 || mediaState[0].url !== props.value) {
        setMediaState([
          {
            _id: "preview-id",
            type: "image",
            url: props.value,
            mimeType: "image/png",
          },
        ]);
      }
    } else {
      setMediaState([]);
    }
  }, [props.value]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleMediaChange = (newMedia: UploadedMedia[]) => {
    setMediaState(newMedia);
    if (newMedia.length > 0) {
      props.onChange(newMedia[0].url);
    } else {
      props.onChange("");
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor={props.id} className="mb-2 block">
          {props.label}
        </Label>
        <MediaUploader
          value={mediaState}
          onChange={handleMediaChange}
          maxFiles={1}
          acceptTypes={acceptTypes}
          accept={props.accept}
          disabled={props.disabled}
          showFileCount={false}
          previewFit="contain"
          previewTileClassName={props.previewClassName}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor={`${props.id}-url`} className="text-xs text-muted-foreground">
          Or paste image URL
        </Label>
        <div className="flex gap-2">
          <Input
            id={`${props.id}-url`}
            className="min-w-0 flex-1"
            placeholder="https://..."
            value={props.value}
            onChange={(e) => props.onChange(e.target.value)}
            disabled={props.disabled}
          />
          {props.action}
        </div>
      </div>
    </div>
  );
}
