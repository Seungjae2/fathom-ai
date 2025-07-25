// public/chat.js

// 1) DOM 요소 참조
const chatContainer = document.getElementById("chat-container");
const userInput = document.getElementById("user-input");
const sendBtn = document.getElementById("send-btn");
const micBtn = document.getElementById("mic-btn");
const faqToggle = document.getElementById("faq-toggle");
const faqPanel = document.getElementById("faq-panel");

// 2) 대화 내역 저장
const history = [];

// 3) 메시지 화면에 추가
function addMessage(text, sender) {
  const msg = document.createElement("div");
  msg.classList.add("message", sender);

  if (sender === "bot") {
    msg.innerHTML = marked.parse(text);
  } else {
    msg.textContent = text;
  }

  chatContainer.append(msg);
  chatContainer.scrollTop = chatContainer.scrollHeight;
}

// 4) 로딩 표시/제거
function setLoading(on) {
  if (on) {
    const load = document.createElement("div");
    load.id = "__loading";
    load.classList.add("message", "bot");
    load.textContent = "생각하는 중...";
    chatContainer.append(load);
    chatContainer.scrollTop = chatContainer.scrollHeight;
  } else {
    const load = document.getElementById("__loading");
    if (load) load.remove();
  }
}

// 5) 백엔드 호출 함수
async function callChatAPI() {
  setLoading(true);
  try {
    // 마지막 사용자 메시지를 question으로 전송
    const lastUser = history
      .slice()
      .reverse()
      .find((m) => m.role === "user");
    const question = lastUser ? lastUser.content : "";

    const res = await fetch("/api/ask", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question }),
    });
    const data = await res.json();
    setLoading(false);

    // Flask가 { full: "..." } 형태로 응답한다고 가정
    const reply = (data.full || "").trim();
    addMessage(reply, "bot");
    history.push({ role: "assistant", content: reply });
  } catch (err) {
    setLoading(false);
    console.error(err);
    addMessage("서버 호출 중 오류가 발생했습니다.", "bot");
  }
}

// 6) 메시지 전송 핸들러
function sendMessage() {
  const text = userInput.value.trim();
  if (!text) return;
  addMessage(text, "user");
  history.push({ role: "user", content: text });
  userInput.value = "";
  callChatAPI();
}

// 7) 클릭·엔터 이벤트 바인딩
sendBtn.addEventListener("click", sendMessage);
userInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    sendMessage();
  }
});

// 8) 음성인식 설정
let recognition;
if ("SpeechRecognition" in window || "webkitSpeechRecognition" in window) {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  recognition = new SR();
  recognition.lang = "ko-KR";
  recognition.interimResults = true;

  recognition.addEventListener("result", (e) => {
    const interim = Array.from(e.results)
      .map((r) => r[0].transcript)
      .join("");
    userInput.value = interim;
  });
  recognition.addEventListener("end", () => {
    if (userInput.value.trim()) sendMessage();
  });
} else {
  micBtn.disabled = true;
}
micBtn.addEventListener("click", () => {
  if (recognition) {
    userInput.value = "";
    recognition.start();
  }
});

// 9) FAQ 토글 및 질문 클릭 (★ 절대 제거하지 않음)
faqToggle.addEventListener("click", () => {
  const icon = faqToggle.querySelector("span");
  faqPanel.classList.toggle("open");
  icon.textContent = faqPanel.classList.contains("open")
    ? "chevron_left"
    : "chevron_right";
});

document.querySelectorAll("#faq-panel li").forEach((item) => {
  item.addEventListener("click", () => {
    const q = item.textContent.trim();
    // FAQ 닫기
    faqPanel.classList.remove("open");
    faqToggle.querySelector("span").textContent = "chevron_right";
    // 자동 전송
    addMessage(q, "user");
    history.push({ role: "user", content: q });
    callChatAPI();
  });
});

// 10) 초기 질문 처리 (URL 파라미터)
const params = new URLSearchParams(window.location.search);
const initial = params.get("q");
if (initial) {
  const decoded = decodeURIComponent(initial);
  addMessage(decoded, "user");
  history.push({ role: "user", content: decoded });
  callChatAPI();
}
// 11) 하단 점3개 메뉴 기능
const menuBtn = document.getElementById("menu-btn");
const menuPanel = document.getElementById("menu-panel");
const menuHome = document.getElementById("menu-home");
const menuHistory = document.getElementById("menu-history");

menuBtn.addEventListener("click", () => {
  menuPanel.classList.toggle("open");
});

menuHome.addEventListener("click", () => {
  window.location.href = "/";
});

menuHistory.addEventListener("click", () => {
  alert("History 기능은 추후 업데이트 예정입니다!");
  // 혹은 별도의 히스토리 페이지 연결 가능
});

// 외부 클릭 시 메뉴 닫힘
document.addEventListener("click", (e) => {
  if (!menuBtn.contains(e.target) && !menuPanel.contains(e.target)) {
    menuPanel.classList.remove("open");
  }
});
