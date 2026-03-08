import { Resend } from 'resend';

// On vérifie que la clé API est bien présente pour éviter de faire crash le serveur
if (!process.env.RESEND_API_KEY) {
    throw new Error('Missing RESEND_API_KEY in environment variables');
}

// On exporte l'instance pour l'utiliser partout ailleurs
export const resend = new Resend(process.env.RESEND_API_KEY);