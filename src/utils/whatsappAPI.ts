export const sendWhatsAppMessage = async (
    toPhone: string,
    templateName: string,
    token: string,
    phoneId: string,
    languageCode: string = 'en',
    variables: string[] = []
): Promise<{ success: boolean; messageId?: string; error?: string }> => {
    if (!token || !phoneId) {
        console.error('WhatsApp API Error: Missing Token or Phone ID');
        return { success: false, error: 'Missing Credentials' };
    }

    // Format phone number (remove +, spaces, dashes, etc.)
    const cleanPhone = toPhone.replace(/[\s\-\+\(\)]/g, '');

    const url = `https://graph.facebook.com/v18.0/${phoneId}/messages`;

    // Strict formatting for Meta's 'template' messages
    const payload: any = {
        messaging_product: "whatsapp",
        to: cleanPhone,
        type: "template",
        template: {
            name: templateName,
            language: {
                code: languageCode
            }
        }
    };

    // If template requires variables, format them according to Graph API spec
    if (variables.length > 0) {
        payload.template.components = [
            {
                type: "body",
                parameters: variables.map(text => ({
                    type: "text",
                    text: text
                }))
            }
        ];
    }

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (!response.ok) {
            console.error('WhatsApp Graph API Error:', data);
            return {
                success: false,
                error: data.error?.message || 'Failed to send WhatsApp message'
            };
        }

        const messageId = data?.messages?.[0]?.id || 'unknown';

        return { success: true, messageId };
    } catch (error: any) {
        console.error('WhatsApp Fetch Error:', error);
        return { success: false, error: error.message };
    }
};
/**
 * Mimicks human behavior by introducing a random delay between messages.
 * Prevents automated spam detection from WhatsApp.
 */
export const randomDelay = async (minSeconds: number = 5, maxSeconds: number = 12) => {
    const ms = Math.floor(Math.random() * (maxSeconds - minSeconds + 1) + minSeconds) * 1000;
    return new Promise(resolve => setTimeout(resolve, ms));
};
