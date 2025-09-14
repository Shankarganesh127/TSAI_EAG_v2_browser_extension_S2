// Copies all text content from the webpage and sends it to the extension
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'COPY_PAGE_CONTENT') {
    const bodyText = document.body.innerText;
    chrome.runtime.sendMessage({ type: 'PAGE_CONTENT', text: bodyText });
  }
});
