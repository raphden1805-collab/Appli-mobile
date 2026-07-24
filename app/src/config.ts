// Adresse du serveur de combat. A definir via la variable d'environnement
// EXPO_PUBLIC_SERVER_URL (voir README) : en dev local, utiliser l'IP de ta
// machine sur le reseau local (pas "localhost", injoignable depuis un telephone).
export const SERVER_URL = process.env.EXPO_PUBLIC_SERVER_URL || 'http://localhost:3000';
