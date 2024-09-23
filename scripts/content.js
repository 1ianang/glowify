const Constants = {
  HIGHLIGHT_CLASS: 'lt-highlight',
  COMMENT_CLASS: 'lt-comment'
}

const Options = {
  highlightColor: '#ff0000',
  highlightBgColor: '#ffeb3b',
  minTextLength: 3,
  saveToNotion: false,
  notionApiKey: '',
  notionDatabaseId: ''
}

let savedRange = null; // Add this line to declare savedRange


function highlightRange(range) {
  const span = HighlightSpan.create(
    range, 
    Options.highlightColor, 
    Options.highlightBgColor
  );  

  Toolbar.setHighlightId(span.id);
  console.log(`[content.js] highlighted range: ${range.toString()}, dataset: ${JSON.stringify(span.dataset)}`);  
  return span;
} 

function onCopyBtn() {
  const selection = window.getSelection();
  // print all ranges in selection
  console.log(`[content.js] selection ranges: ${selection.rangeCount}`);
  if (Toolbar.getCurrentMode() === Mode.EDIT_MODE) {
    const highlightSpan = Toolbar.getHighlightSpan();
    console.log(`[content.js] onCopy highlight text: ${highlightSpan.id}`);
    if (highlightSpan) {
      console.log(`[content.js] onCopy highlight text: ${highlightSpan.textContent}`);
      navigator.clipboard.writeText(highlightSpan.textContent); 
    }
  } else {
    if (selection.rangeCount > 0) {
      DomUtils.copySelection(selection);
    }
  }
  Toolbar.hide();
}

const EnableCheck = {
  isDisabled: false,
  disabledUrls: [],
  init: function() {
    chrome.storage.local.get(['disabledUrls'], function(data) {
      EnableCheck.disabledUrls = data.disabledUrls || [];
    });
  },
  isDisabled: function(url) {
    return EnableCheck.disabledUrls.includes(url);
  },
  disable: function(url) {
    EnableCheck.disabledUrls.push(url);
    chrome.storage.local.set({disabledUrls: EnableCheck.disabledUrls}, function() {
      console.log('Disable option saved');
    });
  },
  enable: function(url) {
    EnableCheck.disabledUrls = EnableCheck.disabledUrls.filter(u => u !== url);
    chrome.storage.local.set({disabledUrls: EnableCheck.disabledUrls}, function() {
      console.log('Enable option saved');
    });
  }
}

function onDisableBtn() {
  console.log(`[content.js] onDisableBtn`);
  const url = window.location.href.split('#')[0];
  EnableCheck.disable(url);

  // cancel all highlights
  const highlights = getAllHighlights();
  highlights.forEach(highlight => {
    const highlightSpan = document.querySelector(`#${highlight.id}`);
    if (highlightSpan) {
      deleteHighlight(highlightSpan);
    }
  });
  Toolbar.hide();
}

function onHightlightBtn() {

  const selection = window.getSelection();
  if (selection.rangeCount <= 0) {
    return;
  } 
  const range = selection.getRangeAt(0);
  const highlightSpan = highlightRange(range);

  selection.removeAllRanges(); 

  Toolbar.hide();
  updateSidePanel();
  onHighlightChange("create", HighlightSpan.getData(highlightSpan));
}



function onHighlightChange(event, highlightInfo) {
  // send message to background.js
  console.log(`[content.js] saveToNotion: ${highlightInfo}`);

  const data = {
    pageDomain: window.location.hostname,
    pageUrl: window.location.href,
    pageTitle: document.title
  }

  Object.assign(data, highlightInfo);

  chrome.runtime.sendMessage({
    action: 'CT_HIGHLIGHT_CHANGED',
    event: event,
    data: data
  }); 
}

/**
 * 分为以下几种情况:
 * 1. 当前文本未高亮， 此时 highlightSpan 为空， 则使用 savedRange 来高亮
 * 2. 当前文本已高亮:
 *    2.1 当前文本已有 comment， 则此时输入框初始内容为此comment
 *    2.2 当前文本没有 comment， 则此时输入框初始内容为空
 */
function onCommentBtn() {
  
  
  let currentComment = "";

  let highlightSpan = Toolbar.getHighlightSpan();
  console.log(`comment btn clicked. highlightSpan: ${highlightSpan}`);

  if (highlightSpan) {
    const commentContentSpan = Toolbar.getCommentContentSpan();
    if (commentContentSpan) {
      currentComment = commentContentSpan.textContent;
    } 
  } else {
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
      savedRange = selection.getRangeAt(0).cloneRange();
      console.log(`highlight current selection first.`);
      highlightSpan = highlightRange(savedRange);
      savedRange = null;
    } else {
      console.log(`no highlight span and no selection, this should not happen.`);
    }
  }

  CommentForm.create(currentComment, (comment) => {
    saveComment(comment, highlightSpan);
  }, highlightSpan.textContent);
  Toolbar.hide();
}

// 保存评论
function saveComment(comment, highlightSpan) {
  console.log(`saving comment: ${comment}, highlightSpan: ${highlightSpan.textContent}`);

  let commentSpan = Toolbar.getCommentSpan();
  if (comment === "") {
    commentSpan?.remove(); 
  } else {
      if (!commentSpan) { 
        commentSpan = CommentSpan.create(comment, highlightSpan);
      } else {
        const commentContentSpan = Toolbar.getCommentContentSpan();
        if (commentContentSpan) {
          commentContentSpan.textContent = comment;
        }
      }
  }

  highlightSpan.dataset.comment = comment;  
  highlightSpan.dataset.updatedAt = StrUtils.getCurrentTs();

  console.log(`comment saved. dataset of highlight ${highlightSpan.id}: ${JSON.stringify(highlightSpan.dataset, space=2)}`);
  updateSidePanel();
  onHighlightChange("update", HighlightSpan.getData(highlightSpan));
}



function deleteHighlight(highlightSpan) {
  if (highlightSpan) {
    // const commentSpan = Toolbar.getCommentSpan();
    // get comment span by highlight span, make sure it's a comment span (check class)
    const commentSpan = highlightSpan.nextElementSibling;
    if (commentSpan && commentSpan.classList.contains(Constants.COMMENT_CLASS)) {
      commentSpan.remove();
    } 
    
    const fragment = document.createDocumentFragment();
    while (highlightSpan.firstChild) {
      fragment.appendChild(highlightSpan.firstChild);
    }

    highlightSpan.parentNode.replaceChild(fragment, highlightSpan);
  }
}

function onDeleteBtn() {
  const highlightSpan = Toolbar.getHighlightSpan();

  deleteHighlight(highlightSpan);
  
  hideToolbar();
  updateSidePanel();
}

function onChangeColorBtn() {
  const highlightSpan = Toolbar.getHighlightSpan();
  
  console.log(`onChangeColorBtn: ${highlightSpan}`);
  
  if (highlightSpan) {
    const colors = ['yellow', 'lightgreen', 'lightblue', 'pink', 'orange'];
    const currentColor = highlightSpan.style.backgroundColor;
    const nextColorIndex = (colors.indexOf(currentColor) + 1) % colors.length;
    highlightSpan.style.backgroundColor = colors[nextColorIndex];
  }
}

function isSelectionAcrossMultipleParagraphs(selection) {
  const range = selection.getRangeAt(0);
  const startContainer = range.startContainer;
  const endContainer = range.endContainer;

  // Helper function to get the closest paragraph
  const getClosestParagraph = (node) => {
    if (node.nodeType === Node.ELEMENT_NODE) {
      return node.closest('p');
    }
    return node.parentElement ? node.parentElement.closest('p') : null;
  };

  // If start and end are in different paragraphs, return true
  if (getClosestParagraph(startContainer) !== getClosestParagraph(endContainer)) {
    return true;
  }

  // Check all nodes within the range
  const nodeIterator = document.createNodeIterator(range.commonAncestorContainer);
  let node;
  let paragraphs = new Set();

  while (node = nodeIterator.nextNode()) {
    if (range.intersectsNode(node) && node.nodeType === Node.ELEMENT_NODE && node.nodeName === 'P') {
      paragraphs.add(node);
      if (paragraphs.size > 1) {
        return true;
      }
    }
  }

  return false;
}

function onMouseUp(event) {

  if (EnableCheck.isDisabled(window.location.href)) {
    console.log(`skip mouseup in disabled page: ${window.location.href}`);
    return;
  } 

  if (event.target.closest('#selection-toolbar')) {
    console.log("skip mouseup in toolbar.");
    return;
  }

  if (event.target.closest('#comment-form')) {
    console.log("skip mouseup in comment form.");
    return;
  }

  const selection = window.getSelection();
  if (selection.toString().length < Options.minTextLength) {
    console.log(`skip mouse up with no selection or too small text. selection = ${selection.toString()}`);
    Toolbar.hide();
    return;
  }

  // Check if selection spans multiple text nodes
  if (selection.anchorNode !== selection.focusNode) {
    const anchorParent = selection.anchorNode.parentElement;
    const focusParent = selection.focusNode.parentElement;
    
    // If the parent elements are different, it spans multiple text nodes
    if (anchorParent !== focusParent) {
      // console.log("Selection spans multiple text nodes. Skipping.");
      console.log(`selection spans multiple text nodes. selection: ${selection.toString()}, anchorNode: ${selection.anchorNode.outerHTML}, focusNode: ${selection.focusNode.outerHTML}`);
      Toolbar.hide();
      return;
    }
  }

  if (selection.anchorNode.nodeType === Node.ELEMENT_NODE && selection.anchorNode.closest('#comment-form')) {
    console.log("skip mouseup in comment form.");
    Toolbar.hide();
    return;
  }

  if (selection.focusNode.nodeType === Node.ELEMENT_NODE && selection.focusNode.closest('#comment-form')) {
    console.log("skip mouseup in comment form.");
    Toolbar.hide();
    return;
  }

  // console.log(`start container: ${selection.anchorNode.outerHTML}`);
  // console.log(`end container: ${selection.focusNode.outerHTML}`); 
  if (CommentForm.isShowing()) {
    CommentForm.remove();
    Toolbar.hide();
  }

  // if current selection strech over multiple P nodes, just return and don't show toolbar.
  const startNode = selection.anchorNode;
  const endNode = selection.focusNode;
  if (isSelectionAcrossMultipleParagraphs(selection)) {
    console.log(`skip mouseup in multiple P nodes`);
    Toolbar.hide();
    return;
  } 

  console.log(`show toolbar in norm mode, selected text: ${selection.toString()}, target: ${event.target.outerHTML}`);
  Toolbar.show(Mode.NORM_MODE, event);
}

function getAllHighlights() {
  const highlights = Array.from(document.querySelectorAll("." + Constants.HIGHLIGHT_CLASS)).map(HighlightSpan.getData);
  return highlights;
}

function updateSidePanel() {
  console.log(`[content.js] updateSidePanel`);
  chrome.runtime.sendMessage({
    action: 'CT_UPDATE_SIDE_PANEL',
    highlights: getAllHighlights()
  }, (response) => {
    console.log(`[content.js] message response: SP_REQ_HIGHLIGHTS， data: ${JSON.stringify(response)}`);
  });
  saveAllHighlightsToLocalStorage();
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'BG_REQ_HIGHLIGHTS') {

    console.log(`[content.js] message receive: BG_REQ_HIGHLIGHTS`);
    const highlights = getAllHighlights();  
    sendResponse({highlights: highlights});
    console.log(`[content.js] message response: BG_REQ_HIGHLIGHTS， data: ${JSON.stringify(highlights)}`);
  } else if (message.action === 'BG_HIGHLIGHT_CLICKED') {
    console.log(`[content.js] message receive: BG_HIGHLIGHT_CLICKED, id: ${message.id}`);
    const highlightSpan = document.querySelector(`#${message.id}`);
    if (highlightSpan) {
      // scroll to highlight span.
      console.log(`[content.js] scroll to highlight span: ${highlightSpan}`);
      highlightSpan.scrollIntoView({ behavior: 'smooth' }); 
    }
  } else if (message.action === 'BG_UPDATE_OPTIONS') {
    console.log(`[content.js] message receive: BG_UPDATE_OPTIONS, data: ${JSON.stringify(message)}`);
    Object.assign(Options, message.options);
  } else if (message.action === 'BG_DELETE_HIGHLIGHT') {
    console.log(`[content.js] message receive: BG_DELETE_HIGHLIGHT, id: ${message.id}`);
    const highlightSpan = document.querySelector(`#${message.id}`);
    if (highlightSpan) {
      deleteHighlight(highlightSpan);
      sendResponse({success: true});  
    } else {
      sendResponse({success: false});
    }
  } else if (message.action === 'BG_HIGHLIGHT_SELECTION') {
    EnableCheck.enable(window.location.href);
    // highlightSelection();
    onHightlightBtn();
  }
  return true;
});


function saveAllHighlightsToLocalStorage() {

  const highlights = getAllHighlights();
  const urlHash = StrUtils.getUrlHash(window.location.href);

  console.log(`[content.js] highlights: ${JSON.stringify(highlights)}`);  
  localStorage.setItem('highlights-' + urlHash, JSON.stringify(highlights));
}



function loadHighlightsFromLocalStorage() {
  const urlHash = StrUtils.getUrlHash(window.location.href);
  const highlights = JSON.parse(localStorage.getItem('highlights-' + urlHash)) || [];
  console.log(`[content.js] load highlights: ${JSON.stringify(highlights)}`);  
  highlights.forEach(highlightData => {
      const highlightSpan = HighlightSpan.restore(highlightData, Options.highlightColor, Options.highlightBgColor);
      console.log(`highlight restored: ${highlightSpan}, comment : ${highlightData.comment}`);
      if (highlightSpan && highlightData.comment && highlightData.comment !== "") {
        CommentSpan.create(highlightData.comment, highlightSpan);
    }
  });
  console.log('All highlights loaded from local storage');
}



// 初始化
console.log('Initializing content script');
Toolbar.create([
  {id: 'highlightBtn', icon: 'highlighter', onClick: onHightlightBtn, title: 'Highlight' },
  {id: 'commentBtn', icon: 'comment', onClick: onCommentBtn, title: 'Comment' },
  {id: 'deleteBtn', icon: 'trash-alt', onClick: onDeleteBtn, title: 'Delete' },
  {id: 'changeColorBtn', icon: 'palette', onClick: onChangeColorBtn, title: 'Change Color' },
  {id: 'copyBtn', icon: 'copy', onClick: onCopyBtn, title: 'Copy' },
  {id: 'disableBtn', icon: 'ban', onClick: onDisableBtn, title: 'Disable on this page' }
]);
document.addEventListener('mouseup', onMouseUp);


async function docInit() {
  await EnableCheck.init();

  chrome.storage.local.get(['highlightColor', 'highlightBgColor', 'minTextLength', 'autoSync'], function(data) {
    Options.highlightColor = data.highlightColor || Options.highlightColor;
    Options.highlightBgColor = data.highlightBgColor || Options.highlightBgColor;
    Options.minTextLength = data.minTextLength || Options.minTextLength;
    Options.autoSync = data.autoSync || Options.autoSync;
  
    
    // send message to background.js to get highlights
    if (!EnableCheck.isDisabled(window.location.href)) {
      chrome.runtime.sendMessage({
        action: 'CT_FETCH_HIGHLIGHTS',
        pageUrl: window.location.href
      }, (response) => {
        console.log(`[content.js] message response: CT_FETCH_HIGHLIGHTS, data: ${JSON.stringify(response)}`);
        if (response.success) {
          response.highlights.forEach(highlightData => {
            const highlightSpan = HighlightSpan.restore(highlightData, Options.highlightColor, Options.highlightBgColor);
            console.log(`highlight restored: ${highlightSpan}, comment : ${highlightData.comment}`);
            if (highlightSpan && highlightData.comment && highlightData.comment !== "") {
              CommentSpan.create(highlightData.comment, highlightSpan);
            }
          });
        }
      });
    } // end of check
  }); 
} 

docInit();


console.log('Content script loaded successfully');
