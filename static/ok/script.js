const apiUrl = "https://ok.edui123.com/";
let uuid = '';

function generateUUID() {
  let newUUID = '';
  const chars = 'abcdef0123456789';
  for (let i = 0; i < 32; i++) {
    const charIndex = Math.floor(Math.random() * chars.length);
    newUUID += chars[charIndex];
    if (i === 7 || i === 11 || i === 15 || i === 19) {
      newUUID += '-';
    }
  }
  return newUUID;
}

function renderChatHistory(messages) {
  const chatHistoryDiv = document.getElementById('chat-history');
  chatHistoryDiv.innerHTML = '';

  let userMessageSeen = false;

  messages.forEach(message => {
    const role = message.role;
    let content = '';

    if (message.content) {
      if (typeof message.content === 'string') {
        content = message.content;
      } else if (message.content.response) {
        content = message.content.response;
      }
    }

    if (role === 'user') {
      userMessageSeen = true;
    }

    if (userMessageSeen || role === 'user') {
      let messageText;

      if (role === 'system') {
        messageText = `Bot: ${content}`;
      } else {
        messageText = `You: ${content}`;
      }

      const pElement = document.createElement('p');
      pElement.textContent = messageText;

      chatHistoryDiv.appendChild(pElement);
    }
  });
}



async function sendMessage(event) {
  event.preventDefault();
  const userInputField = document.getElementById('user-message');
  const userQuery = userInputField.value.trim();
  if (userQuery === '') {
    return;
  }

  const chatHistoryDiv = document.getElementById('chat-history');
  const loadingMessage = document.createElement('p');
  loadingMessage.textContent = 'Loading...';
  chatHistoryDiv.appendChild(loadingMessage);

  try {
    const response = await fetch(`${apiUrl}/${uuid}?q=${encodeURIComponent(userQuery)}`);

    if (!response.ok) {
      throw new Error('Error occurred while fetching data from API');
    }
    const jsonResponse = await response.json();
    const messages = jsonResponse[0].response;
    chatHistoryDiv.removeChild(loadingMessage);
    renderChatHistory(messages);
    userInputField.value = '';
  } catch (error) {
    console.log(error);
  }
}


const messageForm = document.getElementById('message-form');

if (!uuid) {
  uuid = generateUUID();
}

messageForm.addEventListener('submit', sendMessage);
