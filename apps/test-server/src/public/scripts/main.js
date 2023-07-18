const CHATFORM = document.getElementById("chat-form");
const CHATHISTORY = document.getElementById("chat-history");
const CHATLOADING = document.getElementById("chat-loading");
const CHATINFO = document.getElementById("chat-info");

const getRandomID = () => {
  return Math.random().toString(36).substr(2, 9);
};

window.conversation_id =
  sessionStorage.getItem("conversation_id") || getRandomID();

sessionStorage.setItem("conversation_id", window.conversation_id);

const renderChatInfo = () => {
  CHATINFO.innerText = `Conversation ID: ${window.conversation_id}`;
};

renderChatInfo();

const chatHistory = [];

const renderChatHistory = () => {
  CHATHISTORY.innerHTML = "";
  chatHistory.forEach((chat) => {
    const chatItem = document.createElement("li");
    chatItem.classList.add("chat-item");
    chatItem.classList.add(chat.role);
    chatItem.innerText = chat.content;
    CHATHISTORY.appendChild(chatItem);
  });
};

renderChatHistory();

const renderChatLoading = (state) => {
  if (state) {
    CHATLOADING.style.display = "block";
  } else {
    CHATLOADING.style.display = "none";
  }
};

CHATFORM.addEventListener("submit", (e) => {
  e.preventDefault();
  const MESSAGE = e.target.elements.message.value;
  chatHistory.push({
    role: "user",
    content: MESSAGE,
  });
  renderChatHistory();
  renderChatLoading(true);
  e.target.elements.message.value = "";
  fetch("/assistant/message", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message: MESSAGE,
      conversation_id: window.conversation_id,
    }),
  });
});

window.socket.on("assistant-message", (message) => {
  chatHistory.push({
    role: "assistant",
    content: message,
  });
  renderChatHistory();
  renderChatLoading(false);
});

// * FETCH CONVERSATION HISTORY
(async () => {
  const response = await fetch(
    `/assistant/history?conversation_id=${window.conversation_id}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
  const data = await response.json();
  chatHistory.push(...data.data);
  renderChatHistory();
})();
