const SUPABASE_URL = "https://lecciiekoeprcihwnquy.supabase.co";
const SUPABASE_KEY = "sb_publishable_Ci5wrxnimzEsOshQfXVaDA_QM4YRZGq";

(async function () {
  const gate = document.getElementById("board-gate");
  const composer = document.getElementById("board-composer");
  const feed = document.getElementById("board-feed");
  if (!gate || !composer || !feed) return;

  if (typeof supabase === "undefined") {
    feed.innerHTML = '<p class="board-empty">Could not load the board right now. Please refresh.</p>';
    return;
  }
  const sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

  const NICKNAME_KEY = "board-nickname";

  async function updateGateState() {
    const { data } = await sb.auth.getSession();
    if (data.session) {
      gate.hidden = true;
      composer.hidden = false;
    } else {
      gate.hidden = false;
      composer.hidden = true;
    }
  }

  const subscribeForm = document.getElementById("board-subscribe-form");
  if (subscribeForm) {
    subscribeForm.addEventListener("submit", async () => {
      // script.js handles the actual Mailchimp submission (opens in a new
      // tab). We create an anonymous Supabase session right away so
      // posting unlocks immediately, without waiting on the email
      // confirmation, which we have no way to detect from here.
      try {
        await sb.auth.signInAnonymously();
      } catch (err) {
        // ignore - gate stays up, they can try the button again
      }
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

  function initials(name) {
    const clean = (name || "A").trim();
    return (clean.slice(0, 2) || "A").toUpperCase();
  }

  function timeAgo(iso) {
    const diff = Date.now() - new Date(iso).getTime();
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
    div.textContent = str || "";
    return div.innerHTML;
  }

  function renderPost(post, postComments) {
    const commentsHtml = postComments
      .map(
        (c) =>
          `<div class="board-comment"><strong>${escapeHtml(c.nickname || "Anonymous")}:</strong> <span>${escapeHtml(c.body)}</span></div>`
      )
      .join("");

    return `
      <div class="board-post">
        <div class="board-post-header">
          <div class="board-avatar">${initials(post.nickname)}</div>
          <div class="board-post-meta">
            <strong>${escapeHtml(post.nickname || "Anonymous")}</strong>
            <time>${timeAgo(post.created_at)}</time>
          </div>
        </div>
        ${post.body ? `<p class="board-post-text">${escapeHtml(post.body)}</p>` : ""}
        ${post.image_url ? `<img class="board-post-image" src="${post.image_url}" alt="">` : ""}
        <div class="board-post-actions">
          <button type="button" data-toggle-comments="${post.id}">${postComments.length} comments</button>
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

  function wireUpFeed(posts) {
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
        reportBtn.addEventListener("click", async () => {
          reportBtn.disabled = true;
          reportBtn.textContent = "Reporting...";
          const { error } = await sb.from("board_reports").insert({ post_id: post.id });
          reportBtn.textContent = error ? "Report failed" : "Reported";
        });
      }

      const commentForm = feed.querySelector(`[data-comment-form="${post.id}"]`);
      if (commentForm) {
        commentForm.addEventListener("submit", async (event) => {
          event.preventDefault();
          const input = commentForm.querySelector("input");
          const text = input.value.trim();
          if (!text) return;
          const nickname = (localStorage.getItem(NICKNAME_KEY) || "").trim() || "Anonymous";
          input.disabled = true;
          const { error } = await sb.from("board_comments").insert({
            post_id: post.id,
            nickname,
            body: text,
          });
          input.disabled = false;
          if (!error) {
            input.value = "";
            loadFeed();
          }
        });
      }
    });
  }

  async function loadFeed() {
    feed.innerHTML = '<p class="board-empty">Loading...</p>';

    const [{ data: posts, error: postsError }, { data: comments }] = await Promise.all([
      sb.from("board_posts").select("*").order("created_at", { ascending: false }),
      sb.from("board_comments").select("*").order("created_at", { ascending: true }),
    ]);

    if (postsError) {
      feed.innerHTML = '<p class="board-empty">Could not load posts right now. Please refresh.</p>';
      return;
    }

    if (!posts || !posts.length) {
      feed.innerHTML = '<p class="board-empty">No posts yet — be the first to share something.</p>';
      return;
    }

    const commentsByPost = {};
    (comments || []).forEach((c) => {
      (commentsByPost[c.post_id] = commentsByPost[c.post_id] || []).push(c);
    });

    feed.innerHTML = posts.map((post) => renderPost(post, commentsByPost[post.id] || [])).join("");
    wireUpFeed(posts);
  }

  await updateGateState();
  await loadFeed();

  let pendingFile = null;
  const imageInput = document.getElementById("board-image");
  const imageNameLabel = document.getElementById("composer-image-name");
  if (imageInput) {
    imageInput.addEventListener("change", () => {
      const file = imageInput.files[0];
      if (!file) return;
      if (file.size > 5 * 1024 * 1024) {
        alert("Please choose an image under 5MB.");
        imageInput.value = "";
        return;
      }
      pendingFile = file;
      if (imageNameLabel) imageNameLabel.textContent = file.name;
    });
  }

  const postBtn = document.getElementById("board-post-btn");
  if (postBtn) {
    postBtn.addEventListener("click", async () => {
      const textEl = document.getElementById("board-text");
      const text = textEl.value.trim();
      if (!text && !pendingFile) return;

      const nickname = (nicknameInput && nicknameInput.value.trim()) || "Anonymous";
      try {
        localStorage.setItem(NICKNAME_KEY, nickname === "Anonymous" ? "" : nickname);
      } catch (err) {
        // ignore
      }

      postBtn.disabled = true;
      postBtn.textContent = "Posting...";

      let imageUrl = null;
      if (pendingFile) {
        const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${pendingFile.name}`;
        const { error: uploadError } = await sb.storage.from("board-images").upload(path, pendingFile);
        if (!uploadError) {
          const { data } = sb.storage.from("board-images").getPublicUrl(path);
          imageUrl = data.publicUrl;
        }
      }

      const { error } = await sb
        .from("board_posts")
        .insert({ nickname, body: text || null, image_url: imageUrl });

      postBtn.disabled = false;
      postBtn.textContent = "Post";

      if (!error) {
        textEl.value = "";
        pendingFile = null;
        if (imageInput) imageInput.value = "";
        if (imageNameLabel) imageNameLabel.textContent = "";
        loadFeed();
      } else {
        alert("Could not post right now. Please try again.");
      }
    });
  }
})();
