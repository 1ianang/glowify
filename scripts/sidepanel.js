function initTabButtons() {
    const tabButtons = document.querySelectorAll('.toolbar button');
    const tabContents = document.querySelectorAll('.tab-content');

    tabButtons.forEach(button => {
      button.addEventListener('click', function() {
        const tabId = this.getAttribute('data-tab');
        
        tabButtons.forEach(btn => btn.classList.remove('active'));
        tabContents.forEach(content => content.classList.remove('active'));
        
        this.classList.add('active');
        document.getElementById(tabId).classList.add('active');
      });
    });
}   

function requestHighlights() {
    // send message to background.js
    console.log(`[sidepanel.js] message request: SP_REQ_HIGHLIGHTS`);
    chrome.runtime.sendMessage({action: 'SP_REQ_HIGHLIGHTS'}, (response) => {
        console.log(`[sidepanel.js] message receive: SP_REQ_HIGHLIGHTS, message: ${JSON.stringify(response)}`);
        if (response.success) {
            showHighlights(response.highlights);
        } else {
            console.log(`[sidepanel.js] message response: SP_REQ_HIGHLIGHTS, error: ${response.message}`);
        }
    });
}   

function showHighlights(highlights) {
    const container = document.querySelector('.highlights-container');
    container.innerHTML = '';
    
    if (highlights.length === 0) {
        const noHighlightsMessage = document.createElement('div');
        noHighlightsMessage.className = 'no-highlights-message';
        noHighlightsMessage.innerHTML = `Enjoy your day! No highlights to show at the moment.`;
        container.appendChild(noHighlightsMessage);
        return;
    }
    
    highlights.forEach(highlight => {
      const highlightItem = document.createElement('div');
      highlightItem.className = 'highlight-item';
      highlightItem.id = highlight.id;  
      highlightItem.innerHTML = `
        <div class="highlight-text">${highlight.text}</div>
        ${highlight.comment ? `<div class="highlight-comment">${highlight.comment}</div>` : ''}
        <button class="delete-btn" title="Delete highlight">×</button>
      `;
      
      // Add click event for the highlight item
      highlightItem.onclick = function(event) {
        if (!event.target.classList.contains('delete-btn')) {
          console.log(`[sidepanel.js] highlight item clicked, id: ${highlight.id}`);
          chrome.runtime.sendMessage({action: 'SP_HIGHLIGHT_CLICKED', id: highlight.id}, (response) => {
              console.log(`[sidepanel.js] message receive: SP_HIGHLIGHT_CLICKED, message: ${JSON.stringify(response)}`);
          }); 
        }
      };
      
      // Add click event for the delete button
      const deleteBtn = highlightItem.querySelector('.delete-btn');
      deleteBtn.onclick = function(event) {
        event.stopPropagation();
        console.log(`[sidepanel.js] delete button clicked, id: ${highlight.id}`);
        chrome.runtime.sendMessage({action: 'SP_DELETE_HIGHLIGHT', id: highlight.id}, (response) => {
            console.log(`[sidepanel.js] message receive: SP_HIGHLIGHT_DELETED, message: ${JSON.stringify(response)}`);
            // Remove the highlight item from the DOM after successful deletion
            if (response && response.success) {
                highlightItem.remove();
            }
        });
      };
      
      container.appendChild(highlightItem);
    });
}

function onMessage(message) {
    console.log(`[sidepanel.js] onMessage, message: ${JSON.stringify(message)}`);
    if (message.action === 'BG_UPDATE_SIDE_PANEL') {
        showHighlights(message.highlights);
    }   
    return true;
}

function onContentLoaded() {
    console.log(`[sidepanel.js] init tab buttons.`);
    initTabButtons();
    console.log(`[sidepanel.js] add message listener`);
    chrome.runtime.onMessage.addListener(onMessage);
    console.log(`[sidepanel.js] request highlights`);
    requestHighlights();
}
// on document load, add event listener on document load.
document.addEventListener('DOMContentLoaded', onContentLoaded);