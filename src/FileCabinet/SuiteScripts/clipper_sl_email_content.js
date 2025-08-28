/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 *
 * This Suitelet acts as a backend service to generate the email body.
 * The client script calls this to get the content to put in the `mailto` links.
 */
define(['N/record', 'N/render', 'N/log'], (record, render, log) => {
    
    /**
     * Handles the Suitelet request.
     *
     * @param {Object} context The context object
     * @param {ServerRequest} context.request The incoming request object
     * @param {ServerResponse} context.response The outgoing response object
     */
    const onRequest = (context) => {
        if (context.request.method === 'GET') {
         
            // const itemId = context.request.parameters.itemId;
            // const templateId = context.request.parameters.templateId;

            // if (!itemId || !templateId) {
            //     log.error('MISSING_PARAMETERS', 'itemId or templateId is missing.');
            //     context.response.write('Error: itemId or templateId is missing.');
            //     return;
            // }

            try {
                // Load the item record. In a real scenario, this would be a vendor record.
                   //const itemId = 33756;
                   const templateId = 2;
                
                    var mergeResultObj = render.mergeEmail({
                    templateId: templateId,
                    //transactionId: 33756
                    // RecordRef: {
                    //     id: 33756,
                    //     type: "vendorbill"
                    // }
                });

                // Render the template to get the final email content.
                const emailBody = mergeResultObj.body;
                log.debug("emailBody", emailBody)

                // Write the rendered content back to the client script.
                context.response.write(emailBody);

            } catch (e) {
                log.error('EMAIL_RENDER_ERROR', e);
                context.response.write('An error occurred while rendering the email content.');
            }
        }
    };
    
    return { onRequest };
});