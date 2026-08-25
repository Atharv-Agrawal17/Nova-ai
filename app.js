/* =========================================================
   NOVA AI — REAL CHAT FRONTEND
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
   STARTUP
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {
    loadTheme();
    loadHistory();
    resizeInput();
    updateSendButton();

    messageInput.focus();
});


/* =========================================================
   INPUT
   ========================================================= */

messageInput.addEventListener("input", () => {

    resizeInput();
    updateSendButton();

});


messageInput.addEventListener("keydown", event => {

    if (
        event.key === "Enter" &&
        !event.shiftKey
    ) {

        event.preventDefault();

        sendMessage();

    }

});


function resizeInput() {

    messageInput.style.height = "auto";

    const height =
        Math.min(
            messageInput.scrollHeight,
            150
        );

    messageInput.style.height =
        `${height}px`;

}


function updateSendButton() {

    sendButton.disabled =
        messageInput.value.trim().length === 0 ||
        isWaiting;

}


/* =========================================================
   SEND MESSAGE
   ========================================================= */

sendButton.addEventListener(
    "click",
    sendMessage
);


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


    const typing =
        showTypingIndicator();


    scrollToBottom();


    try {

        const response =
            await fetch(
                "/api/chat",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify({
                            messages:
                                conversation
                        })
                }
            );


        const data =
            await response.json();


        removeTypingIndicator(typing);


        if (!response.ok || !data.success) {

            throw new Error(
                data.error ||
                "NOVA could not generate a response."
            );

        }


        addAIMessage(
            data.response
        );


        conversation.push({
            role: "assistant",
            content: data.response
        });


        saveCurrentConversation();


    } catch (error) {

        removeTypingIndicator(typing);


        console.error(
            "NOVA request error:",
            error
        );


        addAIMessage(
            "⚠️ I couldn't connect to my AI engine right now.\n\n" +
            error.message
        );

    }


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

    avatar.textContent =
        "✦";


    const content =
        document.createElement("div");

    content.className =
        "message-content";


    /*
     * Preserve line breaks.
     */

    content.textContent =
        text;


    message.appendChild(avatar);

    message.appendChild(content);

    messages.appendChild(message);


    return message;

}


/* =========================================================
   TYPING
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

    avatar.textContent =
        "✦";


    const typing =
        document.createElement("div");

    typing.className =
        "typing";


    for (
        let i = 0;
        i < 3;
        i++
    ) {

        const dot =
            document.createElement("span");

        typing.appendChild(dot);

    }


    message.appendChild(avatar);

    message.appendChild(typing);

    messages.appendChild(message);


    return message;

}


function removeTypingIndicator(element) {

    if (element) {
        element.remove();
    }

}


/* =========================================================
   WELCOME
   ========================================================= */

function hideWelcome() {

    welcome.style.display =
        "none";

}


function showWelcome() {

    welcome.style.display =
        "";

}


/* =========================================================
   NEW CHAT
   ========================================================= */

newChatButton.addEventListener(
    "click",
    startNewChat
);


function startNewChat() {

    conversation = [];

    messages.innerHTML = "";

    showWelcome();

    messageInput.value = "";

    resizeInput();

    updateSendButton();

    closeMobileSidebar();

    messageInput.focus();

}


/* =========================================================
   SUGGESTIONS
   ========================================================= */

suggestions.forEach(button => {

    button.addEventListener(
        "click",
        () => {

            const prompt =
                button.dataset.prompt;

            messageInput.value =
                prompt;

            resizeInput();

            updateSendButton();

            sendMessage();

        }
    );

});


/* =========================================================
   HISTORY
   ========================================================= */

function saveCurrentConversation() {

    if (
        conversation.length === 0
    ) {
        return;
    }


    const first =
        conversation.find(
            message =>
                message.role === "user"
        );


    if (!first) return;


    const history =
        JSON.parse(
            localStorage.getItem(
                "novaHistory"
            ) || "[]"
        );


    /*
     * Replace the currently active
     * conversation instead of creating
     * a duplicate after every message.
     */

    const existingId =
        localStorage.getItem(
            "novaActiveChat"
        );


    let chat;


    if (existingId) {

        chat =
            history.find(
                item =>
                    String(item.id) ===
                    String(existingId)
            );

    }


    if (chat) {

        chat.conversation =
            conversation;

    } else {

        chat = {

            id: Date.now(),

            title:
                first.content
                    .slice(0, 42),

            conversation: [
                ...conversation
            ]

        };


        history.unshift(chat);


        localStorage.setItem(
            "novaActiveChat",
            String(chat.id)
        );

    }


    /*
     * Keep the latest 25 conversations.
     */

    const limited =
        history.slice(0, 25);


    localStorage.setItem(
        "novaHistory",
        JSON.stringify(limited)
    );


    loadHistory();

}


function loadHistory() {

    const history =
        JSON.parse(
            localStorage.getItem(
                "novaHistory"
            ) || "[]"
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


    localStorage.setItem(
        "novaActiveChat",
        String(item.id)
    );


    messages.innerHTML = "";

    hideWelcome();


    conversation.forEach(
        message => {

            if (
                message.role ===
                "user"
            ) {

                addUserMessage(
                    message.content
                );

            }

            else if (
                message.role ===
                "assistant"
            ) {

                addAIMessage(
                    message.content
                );

            }

        }
    );


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

    document.body.classList.toggle(
        "dark"
    );


    const dark =
        document.body.classList.contains(
            "dark"
        );


    localStorage.setItem(
        "novaTheme",
        dark
            ? "dark"
            : "light"
    );

}


function loadTheme() {

    const theme =
        localStorage.getItem(
            "novaTheme"
        );


    if (theme === "dark") {

        document.body.classList.add(
            "dark"
        );

    }

}


/* =========================================================
   MOBILE SIDEBAR
   ========================================================= */

menuButton.addEventListener(
    "click",
    () => {

        sidebar.classList.toggle(
            "open"
        );

    }
);


function closeMobileSidebar() {

    sidebar.classList.remove(
        "open"
    );

}


/* =========================================================
   SCROLL
   ========================================================= */

function scrollToBottom() {

    const chatArea =
        document.getElementById(
            "chatArea"
        );


    requestAnimationFrame(() => {

        chatArea.scrollTo({

            top:
                chatArea.scrollHeight,

            behavior:
                "smooth"

        });

    });

}


/* =========================================================
   KEYBOARD / FOCUS
   ========================================================= */

document.addEventListener(
    "keydown",
    event => {

        if (
            event.key === "/" &&
            document.activeElement !==
                messageInput
        ) {

            event.preventDefault();

            messageInput.focus();

        }

    }
);


/* =========================================================
   GLOBAL ERROR LOG
   ========================================================= */

window.addEventListener(
    "error",
    event => {

        console.error(
            "NOVA frontend error:",
            event.error
        );

    }
);


/* =========================================================
   STARTUP MESSAGE
   ========================================================= */

console.log(
    "%c✦ NOVA AI",
    "font-size:26px;font-weight:800;"
);

console.log(
    "NOVA frontend connected."
);
