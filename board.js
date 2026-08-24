(function () {
  const SUBSCRIBED_KEY = "board-subscribed";
  const POSTS_KEY = "board-posts-local";
  const NICKNAME_KEY = "board-nickname";

  const gate = document.getElementById("board-gate");
  const composer = document.getElementById("board-composer");
  const feed = document.getElementById("board-feed");
  if (!gate || !composer || !feed) return;

  function isSubscribed() {
    try {
      return localStorage.getItem(SUBSCRIBED_KEY) === "1";
    } catch (err) {
      return false;
    }
  }
  function setSubscribed() {
    try {
      localStorage.setItem(SUBSCRIBED_KEY, "1");
    } catch (err) {
      // ignore
    }
  }

  function updateGateState() {
    if (isSubscribed()) {
      gate.hidden = true;
      composer.hidden = false;
    } else {
      gate.hidden = false;
      composer.hidden = true;
    }
  }
  updateGateState();

  const subscribeForm = document.getElementById("board-subscribe-form");
  if (subscribeForm) {
    subscribeForm.addEventListener("submit", () => {
      // script.js handles the actual Mailchimp submission (opens in a new
      // tab). We unlock posting locally right away rather than waiting on
      // the double opt-in confirmation, which we have no way to detect.
      setSubscribed();
      updateGateState();
    });
  }

  const nicknameInput = document.getElementById("board-nickname");
  if (nicknameInput) {
    try {
      nicknameInput.value = localStorage.getItem(NICKNAME_KEY) || "";
    } catch (err) {
      // ignore
    }
    nicknameInput.addEventListener("change", () => {
      try {
        localStorage.setItem(NICKNAME_KEY, nicknameInput.value.trim());
      } catch (err) {
        // ignore
      }
    });
  }

  function loadPosts() {
    try {
      return JSON.parse(localStorage.getItem(POSTS_KEY)) || [];
    } catch (err) {
      return [];
    }
  }
  function savePosts(posts) {
    try {
      localStorage.setItem(POSTS_KEY, JSON.stringify(posts));
    } catch (err) {
      // ignore (e.g. storage full)
    }
  }

  function initials(name) {
    return (name || "A").trim().slice(0, 2).toUpperCase();
  }

  function timeAgo(ts) {
    const diff = Date.now() - ts;
    const min = Math.floor(diff / 60000);
    if (min < 1) return "just now";
    if (min < 60) return min + "m ago";
    const hr = Math.floor(min / 60);
    if (hr < 24) return hr + "h ago";
    const day = Math.floor(hr / 24);
    return day + "d ago";
  }

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  function renderPost(post) {
    const commentsHtml = (post.comments || [])
      .map(
        (c) =>
          `<div class="board-comment"><strong>${escapeHtml(c.nickname)}:</strong> <span>${escapeHtml(c.text)}</span></div>`
      )
      .join("");

    return `
      <div class="board-post">
        <div class="board-post-header">
          <div class="board-avatar">${initials(post.nickname)}</div>
          <div class="board-post-meta">
            <strong>${escapeHtml(post.nickname || "Anonymous")}</strong>
            <time>${timeAgo(post.ts)}</time>
          </div>
        </div>
        ${post.text ? `<p class="board-post-text">${escapeHtml(post.text)}</p>` : ""}
        ${post.image ? `<img class="board-post-image" src="${post.image}" alt="">` : ""}
        <div class="board-post-actions">
          <button type="button" data-toggle-comments="${post.id}">${(post.comments || []).length} comments</button>
          <button type="button" data-report="${post.id}">Report</button>
        </div>
        <div class="board-comments" data-comments="${post.id}" hidden>
          ${commentsHtml}
          <form class="board-comment-form" data-comment-form="${post.id}">
            <input type="text" maxlength="500" placeholder="Write a comment..." required>
            <button type="submit">Reply</button>
          </form>
        </div>
      </div>
    `;
  }

  function renderFeed() {
    const posts = loadPosts();
    if (!posts.length) {
      feed.innerHTML = '<p class="board-empty">No posts yet — be the first to share something.</p>';
      return;
    }
    feed.innerHTML = posts.slice().reverse().map(renderPost).join("");

    posts.forEach((post) => {
      const toggleBtn = feed.querySelector(`[data-toggle-comments="${post.id}"]`);
      const commentsBox = feed.querySelector(`[data-comments="${post.id}"]`);
      if (toggleBtn && commentsBox) {
        toggleBtn.addEventListener("click", () => {
          commentsBox.hidden = !commentsBox.hidden;
        });
      }

      const reportBtn = feed.querySelector(`[data-report="${post.id}"]`);
      if (reportBtn) {
        reportBtn.addEventListener("click", () => {
          reportBtn.textContent = "Reported";
          reportBtn.disabled = true;
        });
      }

      const commentForm = feed.querySelector(`[data-comment-form="${post.id}"]`);
      if (commentForm) {
        commentForm.addEventListener("submit", (event) => {
          event.preventDefault();
          const input = commentForm.querySelector("input");
          const text = input.value.trim();
          if (!text) return;

          const allPosts = loadPosts();
          const target = allPosts.find((p) => p.id === post.id);
          if (target) {
            target.comments = target.comments || [];
            target.comments.push({
              nickname: (localStorage.getItem(NICKNAME_KEY) || "").trim() || "Anonymous",
              text,
              ts: Date.now(),
            });
            savePosts(allPosts);
            renderFeed();
          }
        });
      }
    });
  }

  renderFeed();

  let pendingImage = null;
  const imageInput = document.getElementById("board-image");
  const imageNameLabel = document.getElementById("composer-image-name");
  if (imageInput) {
    imageInput.addEventListener("change", () => {
      const file = imageInput.files[0];
      if (!file) return;
      if (file.size > 2 * 1024 * 1024) {
        alert("Please choose an image under 2MB for now (this local preview mode has a small storage limit - the real version will handle full-size images).");
        imageInput.value = "";
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        pendingImage = reader.result;
        if (imageNameLabel) imageNameLabel.textContent = file.name;
      };
      reader.readAsDataURL(file);
    });
  }

  const postBtn = document.getElementById("board-post-btn");
  if (postBtn) {
    postBtn.addEventListener("click", () => {
      const textEl = document.getElementById("board-text");
      const text = textEl.value.trim();
      if (!text && !pendingImage) return;

      const nickname = (nicknameInput && nicknameInput.value.trim()) || "Anonymous";
      try {
        localStorage.setItem(NICKNAME_KEY, nickname === "Anonymous" ? "" : nickname);
      } catch (err) {
        // ignore
      }

      const posts = loadPosts();
      posts.push({
        id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
        nickname,
        text,
        image: pendingImage,
        ts: Date.now(),
        comments: [],
      });
      savePosts(posts);

      textEl.value = "";
      pendingImage = null;
      if (imageInput) imageInput.value = "";
      if (imageNameLabel) imageNameLabel.textContent = "";

      renderFeed();
    });
  }
})();
