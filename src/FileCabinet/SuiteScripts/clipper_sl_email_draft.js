/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 *
 * This is the main Suitelet that presents the user interface.
 * It contains a form with a button that triggers a client script.
 */
define(['N/ui/serverWidget', 'N/runtime', 'N/url'], (serverWidget, runtime, url) => {
    
    /**
     * Handles the Suitelet request.
     *
     * @param {Object} context The context object
     * @param {ServerRequest} context.request The incoming request object
     * @param {ServerResponse} context.response The outgoing response object
     */
    const onRequest = (context) => {
        if (context.request.method === 'GET') {
            // Create a form to display the button and pass parameters.
            const form = serverWidget.createForm({ title: 'Vendor Email Draft' });

            // In a real-world scenario, these values would come from a record.
            // For this example, we'll use a hardcoded item and template ID.
            const itemId = '123'; // Replace with a valid item ID
            const templateId = '1';  // Replace with a valid email template ID

            // Create a button that triggers the client-side script.
            // The `functionName` must match the function defined in the client script.
            form.addButton({
                id: 'custpage_create_email_button',
                label: 'Create Draft Email',
                functionName: `prepareVendorEmail('${itemId}', '${templateId}')`
            });

            // Add the client-side script to the form.
            // This script handles the button click in the browser.
            form.clientScriptModulePath = './client_email_draft.js';
            
            context.response.writePage(form);
        }
    };
    
    return { onRequest };
});
