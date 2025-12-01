
export interface NtfyAction {
    action: 'view' | 'broadcast' | 'http';
    label: string;
    url?: string;
    clear?: boolean;
    body?: string;
    headers?: Record<string, string>;
}

export interface NtfyPayload {
    topic: string;
    message?: string;
    title?: string;
    tags?: string[];
    priority?: 1 | 2 | 3 | 4 | 5;
    attach?: string;
    filename?: string;
    click?: string;
    actions?: NtfyAction[];
    markdown?: boolean;
    icon?: string;
}

export async function sendNtfy(payload: NtfyPayload) {
    const server = process.env.NTFY_SERVER;
    if (!server) {
        console.warn("NTFY_SERVER env var not set, skipping ntfy notification");
        return;
    }

    // Ensure server url has protocol
    const baseUrl = server.startsWith('http') ? server : `https://${server}`;
    const token = process.env.NTFY_TOKEN;

    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    try {
        const res = await fetch(baseUrl, {
            method: 'POST',
            body: JSON.stringify(payload),
            headers
        });

        if (!res.ok) {
            console.error(`Failed to send ntfy notification: ${res.status} ${res.statusText}`);
            const text = await res.text();
            console.error(text);
        }
    } catch (e) {
        console.error("Error sending ntfy notification:", e);
    }
}
