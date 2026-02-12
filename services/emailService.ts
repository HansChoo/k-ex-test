
import { doc, getDoc } from 'firebase/firestore';
import { db } from './firebaseConfig';

declare global {
    interface Window {
        emailjs: any;
    }
}

export const sendEmail = async (templateName: 'confirmation' | 'cancellation', data: any) => {
    try {
        // 1. Fetch Admin Settings for EmailJS
        const settingsRef = doc(db, "settings", "email_config");
        const settingsSnap = await getDoc(settingsRef);
        
        if (!settingsSnap.exists()) {
            console.warn("Email configuration not found in Firestore.");
            return;
        }

        const config = settingsSnap.data();
        if (!config.serviceId || !config.templateId || !config.publicKey) {
            console.warn("EmailJS configuration is incomplete.");
            return;
        }

        // 2. Initialize EmailJS
        if (window.emailjs) {
            window.emailjs.init(config.publicKey);
        } else {
            console.error("EmailJS SDK not loaded.");
            return;
        }

        // 3. Prepare Template Params
        // We inject the custom message body from settings if available
        const messageBody = templateName === 'confirmation' 
            ? (config.confirmationBody || "Your reservation has been confirmed.") 
            : "Your reservation has been cancelled.";

        const templateParams = {
            to_name: data.name,
            to_email: data.email,
            product_name: data.productName,
            date: data.date,
            message_body: messageBody.replace('{name}', data.name).replace('{date}', data.date).replace('{product}', data.productName),
            // Standard EmailJS params often used
            reply_to: "support@k-experience.com",
            from_name: "K-Experience Concierge"
        };

        // 4. Send
        const response = await window.emailjs.send(config.serviceId, config.templateId, templateParams);
        console.log('Email sent successfully!', response.status, response.text);
        return true;

    } catch (error) {
        console.error('Failed to send email:', error);
        return false;
    }
};
