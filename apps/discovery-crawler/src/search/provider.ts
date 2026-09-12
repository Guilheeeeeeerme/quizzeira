export interface SearchCandidate {
  url: string;
  title: string;
  snippet?: string;
  rank?: number;
}

export interface SearchProvider {
  search(query: string, limit?: number): Promise<SearchCandidate[]>;
}
