// Handles popup logic: receive content, call Gemini API, export
const contentArea = document.getElementById('content');
const summaryDiv = document.getElementById('summary');
const promptBtn = document.getElementById('promptBtn');
const promptInput = document.getElementById('promptInput');
const copyResponseBtn = document.getElementById('copyResponse');
const copySwitch = document.getElementById('copySwitch');
const closePopupBtn = document.getElementById('closePopup');

// Close button logic
closePopupBtn.onclick = () => {
  window.close();
};

// Listen for messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'PAGE_CONTENT') {
    contentArea.value = request.text;
  }
});

copySwitch.addEventListener('change', async function() {
  if (copySwitch.checked) {
    // Send message to content script to copy all content
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      chrome.tabs.sendMessage(tab.id, { type: 'COPY_PAGE_CONTENT' });
    } catch (e) {
      contentArea.value = 'Error copying content.';
    }
  } else {
    contentArea.value = '';
  }
});


promptBtn.onclick = async () => {
  const text = contentArea.value;
  const prompt = promptInput.value;
  if (!text && !prompt) return;
  summaryDiv.textContent = 'Waiting for Gemini response...';
  try {
    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-goog-api-key': 'GEMINI_API_KEY' // <-- Replace with your actual API key
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: `${prompt}\n\nContext:\n${text}` }] }]
      })
    });
    if (!response.ok) {
      summaryDiv.textContent = `Error: ${response.status} ${response.statusText}`;
      console.error('Gemini API error:', response.status, response.statusText);
      return;
    }
    const data = await response.json();
    if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
      summaryDiv.textContent = data.candidates[0].content.parts[0].text;
    } else {
      summaryDiv.textContent = 'No response.';
      console.error('Gemini API response:', data);
    }
  } catch (err) {
    summaryDiv.textContent = 'Error connecting to Gemini API.';
    console.error('Fetch error:', err);
  }
};



// Copy response logic
copyResponseBtn.onclick = () => {
  const text = summaryDiv.textContent;
  if (!text) return;
  navigator.clipboard.writeText(text).then(() => {
    copyResponseBtn.textContent = 'Copied!';
    setTimeout(() => {
      copyResponseBtn.textContent = 'Copy Response';
    }, 1200);
  });
};
