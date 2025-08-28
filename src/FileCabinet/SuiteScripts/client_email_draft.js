/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 *
 * This client script handles the logic for opening the Outlook pop-up windows.
 * It calls a backend Suitelet to generate the email body.
 */
define(['N/url', 'N/https'], (url, https) => {
    
    /**
     * The `prepareVendorEmail` function is called by the button in the Suitelet.
     * It makes a server-side call to get the email content and then opens
     * three `mailto` links to create the draft emails.
     *
     * @param {string} itemId The ID of the item record.
     * @param {string} templateId The ID of the email template.
     */
    const pageInit = (itemId, templateId) => {
    }
    const prepareVendorEmail = (itemId, templateId) => {
        // Construct the URL to the backend Suitelet that generates the email content.
        const backendSuiteletUrl = url.resolveScript({
            scriptId: 'customscript_suitelet_email_content', // Replace with the actual script ID
            deploymentId: 'customdeploy_suitelet_email_content', // Replace with the actual deployment ID
            params: {
                itemId: itemId,
                templateId: templateId
            }
        });

        // Use `N/https` to make a server-side call to get the email body.
        // We use an asynchronous call here.
        https.get.promise({ url: backendSuiteletUrl })
            .then(response => {
                const emailBody = response.body;
                console.log("emailBody")
              console.log(emailBody)

                // --- IMPORTANT: This part directly interacts with the user's browser ---
                // The `mailto` protocol opens the user's default email client.
                // We open three separate pop-up windows with the specified recipients.
                // Note: Browser pop-up blockers may prevent these from opening.

                const recipients = [
                    'recipient1@example.com',
                    'recipient2@example.com',
                    'recipient3@example.com'
                ];
                
                const subject = encodeURIComponent('Purchase Order Inquiry for Item #' + itemId);
                const encodedBody = encodeURIComponent(emailBody);

                recipients.forEach((recipient, index) => {
                    const mailtoLink = `mailto:${recipient}?subject=${subject}&body=${encodedBody}&bcc=development@zanovoy.com`;
                    //window.open(mailtoLink, '_blank'); //works for chrome - except sunny
                    //window.location.href = mailtoLink; // works for safari, 1x only

    setTimeout(() => {
        window.open(mailtoLink, '_blank'); // works like location.href but doesn't unload page
    });
                });
            })
            .catch(error => {
                console.error('Failed to retrieve email content:', error);
                alert('An error occurred while preparing the email. Please check the console for details.');
            });
    };

    return {  
        prepareVendorEmail: prepareVendorEmail,
        pageInit: pageInit
    };
});