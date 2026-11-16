import { ipcMain } from 'electron';
import { createHash } from 'node:crypto';

/** Segmento da saltare, in secondi. */
export interface SponsorSegment {
    start: number;
    end: number;
    category: string;
}

const API = 'https://sponsor.ajay.app/api/skipSegments';

/** Categorie SponsorBlock che vengono saltate automaticamente. */
const CATEGORIES = ['sponsor', 'selfpromo', 'interaction', 'intro', 'outro', 'preview', 'music_offtopic'];

const cache = new Map<string, SponsorSegment[]>();

/**
 * Scarica i segmenti di un video usando l'API "privacy preserving" di SponsorBlock:
 * al server viene inviato solo un prefisso di 4 caratteri dello SHA-256 dell'ID, mai l'ID completo.
 */
async function fetchSegments(videoId: string): Promise<SponsorSegment[]> {

    const cached = cache.get(videoId);
    if (cached) return cached;

    const prefix = createHash('sha256').update(videoId).digest('hex').slice(0, 4);
    const query = `categories=${encodeURIComponent(JSON.stringify(CATEGORIES))}&actionTypes=${encodeURIComponent('["skip"]')}`;

    const res = await fetch(`${API}/${prefix}?${query}`, { signal: AbortSignal.timeout(8000) });

    let segments: SponsorSegment[] = [];

    // 404 = nessun segmento per questo prefisso.
    if (res.ok) {
        const body = await res.json() as { videoID: string, segments: { segment: [number, number], category: string }[] }[];
        const entry = body.find(v => v.videoID === videoId);
        segments = (entry?.segments ?? []).map(s => ({ start: s.segment[0], end: s.segment[1], category: s.category }));
    } else if (res.status !== 404) {
        // Errore temporaneo del server: non memorizza in cache, così al prossimo video si riprova.
        throw new Error(`SponsorBlock HTTP ${res.status}`);
    }

    // Limita la dimensione della cache.
    if (cache.size > 200) cache.delete(cache.keys().next().value as string);
    cache.set(videoId, segments);

    return segments;
}

/** Registra l'handler IPC usato dal preload per richiedere i segmenti. */
export function registerSponsorBlock() {

    ipcMain.handle('sponsorblock:segments', async (_event, videoId: unknown): Promise<SponsorSegment[]> => {

        if (typeof videoId !== 'string' || !/^[\w-]{11}$/.test(videoId)) return [];

        try {
            return await fetchSegments(videoId);
        } catch (err) {
            console.log('SponsorBlock:', err);
            return [];
        }
    });
}
