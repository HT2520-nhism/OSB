/**
 * PHASE 8 — Document Service HTTP Client.
 *
 * Used by electronic-logbook-api to upload and retrieve documents
 * through the Gateway-api, which forwards to the Document Service.
 *
 * The client is responsible for:
 *  - Always setting owner_service = 'electronic-logbook' (server-authoritative)
 *  - Forwarding the user's auth token (already a Bearer token)
 *  - Returning the canonical document metadata
 *
 * The Document Service must NEVER trust the caller's claimed owner_service;
 * the controller always overrides it with the authenticatedService from the JWT.
 */

import { Injectable, Logger } from '@nestjs/common';

export interface UploadDocumentParams {
  ownerType: string;
  ownerId: string;
  fileBuffer: Buffer;
  originalFileName: string;
  mimeType: string;
  documentType?: string;
  /** Bearer token from the upstream request. */
  authToken: string;
}

export interface DocumentMetadata {
  id: string;
  documentCode: string;
  ownerService: string;
  ownerType: string;
  ownerId: string;
  documentType: string | null;
  originalFileName: string;
  mimeType: string;
  fileSize: string;
  uploadedAt: string;
}

@Injectable()
export class DocumentServiceClient {
  /* istanbul ignore next */
  private readonly logger = new Logger('DocumentServiceClient');

  constructor(private readonly baseUrl: string) {}

  async uploadDocument(
    params: UploadDocumentParams,
  ): Promise<DocumentMetadata> {
    const form = new FormData();
    const blob = new Blob([new Uint8Array(params.fileBuffer)], {
      type: params.mimeType,
    });
    form.append('file', blob, params.originalFileName);
    form.append('ownerType', params.ownerType);
    form.append('ownerId', params.ownerId);
    if (params.documentType) {
      form.append('documentType', params.documentType);
    }

    const res = await fetch(`${this.baseUrl}/api/documents`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${params.authToken}` },
      body: form,
    });
    if (!res.ok) {
      throw new Error(
        `Document upload failed: ${res.status} ${await res.text()}`,
      );
    }
    const result = (await res.json()) as DocumentMetadata;
    this.logger.log({
      event: 'document.uploaded_via_client',
      id: result.id,
      documentCode: result.documentCode,
    });
    return result;
  }

  async listDocuments(
    ownerType: string,
    ownerId: string,
    authToken: string,
  ): Promise<DocumentMetadata[]> {
    const url = new URL(`${this.baseUrl}/api/documents`);
    url.searchParams.set('ownerType', ownerType);
    url.searchParams.set('ownerId', ownerId);
    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    if (!res.ok) {
      throw new Error(`Document list failed: ${res.status}`);
    }
    const data = (await res.json()) as { data: DocumentMetadata[] };
    return data.data;
  }

  async downloadDocument(
    documentId: string,
    authToken: string,
  ): Promise<{ data: Buffer; contentType: string; fileName: string }> {
    const res = await fetch(
      `${this.baseUrl}/api/documents/${documentId}/download`,
      { headers: { Authorization: `Bearer ${authToken}` } },
    );
    if (!res.ok) {
      throw new Error(`Document download failed: ${res.status}`);
    }
    const contentType =
      res.headers.get('content-type') ?? 'application/octet-stream';
    const contentDisposition = res.headers.get('content-disposition') ?? '';
    const match = contentDisposition.match(/filename="([^"]+)"/);
    const fileName = match ? decodeURIComponent(match[1]) : 'download';
    const arrayBuffer = await res.arrayBuffer();
    return { data: Buffer.from(arrayBuffer), contentType, fileName };
  }

  async deleteDocument(documentId: string, authToken: string): Promise<void> {
    const res = await fetch(`${this.baseUrl}/api/documents/${documentId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${authToken}` },
    });
    if (!res.ok) {
      throw new Error(`Document delete failed: ${res.status}`);
    }
  }
}
