const { ColorPicker } = window;

const editorModeSelect = document.getElementById("editor-mode");
const noteTitleInput = document.getElementById("note-title");
const noteTitleStatus = document.getElementById("note-title-status");
const shareNoteEmailInput = document.getElementById("share-note-email");
const shareNoteAddButton = document.querySelector(".share-note-add-btn");
const shareNoteAccessList = document.querySelector(".share-note-access-list");
const noteId = document.body.dataset.noteId;
const noteAccess =
  document.body.dataset.noteAccess || window.__NOTE_ACCESS__ || "author";
const isForcedReadOnly = noteAccess === "read_only";
let editor = null;
let lastSavedData = null;
let lastSavedTitle = noteTitleInput?.value ?? "";
let titleSaveDebounce = null;

function setTitleStatus(message, kind = "saved") {
  if (!noteTitleStatus) return;

  noteTitleStatus.textContent = message;
  noteTitleStatus.classList.remove("is-saving", "is-error");

  if (kind === "saving") {
    noteTitleStatus.classList.add("is-saving");
  }

  if (kind === "error") {
    noteTitleStatus.classList.add("is-error");
  }
}

function createAccessItem(email) {
  const item = document.createElement("div");
  item.className = "share-note-access-item";
  item.innerHTML = `
    <div>
      <strong>${email}</strong>
      <span>Can view</span>
    </div>
    <button type="button" class="share-note-remove-btn" data-email="${email}">Remove</button>
  `;

  return item;
}

if (shareNoteAccessList) {
  shareNoteAccessList.addEventListener("click", async (event) => {
    const removeButton = event.target.closest(".share-note-remove-btn");

    if (!removeButton) return;

    const email = removeButton.getAttribute("data-email");
    if (!email) return;

    const result = await updateEmailAccess(email, "remove");
    if (result) {
      window.notify.success("Email removed from access list.");
      removeButton.closest(".share-note-access-item")?.remove();
    } else {
      window.notify.error("Failed to remove email from access list!");
    }
  });
}

function parseNoteContent(rawContent) {
  try {
    return JSON.parse(rawContent);
  } catch {
    return null;
  }
}

try {
  lastSavedData = parseNoteContent(window.__CURRENT_NOTE_CONTENT__);
} catch (err) {
  console.log(err);
}

function getEditorConfig(isReadOnly) {
  return {
    holder: "editorjs",
    placeholder: "Start writing your note...",
    autofocus: !isReadOnly,
    minHeight: 280,
    readOnly: isReadOnly,
    inlineToolbar: true,
    data: lastSavedData ?? undefined,
    onReady: () => {
      console.log(
        isReadOnly
          ? "Editor is ready in view mode!"
          : "Editor is ready to work!",
      );
    },
    onChange: isReadOnly
      ? undefined
      : async () => {
          setTitleStatus("Saving...", "saving");

          try {
            lastSavedData = await editor.save();
            await saveNoteContent(lastSavedData);
          } catch {
            setTitleStatus("Save failed", "error");
          }
        },
    tools: {
      header: {
        class: Header,
        config: {
          placeholder: "Header",
          levels: [1, 2, 3, 4, 5, 6],
          defaultLevel: 1,
        },
        shortcut: "CMD+SHIFT+H",
      },
      delimiter: Delimiter,
      ColorPicker: {
        class: ColorPicker.default,
      },
      List: {
        class: EditorjsList,
        inlineToolbar: true,
        config: {
          defaultStyle: "unordered",
        },
      },
      table: Table,
      code: CodeTool,
      Marker: {
        class: Marker,
        shortcut: "CMD+SHIFT+M",
      },
      underline: Underline,
      inlineCode: {
        class: InlineCode,
        shortcut: "CMD+SHIFT+M",
      },
    },
  };
}

async function initEditor(isReadOnly) {
  if (editor) {
    try {
      lastSavedData = await editor.save();
    } catch {
      lastSavedData = null;
    }

    editor.destroy();
  }

  editor = new EditorJS(getEditorConfig(isReadOnly));
  window.editor = editor;
}

if (editorModeSelect && !isForcedReadOnly) {
  editorModeSelect.addEventListener("change", () => {
    initEditor(editorModeSelect.value === "view");
  });
}

initEditor(isForcedReadOnly || editorModeSelect?.value === "view");

async function saveNoteTitle(newTitle) {
  if (!noteId || isForcedReadOnly) return;

  const normalizedTitle =
    newTitle.trim().length > 0 ? newTitle.trim() : "Unnamed Note";

  if (normalizedTitle === lastSavedTitle) return;

  setTitleStatus("Saving...", "saving");

  try {
    const response = await fetch(
      `/api/updateNoteTitle/${encodeURIComponent(noteId)}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: normalizedTitle,
        }),
      },
    );

    const result = await response.json();

    if (!response.ok) {
      setTitleStatus("Save failed", "error");
      window.notify.error(result?.errorMessage ?? "Unable to save title");
      return;
    }

    lastSavedTitle = result?.title ?? normalizedTitle;
    setTitleStatus("Saved", "saved");
  } catch {
    setTitleStatus("Save failed", "error");
    window.notify.error("Unable to save title");
  }
}

async function saveNoteContent(newContent) {
  if (!noteId || isForcedReadOnly || !newContent) return;

  setTitleStatus("Saving...", "saving");

  try {
    const response = await fetch(
      `/api/updateNoteContent/${encodeURIComponent(noteId)}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: newContent,
        }),
      },
    );

    const result = await response.json();

    if (!response.ok) {
      setTitleStatus("Save failed", "error");
      window.notify.error(result?.errorMessage ?? "Unable to save content");
      return;
    }

    lastSavedData = newContent ?? null;
    setTitleStatus("Saved", "saved");
  } catch {
    setTitleStatus("Save failed", "error");
    window.notify.error("Unable to save content");
  }
}

if (noteTitleInput && !isForcedReadOnly) {
  noteTitleInput.addEventListener("input", () => {
    setTitleStatus("Saving...", "saving");

    if (titleSaveDebounce) {
      window.clearTimeout(titleSaveDebounce);
    }

    titleSaveDebounce = window.setTimeout(() => {
      saveNoteTitle(noteTitleInput.value);
    }, 500);
  });

  noteTitleInput.addEventListener("blur", () => {
    if (titleSaveDebounce) {
      window.clearTimeout(titleSaveDebounce);
    }

    saveNoteTitle(noteTitleInput.value);
  });
}

if (isForcedReadOnly) {
  setTitleStatus("View only", "saved");
} else {
  setTitleStatus("Saved", "saved");
}

if (shareNoteAddButton && shareNoteEmailInput) {
  shareNoteAddButton.addEventListener("click", async () => {
    const email = shareNoteEmailInput.value.trim();
    const emailIsValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    if (!email) {
      window.notify?.error("Please enter an email address.");
      return;
    }

    if (!emailIsValid) {
      window.notify?.error("Please enter a valid email address.");
      return;
    }

    shareNoteEmailInput.value = "";
    const result = await updateEmailAccess(email, "add");
    console.log(result);
    if (result) {
      shareNoteAccessList.appendChild(createAccessItem(email));
      window.notify.success("Email added to access list.");
    } else {
      window.notify.error("Failed to add email to access list!");
    }
  });

  shareNoteEmailInput.addEventListener("keydown", (event) => {
    if (event.key !== "Enter") return;

    event.preventDefault();
    shareNoteAddButton.click();
  });
}

// -------------------------------------

// action is either `add` or `remove`
async function updateEmailAccess(email, action) {
  console.log(email, action);
  if (action !== "add" && action !== "remove") return;

  const response = await fetch(
    `/api/updateNotesCollaborators/${encodeURIComponent(noteId)}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: email,
        action: action,
      }),
    },
  );

  const result = await response.json();

  console.log(result);

  if (response?.ok) return true;
  else return false;
}
