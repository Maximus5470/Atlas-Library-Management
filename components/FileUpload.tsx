"use client";

import React, { useRef, useState } from "react";
import { IKImage, ImageKitProvider, IKUpload, IKVideo } from "imagekitio-next";
import config from "@/lib/config";
import Image from "next/image";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface Props {
  type: `image` | `video`;
  accept: string;
  placeholder: string;
  folder: string;
  variant: `dark` | "light";
  onFileChange: (filePath: string) => void;
  value?: string;
}

const authenticator = async () => {
  try {
    const response = await fetch(`${config.env.apiEndpoint}/api/auth/imagekit`);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Request failed status: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    const { signature, expire, token } = data;

    return { token, signature, expire };
  } catch (e) {
    throw new Error(`Auth Failed: ${(e as Error).message}`);
  }
};

const FileUpload = ({
  type,
  accept,
  variant,
  placeholder,
  folder,
  value,
  onFileChange,
}: Props) => {
  const ikUploadRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<{ filePath: string | null } | null>({
    filePath: value ?? null,
  });
  const [progress, setProgress] = useState(0);

  const styles = {
    button:
      variant === `dark`
        ? `bg-dark-300`
        : `bg-light-600 border-gray-100 border`,
    placeholder: variant === `dark` ? `text-light-100` : `text-slate-500`,
    text: variant === `dark` ? `text-light-100` : `text-dark-400`,
  };

  const onError = (error: any) => {
    console.log(error);
    toast({
      title: `${type} Upload Failed`,
      description: `Your ${type} was not uploaded`,
      variant: "destructive",
    });
  };
  const onSuccess = (res: any) => {
    setFile(res);
    onFileChange(res.filePath);

    toast({
      title: `${type} Uploaded`,
      description: `${res.filePath} uploaded successfully`,
    });
  };

  const onValidate = (file: File) => {
    if (type === `image`) {
      if (file.size > 20 * 1024 * 1024) {
        toast({
          title: `File Too Large`,
          description: `File size should be less than 20MB`,
          variant: "destructive",
        });
        return false;
      }
    } else if (type === `video`) {
      if (file.size > 50 * 1024 * 1024) {
        toast({
          title: `File Too Large`,
          description: `File size should be less than 50MB`,
          variant: "destructive",
        });
        return false;
      }
    }
    return true;
  };

  return (
    <ImageKitProvider
      publicKey={config.env.imagekit.publicKey}
      authenticator={authenticator}
      urlEndpoint={config.env.imagekit.urlEndpoint}
    >
      <IKUpload
        ref={ikUploadRef}
        onError={onError}
        onSuccess={onSuccess}
        useUniqueFileName={true}
        validateFile={onValidate}
        onUploadStart={() => setProgress(0)}
        onUploadProgress={({ loaded, total }) => {
          const percent = Math.round((loaded / total) * 100);
          setProgress(percent);
        }}
        folder={folder}
        accept={accept}
        className={`hidden`}
      ></IKUpload>
      <button
        className={cn(`upload-btn`, styles.button)}
        onClick={(e) => {
          e.preventDefault();
          if (ikUploadRef.current) {
            ikUploadRef.current.click();
          }
        }}
      >
        <Image
          src={"/icons/upload.svg"}
          alt={"upload-icon"}
          width={20}
          height={20}
          className={`object-contain`}
        />
        <p className={cn(`text-base`, styles.placeholder)}>{placeholder}</p>
        {file && (
          <p className={cn(`upload-filename`, styles.text)}>{file.filePath}</p>
        )}
      </button>

      {progress > 0 && progress !== 100 && (
        <div className={`w-full rounded-full bg-green-200`}>
          <div className={`progress`} style={{ width: `${progress}%` }}>
            {progress}%
          </div>
        </div>
      )}

      {file &&
        (type === `image` ? (
          <IKImage
            alt={`${file.filePath}`}
            path={file.filePath!}
            width={500}
            height={500}
          />
        ) : type === `video` ? (
          <IKVideo
            path={file.filePath!}
            controls={true}
            className={`h-96 w-full rounded-xl`}
          />
        ) : null)}
    </ImageKitProvider>
  );
};
export default FileUpload;
