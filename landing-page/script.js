// Mobile Navigation
const menuToggle = document.getElementById("menuToggle");
const navLinks = document.getElementById("navLinks");

if (menuToggle && navLinks) {
  menuToggle.addEventListener("click", () => {
    const isOpen = navLinks.classList.toggle("open");
    menuToggle.setAttribute("aria-expanded", String(isOpen));
  });

  navLinks.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      navLinks.classList.remove("open");
      menuToggle.setAttribute("aria-expanded", "false");
    });
  });
}

// Dynamic Year
const yearElement = document.getElementById("year");
if (yearElement) {
  yearElement.textContent = new Date().getFullYear();
}

// ----------------------------------------------------
// Hero Scenario Switcher
// ----------------------------------------------------
const scenarioData = {
  booking: {
    customer: "Hi! Do you have any open slots for a teeth cleaning consultation this Saturday afternoon?",
    ai: "Hi Rahul! 👋 Yes, Dr. Sharma has two slots open this Saturday (Oct 17):<br><br>• <strong>2:30 PM</strong><br>• <strong>4:15 PM</strong><br><br>Consultation is ₹499. Would you like me to confirm the 2:30 PM slot for you?",
    footer: "✦ Grounded on Verified FAQs · Calendar Synchronized"
  },
  faq: {
    customer: "Hello, what are your root canal package charges and do you accept cashless health insurance?",
    ai: "Hello! Our Single Sitting Root Canal starts at ₹3,499 including X-rays. 🦷<br><br>Yes, we accept major cashless health insurance providers (Star Health, HDFC Ergo, ICICI Lombard). Please bring your policy card for instant pre-authorization!",
    footer: "✦ Exact Rates from Approved Knowledge Base · Zero Hallucination"
  },
  handoff: {
    customer: "I had a procedure yesterday and feeling sharp pain around the treated tooth. What should I do right now?",
    ai: "I understand this is uncomfortable, Rahul! ⚠️ I have immediately alerted our on-duty dental surgeon and human staff.<br><br>Dr. Verma has been paged and will call your WhatsApp number within 5 minutes. For immediate guidance, please rinse gently with lukewarm salt water.",
    footer: "✦ Confidence Score Below Threshold · Instant Human Escalation"
  }
};

const scenarioButtons = document.querySelectorAll(".scenario-btn");
const customerText = document.getElementById("customerText");
const aiText = document.getElementById("aiText");
const scenarioFooter = document.getElementById("scenarioFooter");

scenarioButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    scenarioButtons.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");

    const scenarioKey = btn.getAttribute("data-scenario");
    const data = scenarioData[scenarioKey];

    if (data) {
      if (customerText) customerText.innerHTML = data.customer;
      if (aiText) aiText.innerHTML = data.ai;
      if (scenarioFooter) scenarioFooter.textContent = data.footer;
    }
  });
});

// ----------------------------------------------------
// Interactive WhatsApp Simulator (Demo Section)
// ----------------------------------------------------
const simForm = document.getElementById("simForm");
const simInput = document.getElementById("simInput");
const simMessages = document.getElementById("simMessages");
const chipButtons = document.querySelectorAll(".chip-btn");

const knowledgeBaseAnswers = [
  {
    keywords: ["time", "timing", "open", "hour", "hours", "close"],
    response: "Our clinic is open Monday to Saturday from 9:00 AM to 8:30 PM, and Sunday from 10:00 AM to 2:00 PM. Would you like to schedule a visit?"
  },
  {
    keywords: ["price", "cost", "charge", "rate", "fee", "root canal"],
    response: "Root Canal Treatment ranges from ₹3,499 to ₹5,500 depending on the tooth and crown type. Routine cleaning is ₹499. All treatments include free digital X-rays!"
  },
  {
    keywords: ["book", "appointment", "slot", "tomorrow", "saturday", "sunday"],
    response: "I'd be happy to schedule that! We have slots open tomorrow at 11:30 AM and 5:00 PM. Which time suits you best?"
  },
  {
    keywords: ["insurance", "cashless", "claim", "mediclaim"],
    response: "Yes, we support cashless claims with Star Health, HDFC Ergo, Care Health, and ICICI Lombard. Our desk assists with instant documentation!"
  },
  {
    keywords: ["doctor", "specialist", "dentist", "surgeon"],
    response: "Our clinic is headed by Dr. Sharma (BDS, MDS - 12+ years exp) and Dr. Verma (Orthodontist & Implantologist). Both are available for consultations this week!"
  }
];

function getCurrentTime() {
  const now = new Date();
  return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function appendMessage(text, isUser = false) {
  if (!simMessages) return;

  const bubble = document.createElement("div");
  bubble.className = `bubble ${isUser ? "user-bubble" : "bot-bubble"}`;
  bubble.innerHTML = `${text}<span class="bubble-time">${getCurrentTime()}</span>`;
  
  simMessages.appendChild(bubble);
  simMessages.scrollTop = simMessages.scrollHeight;
}

function handleUserMessage(userQuery) {
  if (!userQuery.trim()) return;

  appendMessage(userQuery, true);

  // Simulate typing delay
  setTimeout(() => {
    const lower = userQuery.toLowerCase();
    let reply = "Thank you for reaching out! A team member has noted your inquiry and will reply shortly. You can also ask about our opening hours, appointment slots, or treatment charges!";

    for (const item of knowledgeBaseAnswers) {
      if (item.keywords.some((kw) => lower.includes(kw))) {
        reply = item.response;
        break;
      }
    }

    appendMessage(reply, false);
  }, 600);
}

if (simForm && simInput) {
  simForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const query = simInput.value;
    handleUserMessage(query);
    simInput.value = "";
  });
}

chipButtons.forEach((chip) => {
  chip.addEventListener("click", () => {
    const query = chip.getAttribute("data-query");
    if (query) {
      handleUserMessage(query);
    }
  });
});
