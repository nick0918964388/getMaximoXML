/**
 * OSLC Client — Server-side HTTP client for Maximo OSLC REST API
 *
 * Used in Next.js API routes to proxy OSLC requests (avoids CORS).
 * Supports API key and Basic auth methods.
 */

import type {
  OslcCollection,
  OslcMaxObject,
  OslcMaxAttribute,
  OslcMaxDomain,
  OslcMaxRelationship,
  OslcMaxIndex,
  OslcMaxApp,
  OslcMaxModule,
  OslcSynonymValue,
  OslcAlnValue,
  OslcNumericValue,
} from './types';

// ─── Config ─────────────────────────────────────────────────────

export interface OslcClientConfig {
  baseUrl: string;
  authMethod: 'apikey' | 'basic';
  apiKey?: string;
  username?: string;
  password?: string;
}

export interface PaginationParams {
  pageSize?: number;
  pageNum?: number;
  search?: string;
}

// ─── OSLC Endpoints ─────────────────────────────────────────────

const ENDPOINTS = {
  objects: '/maximo/oslc/os/mxapiobjectstructure',
  attributes: '/maximo/oslc/os/mxapiattribute',
  domains: '/maximo/oslc/os/mxapidomain',
  alnDomainValues: '/maximo/oslc/os/mxapialndomain',
  synonymDomainValues: '/maximo/oslc/os/mxapisynonymdomain',
  relationships: '/maximo/oslc/os/mxapirelationship',
  indexes: '/maximo/oslc/os/mxapisysindexes',
  apps: '/maximo/oslc/os/mxapiapplication',
  modules: '/maximo/oslc/os/mxapimodules',
} as const;

// ─── Response parsing ───────────────────────────────────────────

interface RawOslcResponse {
  member?: unknown[];
  'oslc:responseInfo'?: {
    'oslc:totalCount'?: number;
    nextPage?: string;
  };
}

function parseCollection<T>(raw: RawOslcResponse, pageNum: number): OslcCollection<T> {
  return {
    member: (raw.member ?? []) as T[],
    totalCount: raw['oslc:responseInfo']?.['oslc:totalCount'] ?? 0,
    pagenum: pageNum,
    responseInfo: raw['oslc:responseInfo']?.nextPage
      ? { nextPage: raw['oslc:responseInfo'].nextPage }
      : undefined,
  };
}

// ─── Client ─────────────────────────────────────────────────────

export class OslcClient {
  private readonly baseUrl: string;
  private readonly authHeaders: Record<string, string>;

  constructor(config: OslcClientConfig) {
    this.baseUrl = config.baseUrl.replace(/\/+$/, '');

    if (config.authMethod === 'apikey') {
      this.authHeaders = { apikey: config.apiKey ?? '' };
    } else {
      const cred = Buffer.from(`${config.username}:${config.password}`).toString('base64');
      this.authHeaders = { Authorization: `Basic ${cred}` };
    }
  }

  getBaseUrl(): string {
    return this.baseUrl;
  }

  // ─── Generic fetch ──────────────────────────────────────────

  private async fetchOslc<T>(
    endpoint: string,
    params: Record<string, string> = {},
    pageNum = 1
  ): Promise<OslcCollection<T>> {
    const url = new URL(`${this.baseUrl}${endpoint}`);
    url.searchParams.set('lean', '1');

    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
    }

    if (!params['oslc.pageSize']) {
      url.searchParams.set('oslc.pageSize', '100');
    }
    if (pageNum > 1) {
      url.searchParams.set('pageno', String(pageNum));
    }

    const response = await fetch(url.toString(), {
      headers: {
        ...this.authHeaders,
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`OSLC request failed (${response.status}): ${text}`);
    }

    const data = (await response.json()) as RawOslcResponse;
    return parseCollection<T>(data, pageNum);
  }

  // ─── Objects ────────────────────────────────────────────────

  async listObjects(opts?: PaginationParams): Promise<OslcCollection<OslcMaxObject>> {
    const params: Record<string, string> = {
      'oslc.select': 'objectname,description,classname,servicename,type,persistent,isview,maintbname,primarykey,internal,storagetype',
    };
    if (opts?.pageSize) params['oslc.pageSize'] = String(opts.pageSize);
    if (opts?.search) params['oslc.where'] = `objectname="%${opts.search}%"`;
    return this.fetchOslc<OslcMaxObject>(ENDPOINTS.objects, params, opts?.pageNum);
  }

  // ─── Attributes ─────────────────────────────────────────────

  async listAttributes(
    objectName: string,
    opts?: PaginationParams
  ): Promise<OslcCollection<OslcMaxAttribute>> {
    const params: Record<string, string> = {
      'oslc.select': 'attributename,objectname,maxtype,length,scale,domainid,required,persistent,haslongdesc,userdefined,classname,defaultvalue,title,remarks,sameasobject,sameasattribute,mustbe,ispositive,autokey,canautonum,searchtype,localizable,domainlink,restricted',
      'oslc.where': `objectname="${objectName}"`,
    };
    if (opts?.pageSize) params['oslc.pageSize'] = String(opts.pageSize);
    return this.fetchOslc<OslcMaxAttribute>(ENDPOINTS.attributes, params, opts?.pageNum);
  }

  // ─── Domains ────────────────────────────────────────────────

  async listDomains(opts?: PaginationParams): Promise<OslcCollection<OslcMaxDomain>> {
    const params: Record<string, string> = {
      'oslc.select': 'domainid,description,domaintype,maxtype,length,scale,internal',
    };
    if (opts?.pageSize) params['oslc.pageSize'] = String(opts.pageSize);
    if (opts?.search) params['oslc.where'] = `domainid="%${opts.search}%"`;
    return this.fetchOslc<OslcMaxDomain>(ENDPOINTS.domains, params, opts?.pageNum);
  }

  async getSynonymValues(domainId: string): Promise<OslcCollection<OslcSynonymValue>> {
    return this.fetchOslc<OslcSynonymValue>(ENDPOINTS.synonymDomainValues, {
      'oslc.select': 'value,maxvalue,defaults,description',
      'oslc.where': `domainid="${domainId}"`,
      'oslc.pageSize': '500',
    });
  }

  async getAlnValues(domainId: string): Promise<OslcCollection<OslcAlnValue>> {
    return this.fetchOslc<OslcAlnValue>(ENDPOINTS.alnDomainValues, {
      'oslc.select': 'value,description',
      'oslc.where': `domainid="${domainId}"`,
      'oslc.pageSize': '500',
    });
  }

  async getNumericValues(domainId: string): Promise<OslcCollection<OslcNumericValue>> {
    // Numeric values use same endpoint as ALN in some Maximo versions
    return this.fetchOslc<OslcNumericValue>(ENDPOINTS.alnDomainValues, {
      'oslc.select': 'value,description',
      'oslc.where': `domainid="${domainId}"`,
      'oslc.pageSize': '500',
    });
  }

  // ─── Relationships ──────────────────────────────────────────

  async listRelationships(
    objectName: string,
    opts?: PaginationParams
  ): Promise<OslcCollection<OslcMaxRelationship>> {
    const params: Record<string, string> = {
      'oslc.select': 'name,parent,child,whereclause,remarks',
      'oslc.where': `parent="${objectName}"`,
    };
    if (opts?.pageSize) params['oslc.pageSize'] = String(opts.pageSize);
    return this.fetchOslc<OslcMaxRelationship>(ENDPOINTS.relationships, params, opts?.pageNum);
  }

  // ─── Indexes ────────────────────────────────────────────────

  async listIndexes(
    objectName: string,
    opts?: PaginationParams
  ): Promise<OslcCollection<OslcMaxIndex>> {
    const params: Record<string, string> = {
      'oslc.select': 'name,tbname,uniquerule,clusterrule,keys',
      'oslc.where': `tbname="${objectName}"`,
    };
    if (opts?.pageSize) params['oslc.pageSize'] = String(opts.pageSize);
    return this.fetchOslc<OslcMaxIndex>(ENDPOINTS.indexes, params, opts?.pageNum);
  }

  // ─── Applications ───────────────────────────────────────────

  async listApps(opts?: PaginationParams): Promise<OslcCollection<OslcMaxApp>> {
    const params: Record<string, string> = {
      'oslc.select': 'app,description,maintbname,restrictions,orderby',
    };
    if (opts?.pageSize) params['oslc.pageSize'] = String(opts.pageSize);
    if (opts?.search) params['oslc.where'] = `app="%${opts.search}%"`;
    return this.fetchOslc<OslcMaxApp>(ENDPOINTS.apps, params, opts?.pageNum);
  }

  // ─── Modules ────────────────────────────────────────────────

  async listModules(opts?: PaginationParams): Promise<OslcCollection<OslcMaxModule>> {
    const params: Record<string, string> = {
      'oslc.select': 'module,description',
    };
    if (opts?.pageSize) params['oslc.pageSize'] = String(opts.pageSize);
    if (opts?.search) params['oslc.where'] = `module="%${opts.search}%"`;
    return this.fetchOslc<OslcMaxModule>(ENDPOINTS.modules, params, opts?.pageNum);
  }

  // ─── Connection Test ────────────────────────────────────────

  async testConnection(): Promise<boolean> {
    try {
      await this.listObjects({ pageSize: 1 });
      return true;
    } catch {
      return false;
    }
  }
}
