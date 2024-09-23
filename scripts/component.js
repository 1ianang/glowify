const Mode = {
    NORM_MODE: 'NORM_MODE',
    EDIT_MODE: 'EDIT_MODE'
};

function hideToolbar() {
    // console.log('hide toolbar');
    document.getElementById('selection-toolbar').style.display = 'none';
}

function hideToolbarWithDelay() {
    // console.log('hide toolbar with delay');
    setTimeout(() => {
      const toolbar = document.getElementById('selection-toolbar');
      if (!toolbar.matches(':hover')) {
        hideToolbar();
      }
    }, 500);
}

function createToolbar(btnConfigs) {
    console.log('Creating toolbar');
    const toolbar = document.createElement('div');
    toolbar.id = 'selection-toolbar';
    toolbar.style.cssText = `
      position: absolute;
      display: none;
      background-color: #f8f9fa;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
      padding: 8px;
      z-index: 9999;
      font-family: Arial, sans-serif;
    `;
  
    const buttonStyle = `
      margin: 0 4px;
      padding: 8px;
      font-size: 16px;
      color: #495057;
      background-color: transparent;
      border: none;
      cursor: pointer;
      transition: color 0.3s ease;
    `;
  
    const buttons = [];
  
    btnConfigs.forEach(({ id, icon, onClick, title }) => {
      const button = DomUtils.createButton(id, icon, onClick, title, buttonStyle);
      buttons.push(button);
      toolbar[id] = button; 
      toolbar.appendChild(button);
    });
    document.body.appendChild(toolbar);
  
    buttons.forEach(btn => {
      btn.addEventListener('mouseover', () => {
        btn.style.color = '#007bff'; 
      });
      btn.addEventListener('mouseout', () => {
        btn.style.color = '#495057';
      });
    });
  
    document.head.appendChild(DomUtils.createFontAwesomeLink());
  
    toolbar.addEventListener('mouseleave', () => {
      hideToolbarWithDelay();
    });
}



const Toolbar = {
    hide: hideToolbar,
    delayHide: hideToolbarWithDelay,
    create: createToolbar,
    currentMode: Mode.NORM_MODE,
    getCurrentMode: function() {
      return this.currentMode;
    },
  
    setCurrentMode: function(mode) {
      this.currentMode = mode;
    },
    show: function (mode, event) {

      this.setCurrentMode(mode);
      if (this.isShowing()) {
        console.log(`toolbar is already showing, skip show.`);
        return;
      }
  
      // console.log(`show toolbar: ${mode}, ${JSON.stringify(event)}`);
      const toolbar = document.getElementById('selection-toolbar');
      let offsetX = 5;
      let offsetY = 5;
      let btnConfs;
      if (mode === Mode.NORM_MODE) {
  
  
    
        // toolbar.dataset.highlightId = "";
    
        btnConfs = [
          {id: 'highlightBtn', display: true },
          {id: 'commentBtn', display: true },
          {id: 'deleteBtn', display: false },
          {id: 'changeColorBtn', display: false }
        ];
    
      } else if (mode === Mode.EDIT_MODE) {
        // toolbar.dataset.highlightId = event.target.id;
    
        btnConfs = [
          {id: 'highlightBtn', display: false },
          {id: 'commentBtn', display: true },
          {id: 'deleteBtn', display: true },
          {id: 'changeColorBtn', display: true }
        ];
      }
      
      toolbar.style.display = 'block';
      toolbar.style.left = `${event.pageX + offsetX}px`;
      toolbar.style.top = `${event.pageY + offsetY}px`;
    
      btnConfs.forEach(({ id, display }) => {
        toolbar[id].style.display = display ? 'inline-block' : 'none';
      });
  
      if (mode === Mode.EDIT_MODE) {

        // get the closest highlight span
        const highlightSpan = event.target.closest("." + Constants.HIGHLIGHT_CLASS);
        if (highlightSpan) {
          console.log(`edit mode, set highlight id: ${highlightSpan.id}`); 
          this.setHighlightId(highlightSpan.id);
        }

      } else {
        console.log(`norm mode, set highlight id: ""`); 
        this.setHighlightId("");
      }
  },
    isShowing: function () {
        return document.getElementById('selection-toolbar').style.display !== 'none';
    },  
    get: function () {
        return document.getElementById('selection-toolbar');
    },
    setHighlightId: function (highlightId) {
        const toolbar = this.get();
        toolbar.dataset.highlightId = highlightId;
    },
    getHighlightId: function () {
        const toolbar = this.get();
        return toolbar.dataset.highlightId;
    },
    getHighlightSpan: function () {
        const highlightId = this.getHighlightId();
        if (!highlightId) {
            return null;
        }
        return document.querySelector(`#${highlightId}`);
    },
    getCommentSpan: function() {
      const highlightSpan = this.getHighlightSpan();
      if (!highlightSpan) {
        return null;
      }
      const commentSpan = highlightSpan.nextElementSibling;
      if (commentSpan && commentSpan.className === 'comment') {
        return commentSpan;
      }
      return null;
    }, 
    getCommentContentSpan: function() {
      const commentSpan = this.getCommentSpan();
      if (!commentSpan) {
        return null;
      }
      return commentSpan.querySelector('.comment-content');
    }   
}

const CommentForm = {
    form: null,
    isShowing: function () {
      return document.getElementById('comment-form') !== null;
    },  
    create: function (defaultComment, saveCallback, selectionText) {
        const commentForm = document.createElement('div');
        commentForm.id = 'comment-form';
        commentForm.style.cssText = `
          position: fixed;
          background-color: #f8f9fa;
          padding: 20px;
          border-radius: 8px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
          z-index: 10000;
          width: 500px;
          cursor: move;
        `;
        
        // 设置初始位置
        const initialLeft = window.innerWidth / 2 - 250; // 250 是宽度的一半
        const initialTop = window.innerHeight / 2 - 200; // 假设高度约400px
        commentForm.style.left = `${initialLeft}px`;
        commentForm.style.top = `${initialTop}px`;

        console.log(`show comment form: ${defaultComment}`);
        commentForm.innerHTML = `
          <p style="
            margin-bottom: 10px;
            font-weight: bold;
            color: #333;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            font-size: 16px;
            letter-spacing: 0.5px;
          ">Comment for:</p>
          <blockquote style="
            font-family: Georgia, 'Times New Roman', serif;
            font-style: italic;
            color: #495057;
            padding: 0px 0px 0px 5px;
            margin: 20px 0px;
            margin-bottom: 20px;
            word-wrap: break-word;
          ">${selectionText}</blockquote>
          <textarea id="comment-input" style="width: 100%; height: 100px; margin-bottom: 10px; border: 1px solid #ced4da; border-radius: 4px; padding: 8px;">${defaultComment}</textarea>
          <div style="display: flex; justify-content: flex-end; margin-top: 15px;">
            <button id="save-comment" style="
              margin-right: 10px;
              background-color: #4CAF50;
              color: white;
              border: none;
              padding: 12px;
              border-radius: 50%;
              font-size: 18px;
              cursor: pointer;
              transition: all 0.3s ease;
              box-shadow: 0 2px 5px rgba(76, 175, 80, 0.3);
              width: 48px;
              height: 48px;
              display: flex;
              align-items: center;
              justify-content: center;
            "><i class="fas fa-check"></i></button>
            <button id="cancel-comment" style="
              background-color: transparent;
              color: #555;
              border: 2px solid #555;
              padding: 12px;
              border-radius: 50%;
              font-size: 18px;
              cursor: pointer;
              transition: all 0.3s ease;
              width: 48px;
              height: 48px;
              display: flex;
              align-items: center;
              justify-content: center;
            "><i class="fas fa-times"></i></button>
          </div>
        `;
        document.body.appendChild(commentForm);
        CommentForm.form = commentForm;
        
        const saveButton = document.getElementById('save-comment');
        const cancelButton = document.getElementById('cancel-comment');

        saveButton.addEventListener('mouseenter', () => {
          saveButton.style.backgroundColor = '#45a049';
          saveButton.style.boxShadow = '0 4px 8px rgba(76, 175, 80, 0.5)';
        });

        saveButton.addEventListener('mouseleave', () => {
          saveButton.style.backgroundColor = '#4CAF50';
          saveButton.style.boxShadow = '0 2px 5px rgba(76, 175, 80, 0.3)';
        });

        cancelButton.addEventListener('mouseenter', () => {
          cancelButton.style.backgroundColor = '#555';
          cancelButton.style.color = 'white';
        });

        cancelButton.addEventListener('mouseleave', () => {
          cancelButton.style.backgroundColor = 'transparent';
          cancelButton.style.color = '#555';
        });

        document.getElementById('save-comment').onclick = () => {
            const comment = document.getElementById('comment-input').value;
            saveCallback(comment); 
            CommentForm.remove();
        };
        document.getElementById('cancel-comment').onclick = () => {
            CommentForm.remove();
        };

        this.addDragFunctionality(commentForm);
    },
    remove: function () {
        CommentForm.form?.remove() ?? console.log('Comment form not found');
    },
    addDragFunctionality: function(commentForm) {
        let isDragging = false;
        let startX;
        let startY;

        commentForm.addEventListener('mousedown', dragStart, true);
        document.addEventListener('mousemove', drag, true);
        document.addEventListener('mouseup', dragEnd, true);

        function dragStart(e) {
            if (e.target.tagName === 'TEXTAREA' || e.target.tagName === 'BUTTON') {
                return;
            }
            e.preventDefault();
            
            startX = e.clientX - commentForm.offsetLeft;
            startY = e.clientY - commentForm.offsetTop;
            
            isDragging = true;
        }

        function drag(e) {
            if (!isDragging) return;
            e.preventDefault();
            
            const newX = e.clientX - startX;
            const newY = e.clientY - startY;
            
            commentForm.style.left = `${newX}px`;
            commentForm.style.top = `${newY}px`;
        }

        function dragEnd(e) {
            isDragging = false;
        }
    }
}

const CommentSpan = {
    create: function (comment, prevNode) {
        const commentSpan = document.createElement('span');
        commentSpan.className = 'comment';
        commentSpan.id = `comment-${Date.now()}`;
        commentSpan.innerHTML = `
          (<i class="fas fa-comment-dots" style="margin-right: 5px;font-style:normal;"></i>
          <span class="comment-content" style="display: inline-block;white-space: normal;">${comment}</span>)
        `;
        commentSpan.style.cssText = `
          display: inline;
          margin-left: 5px;
          color: green;
          font-style: normal;
          position: static;
          white-space: normal;
        `;
        prevNode.parentNode.insertBefore(commentSpan, prevNode.nextSibling);    
        return commentSpan;
    }
}
const HighlightSpan = {
  hoverTimer: null,
  mouseover: function (event) {
    clearTimeout(this.hoverTimer);
    this.hoverTimer = setTimeout(() => {
      if (CommentForm.isShowing()) {
        CommentForm.remove();
      } 
      console.log(`[HighlightSpan] mouseover, show edit mode, event target: ${event.target.outerHTML}`);
      return Toolbar.show(Mode.EDIT_MODE, event);
    }, 800);  
  },
  mouseout: function (event) {
    clearTimeout(this.hoverTimer);
    Toolbar.delayHide();
  },
  restore: function (data, textColor, bgColor, callbacks = {mouseover: this.mouseover, mouseout: this.mouseout}) {

    // create range
    const range = document.createRange();
    const startContainer = DomUtils.getElementByXPath(data.startContainer);
    const endContainer = DomUtils.getElementByXPath(data.endContainer);
    if (!startContainer || !endContainer) {
      console.log('Invalid container for highlight:', data);
      console.log(`startContainer: ${data.startContainer}, endContainer: ${data.endContainer}`);
      return null;
    }

    const startNode = startContainer;
    const endNode = endContainer;

    if (data.endOffset > endNode.textContent.length) {
      console.log(`malformed highlight data, endOffset is out of range: ${data.text}, ${data.endOffset}, end node max offset: ${endNode.textContent.length}`);
      return null;
    } else if (data.startOffset > startNode.textContent.length) {
      console.log(`malformed highlight data, startOffset is out of range: ${data.text}, ${data.startOffset}, start node max offset: ${startNode.textContent.length}`);
      return null;
    } 

    // Safely set start and end points
    range.setStart(startNode, data.startOffset);
    range.setEnd(endNode, data.endOffset); 

    const span = document.createElement('span');
    span.id = data.id;  
    span.style.backgroundColor = bgColor;
    span.style.color = textColor;
    span.classList.add(Constants.HIGHLIGHT_CLASS);

    // assign data to span.dataset.
    Object.assign(span.dataset, data);

    const fragment = range.extractContents();
    span.appendChild(fragment); // using surroundContents will report an error in certain cases.
    range.insertNode(span);

    Object.entries(callbacks).forEach(([event, callback]) => {
      span.addEventListener(event, callback);
    }); 

    return span;
  },
  create: function (range, textColor, bgColor, callbacks = {mouseover: this.mouseover, mouseout: this.mouseout}) {
    const span = document.createElement('span');
    span.id = StrUtils.genUniqueId();  
    span.style.backgroundColor = bgColor;
    span.style.color = textColor;
    // span.style.display = 'inline-block';
    span.classList.add(Constants.HIGHLIGHT_CLASS);

    const startXpath = DomUtils.getXPathForElement(range.startContainer);
    const endXpath = DomUtils.getXPathForElement(range.endContainer);

    span.dataset.startContainer = startXpath;
    span.dataset.startOffset = range.startOffset;
    span.dataset.endContainer = endXpath;
    span.dataset.endOffset = range.endOffset;
    span.dataset.createdAt = StrUtils.getCurrentTs();
    span.dataset.updatedAt = StrUtils.getCurrentTs();

    const fragment = range.extractContents();
    span.appendChild(fragment); // using surroundContents will report an error in certain cases.
    range.insertNode(span);

    // callbacks is a dict, the key is the event name, the value is the callback function, 
    // iterate over callbacks and add event listeners
    Object.entries(callbacks).forEach(([event, callback]) => {
      span.addEventListener(event, callback);
    }); 

    return span;
  },
  getData: function (span) {
    if (!span) {
      return null;
    }
    return {
      text: span.textContent,
      id: span.id,
      comment: span.dataset.comment,
      createdAt: span.dataset.createdAt,
      updatedAt: span.dataset.updatedAt,  
      startContainer: span.dataset.startContainer,
      startOffset: span.dataset.startOffset,
      endContainer: span.dataset.endContainer,
      endOffset: span.dataset.endOffset 
    }
  }
}