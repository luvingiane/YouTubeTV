/**
 * Preload della finestra principale (contextIsolation disattivato: gira nello stesso mondo JS della pagina,
 * prima di qualsiasi script di YouTube TV).
 *
 * - Rimozione annunci: elimina i campi pubblicitari dalle risposte JSON dell'API di YouTube.
 *   (Il blocco delle richieste di rete è gestito nel processo principale da @ghostery/adblocker-electron.)
 * - SponsorBlock: salta automaticamente i segmenti segnalati dalla community.
 */
(() => {

    if (!/(^|\.)youtube\.com$/.test(location.hostname)) return;

    const { ipcRenderer } = require('electron');

    // Funzioni attive (impostazioni dell'app). Se il processo principale non risponde, tutto attivo.
    let features = { adBlock: true, sponsorBlock: true };
    try { features = ipcRenderer.sendSync('ytv:features') || features; } catch (e) { }

    /* ------------------------------------------------------------------ *
     *  Rimozione annunci e contenuti sponsorizzati dalle risposte JSON
     * ------------------------------------------------------------------ */

    // Campi del player con la pubblicità.
    const AD_FIELDS = new Set(['adPlacements', 'adSlots', 'playerAds']);
    // Renderer di annunci / promozioni nei feed (home, ricerca, correlati, masthead).
    const AD_RENDERERS = new Set([
        'adSlotRenderer', 'displayAdRenderer', 'inFeedAdLayoutRenderer', 'promotedSparklesWebRenderer',
        'promotedSparklesTextSearchRenderer', 'promotedVideoRenderer', 'compactPromotedVideoRenderer',
        'searchPyvRenderer', 'tvMastheadRenderer', 'statementBannerRenderer', 'bannerPromoRenderer',
    ]);
    // Test rapido sul testo grezzo: se non c'è nessun termine sospetto non si percorre l'oggetto.
    const AD_HINT = new RegExp([...AD_FIELDS, ...AD_RENDERERS].join('|'));

    const isAdItem = (item) => {
        if (!item || typeof item !== 'object' || Array.isArray(item)) return false;
        for (const k in item) if (AD_RENDERERS.has(k)) return true;
        return false;
    };

    /** Percorre l'oggetto eliminando campi pubblicitari ed elementi di lista che sono annunci. */
    const strip = (node, depth) => {
        if (!node || typeof node !== 'object' || depth > 60) return;
        if (Array.isArray(node)) {
            for (let i = node.length - 1; i >= 0; i--) {
                if (isAdItem(node[i])) node.splice(i, 1);
                else strip(node[i], depth + 1);
            }
            return;
        }
        for (const k of Object.keys(node)) {
            if (AD_FIELDS.has(k) || AD_RENDERERS.has(k)) delete node[k];
            else strip(node[k], depth + 1);
        }
    };

    const stripAds = (obj, raw) => {
        if (!obj || typeof obj !== 'object') return obj;
        if (raw !== undefined && !AD_HINT.test(raw)) return obj;
        strip(obj, 0);
        return obj;
    };

    /* ------------------------------------------------------------------ *
     *  Menu laterale (guide): toglie voci e aggiunge "Esci" dopo "Impostazioni"
     * ------------------------------------------------------------------ */

    // Voci da nascondere, per browseId (indipendente dalla lingua): Notizie, Giochi, Live, Sport, Film.
    const HIDDEN_GUIDE = new Set(['FEtopics_news', 'FEtopics_gaming', 'FEtopics_live', 'FEtopics_sports', 'FEtopics_movies']);
    const EXIT_LABELS = { it: 'Esci', es: 'Salir', en: 'Exit', fr: 'Quitter', de: 'Beenden', pt: 'Sair' };
    const exitLabel = EXIT_LABELS[(navigator.language || 'en').slice(0, 2)] || 'Exit';

    const entryId = (it) => {
        const e = it && it.guideEntryRenderer;
        return e && e.navigationEndpoint && e.navigationEndpoint.browseEndpoint && e.navigationEndpoint.browseEndpoint.browseId;
    };

    const patchGuide = (obj) => {
        if (!obj || !Array.isArray(obj.items)) return;
        for (const section of obj.items) {
            const sec = section && section.guideSectionRenderer;
            if (sec && Array.isArray(sec.items)) sec.items = sec.items.filter((it) => !HIDDEN_GUIDE.has(entryId(it)));
        }
        const footer = obj.footer && obj.footer.guideSectionRenderer;
        if (footer && Array.isArray(footer.items) && !footer.items.some((it) => it && it.guideEntryRenderer && it.guideEntryRenderer.formattedTitle && it.guideEntryRenderer.formattedTitle.simpleText === exitLabel)) {
            footer.items.push({
                guideEntryRenderer: {
                    // Stesso tipo di endpoint di "Impostazioni": un browseEndpoint si caricherebbe già al solo focus.
                    navigationEndpoint: { applicationSettingsEndpoint: { hack: true } },
                    icon: { iconType: 'EXIT_TO_APP' },
                    formattedTitle: { simpleText: exitLabel },
                },
            });
        }
    };

    const nativeParse = JSON.parse;
    JSON.parse = function (text, ...rest) {
        const result = nativeParse.call(this, text, ...rest);
        if (features.adBlock) stripAds(result, typeof text === 'string' ? text : undefined);
        if (typeof text === 'string' && text.includes('guideSectionRenderer')) patchGuide(result);
        return result;
    };

    // Response.json() viene reindirizzato a JSON.parse (già filtrato).
    Response.prototype.json = function () {
        return this.text().then((t) => JSON.parse(t));
    };

    // Attivando la voce "Esci" (Invio, tasto A del pad o click) chiude l'applicazione.
    const onActivate = (e) => {
        if (e.type === 'keydown' && e.key !== 'Enter') return;
        const entry = e.target && e.target.closest && e.target.closest('ytlr-guide-entry-renderer');
        const title = entry && entry.querySelector('yt-formatted-string');
        if (!title || title.textContent.trim() !== exitLabel) return;
        e.preventDefault();
        e.stopImmediatePropagation();
        // Con il pad aspetta che i tasti siano rilasciati (vedi gamepad.js); da tastiera chiude subito.
        if (window.ytvQuit) window.ytvQuit(); else ipcRenderer.send('ytv:quit');
    };
    window.addEventListener('keydown', onActivate, true);
    window.addEventListener('click', onActivate, true);

    /* ------------------------------------------------------------------ *
     *  SponsorBlock
     * ------------------------------------------------------------------ */

    let videoId = null;
    let segments = [];
    let lastSkippedEnd = -1;
    let toast = null;
    let toastTimer = null;

    const currentVideoId = () => {
        const m = /[?&]v=([\w-]{11})/.exec(location.href);
        return m ? m[1] : null;
    };

    const showToast = (category) => {
        if (!document.body) return;
        if (!toast) {
            toast = document.createElement('div');
            toast.style.cssText = 'position:fixed;top:5%;right:3%;padding:10px 18px;border-radius:8px;' +
                'background:rgba(0,0,0,.75);color:#fff;font:600 22px Roboto,sans-serif;z-index:2147483647;' +
                'pointer-events:none;transition:opacity .3s;';
            document.body.appendChild(toast);
        }
        toast.textContent = `SponsorBlock: salto ${category}`;
        toast.style.opacity = '1';
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => { toast.style.opacity = '0'; }, 2500);
    };

    /** Carica i segmenti quando cambia il video in riproduzione. */
    const refreshSegments = () => {
        const id = currentVideoId();
        if (id === videoId) return;
        videoId = id;
        segments = [];
        lastSkippedEnd = -1;
        if (!id) return;
        ipcRenderer.invoke('sponsorblock:segments', id)
            .then((result) => { if (videoId === id) segments = result || []; })
            .catch(() => { });
    };

    if (features.sponsorBlock) setInterval(() => {

        refreshSegments();
        if (!segments.length) return;

        const video = document.querySelector('video');
        if (!video || video.paused || !isFinite(video.duration)) return;

        const t = video.currentTime;
        for (const seg of segments) {
            // Tolleranza di 0.5s per evitare di rientrare in un segmento appena saltato.
            if (t >= seg.start && t < seg.end - 0.5 && seg.end !== lastSkippedEnd) {
                lastSkippedEnd = seg.end;
                // Se il segmento arriva a fine video, salta alla fine invece di superare la durata.
                video.currentTime = Math.min(seg.end, video.duration);
                showToast(seg.category);
                break;
            }
        }
    }, 250);

    // Supporto controller (D-pad, pulsanti, stick): vedi gamepad.js.
    require('./gamepad.js');

})();
