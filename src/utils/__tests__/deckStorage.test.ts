import { describe, it, expect, vi, beforeEach } from 'vitest';
import { loadCardsFromStorage, saveCardsToStorage, clearDeckStorage, estimateStorageUsage } from '../deckStorage';
import { LoteriaCard } from '../../types/loteria';

const sampleCards: LoteriaCard[] = [
  { id: '1', number: 1, name: 'El Gallo', tagline: 'El que le cantó a San Pedro', image: 'data:image/png;base64,gallo' },
  { id: '2', number: 2, name: 'El Diablito', tagline: 'Pórtate bien', image: 'data:image/png;base64,diablo' }
];

describe('deckStorage with IndexedDB mock', () => {
  let mockStore: Record<string, any> = {};

  beforeEach(() => {
    localStorage.clear();
    mockStore = {};
    vi.clearAllMocks();

    const mockIDB = {
      open: vi.fn().mockImplementation(() => {
        const req: any = {
          result: {
            objectStoreNames: { contains: () => true },
            createObjectStore: vi.fn(),
            transaction: () => ({
              objectStore: () => ({
                get: (key: string) => {
                  const getReq: any = { result: mockStore[key] };
                  setTimeout(() => getReq.onsuccess && getReq.onsuccess({ target: getReq }), 0);
                  return getReq;
                },
                put: (val: any, key: string) => {
                  mockStore[key] = val;
                  const putReq: any = { result: key };
                  setTimeout(() => putReq.onsuccess && putReq.onsuccess({ target: putReq }), 0);
                  return putReq;
                },
                delete: (key: string) => {
                  delete mockStore[key];
                  const delReq: any = {};
                  setTimeout(() => delReq.onsuccess && delReq.onsuccess({ target: delReq }), 0);
                  return delReq;
                }
              })
            })
          }
        };
        setTimeout(() => req.onsuccess && req.onsuccess({ target: req }), 0);
        return req;
      })
    };

    // @ts-ignore
    window.indexedDB = mockIDB;
  });

  it('saves cards to IndexedDB and loads them back', async () => {
    const savedOk = await saveCardsToStorage(sampleCards);
    expect(savedOk).toBe(true);

    const loaded = await loadCardsFromStorage([]);
    expect(loaded).toHaveLength(2);
    expect(loaded[0].name).toBe('El Gallo');
  });

  it('clears cards from IndexedDB', async () => {
    await saveCardsToStorage(sampleCards);
    await clearDeckStorage();
    const loaded = await loadCardsFromStorage([]);
    expect(loaded).toHaveLength(0);
  });

  it('estimates storage usage without errors', async () => {
    const usage = await estimateStorageUsage();
    expect(usage === null || typeof usage.usageMB === 'number').toBe(true);
  });
});
