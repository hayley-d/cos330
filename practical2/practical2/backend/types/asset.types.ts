import { Resource, UUID } from "../types";
import { Asset, ListAssetItem } from "../schemas/asset.schema";

export type RequestOption = {
  ok: boolean;
  error?: string;
};

export type RequestAssetOption = {
  ok: boolean;
  error?: string;
  asset?: Asset;
};

export type CreateConfidentialAssetProps = {
  assetId: UUID;
  fileName: string;
  mimeType: string;
  bytes: Buffer;
  createdBy: UUID;
  description: string;
  keyId?: string;
};

export type GetAssetOption = {
  ok: boolean;
  error?: string;
  mimeType?: string;
  bytes?: Buffer;
  description?: string;
  file_name?: string;
  asset_type?: "confidential" | "image" | "document";
};

export type GetConfidentialAssetOption = {
  ok: boolean;
  error?: string;
  mimeType?: string;
  content?: string;
  description?: string;
  file_name?: string;
  asset_type?: "confidential" | "image" | "document";
};

export type ListAssetsOption = {
  items?: ListAssetItem[];
  ok: boolean;
  error?: string;
};

export type DeleteAssetProps = {
  assetId: UUID;
  deletedBy: UUID;
};

export type CreateAssetProps = {
  assetId: UUID;
  fileName: string;
  mimeType: string;
  bytes: Buffer;
  createdBy: UUID;
  description: string;
  assetType: Exclude<Resource, "confidential">;
};

export type CreateAssetRequest = {
  fileName: string;
  mimeType: string;
  bytes: Buffer;
  createdBy: UUID;
  description: string;
  assetType: Resource;
};

export type PatchAssetRequest = {
  assetId: UUID;
  fileName?: string;
  mimeType: string;
  content?: Buffer;
  updatedBy: UUID;
  description?: string;
  assetType: Exclude<Resource, "confidential">;
};

export type AssetListOptions = {
  type?: Resource;
  limit?: number;
  offset?: number;
};

export type PatchConfAssetRequest = {
  updatedBy: UUID;
  assetId: UUID;
  content?: string;
  fileName?: string;
  description?: string;
};
