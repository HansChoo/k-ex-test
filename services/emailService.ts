
import { doc, getDoc } from 'firebase/firestore';
import { db } from './firebaseConfig';

declare global {
    interface Window {
        emailjs: any;
    }
}

export const sendEmail = async (templateName: 'confirmation' | 'cancellation', data: any, reservationId?: string) => {
    try {
        // 1. Fetch Email Config
        const settingsRef = doc(db, "settings", "email_config");
        const settingsSnap = await getDoc(settingsRef);
        
        // Use default if not set (for demo)
        const config = settingsSnap.exists() ? settingsSnap.data() : {
            serviceId: "service_default", // Replace with real ID
            templateId: "template_default", // Replace with real ID
            publicKey: "user_default" // Replace with real Key
        };

        if (window.emailjs && config.publicKey) window.emailjs.init(config.publicKey);

        // 2. Generate Survey Link
        // Assuming the app is hosted at k-experience.com or localhost
        const surveyLink = `${window.location.origin}/?page=survey&id=${reservationId}`;
        const myPageLink = `${window.location.origin}/`;

        let customMessage = "";
        
        if (templateName === 'confirmation') {
            customMessage = `
            Thank you for your reservation!
            
            [IMPORTANT: PRE-VISIT SURVEY]
            To ensure the best experience, please complete the survey below before your visit.
            
            👉 FILL OUT SURVEY: ${surveyLink}
            
            [RECEIPT / VOUCHER]
            You can view your receipt and e-voucher at My Page: ${myPageLink}
            `;
        }

        const templateParams = {
            to_name: data.name,
            to_email: data.email,
            product_name: data.productName,
            date: data.date,
            message_body: customMessage,
            reply_to: "support@k-experience.com",
            from_name: "K-Experience Concierge"
        };

        // 4. Send (Mocking success if keys aren't real)
        // In production, use real IDs
        console.log("Sending Email with params:", templateParams);
        // await window.emailjs.send(config.serviceId, config.templateId, templateParams);
        
        return true;

    } catch (error) {
        console.error('Email Error:', error);
        return false;
    }
};
