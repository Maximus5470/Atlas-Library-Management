"use client";

import React, { useRef, useState } from "react";
import { IKImage, ImageKitProvider, IKUpload } from "imagekitio-next";
import config from "@/lib/config";
import Image from "next/image";
import { toast } from "@/hooks/use-toast";

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

const ImageUpload = ({
  onFileChange,
}: {
  onFileChange: (filePath: string) => void;
}) => {
  const ikUploadRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<{ filePath: string } | null>(null);

  const onError = (error: any) => {
    console.log(error);
    toast({
      title: "File Upload Failed",
      description: `Your image was not uploaded`,
      variant: "destructive",
    });
  };
  const onSuccess = (res: any) => {
    setFile(res);
    onFileChange(res.filePath);

    toast({
      title: "File Uploaded",
      description: `${res.filePath} uploaded successfully`,
    });
  };

  return (
    <ImageKitProvider
      publicKey={config.env.imagekit.publicKey}
      authenticator={authenticator}
      urlEndpoint={config.env.imagekit.urlEndpoint}
    >
      <IKUpload
        className={`hidden`}
        ref={ikUploadRef}
        onError={onError}
        onSuccess={onSuccess}
        fileName={`test-upload.png`}
      ></IKUpload>
      <button
        className={`upload-btn`}
        onClick={(e) => {
          e.preventDefault();
          if (ikUploadRef.current) {
            ikUploadRef.current.click();
          }
        }}
      >
        <Image
          src={"./icons/upload.svg"}
          alt={"upload-icon"}
          width={20}
          height={20}
          className={`object-contain`}
        />
        <p className={`text-base text-light-100`}>Upload a File</p>
        {file && <p className={`upload-filename`}>{file.filePath}</p>}
      </button>
      {file && (
        <IKImage
          alt={`${file.filePath}`}
          path={file.filePath}
          width={500}
          height={500}
        />
      )}
    </ImageKitProvider>
  );
};
export default ImageUpload;
