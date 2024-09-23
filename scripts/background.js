const Options = {
    notionApiKey: '',
    notionDatabaseId: ''
}

// read options from storage.
chrome.storage.local.get(['notionApiKey', 'notionDatabaseId'], function(data) {
    Options.notionApiKey = data.notionApiKey;
    Options.notionDatabaseId = data.notionDatabaseId;
});

notion = {
}

notion.formatPageId = function (pageId) {
    if (pageId.length !== 32) {
        throw new Error("Invalid page ID length. Expected 32 characters.");
    }
    
    return `${pageId.slice(0, 8)}-${pageId.slice(8, 12)}-${pageId.slice(12, 16)}-${pageId.slice(16, 20)}-${pageId.slice(20)}`;
}


notion.addRecord = async function (data) {

    console.log(`[background.js] addRecord: ${JSON.stringify(data)}`);

    // see more: https://developers.notion.com/docs/working-with-databases#adding-pages-to-a-database

    const payload = {
        parent: { 
            type: "database_id", 
            database_id: Options.notionDatabaseId 
        },
        properties: {
            "excerpt": {
                type: "title",
                title: [{ type: "text", text: { content: data.text } }]
            },
            "pageUrl": {
                type: "url",
                url: data.pageUrl
            },
            "pageDomain": {
                type: "rich_text",
                rich_text: [
                    {
                        type: "text",
                        text: {
                            content: data.pageDomain,
                            link: null
                        }   
                    }
                ]
            },  
            "highlightId": {
                type: "rich_text",
                rich_text: [
                    {
                        type: "text",
                        text: {
                            content: data.id,
                            link: null
                        }
                    }
                ]
            },
            "pageTitle": {
                type: "rich_text",
                rich_text: [
                    {
                        type: "text",
                        text: {
                            content: data.pageTitle,
                            link: null
                        }
                    }
                ]
            },
            "comment": {
                type: "rich_text",
                rich_text: [
                    {
                        type: "text",
                        text: {
                            content: data.comment ? data.comment : "",
                            link: null
                        }
                    }
                ]
            },
            "created": {
                type: "date",
                date: { start: data.createdAt }
            },
            "updated": {
                type: "date",
                date: { start: data.updatedAt }
            },
            "startContainer": {
                type: "rich_text",
                rich_text: [
                    {
                        type: "text",
                        text: {
                            content: data.startContainer,
                            link: null
                        }
                    }
                ]
            },
            "startOffset": {
                type: "rich_text",
                rich_text: [
                    {
                        type: "text",
                        text: {
                            content: data.startOffset,
                            link: null
                        }
                    }
                ]
            },
            "endContainer": {
                type: "rich_text",
                rich_text: [
                    {
                        type: "text",
                        text: {
                            content: data.endContainer,
                            link: null
                        }
                    }
                ]
            },
            "endOffset": {
                type: "rich_text",
                rich_text: [
                    {
                        type: "text",
                        text: {
                            content: data.endOffset,
                            link: null
                        }
                    }
                ]
            },
        }
    };

    try {

        console.log('Adding record to Notion:', JSON.stringify(payload));
        const response = await fetch('https://api.notion.com/v1/pages', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${Options.notionApiKey}`,
                'Content-Type': 'application/json',
                'Notion-Version': '2022-06-28'
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Successfully added record to Notion:', data);
        return data;
    } catch (error) {
        console.error('Error adding record to Notion:', error);
        throw error;
    }
}

notion.deleteRecord = async function (data) {
    console.log(`[background.js] deleteRecord: ${JSON.stringify(data)}`);
}

notion.updateRecord = async function (data) {
    console.log(`[background.js] updateRecord: ${JSON.stringify(data)}`);
    
    const filter = {
        property: "highlightId",
        "title": {
            "equals": data.id
        }
    }

    this.fetchRecords(filter).then((results) => {
        if (results.length > 0) {
            // archive the page.
            console.log(`[background.js] updateRecord: archiving page: ${results[0].pageId}`);
            this.archivePage(results[0].pageId);
        }

        return this.addRecord(data);
    }); 
}

notion.fetchRecords = async function (filter) {
    const payload = {
        filter: filter
    };

    try {
        console.log('Fetching records from Notion with payload:', JSON.stringify(payload));
        const response = await fetch(`https://api.notion.com/v1/databases/${Options.notionDatabaseId}/query`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${Options.notionApiKey}`,
                'Content-Type': 'application/json',
                'Notion-Version': '2022-06-28'
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const responseData = await response.json();
        console.log('Successfully fetched records from Notion:', responseData);

        const results = [];
        for (const entry of responseData.results) {
            const highlightEntry = {};
            for (const property in entry.properties) {
                const data = entry.properties[property];
                console.log(`[background.js] property: ${property}, value: ${data}`);
                let value = "";
                if (data.type === "rich_text") {
                    value = data.rich_text[0].text.content;
                } else if (data.type === "url") {
                    value = data.url;
                } else if (data.type === "date") {
                    value = data.date.start;
                } else if (data.type === "title") {
                    value = data.title[0].text.content;
                }
                highlightEntry[property] = value;
                console.log(`[background.js] property: ${property}, value: ${value}`);
            }
            highlightEntry["pageId"] = entry.id;
            highlightEntry["id"] = highlightEntry.highlightId;
            results.push(highlightEntry);
        }

        return results;
    } catch (error) {
        console.error('Error fetching records from Notion:', error);
        throw error;
    }
}

notion.archivePage = async function (pageId) {
    try {
        const response = await fetch(`https://api.notion.com/v1/pages/${pageId}`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${Options.notionApiKey}`,
                'Content-Type': 'application/json',
                'Notion-Version': '2022-06-28'
            },
            body: JSON.stringify({ archived: true })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const responseData = await response.json();
        console.log('Successfully archived page in Notion:', responseData);
        return responseData;
    } catch (error) {
        console.error('Error archiving page in Notion:', error);
        throw error;
    }
}

function isSidePanelOpen(tabId) {
    return new Promise((resolve) => {
      chrome.sidePanel.getOptions({ tabId: tabId }, (options) => {
        resolve(options.enabled);
      });
    });
  }

// chrome.sidePanel
//   .setPanelBehavior({ openPanelOnActionClick: true })
//   .catch((error) => console.error(error));


  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'SP_REQ_HIGHLIGHTS') {
        // send message to content.js
        console.log(`[background.js] message receive: SP_REQ_HIGHLIGHTS.`);
        console.log(`[background.js] message request: BG_REQ_HIGHLIGHTS.`);

        // get current tab id.
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0]) {
                console.log(`[background.js] chrome.tabs.query, tabId: ${tabs[0].id}`);
                chrome.tabs.sendMessage(tabs[0].id, {action: 'BG_REQ_HIGHLIGHTS'}, (response) => {
                    // Check if response exists and has a highlights property
                    if (!response || !response.highlights) {
                        sendResponse({
                            success: false,
                            highlights: []
                        });
                    } else {
                        sendResponse({
                            success: true,
                            highlights: response.highlights
                        });
                    }
                }); 
            }
        }); // end of tabs.query

    
    } else if (message.action === 'SP_HIGHLIGHT_CLICKED') {
        console.log(`[background.js] message receive: SP_HIGHLIGHT_CLICKED, id: ${message.id}`);
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0]) {
                        
                chrome.tabs.sendMessage(tabs[0].id, {action: 'BG_HIGHLIGHT_CLICKED', id: message.id}, (response) => {
                    console.log(`[background.js] message response: BG_HIGHLIGHT_CLICKED, id: ${message.id}`);
                }); 
            }
        }); // end of tabs.query
    } else if (message.action === 'CT_UPDATE_SIDE_PANEL') {
        console.log(`[background.js] message receive: CT_UPDATE_SIDE_PANEL, data: ${JSON.stringify(message)}`);

        try {
            chrome.runtime.sendMessage({action: 'BG_UPDATE_SIDE_PANEL', highlights: message.highlights}, (response) => {
                console.log(`[background.js] message response: BG_UPDATE_SIDE_PANEL, data: ${JSON.stringify(response)}`);
            }); 
        } catch (error) {
            console.log(`[CT_UPDATE_SIDE_PANEL] Error checking side panel: ${error}`);
        }
        return true;
    } else if (message.action === 'CT_HIGHLIGHT_CHANGED') {
        console.log(`[background.js] message receive: CT_HIGHLIGHT_CHANGED, event: ${message.event}, data: ${JSON.stringify(message.data)}`);
        if (message.event === "create") {
            notion.addRecord(message.data);
        } else if (message.event === "update") {
            notion.updateRecord(message.data);
        } else if (message.event === "delete") {
            notion.deleteRecord(message.data);
        }
    } else if (message.action === 'CT_FETCH_HIGHLIGHTS') {
        const filter = {
            property: "pageUrl",
            rich_text: {
                equals: message.pageUrl
            }
        }
        notion.fetchRecords(filter).then((results) => {
            console.log(`[background.js] message response: CT_FETCH_HIGHLIGHTS, data: ${JSON.stringify(results)}`);
            sendResponse({
                success: true,
                highlights: results
            });
        });
    } else if (message.action === 'SP_UPDATE_OPTIONS') {
        console.log(`[background.js] message receive: SP_UPDATE_OPTIONS, data: ${JSON.stringify(message)}`);
        
        Options.notionApiKey = message.options.notionApiKey;
        Options.notionDatabaseId = message.options.notionDatabaseId;

        // send message to content.js
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0]) {
                chrome.tabs.sendMessage(tabs[0].id, {action: 'BG_UPDATE_OPTIONS', options: message.options}, (response) => {
                    console.log(`[background.js] message response: BG_UPDATE_OPTIONS, data: ${JSON.stringify(response)}`);
                }); 
            }
        }); // end of tabs.query
    } else if (message.action === 'SP_DELETE_HIGHLIGHT') {
        console.log(`[background.js] message receive: SP_DELETE_HIGHLIGHT, id: ${message.id}`);
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0]) {
                chrome.tabs.sendMessage(tabs[0].id, {action: 'BG_DELETE_HIGHLIGHT', id: message.id}, (response) => {
                    console.log(`[background.js] message response: BG_DELETE_HIGHLIGHT, id: ${message.id}`);
                    sendResponse(response);
                }); 
            }
        });
        return true; // Indicates that the response is sent asynchronously
    }   
    return true;
  });   

// Add this near the top of the file, after the Options object
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "highlightWithGlowify",
    title: "Highlight with Glowify",
    contexts: ["selection"]
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "highlightWithGlowify") {
    chrome.tabs.sendMessage(tab.id, {
      action: "BG_HIGHLIGHT_SELECTION"
    });
  }
});

// Add this new event listener for action button clicks
chrome.action.onClicked.addListener((tab) => {
    console.log(`[background.js] chrome.action.onClicked, tabId: ${tab.id}`);
    
    chrome.storage.local.get([`sidePanel_${tab.id}`], (result) => {

        console.log(`[background.js] chrome.action.onClicked, result: ${JSON.stringify(result)}`);
        const isOpen = result[`sidePanel_${tab.id}`] || false;
        
        if (isOpen) {
            chrome.sidePanel.setOptions({ 
                tabId: tab.id, 
                enabled: false 
            });
        } else {
            chrome.sidePanel.setOptions({ 
                tabId: tab.id, 
                path: "sidepanel.html",
                enabled: true 
            });

            // open side panel.
            chrome.sidePanel.open({ tabId: tab.id });
        }
        chrome.storage.local.set({ [`sidePanel_${tab.id}`]: !isOpen });
    });
});


chrome.tabs.onActivated.addListener((activeInfo) => {
    // log activeInfo
    console.log(`[background.js] chrome.tabs.onActivated, activeInfo: ${JSON.stringify(activeInfo)}`);
    const tabId = activeInfo.tabId;
    chrome.storage.local.get([`sidePanel_${tabId}`], (result) => {
        const isOpen = result[`sidePanel_${tabId}`] || false;

        console.log(`[background.js] chrome.tabs.onActivated, tabId: ${tabId}, isOpen: ${isOpen}`);  

        chrome.sidePanel.setOptions({ 
            tabId: tabId, 
            enabled: isOpen 
        });
    }); 
});