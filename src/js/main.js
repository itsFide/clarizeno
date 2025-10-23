document.addEventListener("DOMContentLoaded", () => {
  new Swiper(".stories-swiper", {
    // Optional parameters
    direction: "horizontal",
    loop: true,
    slidesPerView: 2,
    spaceBetween: 20,
    slidesPerGroup: 2,
    pagination: {
      el: ".stories-swiper-pagination",
    },

    // Navigation arrows
    navigation: {
      nextEl: ".stories-swiper-button-next",
      prevEl: ".stories-swiper-button-prev",
    },
  });

  /* ---------- CONFIG ---------- */
  const config = {
    "comment-1": { likes: 121, daysAgo: 2, time: "3:15 PM" },
    "comment-1-1": { likes: 276, daysAgo: 2, time: "6:34 PM" },
    "comment-1-2": { likes: 87, daysAgo: 1, time: "11:07 AM" },
    "comment-1-3": { likes: 381, daysAgo: 1, time: "4:33 PM" },
    "comment-2": { likes: 211, daysAgo: 2, time: "8:44 PM" },
    "comment-2-1": { likes: 33, daysAgo: 1, time: "9:25 AM" },
    "comment-2-2": { likes: 298, daysAgo: 1, time: "12:53 PM" },
    "comment-3": { likes: 113, daysAgo: 2, time: "9:02 AM" },
    "comment-4": { likes: 198, daysAgo: 2, time: "3:37 PM" },
    "comment-5": { likes: 94, daysAgo: 2, time: "5:22 PM" },
    "comment-6": { likes: 154, daysAgo: 1, time: "10:29 AM" },
    "comment-7": { likes: 203, daysAgo: 1, time: "11:19 AM" },
    "comment-8": { likes: 176, daysAgo: 1, time: "1:52 PM" },
  };

  /* ---------- UTILITIES ---------- */
  function getFormattedDate(daysAgo, time) {
    const now = new Date();
    now.setDate(now.getDate() - daysAgo);
    const options = { year: "numeric", month: "long", day: "numeric" };
    const dateString = now.toLocaleDateString("en-US", options);
    return `${dateString}, ${time}`;
  }

  function formatNow() {
    const now = new Date();
    return now.toLocaleString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  }

  function genUID(prefix = "comment") {
    if (window.crypto && crypto.randomUUID)
      return `${prefix}-${crypto.randomUUID()}`;
    return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000000)}`;
  }

  /* ---------- SAFE APPEND ---------- */
  function safeAppendReply(parentId, replyData) {
    const existing = document.getElementById(replyData.id);
    if (existing) return; // avoid duplicate render
    addReply(
      parentId,
      replyData.name,
      replyData.text,
      replyData.image,
      replyData.date,
      replyData.id
    );
  }

  /* ---------- INITIALIZE COMMENTS ---------- */
  Object.entries(config).forEach(([id, data]) => {
    const el = document.getElementById(id);
    if (!el) return;

    const dateEl = el.querySelector(".comments-item__date");
    const likeEl = el.querySelector(".comments-item__like p");
    if (dateEl) dateEl.textContent = getFormattedDate(data.daysAgo, data.time);

    let storedLikes = localStorage.getItem(`likes_${id}`);
    let count = storedLikes ? parseInt(storedLikes) : data.likes;
    if (likeEl) likeEl.textContent = count;

    const likeBtn = el.querySelector(".comments-item__like");
    const liked = localStorage.getItem(`liked_${id}`) === "true";
    if (liked) likeBtn.classList.add("liked");

    likeBtn.addEventListener("click", () => {
      if (localStorage.getItem(`liked_${id}`) === "true") return;
      count++;
      likeEl.textContent = count;
      localStorage.setItem(`likes_${id}`, count);
      localStorage.setItem(`liked_${id}`, true);
      likeBtn.classList.add("liked");
    });

    const replyBtn = el.querySelector(".comments-item__reply");
    if (replyBtn)
      replyBtn.addEventListener("click", () => openReplyForm(id, el));
  });

  /* ---------- REPLY FORM ---------- */
  function openReplyForm(parentId, parentEl) {
    if (parentEl.querySelector(".reply-form")) return;

    const form = document.createElement("form");
    form.className = "comments-form reply-form";
    form.innerHTML = `
          <h3>Reply to Comment</h3>
          <div class="comments-form-item">
              <p>Name*</p>
              <input type="text" class="reply-name">
          </div>
          <div class="comments-form-item">
              <p>Email*</p>
              <input type="text" class="reply-email">
          </div>
          <div class="comments-form-item comment-area">
              <p>Comment*</p>
              <textarea class="reply-text"></textarea>
              <div class="import-btn">
                  <img src="img/import-icon.svg" width="16" height="16" alt="comment">
              </div>
              <input type="file" class="reply-file" accept="image/*" style="display:none;">
          </div>
          <button type="button" class="comments-form-btn">share my Comment</button>
          <div class="reply-preview"></div>
        `;
    parentEl.appendChild(form);

    const importBtn = form.querySelector(".import-btn");
    const fileInput = form.querySelector(".reply-file");
    const preview = form.querySelector(".reply-preview");
    let uploadedImage = null;

    importBtn.addEventListener("click", () => fileInput.click());
    fileInput.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (ev) => {
          uploadedImage = ev.target.result;
          preview.innerHTML = `<img src="${uploadedImage}" style="max-width:150px;border-radius:8px;">`;
        };
        reader.readAsDataURL(file);
      }
    });

    form.querySelector(".comments-form-btn").addEventListener("click", () => {
      const name = form.querySelector(".reply-name").value.trim();
      const text = form.querySelector(".reply-text").value.trim();
      if (!name || !text) {
        alert("Please fill in Name and Comment.");
        return;
      }
      addReply(parentId, name, text, uploadedImage);
      form.remove();
    });
  }

  /* ---------- ADD REPLY ---------- */
  function addReply(
    parentId,
    name,
    text,
    image,
    dateStr = null,
    forcedId = null
  ) {
    const wrapper =
      document.querySelector(`#${parentId} .comments-item-reply-wrap`) ||
      (() => {
        const div = document.createElement("div");
        div.className = "comments-item-reply-wrap";
        document.getElementById(parentId).appendChild(div);
        return div;
      })();

    const replyId = forcedId || genUID(`${parentId}-reply`);
    const finalDate = dateStr || formatNow();

    if (document.getElementById(replyId)) return; // duplicate safety

    const replyEl = document.createElement("div");
    replyEl.id = replyId;
    replyEl.className = "comments-item-reply-item";
    replyEl.innerHTML = `
          <div class="comments-item-info">
            <div class="comments-item__content">
              <div class="comments-item-head">
                <div class="comments-item__name">${name}</div>
                <div class="comments-item__date">${finalDate}</div>
              </div>
              <p class="comments-item__descr">${text}</p>
              <div class="comments-item__actions">
                <div class="comments-item__reply">Reply</div>
                <div class="comments-item__like"><span>Like</span><img src="img/like-icon.svg" width="16" height="16"><p>0</p></div>
              </div>
              ${
                image
                  ? `<div class="comments-img"><img src="${image}" style="max-width:200px;border-radius:8px;"></div>`
                  : ""
              }
            </div>
          </div>
        `;
    wrapper.appendChild(replyEl);

    const storedReplies = JSON.parse(
      localStorage.getItem(`replies_${parentId}`) || "[]"
    );
    if (!storedReplies.find((r) => r.id === replyId)) {
      storedReplies.push({ id: replyId, name, text, image, date: finalDate });
      localStorage.setItem(
        `replies_${parentId}`,
        JSON.stringify(storedReplies)
      );
    }

    bindLike(replyId);
    replyEl
      .querySelector(".comments-item__reply")
      .addEventListener("click", () => openReplyForm(replyId, replyEl));
  }

  /* ---------- LIKE SYSTEM ---------- */
  function bindLike(id) {
    const el = document.getElementById(id);
    if (!el) return;
    const likeEl = el.querySelector(".comments-item__like p");
    const likeBtn = el.querySelector(".comments-item__like");
    let count = parseInt(
      localStorage.getItem(`likes_${id}`) || likeEl.textContent || 0
    );
    likeEl.textContent = count;
    const liked = localStorage.getItem(`liked_${id}`) === "true";
    if (liked) likeBtn.classList.add("liked");
    likeBtn.addEventListener("click", () => {
      if (localStorage.getItem(`liked_${id}`) === "true") return;
      count++;
      likeEl.textContent = count;
      localStorage.setItem(`likes_${id}`, count);
      localStorage.setItem(`liked_${id}`, true);
      likeBtn.classList.add("liked");
    });
  }

  /* ---------- RESTORE REPLIES ---------- */
  Object.keys(localStorage).forEach((k) => {
    if (k.startsWith("replies_")) {
      const parentId = k.replace("replies_", "");
      const replies = JSON.parse(localStorage.getItem(k));
      replies.forEach((r) => safeAppendReply(parentId, r));
    }
  });

  /* ---------- RESTORE USER COMMENTS ---------- */
  const savedComments = JSON.parse(
    localStorage.getItem("userComments") || "[]"
  );
  savedComments.forEach((c) =>
    renderMainComment(c.id, c.name, c.text, c.image, c.date)
  );

  /* ---------- MAIN COMMENTS FORM ---------- */
  const mainForm = document.querySelector(".comments-form");
  const mainImport = mainForm.querySelector(".import-btn");
  const previewArea = document.createElement("div");
  previewArea.className = "main-preview";
  mainForm.appendChild(previewArea);
  let uploadedMainImage = null;

  let mainFile = mainForm.querySelector('input[type="file"]');
  if (!mainFile) {
    mainFile = document.createElement("input");
    mainFile.type = "file";
    mainFile.accept = "image/*";
    mainFile.style.display = "none";
    mainForm.appendChild(mainFile);
  }

  mainImport.addEventListener("click", () => mainFile.click());
  mainFile.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        uploadedMainImage = ev.target.result;
        previewArea.innerHTML = `<img src="${uploadedMainImage}" style="max-width:150px;border-radius:8px;">`;
      };
      reader.readAsDataURL(file);
    }
  });

  mainForm
    .querySelector(".comments-form-btn")
    .addEventListener("click", (e) => {
      e.preventDefault();
      const inputs = mainForm.querySelectorAll('input[name="name"]');
      const name = inputs[0].value.trim();
      const email = inputs[1].value.trim();
      const text = mainForm
        .querySelector('textarea[name="comment"]')
        .value.trim();
      if (!name || !email || !text) {
        alert("Please fill all fields");
        return;
      }

      const newId = genUID("comment");
      const dateStr = formatNow();

      renderMainComment(newId, name, text, uploadedMainImage, dateStr);

      const userComments = JSON.parse(
        localStorage.getItem("userComments") || "[]"
      );
      if (!userComments.find((c) => c.id === newId)) {
        userComments.push({
          id: newId,
          name,
          text,
          image: uploadedMainImage,
          date: dateStr,
        });
        localStorage.setItem("userComments", JSON.stringify(userComments));
      }

      mainForm.reset();
      previewArea.innerHTML = "";
      uploadedMainImage = null;
    });

  /* ---------- RENDER MAIN COMMENT ---------- */
  function renderMainComment(id, name, text, image, dateStr) {
    if (document.getElementById(id)) return;
    const newEl = document.createElement("div");
    newEl.className = "comments-item";
    newEl.id = id;
    newEl.innerHTML = `
          <div class="comments-item-info">
            <div class="comments-item__content">
              <div class="comments-item-head">
                <div class="comments-item__name">${name}</div>
                <div class="comments-item__date">${dateStr}</div>
              </div>
              <p class="comments-item__descr">${text}</p>
              <div class="comments-item__actions">
                <div class="comments-item__reply">Reply</div>
                <div class="comments-item__like"><span>Like</span><img src="img/like-icon.svg" width="16" height="16"><p>0</p></div>
              </div>
              ${
                image
                  ? `<div class="comments-img"><img src="${image}" style="max-width:200px;border-radius:8px;"></div>`
                  : ""
              }
            </div>
          </div>
        `;
    document.querySelector(".comments-items").appendChild(newEl);
    bindLike(id);
    newEl
      .querySelector(".comments-item__reply")
      .addEventListener("click", () => openReplyForm(id, newEl));
  }
  const navItems = document.querySelectorAll(".page-nav__content-item");
  const sections = document.querySelectorAll(
    ".content > section, .content > div[id]"
  );
  const scrollLine = document.querySelector(".page-nav-scroll-line");
  let activeIndex = 0;

  // плавный переход при клике
  navItems.forEach((item, i) => {
    item.addEventListener("click", () => {
      const target = sections[i];
      if (target) {
        window.scrollTo({
          top:
            target.offsetTop - window.innerHeight / 2 + target.offsetHeight / 2,
          behavior: "smooth",
        });
      }
    });
  });

  // отслеживаем активный блок
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const index = [...sections].indexOf(entry.target);
          if (index !== -1) setActive(index);
        }
      });
    },
    {
      threshold: 0.5,
    }
  );

  sections.forEach((sec) => observer.observe(sec));

  function setActive(index) {
    navItems[activeIndex]?.classList.remove("active");
    activeIndex = index;
    navItems[index]?.classList.add("active");

    const activeEl = navItems[index];
    const elHeight = activeEl.offsetHeight;
    const lineHeight = scrollLine.offsetHeight;

    // вычисляем позицию центра
    const top = activeEl.offsetTop + elHeight / 2 - lineHeight / 2;
    scrollLine.style.transform = `translateY(${top}px)`;
  }

  const modal = document.querySelector("#modal");
  const modalContent = modal.querySelector(".modal__content");
  const closeBtn = modal.querySelector(".close-modal img");
  const footerLinks = document.querySelectorAll(".footer-link");

  // Контент модалок
  const modalTexts = {
    privacy: `
            <h1 class="c8" id="h.6ijygqxpamzp"><span class="c3 c10">Privacy Policy</span></h1><p class="c0"><span class="c3">Last Updated:</span><span class="c2">&nbsp;October 12, 2025</span></p><p class="c0"><span class="c2">This Privacy Policy describes how Clarizeno ("we," "us," or "our") collects, uses, and discloses your information when you use our website clarizeno.com.ph (the "Site") and the services offered on the Site.</span></p><h3 class="c1" id="h.ad2gxqpgpyuh"><span class="c7 c3">1. Information We Collect</span></h3><p class="c0"><span class="c2">We collect personal information that you voluntarily provide to us when you express an interest in obtaining information about us or our products and services. The personal information that we collect depends on the context of your interactions with us and the Site, the choices you make, and the products and features you use.</span></p><p class="c0"><span class="c2">The personal information we collect may include the following:</span></p><ul class="c4 lst-kix_j8y5354rtwzw-0 start"><li class="c0 c5 li-bullet-0"><span class="c3">Personal Information You Disclose to Us.</span><span class="c2">&nbsp;We collect personal information that you voluntarily provide to us, such as:</span></li></ul><ul class="c4 lst-kix_j8y5354rtwzw-1 start"><li class="c0 c6 li-bullet-0"><span class="c2">Name</span></li><li class="c0 c6 li-bullet-0"><span class="c2">Email address</span></li><li class="c0 c6 li-bullet-0"><span class="c2">Phone number</span></li></ul><h3 class="c1" id="h.8f7exr2f8cwe"><span class="c7 c3">2. How We Use Your Information</span></h3><p class="c0"><span class="c2">We use the information we collect or receive:</span></p><ul class="c4 lst-kix_72zexz2ok2re-0 start"><li class="c0 c5 li-bullet-0"><span class="c3">To send you marketing and promotional communications.</span><span class="c2">&nbsp;We and/or our third-party marketing partners may use the personal information you send to us for our marketing purposes, if this is in accordance with your marketing preferences. You can opt-out of our marketing emails at any time.</span></li><li class="c0 c5 li-bullet-0"><span class="c3">To respond to your inquiries and provide you with customer support.</span><span class="c2">&nbsp;We may use your information to respond to your inquiries and solve any potential issues you might have with the use of our Services.</span></li><li class="c0 c5 li-bullet-0"><span class="c3">For other business purposes.</span><span class="c2">&nbsp;We may use your information for other business purposes, such as data analysis, identifying usage trends, determining the effectiveness of our promotional campaigns, and to evaluate and improve our Site, products, marketing, and your experience.</span></li></ul><h3 class="c1" id="h.x3t2m3vlt7n1"><span class="c3 c7">3. Will Your Information Be Shared with Anyone?</span></h3><p class="c0"><span class="c2">We only share and disclose your information in the following situations:</span></p><ul class="c4 lst-kix_v0f9i3gtazhl-0 start"><li class="c0 c5 li-bullet-0"><span class="c3">With your consent.</span><span class="c2">&nbsp;We may disclose your personal information for any other purpose with your consent.</span></li><li class="c0 c5 li-bullet-0"><span class="c3">To our trusted third-party service providers.</span><span class="c2">&nbsp;We may share your data with third-party vendors, service providers, contractors, or agents who perform services for us or on our behalf and require access to such information to do that work.</span></li><li class="c0 c5 li-bullet-0"><span class="c3">For legal reasons.</span><span class="c2">&nbsp;We may disclose your information where we are legally required to do so in order to comply with applicable law, governmental requests, a judicial proceeding, court order, or legal process.</span></li></ul><h3 class="c1" id="h.vraqwteki3pq"><span class="c7 c3">4. How We Protect Your Information</span></h3><p class="c0"><span class="c2">We have implemented appropriate technical and organizational security measures designed to protect the security of any personal information we process. However, despite our safeguards and efforts to secure your information, no electronic transmission over the Internet or information storage technology can be guaranteed to be 100% secure, so we cannot promise or guarantee that hackers, cybercriminals, or other unauthorized third parties will not be able to defeat our security and improperly collect, access, steal, or modify your information.</span></p><h3 class="c1" id="h.2sw6i265vxd"><span class="c7 c3">5. Your Privacy Rights</span></h3><p class="c0"><span class="c2">In accordance with the Republic Act No. 10173, also known as the Data Privacy Act of 2012 of the Philippines, you have the following rights:</span></p><ul class="c4 lst-kix_gi2oxy9tc9c7-0 start"><li class="c0 c5 li-bullet-0"><span class="c3">The right to be informed.</span><span class="c2">&nbsp;You have the right to be informed whether your personal data shall be, are being, or have been processed.</span></li><li class="c0 c5 li-bullet-0"><span class="c3">The right to object.</span><span class="c2">&nbsp;You have the right to object to the processing of your personal data.</span></li><li class="c0 c5 li-bullet-0"><span class="c3">The right to access.</span><span class="c2">&nbsp;You have the right to reasonable access to, upon demand, the contents of your personal data that were processed.</span></li><li class="c0 c5 li-bullet-0"><span class="c3">The right to rectification.</span><span class="c2">&nbsp;You have the right to dispute the inaccuracy or error in the personal data and have the personal information controller correct it immediately and accordingly.</span></li><li class="c0 c5 li-bullet-0"><span class="c3">The right to erasure or blocking.</span><span class="c2">&nbsp;You have the right to suspend, withdraw or order the blocking, removal, or destruction of your personal data from the personal information controller's filing system.</span></li><li class="c0 c5 li-bullet-0"><span class="c3">The right to data portability.</span><span class="c2">&nbsp;Where your personal information is processed by electronic means and in a structured and commonly used format, you have the right to obtain from the personal information controller a copy of your personal data.</span></li></ul><p class="c0"><span class="c2">To exercise these rights, please contact us at support@clarizeno.com.ph</span></p><h3 class="c1" id="h.lq54c6h8iieu"><span class="c7 c3">6. Changes to This Privacy Policy</span></h3><p class="c0"><span class="c2">We may update this privacy policy from time to time. The updated version will be indicated by an updated "Last Updated" date and the updated version will be effective as soon as it is accessible. We encourage you to review this privacy policy frequently to be informed of how we are protecting your information.</span></p><h3 class="c1" id="h.akcjuablhecw"><span class="c7 c3">7. Contact Us</span></h3><p class="c0"><span class="c2">If you have questions or comments about this policy, you may email us at support@clarizeno.com.ph</span></p>
        `,

    terms: `
        <h1 class="c4" id="h.7wji0zvzejmu"><span class="c8 c9">Terms &amp; Conditions</span></h1><p class="c1"><span class="c8">Last Updated:</span><span class="c3">&nbsp;October 12, 2025</span></p><h3 class="c6" id="h.don3gnam622p"><span class="c2">1. Agreement to Terms</span></h3><p class="c1"><span>These Terms and Conditions constitute a legally binding agreement made between you, whether personally or on behalf of an entity (“you”) and Clarizeno ("we," "us," or "our"), concerning your access to and use of the </span><span class="c10"><a class="c13" href="https://www.google.com/url?q=https://www.google.com/search?q%3Dhttps://clarizeno.com.ph&amp;sa=D&amp;source=editors&amp;ust=1761250274334676&amp;usg=AOvVaw20_Ke2nGadGDQIk_1k6nXl">https://clarizeno.com.ph</a></span><span class="c3">&nbsp;website as well as any other media form, media channel, mobile website or mobile application related, linked, or otherwise connected thereto (collectively, the “Site”).</span></p><p class="c1"><span class="c3">You agree that by accessing the Site, you have read, understood, and agreed to be bound by all of these Terms and Conditions. If you do not agree with all of these Terms and Conditions, then you are expressly prohibited from using the Site and you must discontinue use immediately.</span></p><h3 class="c6" id="h.5ghyup98nd3h"><span class="c2">2. Intellectual Property Rights</span></h3><p class="c1"><span class="c3">Unless otherwise indicated, the Site is our proprietary property and all source code, databases, functionality, software, website designs, audio, video, text, photographs, and graphics on the Site (collectively, the “Content”) and the trademarks, service marks, and logos contained therein (the “Marks”) are owned or controlled by us or licensed to us, and are protected by copyright and trademark laws and various other intellectual property rights and unfair competition laws of the Philippines, foreign jurisdictions, and international conventions.</span></p><p class="c1"><span class="c3">The Content and the Marks are provided on the Site “AS IS” for your information and personal use only. Except as expressly provided in these Terms and Conditions, no part of the Site and no Content or Marks may be copied, reproduced, aggregated, republished, uploaded, posted, publicly displayed, encoded, translated, transmitted, distributed, sold, licensed, or otherwise exploited for any commercial purpose whatsoever, without our express prior written permission.</span></p><h3 class="c6" id="h.pfxm1sa0rrk2"><span class="c2">3. User Representations</span></h3><p class="c0"><span class="c3">By using the Site, you represent and warrant that:</span></p><p class="c0"><span class="c3">(1) all registration information you submit will be true, accurate, current, and complete;</span></p><p class="c0"><span class="c3">(2) you will maintain the accuracy of such information and promptly update such registration information as necessary;</span></p><p class="c0"><span class="c3">(3) you have the legal capacity and you agree to comply with these Terms and Conditions;</span></p><p class="c0"><span class="c3">(4) you will not use the Site for any illegal or unauthorized purpose;</span></p><p class="c0"><span class="c3">(5) your use of the Site will not violate any applicable law or regulation.</span></p><h3 class="c6" id="h.6f3gknqjpp1d"><span class="c2">4. Prohibited Activities</span></h3><p class="c1"><span>You may not access or use the Site for any purpose other than that for which we make the Site available. The Site may not be used in connection with any commercial endeavors except those that are specifically endorsed or approved by us.</span></p><p class="c1"><span>As a user of the Site, you agree not to:</span></p><ul class="c12 lst-kix_5ppv0sym5noe-0 start"><li class="c1 c5 li-bullet-0"><span class="c3">Systematically retrieve data or other content from the Site to create or compile, directly or indirectly, a collection, compilation, database, or directory without written permission from us.</span></li><li class="c1 c5 li-bullet-0"><span class="c3">Make any unauthorized use of the Site, including collecting usernames and/or email addresses of users by electronic or other means for the purpose of sending unsolicited email, or creating user accounts by automated means or under false pretenses.</span></li><li class="c1 c5 li-bullet-0"><span>Use the Site to advertise or offer to sell goods and services.</span></li><li class="c1 c5 li-bullet-0"><span>Engage in any automated use of the system, such as using scripts to send comments or messages, or using any data mining, robots, or similar data gathering and extraction tools.</span></li><li class="c1 c5 li-bullet-0"><span class="c3">Interfere with, disrupt, or create an undue burden on the Site or the networks or services connected to the Site.</span></li></ul><h3 class="c6" id="h.vqa6wuhsoj4w"><span class="c2">5. Submissions</span></h3><p class="c1"><span class="c3">You acknowledge and agree that any questions, comments, suggestions, ideas, feedback, or other information regarding the Site ("Submissions") provided by you to us are non-confidential and shall become our sole property. We shall own exclusive rights, including all intellectual property rights, and shall be entitled to the unrestricted use and dissemination of these Submissions for any lawful purpose, commercial or otherwise, without acknowledgment or compensation to you.</span></p><h3 class="c6" id="h.f49op6tdg7tg"><span class="c2">6. Site Management</span></h3><p class="c0"><span class="c3">We reserve the right, but not the obligation, to:</span></p><p class="c0"><span class="c3">(1) monitor the Site for violations of these Terms and Conditions;</span></p><p class="c0"><span class="c3">(2) take appropriate legal action against anyone who, in our sole discretion, violates the law or these Terms and Conditions;</span></p><p class="c0"><span class="c3">(3) in our sole discretion and without limitation, refuse, restrict access to, limit the availability of, or disable (to the extent technologically feasible) any of your contributions or any portion thereof;</span></p><p class="c0"><span class="c3">(4) otherwise manage the Site in a manner designed to protect o9ur rights and property and to facilitate the proper functioning of the Site.</span></p><h3 class="c6" id="h.v4y27s8mt3g2"><span class="c2">7. Governing Law</span></h3><p class="c1"><span class="c3">These Terms shall be governed by and defined following the laws of the Philippines. Clarizeno and yourself irrevocably consent that the courts of the Philippines shall have exclusive jurisdiction to resolve any dispute which may arise in connection with these terms.</span></p><h3 class="c6" id="h.9w6ktmgg4afe"><span class="c2">8. Disclaimer</span></h3><p class="c1"><span class="c3">The Site is provided on an as-is and as-available basis. You agree that your use of the Site and our services will be at your sole risk. To the fullest extent permitted by law, we disclaim all warranties, express or implied, in connection with the site and your use thereof, including, without limitation, the implied warranties of merchantability, fitness for a particular purpose, and non-infringement. We make no warranties or representations about the accuracy or completeness of the Site’s content or the content of any websites linked to the Site and we will assume no liability or responsibility for any (1) errors, mistakes, or inaccuracies of content and materials, (2) personal injury or property damage, of any nature whatsoever, resulting from your access to and use of the site, (3) any unauthorized access to or use of our secure servers and/or any and all personal information and/or financial information stored therein.</span></p><h3 class="c6" id="h.3wbexw17a3uz"><span class="c2">9. Limitation of Liability</span></h3><p class="c1"><span class="c3">In no event will we or our directors, employees, or agents be liable to you or any third party for any direct, indirect, consequential, exemplary, incidental, special, or punitive damages, including lost profit, lost revenue, loss of data, or other damages arising from your use of the site, even if we have been advised of the possibility of such damages.</span></p><h3 class="c6" id="h.jnb7kaqnaoke"><span class="c2">10. Indemnification</span></h3><p class="c1"><span class="c3">You agree to defend, indemnify, and hold us harmless, including our subsidiaries, affiliates, and all of our respective officers, agents, partners, and employees, from and against any loss, damage, liability, claim, or demand, including reasonable attorneys’ fees and expenses, made by any third party due to or arising out of: (1) your use of the Site; (2) your breach of these Terms and Conditions; (3) any breach of your representations and warranties set forth in these Terms and Conditions.</span></p><h3 class="c6" id="h.birm9nixrq7j"><span class="c2">11. User Data</span></h3><p class="c1"><span>We will maintain certain data that you transmit to the Site for the purpose of managing the Site, as well as data relating to your use of the Site. Although we perform regular routine backups of data, you are solely responsible for all data that you transmit or that relates to any activity you have undertaken using the Site. You agree that we shall have no liability to you for any loss or corruption of any such data, and you hereby waive any right of action against us arising from any such loss or corruption of such data. Please review our </span><span class="c8">Privacy Policy</span><span class="c3">&nbsp;for more information.</span></p><h3 class="c6" id="h.y9qanlzclup7"><span class="c2">12. Miscellaneous</span></h3><p class="c1"><span class="c3">These Terms and Conditions and any policies or operating rules posted by us on the Site constitute the entire agreement and understanding between you and us. Our failure to exercise or enforce any right or provision of these Terms and Conditions shall not operate as a waiver of such right or provision. These Terms and Conditions operate to the fullest extent permissible by law.</span></p><h3 class="c6" id="h.5fidggxuomr4"><span class="c2">13. Contact Us</span></h3><p class="c1"><span class="c3">In order to resolve a complaint regarding the Site or to receive further information regarding the use of the Site, please contact us at:</span></p><p class="c0"><span class="c3">Clarizeno</span></p><p class="c0"><span class="c3">Email: support@clarizeno.com.ph</span></p>
        `,

    contact: `
          <h2 class="c7" id="h.39t5jlhta8t0"><span class="c6 c10">Contact Us</span></h2><p class="c0"><span class="c2">We're here to help and answer any question you might have. We look forward to hearing from you! Please feel free to get in touch with us using any of the methods below.</span></p><h3 class="c5" id="h.59ef24y9yvr2"><span class="c4">General Inquiries &amp; Customer Support</span></h3><p class="c0"><span class="c2">For all questions, support requests, or feedback, please send us an email. Our team is dedicated to providing you with a timely response.</span></p><p class="c0"><span>📧 </span><span class="c6">Email:</span><span>&nbsp;</span><span class="c6 c8">support@clarizeno.com.ph</span></p><h3 class="c5" id="h.zay9vq7jidyw"><span class="c4">Business Hours</span></h3><p class="c0"><span class="c2">Our support team is available to assist you during the following hours:</span></p><ul class="c3 lst-kix_cakzn052j3mv-0 start"><li class="c0 c1 li-bullet-0"><span class="c6">Monday - Friday:</span><span class="c2">&nbsp;9:00 AM - 5:00 PM (PHT)</span></li><li class="c0 c1 li-bullet-0"><span class="c2">We aim to respond to all inquiries within 24 business hours.</span></li></ul><h3 class="c5" id="h.eb8o4l7wtrdd"><span class="c4">Connect With Us on Social Media</span></h3><p class="c0"><span class="c2">Stay up-to-date with our latest news and announcements by following us on our social channels. You can also send us a direct message!</span></p><ul class="c3 lst-kix_i1bu6kxr9pkg-0 start"><li class="c0 c1 li-bullet-0"><span class="c6">Facebook:</span><span class="c2">&nbsp;[Link to your Clarizeno Facebook Page]</span></li><li class="c0 c1 li-bullet-0"><span class="c6">Instagram:</span><span class="c2">&nbsp;[Link to your Clarizeno Instagram Page]</span></li></ul>
        `,
  };

  // Открытие модалки
  footerLinks.forEach((link) => {
    link.addEventListener("click", () => {
      const type = link.getAttribute("data-modal");
      const content = modalTexts[type];
      if (content) {
        modalContent.innerHTML = content;
        modal.classList.add("active");
        document.body.style.overflow = "hidden"; // убрать скролл
      }
    });
  });

  // Закрытие по кнопке
  closeBtn.addEventListener("click", closeModal);

  // Закрытие по клику вне окна
  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeModal();
  });

  // Функция закрытия
  function closeModal() {
    modal.classList.remove("active");
    modalContent.innerHTML = "";
    document.body.style.overflow = ""; // вернуть скролл
  }
});
