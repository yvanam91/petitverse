export type EmbedType = 'youtube' | 'spotify' | 'soundcloud' | 'tiktok' | 'calendly' | 'deezer' | 'instagram'

export interface EmbedData {
    type: EmbedType
    embedUrl: string
}

export function getEmbedUrl(url: string): EmbedData | null {
    if (!url) return null;

    // YouTube (Standard, Mobile, Shorts)
    const ytMatch = url.match(/(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/);
    if (ytMatch) return { type: 'youtube', embedUrl: `https://www.youtube.com/embed/${ytMatch[1]}` };

    // Spotify
    // Catching standard URLs and already embedded ones just in case, but mainly standard.
    const spotMatch = url.match(/open\.spotify\.com\/(track|album|playlist|artist)\/([a-zA-Z0-9]+)/);
    if (spotMatch) return { type: 'spotify', embedUrl: `https://open.spotify.com/embed/${spotMatch[1]}/${spotMatch[2]}` };

    // SoundCloud (Using the encoded Widget API URL as requested)
    // We strictly check for soundcloud.com domain
    if (url.includes('soundcloud.com')) {
        // If it's already a player url, maybe return it? 
        // The requirement says: "Utilise l'URL brute encodée" logic provided.
        // If input is "https://soundcloud.com/user/track", we wrap it.
        // We should avoid double wrapping if the user pastes the widget code src.
        if (!url.includes('w.soundcloud.com/player')) {
            return { type: 'soundcloud', embedUrl: `https://w.soundcloud.com/player/?url=${encodeURIComponent(url)}&color=%237c3aed&auto_play=false&hide_related=false&show_comments=true&show_user=true&show_reposts=false&show_teaser=true` };
        }
        // If it is the player URL already
        return { type: 'soundcloud', embedUrl: url };
    }

    // TikTok
    const ttMatch = url.match(/tiktok\.com\/.*\/video\/([0-9]+)/);
    if (ttMatch) return { type: 'tiktok', embedUrl: `https://www.tiktok.com/embed/v2/${ttMatch[1]}` };

    // Deezer (Added to match previous requirements + standard)
    if (url.includes('deezer.com')) {
        const parts = url.split('/')
        const typeInd = parts.findIndex(p => ['track', 'album', 'playlist'].includes(p))
        if (typeInd !== -1 && parts[typeInd + 1]) {
            const type = parts[typeInd] // track, album, playlist
            const id = parts[typeInd + 1]
            return { type: 'deezer', embedUrl: `https://widget.deezer.com/widget/dark/${type}/${id}` }
        }
    }

    // Instagram (Added to match previous requirements)
    if (url.includes('instagram.com')) {
        if (url.includes('/p/') || url.includes('/reel/') || url.includes('/tv/')) {
            // Ensure trailing slash and add embed
            // Basic heuristic: strip query params, modify path
            try {
                const urlObj = new URL(url);
                const path = urlObj.pathname.endsWith('/') ? urlObj.pathname : `${urlObj.pathname}/`;
                return { type: 'instagram', embedUrl: `https://www.instagram.com${path}embed` };
            } catch (e) {
                return null; // Invalid URL
            }
        }
    }

    // Calendly
    if (url.includes('calendly.com')) {
        return { type: 'calendly', embedUrl: url }; // Calendly loads as is in iframe
    }

    return null;
}
