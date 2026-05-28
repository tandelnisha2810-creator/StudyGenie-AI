 const Note = require("../models/Note");
const { callOpenRouter } = require("./chatController");

const formatNote = (note) => {
  const noteObject = note.toObject({ versionKey: false });
  const { _id, ...rest } = noteObject;
  return {
    id: _id.toString(),
    ...rest,
  };
};

exports.createNote = async (req, res) => {
  console.log("========================================");
  console.log("📝 POST /api/notes HIT");
  console.log("Request body:", JSON.stringify(req.body, null, 2));
  console.log("========================================");
  
  try {
    const {
      userId,
      title,
      content,
      subject = "General",
      tags = [],
      summary = "",
      color = "yellow",
      image = "",
      isPinned = false,
      isFavorite = false,
      type = "text-note",
      quiz = [],
      audioUri = "",
    } = req.body;


    // Validation
    if (!userId || !title?.trim() || !content?.trim()) {
      console.error("❌ Validation failed - missing required fields");
      return res.status(400).json({
        success: false,
        error: "userId, title, and content are required to create a note.",
      });
    }

    const normalizedTags = Array.isArray(tags)
      ? tags.map((tag) => tag.toString().trim()).filter(Boolean)
      : [];

    const noteData = {
      userId: userId.toString(),
      title: title.trim(),
      content: content.trim(),
      summary: summary.toString().trim(),
      subject: subject.toString().trim() || "General",
      tags: normalizedTags,
      color: (color || "yellow").toString().toLowerCase(),
      image: (image || "").toString().trim(),
      isPinned: Boolean(isPinned),
      isFavorite: Boolean(isFavorite),

      // Voice-note fields
      type: (type || "text-note").toString().trim(),
      quiz,
      audioUri: (audioUri || "").toString().trim(),
    };


    console.log("✅ Creating note with data:", JSON.stringify(noteData, null, 2));

    const note = await Note.create(noteData);

    console.log("✅ Note created successfully");
    console.log("Note ID:", note._id);
    console.log("User ID:", note.userId);
    console.log("Title:", note.title);

    const formattedNote = formatNote(note);
    console.log("Formatted response:", JSON.stringify(formattedNote, null, 2));

    return res.status(201).json({
      success: true,
      note: formattedNote,
      message: "Note created successfully",
    });
  } catch (error) {
    console.error("❌ Create note error:", error);
    console.error("Error stack:", error.stack);
    return res.status(500).json({
      success: false,
      error: "Unable to create note. Please try again.",
      details: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

exports.getNotes = async (req, res) => {
  try {
    const { userId } = req.query;
    
    console.log("📖 GET /api/notes - userId:", userId);

    if (!userId) {
      console.error("❌ Missing userId query parameter");
      return res.status(400).json({
        success: false,
        error: "Missing query parameter userId.",
      });
    }

    // Important: /notes must show ONLY manually created study notes.
    // Backwards compatibility: older notes may not have `type` set at all.
    // Exclude voice notes explicitly.
    const notes = await Note.find({
      userId: userId.toString(),
      $or: [
        { type: "text-note" },
        { type: { $exists: false } },
      ],
      type: { $ne: "voice-note" },
    })
      .sort({ isPinned: -1, updatedAt: -1 })
      .lean();



    const formattedNotes = notes.map((note) => ({
      ...note,
      id: note._id.toString(),
    }));

    console.log(`✅ Retrieved ${formattedNotes.length} notes for user ${userId}`);

    return res.status(200).json({
      success: true,
      notes: formattedNotes,
      count: formattedNotes.length,
    });
  } catch (error) {
    console.error("❌ Fetch notes error:", error);
    return res.status(500).json({
      success: false,
      error: "Unable to load notes. Please try again.",
    });
  }
};

exports.getNoteById = async (req, res) => {
  try {
    const { id } = req.params;
    console.log("📖 GET /api/notes/:id - id:", id);

    const note = await Note.findById(id);

    if (!note) {
      console.error("❌ Note not found:", id);
      return res.status(404).json({ success: false, error: "Note not found." });
    }

    console.log("✅ Retrieved note:", id);
    return res.status(200).json({ success: true, note: formatNote(note) });
  } catch (error) {
    console.error("❌ Get note error:", error);
    return res.status(500).json({
      success: false,
      error: "Could not return note. Please try again.",
    });
  }
};

exports.updateNote = async (req, res) => {
  try {
    const { id } = req.params;
    console.log("✏️ PUT /api/notes/:id - id:", id);
    console.log("Update payload:", JSON.stringify(req.body, null, 2));

    const updates = {};
    const {
      title,
      content,
      subject,
      tags,
      summary,
      color,
      image,
      isPinned,
      isFavorite,
      type,
      quiz,
      audioUri,
    } = req.body;


    if (title !== undefined) updates.title = title.toString().trim();
    if (content !== undefined) updates.content = content.toString().trim();
    if (subject !== undefined) updates.subject = subject.toString().trim();
    if (summary !== undefined) updates.summary = summary.toString().trim();
    if (color !== undefined) updates.color = (color || "yellow").toString().toLowerCase();
    if (image !== undefined) updates.image = (image || "").toString().trim();
    if (isPinned !== undefined) updates.isPinned = Boolean(isPinned);
    if (isFavorite !== undefined) updates.isFavorite = Boolean(isFavorite);

    if (tags !== undefined) {
      updates.tags = Array.isArray(tags)
        ? tags.map((tag) => tag.toString().trim()).filter(Boolean)
        : [];
    }

    if (type !== undefined) updates.type = (type || "text-note").toString().trim();
    if (quiz !== undefined) updates.quiz = quiz;
    if (audioUri !== undefined) updates.audioUri = (audioUri || "").toString().trim();

    updates.updatedAt = Date.now();


    const note = await Note.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    });

    if (!note) {
      console.error("❌ Note not found for update:", id);
      return res.status(404).json({ success: false, error: "Note not found." });
    }

    console.log("✅ Updated note:", id);
    return res.status(200).json({
      success: true,
      note: formatNote(note),
      message: "Note updated successfully",
    });
  } catch (error) {
    console.error("❌ Update note error:", error);
    return res.status(500).json({
      success: false,
      error: "Unable to update note. Please try again.",
    });
  }
};

exports.deleteNote = async (req, res) => {
  try {
    const { id } = req.params;
    console.log("🔥 DELETE API HIT:", req.params.id);


    if (!id) {
      console.error("❌ deleteNote - missing id param");
      return res.status(400).json({ success: false, error: "Missing note id" });
    }

    const note = await Note.findByIdAndDelete(req.params.id);


    console.log("🗑️ deleteNote - findByIdAndDelete result:", {
      deletedFound: !!note,
      deletedId: note?._id?.toString?.(),
    });

    if (!note) {
      console.error("❌ Note not found for deletion:", id);
      return res.status(404).json({ success: false, message: "Note not found." });
    }

    return res.status(200).json({ success: true });

  } catch (error) {

    console.error("❌ Delete note error:", error);
    return res.status(500).json({
      success: false,
      error: "Unable to delete note. Please try again.",
      details: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};


exports.summarizeNote = async (req, res) => {
  try {
    const { id } = req.params;
    console.log("✨ POST /api/notes/:id/summarize - id:", id);

    const note = await Note.findById(id);

    if (!note) {
      console.error("❌ Note not found for summarization:", id);
      return res.status(404).json({ success: false, error: "Note not found." });
    }

    if (!note.content || !note.content.trim()) {
      return res.status(400).json({
        success: false,
        error: "Note content is required to generate a summary.",
      });
    }

    console.log("Generating AI summary for note:", id);
    const prompt = `Summarize the following study note in a concise, student-friendly paragraph that highlights the key concepts and ideas:\n\n${note.content}`;
    const summary = await callOpenRouter(prompt);

    note.summary = summary.trim();
    note.updatedAt = Date.now();
    await note.save();

    console.log("✅ Generated AI summary for note:", id);
    return res.status(200).json({
      success: true,
      note: formatNote(note),
      message: "Summary generated successfully",
    });
  } catch (error) {
    console.error("❌ Summarize note error:", error);
    return res.status(500).json({
      success: false,
      error: "Unable to generate summary. Please try again.",
    });
  }
};
