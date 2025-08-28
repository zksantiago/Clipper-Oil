/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 * by AJD
 */
define([
    'N/search',
    'N/url',
    'N/record',
    'N/ui/serverWidget',
    'N/log',
    'N/https'
], (search, url, record, serverWidget, log, https) => {

    const ROWS_PER_PAGE = 20;

    /**
     * Helper: render the time‑logs table.
     */
    function buildTimeLogs(times) {
        return `
      <table id="timeLogs" style="border-collapse:collapse; margin-top:10px;">
        <thead>
          <tr><th>Step</th><th>Time (ms)</th></tr>
        </thead>
        <tbody>
          <tr><td>Load Search</td><td>${times.loadSearch}</td></tr>
          <tr><td>Count Results</td><td>${times.countTime}</td></tr>
          <tr><td>Fetch Page Rows</td><td>${times.fetchTime}</td></tr>
          <tr><td>Build Table</td><td>${times.tableTime}</td></tr>
        </tbody>
      </table>`;
    }

    /**
     * Build HTML fragment: results (if any) + pagination + time‑logs,
     * or "No results found." + time‑logs when count=0.
     */
    function generateHtmlFragment(page, savedSearch, times) {
        // Count
        const t0 = Date.now();
        const pagedData = savedSearch.runPaged({ pageSize: ROWS_PER_PAGE });
        times.countTime = Date.now() - t0;

        // Fetch page
        const t1 = Date.now();
        const currentPage = pagedData.fetch({ index: page - 1 });
        const results = currentPage.data;
        const columns = savedSearch.columns;
        times.fetchTime = Date.now() - t1;

        // If no results, only show message + logs
        if (pagedData.count === 0) {
            let html = `<div style="font-style:italic; margin-bottom:10px;">No results found.</div>`;
            html += buildTimeLogs(times);
            return html;
        }

        // Build results table
        const t2 = Date.now();
        let html = `
      <style>
        table { border-collapse:collapse; width:100%; margin-bottom:10px; }
        th,td { border:1px solid #ccc; padding:6px; }
        th { background:#f2f2f2; }
        .action-btn { padding:4px 8px; }
        .total-row { font-weight:bold; text-align:right; }
        .pagination a { margin:0 4px; cursor:pointer; color:blue; text-decoration:none; }
      </style>
      <table>
        <thead><tr>
          <th>Action</th>`;
        columns.forEach(col => html += `<th>${col.label||col.name}</th>`);
        html += `</tr></thead><tbody>`;
        let mailtoLink;
        /*  Draft Email Templates Start **/
                const itemId = '123'; // Replace with a valid item ID
                const templateId = '1';  // Replace with a valid email template ID
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
                        const recipients ='recipient1@example.com';
                          
                        const subject = encodeURIComponent('Purchase Order Inquiry for Item #' + itemId);
                        const encodedBody = encodeURIComponent(emailBody);

                        mailtoLink = `mailto:${recipient}?subject=${subject}&body=${encodedBody}&bcc=development@zanovoy.com`;
                        //window.open(mailtoLink, '_blank'); // works like location.href but doesn't unload page

                          })
                          .catch(error => {
                              console.error('Failed to retrieve email content:', error);
                              alert('An error occurred while preparing the email. Please check the console for details.');
                          });
                  
         /*  Draft Email Templates End **/
            
        results.forEach(r => {
            html += `<tr><td>`;
            const poUrl = url.resolveRecord({
                recordType: record.Type.PURCHASE_ORDER,
                isEdit: false,
                params: { entity: r.id }
            });
            html += `<button type="button" class="action-btn"
        onclick="window.open('${poUrl}','_blank')">Draft Email</button>`;
            html += `</td>`;
            columns.forEach(col => html += `<td>${r.getValue(col)||''}</td>`);
            html += `</tr>`;
        });
        html += `<tr><td colspan="${columns.length+1}" class="total-row">
               Total: ${pagedData.count}
             </td></tr>`;
        html += `</tbody></table>`;
        times.tableTime = Date.now() - t2;

        // Pagination links
        html += `<div class="pagination">`;
        if (page > 1) {
            html += `<a data-page="1" class="paginationLink">First</a>`;
            html += `<a data-page="${page-1}" class="paginationLink">Previous</a>`;
        }
        html += `<span>Page ${page} of ${pagedData.pageRanges.length}</span>`;
        if (page < pagedData.pageRanges.length) {
            html += `<a data-page="${page+1}" class="paginationLink">Next</a>`;
            html += `<a data-page="${pagedData.pageRanges.length}" class="paginationLink">Last</a>`;
        }
        html += `</div>`;

        // Append time‑logs
        html += buildTimeLogs(times);
        return html;
    }

    /**
     * Wrap filter UI + results container + inline JS.
     */
    function createInlineHtml(fragment, suiteletUrl, status, method, country, id) {
        return `
      <div id="filterContainer" style="margin-bottom:8px;">
        <label>Demo Country:</label>
        <select id="countryFilter">
          <option value="all"${country==='all'?' selected':''}>All</option>
          <option value="USA"${country==='USA'?' selected':''}>USA</option>
          <option value="Philippines"${country==='Philippines'?' selected':''}>Philippines</option>
          <option value="Japan"${country==='Japan'?' selected':''}>Japan</option>
          <option value="Canada"${country==='Canada'?' selected':''}>Canada</option>
        </select>
        <label style="margin-left:12px;">Demo Status:</label>
        <select id="statusFilter">
          <option value="all"${status==='all'?' selected':''}>All</option>
          <option value="Active"${status==='Active'?' selected':''}>Active</option>
          <option value="Inactive"${status==='Inactive'?' selected':''}>Inactive</option>
        </select>
        <label style="margin-left:12px;">Delivery Method:</label>
        <select id="methodFilter">
          <option value="all"${method==='all'?' selected':''}>All</option>
          <option value="Phillips 66"${method==='Phillips 66'?' selected':''}>Phillips 66</option>
          <option value="Summit"${method==='Summit'?' selected':''}>Summit</option>
          <option value="Shell"${method==='Shell'?' selected':''}>Shell</option>
        </select>
        <label style="margin-left:12px;">Name:</label>
        <input
          type="text"
          id="idFilter"
          value="${id!=='all'?id:''}"
          placeholder="Enter ID and press Enter"
        >
        <label style="margin-left:20px;">
          <input type="checkbox" id="showLogs"> Show Time Logs
        </label>
      </div>
      <div id="resultsContainer">${fragment}</div>
      <script>
      (function(){
        var baseUrl = "${suiteletUrl}";
        function fetchPage(pg, st, mt, ct, id){
          var d = baseUrl.indexOf('?')!==-1 ? '&' : '?';
          var u = baseUrl + d
                + "action=fetch&page=" + pg
                + "&status=" + encodeURIComponent(st)
                + "&method=" + encodeURIComponent(mt)
                + "&country=" + encodeURIComponent(ct)
                + "&id=" + encodeURIComponent(id);
          var xhr = new XMLHttpRequest();
          xhr.onload = function(){
            if(xhr.status===200){
              document.getElementById("resultsContainer").innerHTML = xhr.responseText;
            }
          };
          xhr.open("GET", u, true);
          xhr.send();
        }

        document.addEventListener("change", function(e){
          var t = e.target;
          if (t.id==="countryFilter" || t.id==="statusFilter" || t.id==="methodFilter") {
            fetchPage(
              1,
              document.getElementById("statusFilter").value,
              document.getElementById("methodFilter").value,
              document.getElementById("countryFilter").value,
              document.getElementById("idFilter").value
            );
          }
          if (t.id==="showLogs") {
            document.getElementById("timeLogs").style.display = t.checked ? "table" : "none";
          }
        });

        var idInput = document.getElementById("idFilter");
        idInput.addEventListener("keyup", function(e){
          if (e.key === "Enter") {
            fetchPage(
              1,
              document.getElementById("statusFilter").value,
              document.getElementById("methodFilter").value,
              document.getElementById("countryFilter").value,
              this.value
            );
          }
        });
        idInput.addEventListener("blur", function(){
          fetchPage(
            1,
            document.getElementById("statusFilter").value,
            document.getElementById("methodFilter").value,
            document.getElementById("countryFilter").value,
            this.value
          );
        });

        document.addEventListener("click", function(e){
          var t = e.target;
          if (t.classList && t.classList.contains("paginationLink")) {
            e.preventDefault();
            fetchPage(
              t.getAttribute("data-page"),
              document.getElementById("statusFilter").value,
              document.getElementById("methodFilter").value,
              document.getElementById("countryFilter").value,
              document.getElementById("idFilter").value
            );
          }
        });
      })();
      </script>`;
    }

    function onRequest(context) {
        if (context.request.method !== "GET") return;

        const times = {};
        const tLoad = Date.now();

        let page    = parseInt(context.request.parameters.page,10) || 1;
        if (page < 1) page = 1;
        const action  = context.request.parameters.action  || "";
        const status  = context.request.parameters.status  || "all";
        const method  = context.request.parameters.method  || "all";
        const country = context.request.parameters.country || "all";
        const id      = context.request.parameters.id      || "all";

        const savedSearch = search.load({ id: '845' });
        times.loadSearch = Date.now() - tLoad;

        if (country !== 'all') {
            savedSearch.filters.push(search.createFilter({
                name: 'custentity_demo_country',
                operator: search.Operator.IS,
                values: country
            }));
        }
        if (status !== 'all') {
            savedSearch.filters.push(search.createFilter({
                name: 'custentity_demo_status',
                operator: search.Operator.IS,
                values: status
            }));
        }
        if (method !== 'all') {
            savedSearch.filters.push(search.createFilter({
                name: 'custentity_demo_method',
                operator: search.Operator.IS,
                values: method
            }));
        }
        if (id !== 'all' && id.trim() !== '') {
            savedSearch.filters.push(search.createFilter({
                name: 'entityid',
                operator: search.Operator.HASKEYWORDS,
                values: id
            }));
        }

        const fragment = generateHtmlFragment(page, savedSearch, times);
        if (action === 'fetch') {
            context.response.write(fragment);
            return;
        }

        const suiteletUrl = url.resolveScript({
            scriptId: '1087',
            deploymentId: '1'
        });
        const inlineHtml = createInlineHtml(fragment, suiteletUrl, status, method, country, id);

        const form = serverWidget.createForm({ title: 'Master Supplier List' });
        form.addField({
            id: 'custpage_fullhtml',
            label: 'Results',
            type: serverWidget.FieldType.INLINEHTML
        }).defaultValue = inlineHtml;
        context.response.writePage(form);
    }

    return { onRequest };
});
