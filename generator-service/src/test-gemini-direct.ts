import axios from 'axios';
import { env } from "./config/env.config";
import { logger } from "./utils/logger";

async function runDirectTest() {
    if (!env.API_KEY_GEMINI) {
        logger.error("No API Key");
        return;
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${env.API_KEY_GEMINI}`;

    try {
        console.log(`Querying: ${url.replace(env.API_KEY_GEMINI, 'HIDDEN_KEY')}`);
        const response = await axios.get(url);
        console.log("Response Status:", response.status);
        console.log("Available Models:");
        const models = response.data.models;
        if (models) {
            models.forEach((m: any) => console.log(`- ${m.name}`));
        } else {
            console.log("No models returned.");
        }
    } catch (error: any) {
        console.error("REST API Failed:");
        if (error.response) {
            console.error(`Status: ${error.response.status}`);
            console.error(`Data:`, JSON.stringify(error.response.data, null, 2));
        } else {
            console.error(error.message);
        }
    }
}

runDirectTest();
