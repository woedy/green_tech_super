import { api } from "@/lib/api";

export type UploadDescriptor = {
  upload_mode: "s3" | "direct";
  url?: string;
  bucket?: string;
  key?: string;
  fields?: Record<string, string>;
  storage_key: string | null;
  original_name: string;
  upload_url?: string;
};

export type UploadedFileMeta = {
  storage_key: string;
  original_name: string;
  url?: string;
};

async function requestUpload(file: File): Promise<UploadDescriptor> {
  return api.post<UploadDescriptor>("/api/build-requests/uploads/", {
    filename: file.name,
    content_type: file.type || "application/octet-stream",
  });
}

export async function uploadBuildRequestFile(file: File): Promise<UploadedFileMeta> {
  const descriptor = await requestUpload(file);

  if (descriptor.upload_mode === "s3" && descriptor.url && descriptor.fields && descriptor.storage_key) {
    const formData = new FormData();
    Object.entries(descriptor.fields).forEach(([key, value]) => {
      formData.append(key, value);
    });
    formData.append("file", file);
    const res = await fetch(descriptor.url, {
      method: "POST",
      body: formData,
    });
    if (!res.ok) {
      throw new Error("Failed to upload file to S3");
    }
    return { storage_key: descriptor.storage_key, original_name: descriptor.original_name };
  }

  if (descriptor.upload_mode === "direct") {
    const uploadPath = descriptor.upload_url ?? "/api/build-requests/uploads/direct/";
    const formData = new FormData();
    formData.append("file", file);
    formData.append("filename", file.name);
    const response = await api.postForm<{ storage_key: string; original_name: string; url?: string }>(uploadPath, formData);
    return {
      storage_key: response.storage_key,
      original_name: response.original_name,
      url: response.url,
    };
  }

  throw new Error("Unsupported upload mode");
}
