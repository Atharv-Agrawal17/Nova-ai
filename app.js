/* =========================================================
   NOVA AI — FRONTEND ENGINE
   ========================================================= */

const messageInput = document.getElementById("messageInput");
const sendButton = document.getElementById("sendButton");
const messages = document.getElementById("messages");
const welcome = document.getElementById("welcome");
const newChatButton = document.getElementById("newChat");
const chatHistory = document.getElementById("chatHistory");
const themeButton = document.getElementById("themeButton");
const menuButton = document.getElementById("menuButton");
const sidebar = document.querySelector(".sidebar");
const suggestions = document.querySelectorAll(".suggestion");

let conversation = [];
let isWaiting = false;


/* =========================================================
   INITIALIZATION
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {
    loadTheme();
    loadHistory();
    resizeInput();

    messageInput.focus();
});


/* =========================================================
   MESSAGE INPUT
   ========================================================= */

messageInput.addEventListener("input", () => {
    resizeInput();
    updateSendButton();
});


function resizeInput() {

    messageInput.style.height = "auto";

    const newHeight =
        Math.min(messageInput.scrollHeight, 150);

    messageInput.style.height =
        `${newHeight}px`;
}


function updateSendButton() {

    const hasText =
        messageInput.value.trim().length > 0;

    sendButton.disabled =
        !hasText || isWaiting;
}


/* =========================================================
   SEND MESSAGE
   ========================================================= */

sendButton.addEventListener("click", sendMessage);


messageInput.addEventListener("keydown", event => {

    if (event.key === "Enter" && !event.shiftKey) {

        event.preventDefault();

        sendMessage();
    }
});


async function sendMessage() {

    if (isWaiting) return;

    const text =
        messageInput.value.trim();

    if (!text) return;

    hideWelcome();

    addUserMessage(text);

    conversation.push({
        role: "user",
        content: text
    });

    messageInput.value = "";

    resizeInput();

    isWaiting = true;

    updateSendButton();

    const typingElement =
        showTypingIndicator();

    scrollToBottom();

    /*
     * TEMPORARY FRONTEND RESPONSE
     *
     * In the next step this will be replaced
     * with a real backend/API request.
     */

    await delay(900);

    removeTypingIndicator(typingElement);

    const response =
        generateTemporaryResponse(text);

    addAIMessage(response);

    conversation.push({
        role: "assistant",
        content: response
    });

    saveCurrentConversation();

    isWaiting = false;

    updateSendButton();

    messageInput.focus();

    scrollToBottom();
}


/* =========================================================
   USER MESSAGE
   ========================================================= */

function addUserMessage(text) {

    const message =
        document.createElement("div");

    message.className =
        "message user";

    const content =
        document.createElement("div");

    content.className =
        "message-content";

    content.textContent =
        text;

    message.appendChild(content);

    messages.appendChild(message);

    scrollToBottom();
}


/* =========================================================
   AI MESSAGE
   ========================================================= */

function addAIMessage(text) {

    const message =
        document.createElement("div");

    message.className =
        "message ai";

    const avatar =
        document.createElement("div");

    avatar.className =
        "message-avatar";

    avatar.textContent = "✦";

    const content =
        document.createElement("div");

    content.className =
        "message-content";

    content.textContent =
        text;

    message.appendChild(avatar);

    message.appendChild(content);

    messages.appendChild(message);

    scrollToBottom();
}


/* =========================================================
   TYPING INDICATOR
   ========================================================= */

function showTypingIndicator() {

    const message =
        document.createElement("div");

    message.className =
        "message ai";

    const avatar =
        document.createElement("div");

    avatar.className =
        "message-avatar";

    avatar.textContent = "✦";

    const typing =
        document.createElement("div");

    typing.className =
        "typing";

    for (let i = 0; i < 3; i++) {

        const dot =
            document.createElement("span");

        typing.appendChild(dot);
    }

    message.appendChild(avatar);

    message.appendChild(typing);

    messages.appendChild(message);

    scrollToBottom();

    return message;
}


function removeTypingIndicator(element) {

    if (element) {
        element.remove();
    }
}


/* =========================================================
   WELCOME SCREEN
   ========================================================= */

function hideWelcome() {

    if (!welcome) return;

    welcome.style.display =
        "none";
}


/* =========================================================
   NEW CHAT
   ========================================================= */

newChatButton.addEventListener("click", () => {

    conversation = [];

    messages.innerHTML = "";

    welcome.style.display =
        "";

    messageInput.value = "";

    resizeInput();

    closeMobileSidebar();

    messageInput.focus();
});


/* =========================================================
   SUGGESTIONS
   ========================================================= */

suggestions.forEach(button => {

    button.addEventListener("click", () => {

        const prompt =
            button.dataset.prompt;

        messageInput.value =
            prompt;

        resizeInput();

        updateSendButton();

        sendMessage();
    });

});


/* =========================================================
   TEMPORARY RESPONSE ENGINE
   ========================================================= */

function generateTemporaryResponse(text) {

    const lower =
        text.toLowerCase();

    if (
        lower.includes("hello") ||
        lower.includes("hi") ||
        lower.includes("hey")
    ) {
        return "Hello! I'm NOVA. I'm ready to help you. 🚀";
    }

    if (lower.includes("who are you")) {

        return (
            "I'm NOVA, your AI assistant. " +
            "I'm being built to answer questions, " +
            "help you learn, create content, write code, " +
            "and much more."
        );
    }

    if (
        lower.includes("space") ||
        lower.includes("universe")
    ) {

        return (
            "Space is enormous and fascinating. " +
            "There are billions of galaxies in the observable " +
            "universe, with many containing billions of stars."
        );
    }

    if (
        lower.includes("code") ||
        lower.includes("program")
    ) {

        return (
            "Absolutely! NOVA will be able to help with " +
            "programming, debugging, explanations, and " +
            "building complete projects once the AI backend " +
            "is connected."
        );
    }

    return (
        "That's a great question. I'm currently running " +
        "in development mode. In the next step, we'll " +
        "connect NOVA to a real AI model so it can generate " +
        "much more capable answers."
    );
}


/* =========================================================
   CHAT HISTORY
   ========================================================= */

function saveCurrentConversation() {

    if (conversation.length === 0) {
        return;
    }

    const firstUserMessage =
        conversation.find(
            message => message.role === "user"
        );

    if (!firstUserMessage) {
        return;
    }

    const history =
        JSON.parse(
            localStorage.getItem("novaHistory") || "[]"
        );

    const title =
        firstUserMessage.content
            .slice(0, 42);

    const item = {
        id: Date.now(),
        title,
        conversation
    };

    history.unshift(item);

    /*
     * Keep the browser history manageable.
     */

    const limitedHistory =
        history.slice(0, 25);

    localStorage.setItem(
        "novaHistory",
        JSON.stringify(limitedHistory)
    );

    loadHistory();
}


function loadHistory() {

    const history =
        JSON.parse(
            localStorage.getItem("novaHistory") || "[]"
        );

    chatHistory.innerHTML = "";

    history.forEach(item => {

        const button =
            document.createElement("button");

        button.className =
            "history-item";

        button.textContent =
            item.title;

        button.title =
            item.title;

        button.addEventListener(
            "click",
            () => loadConversation(item)
        );

        chatHistory.appendChild(button);
    });
}


function loadConversation(item) {

    conversation =
        Array.isArray(item.conversation)
            ? [...item.conversation]
            : [];

    messages.innerHTML = "";

    hideWelcome();

    conversation.forEach(message => {

        if (message.role === "user") {

            addUserMessage(
                message.content
            );

        } else if (
            message.role === "assistant"
        ) {

            addAIMessage(
                message.content
            );
        }

    });

    closeMobileSidebar();

    scrollToBottom();
}


/* =========================================================
   THEME
   ========================================================= */

themeButton.addEventListener(
    "click",
    toggleTheme
);


function toggleTheme() {

    document.body.classList.toggle("dark");

    const isDark =
        document.body.classList.contains("dark");

    localStorage.setItem(
        "novaTheme",
        isDark ? "dark" : "light"
    );
}


function loadTheme() {

    const saved =
        localStorage.getItem("novaTheme");

    if (saved === "dark") {

        document.body.classList.add("dark");

    } else if (saved === "light") {

        document.body.classList.remove("dark");
    }
}


/* =========================================================
   MOBILE SIDEBAR
   ========================================================= */

menuButton.addEventListener(
    "click",
    () => {

        sidebar.classList.toggle("open");

    }
);


function closeMobileSidebar() {

    sidebar.classList.remove("open");
}


/* =========================================================
   SCROLLING
   ========================================================= */

function scrollToBottom() {

    const chatArea =
        document.getElementById("chatArea");

    requestAnimationFrame(() => {

        chatArea.scrollTo({
            top: chatArea.scrollHeight,
            behavior: "smooth"
        });

    });
}


/* =========================================================
   UTILITY
   ========================================================= */

function delay(milliseconds) {

    return new Promise(resolve => {

        setTimeout(
            resolve,
            milliseconds
        );

    });
}


/* =========================================================
   PREVENT ACCIDENTAL FORM BEHAVIOR
   ========================================================= */

document.addEventListener(
    "submit",
    event => event.preventDefault()
);


/* =========================================================
   GLOBAL ERROR HANDLING
   ========================================================= */

window.addEventListener(
    "error",
    event => {

        console.error(
            "NOVA error:",
            event.error
        );

    }
);

console.log(
    "%cNOVA AI",
    "font-size:24px;font-weight:bold;"
);

console.log(
    "NOVA frontend initialized."
);
