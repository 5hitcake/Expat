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
  let currentUserId = null;

  async function updateGateState() {
    const { data } = await sb.auth.getSession();
    if (data.session) {
      gate.hidden = true;
      composer.hidden = false;
      currentUserId = data.session.user.id;
    } else {
      gate.hidden = false;
      composer.hidden = true;
      currentUserId = null;
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
      await updateGateState();
      loadFeed();
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

  function ownerActionsHtml(kind, id) {
    return `
      <div class="board-owner-actions">
        <button type="button" class="board-edit-btn" data-edit-${kind}="${id}">Edit</button>
        <button type="button" class="board-delete-btn" data-delete-${kind}="${id}">Delete</button>
      </div>
    `;
  }

  function renderComment(c) {
    const isOwner = currentUserId && c.user_id === currentUserId;
    return `
      <div class="board-comment" data-comment-id="${c.id}">
        <div class="board-comment-main">
          <div class="board-comment-body" data-comment-body="${c.id}">
            <strong>${escapeHtml(c.nickname || "Anonymous")}:</strong> <span>${escapeHtml(c.body)}</span>
          </div>
          ${isOwner ? ownerActionsHtml("comment", c.id) : ""}
        </div>
      </div>
    `;
  }

  function imagesHtml(post) {
    const urls = (post.image_urls && post.image_urls.length) ? post.image_urls : (post.image_url ? [post.image_url] : []);
    if (!urls.length) return "";
    if (urls.length === 1) {
      return `<img class="board-post-image" src="${urls[0]}" alt="">`;
    }
    const items = urls.map((u) => `<img src="${u}" alt="">`).join("");
    return `<div class="board-post-gallery board-post-gallery-${Math.min(urls.length, 4)}">${items}</div>`;
  }

  function renderPost(post, postComments) {
    const isOwner = currentUserId && post.user_id === currentUserId;
    const commentsHtml = postComments.map((c) => renderComment(c)).join("");

    return `
      <div class="board-post" data-post-id="${post.id}">
        <div class="board-post-header">
          <div class="board-avatar">${initials(post.nickname)}</div>
          <div class="board-post-meta">
            <strong>${escapeHtml(post.nickname || "Anonymous")}</strong>
            <time>${timeAgo(post.created_at)}</time>
          </div>
          ${isOwner ? ownerActionsHtml("post", post.id) : ""}
        </div>
        <div class="board-post-body" data-post-body="${post.id}">
          ${post.body ? `<p class="board-post-text">${escapeHtml(post.body)}</p>` : ""}
          ${imagesHtml(post)}
        </div>
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

  function enterEditMode(container, currentText, onSave) {
    const original = container.innerHTML;
    container.innerHTML = `
      <textarea class="board-edit-textarea" maxlength="2000">${escapeHtml(currentText || "")}</textarea>
      <div class="board-edit-actions">
        <button type="button" class="board-save-btn">Save</button>
        <button type="button" class="board-cancel-btn">Cancel</button>
      </div>
    `;
    const textarea = container.querySelector(".board-edit-textarea");
    textarea.focus();
    container.querySelector(".board-cancel-btn").addEventListener("click", () => {
      container.innerHTML = original;
    });
    const saveBtn = container.querySelector(".board-save-btn");
    saveBtn.addEventListener("click", async () => {
      saveBtn.disabled = true;
      saveBtn.textContent = "Saving...";
      await onSave(textarea.value.trim());
    });
  }

  function wireUpFeed(posts, commentsByPost) {
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

      const editPostBtn = feed.querySelector(`[data-edit-post="${post.id}"]`);
      if (editPostBtn) {
        editPostBtn.addEventListener("click", () => {
          const bodyEl = feed.querySelector(`[data-post-body="${post.id}"]`);
          enterEditMode(bodyEl, post.body, async (newText) => {
            const { error } = await sb.from("board_posts").update({ body: newText || null }).eq("id", post.id);
            if (error) alert("Could not save changes: " + error.message);
            loadFeed();
          });
        });
      }

      const deletePostBtn = feed.querySelector(`[data-delete-post="${post.id}"]`);
      if (deletePostBtn) {
        deletePostBtn.addEventListener("click", async () => {
          if (!confirm("Delete this post? This can't be undone.")) return;
          deletePostBtn.disabled = true;
          const { error } = await sb.from("board_posts").delete().eq("id", post.id);
          if (error) {
            alert("Could not delete: " + error.message);
            deletePostBtn.disabled = false;
            return;
          }
          loadFeed();
        });
      }

      (commentsByPost[post.id] || []).forEach((c) => {
        const editCommentBtn = feed.querySelector(`[data-edit-comment="${c.id}"]`);
        if (editCommentBtn) {
          editCommentBtn.addEventListener("click", () => {
            const bodyEl = feed.querySelector(`[data-comment-body="${c.id}"]`);
            enterEditMode(bodyEl, c.body, async (newText) => {
              if (!newText) {
                alert("Comment can't be empty.");
                loadFeed();
                return;
              }
              const { error } = await sb.from("board_comments").update({ body: newText }).eq("id", c.id);
              if (error) alert("Could not save changes: " + error.message);
              loadFeed();
            });
          });
        }

        const deleteCommentBtn = feed.querySelector(`[data-delete-comment="${c.id}"]`);
        if (deleteCommentBtn) {
          deleteCommentBtn.addEventListener("click", async () => {
            if (!confirm("Delete this comment?")) return;
            deleteCommentBtn.disabled = true;
            const { error } = await sb.from("board_comments").delete().eq("id", c.id);
            if (error) {
              alert("Could not delete: " + error.message);
              deleteCommentBtn.disabled = false;
              return;
            }
            loadFeed();
          });
        }
      });
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
    wireUpFeed(posts, commentsByPost);
  }

  await updateGateState();
  await loadFeed();

  const MAX_PHOTOS = 6;
  const imageInput = document.getElementById("board-image");
  const imageNameLabel = document.getElementById("composer-image-name");
  if (imageInput) {
    imageInput.addEventListener("change", () => {
      const files = Array.from(imageInput.files || []);
      if (!files.length) {
        if (imageNameLabel) imageNameLabel.textContent = "";
        return;
      }
      if (files.length > MAX_PHOTOS) {
        alert(`Please choose at most ${MAX_PHOTOS} photos.`);
        imageInput.value = "";
        if (imageNameLabel) imageNameLabel.textContent = "";
        return;
      }
      const tooBig = files.find((f) => f.size > 5 * 1024 * 1024);
      if (tooBig) {
        alert(`"${tooBig.name}" is over 5MB. Please choose smaller photos.`);
        imageInput.value = "";
        if (imageNameLabel) imageNameLabel.textContent = "";
        return;
      }
      if (imageNameLabel) {
        imageNameLabel.textContent = files.length === 1 ? files[0].name : `${files.length} photos selected`;
      }
    });
  }

  function compressImage(file, maxDim, quality) {
    return new Promise((resolve) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(url);
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob((blob) => resolve(blob || file), "image/jpeg", quality);
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        resolve(file);
      };
      img.src = url;
    });
  }

  async function uploadOnce(file, blob, contentType) {
    // Direct browser -> Supabase Storage uploads consistently fail on this
    // site (confirmed not a network/device issue - other browser uploads
    // work fine, and uploading straight in the Supabase dashboard works
    // too). Route through an Edge Function instead: the function makes a
    // server-to-server call to Storage, which isn't subject to whatever is
    // blocking the direct browser request.
    const { data: sessionData } = await sb.auth.getSession();
    const token = (sessionData.session && sessionData.session.access_token) || SUPABASE_KEY;
    const url = `${SUPABASE_URL}/functions/v1/super-action`;
    console.log("[board upload] starting", { url, contentType, blobSize: blob.size, blobType: blob.type, hasToken: !!token });
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          apikey: SUPABASE_KEY,
          "Content-Type": contentType,
          "x-filename": file.name || "upload.jpg",
        },
        body: blob,
      });
      console.log("[board upload] got response", res.status, res.type, res.ok);
      const body = await res.json().catch((e) => {
        console.log("[board upload] body was not JSON", e && e.message);
        return {};
      });
      if (res.ok && body.url) return { error: null, url: body.url };
      return { error: { message: body.error || `HTTP ${res.status}` } };
    } catch (err) {
      console.error("[board upload] fetch threw", err.name, err.message, err);
      return { error: { message: err.message || "Network error" } };
    }
  }

  async function uploadWithRetry(file, blob, contentType) {
    for (let attempt = 0; attempt < 2; attempt++) {
      const result = await uploadOnce(file, blob, contentType);
      if (!result.error) return result;
      if (attempt === 0) {
        await new Promise((resolve) => setTimeout(resolve, 1200));
      } else {
        return result;
      }
    }
  }

  const postBtn = document.getElementById("board-post-btn");
  if (postBtn) {
    postBtn.addEventListener("click", async () => {
      const textEl = document.getElementById("board-text");
      const text = textEl.value.trim();
      // Read the files straight from the input at submit time rather than
      // trusting a variable captured earlier - more robust against mobile
      // browsers that can lose JS state between picking photos and
      // tapping Post.
      const files = imageInput ? Array.from(imageInput.files || []) : [];
      if (!text && !files.length) return;

      const nickname = (nicknameInput && nicknameInput.value.trim()) || "Anonymous";
      try {
        localStorage.setItem(NICKNAME_KEY, nickname === "Anonymous" ? "" : nickname);
      } catch (err) {
        // ignore
      }

      postBtn.disabled = true;
      postBtn.textContent = "Posting...";

      const imageUrls = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        postBtn.textContent = files.length > 1 ? `Uploading photo ${i + 1}/${files.length}...` : "Preparing photo...";
        const compressed = await compressImage(file, 1600, 0.82);
        postBtn.textContent = files.length > 1 ? `Uploading photo ${i + 1}/${files.length}...` : "Posting...";
        const { error: uploadError, url } = await uploadWithRetry(file, compressed, "image/jpeg");
        if (uploadError) {
          postBtn.disabled = false;
          postBtn.textContent = "Post";
          alert("Image upload failed: " + uploadError.message + ". Please check your connection and try again.");
          return;
        }
        imageUrls.push(url);
      }

      postBtn.textContent = "Posting...";
      const { error } = await sb
        .from("board_posts")
        .insert({ nickname, body: text || null, image_urls: imageUrls.length ? imageUrls : null });

      postBtn.disabled = false;
      postBtn.textContent = "Post";

      if (!error) {
        textEl.value = "";
        if (imageInput) imageInput.value = "";
        if (imageNameLabel) imageNameLabel.textContent = "";
        loadFeed();
      } else {
        alert("Could not post right now. Please try again.");
      }
    });
  }
})();
