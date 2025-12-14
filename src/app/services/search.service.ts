import { Injectable } from '@angular/core';
import { Firestore, collection, getDocs, QuerySnapshot, DocumentData } from '@angular/fire/firestore';
import { SearchCollection, SearchResult } from '../classes/search-result.class';

@Injectable({ providedIn: 'root' })
export class SearchService {
  constructor(private firestore: Firestore) {}

async smartSearch(term: string): Promise<SearchResult[]> {
  term = this.normalizeTerm(term);
  if (!term) return [];

  if (this.isUserSearch(term)) {
    return this.searchByPrefix('users', term.substring(1), (r) => r.data.name);
  }

  if (this.isChannelSearch(term)) {
    return this.searchByPrefix('channels', term.substring(1), (r) => r.data.title);
  }

  if (term.length < 4) return [];

  return this.searchAcrossCollectionsCaseInsensitive(term, ['users', 'channels']);
}

 normalizeTerm(term: string): string {
  return term.trim().replace(/\s+/g, ' ');
}

 isUserSearch(term: string): boolean {
  return term.startsWith('@');
}

 isChannelSearch(term: string): boolean {
  return term.startsWith('#');
}

/**
 * Case-insensitive search across one collection.
 * 
 * All documents from the specified collection are fetched and filtered
 * on the client side to find matches for the given term.
 * 
 * @param collectionName - The collection to search in
 * @param term - entered search term
 * @param extractField - function to extract the field to search from a SearchResult
 * @returns A list of matching search results (case-insensitive)
 */
private async searchByPrefix(
  collectionName: SearchCollection,
  term: string,
  extractField: (r: SearchResult) => string
): Promise<SearchResult[]> {
  const results = await this.getAllFromCollection(collectionName);
  const lowerTerm = term.toLowerCase();
  return results.filter((r) => extractField(r).toLowerCase().includes(lowerTerm));
}

/**
 * Case-insensitive search across multiple collections.
 * 
 * All documents from the specified collections are fetched and filtered
 * on the client side to find matches for the given term.
 * 
 * @param term - entered search term
 * @param collections - collections to search in
 * @returns A list of matching search results (case-insensitive)
 */
private async searchAcrossCollectionsCaseInsensitive(
  term: string,
  collections: SearchCollection[]
): Promise<SearchResult[]> {
  const lowerTerm = term.toLowerCase();
  const results = await Promise.all(collections.map((col) => this.getAllFromCollection(col)));
  return results
    .flat()
    .filter((r) => {
      const value = r.collection === 'users' ? r.data.name : r.data.title;
      return value.toLowerCase().includes(lowerTerm);
    });
}

/**
 * Maps a query snapshot to an array of SearchResult objects.
 * 
 * @param snapshot - The query snapshot from Firestore
 * @param collectionName - The name of the collection the documents belong to
 * @returns An array of SearchResult objects
 */
  private mapSnapshot(snapshot: QuerySnapshot<DocumentData>, collectionName: SearchCollection): SearchResult[] {
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      collection: collectionName,
      data: doc.data(),
    }));
  }

/**
 * Retrieves all documents from a Firestore collection.
 * 
 * Note: Not for large collections due to performance considerations.
 * 
 * @param collectionName - The name of the collection to retrieve documents from
 * @returns A list of all documents in the collection as SearchResult objects
 */
  async getAllFromCollection(collectionName: SearchCollection): Promise<SearchResult[]> {
    const colRef = collection(this.firestore, collectionName);
    const snapshot = await getDocs(colRef);
    return this.mapSnapshot(snapshot, collectionName);
  }
}
