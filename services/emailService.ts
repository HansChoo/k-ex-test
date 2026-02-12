
import { doc, getDoc } from 'firebase/firestore';
import { db } from './firebaseConfig';

declare global {
    interface Window {
        emailjs: any;
    }
}

export const sendEmail = async (templateName: 'confirmation' | 'cancellation', data: any) => {
    try {
        // 1. Fetch Email Config
        const settingsRef = doc(db, "settings", "email_config");
        const settingsSnap = await getDoc(settingsRef);
        
        if (!settingsSnap.exists()) return;
        const config = settingsSnap.data();

        if (window.emailjs) window.emailjs.init(config.publicKey);

        // 2. Fetch Survey Content if Confirmation
        let surveyContent = "";
        if (templateName === 'confirmation') {
            // Determine category from product name or options
            let category = "General";
            if (data.productName.includes("Health") || data.productName.includes("검진")) category = "Health Check";
            else if (data.productName.includes("Beauty") || data.productName.includes("Skin") || data.productName.includes("Rejuran")) category = "Beauty Treatment";
            else if (data.productName.includes("IDOL")) category = "K-IDOL";

            const surveySnap = await getDoc(doc(db, "survey_templates", category));
            if (surveySnap.exists()) {
                surveyContent = `
--------------------------------------------------
[PRE-VISIT SURVEY]
Please reply to this email with the following information:

${surveySnap.data().content}
--------------------------------------------------`;
            }
        }

        // 3. Prepare Body
        const baseBody = config.confirmationBody || "Your reservation is confirmed.";
        const fullBody = `${baseBody}\n\n${surveyContent}`;

        const templateParams = {
            to_name: data.name,
            to_email: data.email,
            product_name: data.productName,
            date: data.date,
            message_body: fullBody,
            reply_to: "support@k-experience.com",
            from_name: "K-Experience Concierge"
        };

        // 4. Send
        await window.emailjs.send(config.serviceId, config.templateId, templateParams);
        return true;

    } catch (error) {
        console.error('Email Error:', error);
        return false;
    }
};
