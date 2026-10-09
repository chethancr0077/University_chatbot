const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { dbGet, dbAll, dbRun } = require('../../database/db');
const { optionalAuth, authenticateToken } = require('../middleware/auth');
const { processChatMessage } = require('../ai/aiEngine');

// POST /api/chat/message (Requires SRN Authentication)
router.post('/message', authenticateToken, async (req, res) => {
  try {
    const { message, conversationId, clientConfig } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Message content is required.' });
    }

    const userId = req.user.user_id;
    let activeConvId = conversationId;

    // Check if conversation exists, if not create one
    if (activeConvId) {
      const conv = await dbGet('SELECT conversation_id FROM conversations WHERE conversation_id = ?', [activeConvId]);
      if (!conv) {
        await dbRun('INSERT INTO conversations (conversation_id, user_id, title) VALUES (?, ?, ?)', [
          activeConvId,
          userId,
          message.slice(0, 35) + '...'
        ]);
      }
    } else {
      activeConvId = 'conv-' + crypto.randomBytes(6).toString('hex');
      await dbRun('INSERT INTO conversations (conversation_id, user_id, title) VALUES (?, ?, ?)', [
        activeConvId,
        userId,
        message.slice(0, 35) + (message.length > 35 ? '...' : '')
      ]);
    }

    // Save User Message
    await dbRun(
      `INSERT INTO messages (conversation_id, role, content, mode) VALUES (?, 'user', ?, 'USER')`,
      [activeConvId, message]
    );

    // Process via Master AI Engine
    const aiResponse = await processChatMessage({
      message,
      conversationId: activeConvId,
      user: req.user,
      student: req.student,
      faculty: req.faculty,
      clientConfig: clientConfig || {}
    });

    // Save Assistant Message
    const vizType = aiResponse.visualization ? aiResponse.visualization.type : null;
    const vizData = aiResponse.visualization ? JSON.stringify(aiResponse.visualization) : null;
    const suggestedStr = aiResponse.suggested ? JSON.stringify(aiResponse.suggested) : null;

    const insertResult = await dbRun(
      `INSERT INTO messages (conversation_id, role, content, mode, visualization_type, visualization_data, suggested_followups) 
       VALUES (?, 'assistant', ?, ?, ?, ?, ?)`,
      [activeConvId, aiResponse.content, aiResponse.mode, vizType, vizData, suggestedStr]
    );

    // Update conversation timestamp
    await dbRun(
      `UPDATE conversations SET updated_at = CURRENT_TIMESTAMP WHERE conversation_id = ?`,
      [activeConvId]
    );

    res.json({
      messageId: insertResult.lastID,
      conversationId: activeConvId,
      role: 'assistant',
      content: aiResponse.content,
      mode: aiResponse.mode,
      visualization: aiResponse.visualization,
      suggested: aiResponse.suggested,
      createdAt: new Date().toISOString()
    });

  } catch (err) {
    console.error('Chat error:', err);
    res.status(500).json({ error: 'Failed to process chat message.' });
  }
});

// GET /api/chat/conversations
router.get('/conversations', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.user_id;
    const convs = await dbAll(
      `SELECT c.*, 
        (SELECT content FROM messages WHERE conversation_id = c.conversation_id ORDER BY message_id DESC LIMIT 1) AS last_message,
        (SELECT created_at FROM messages WHERE conversation_id = c.conversation_id ORDER BY message_id DESC LIMIT 1) AS last_message_time
       FROM conversations c
       WHERE c.user_id = ?
       ORDER BY c.updated_at DESC`,
      [userId]
    );
    res.json(convs);
  } catch (err) {
    console.error('Fetch conversations error:', err);
    res.status(500).json({ error: 'Failed to fetch conversations.' });
  }
});

// GET /api/chat/conversations/:id
router.get('/conversations/:id', authenticateToken, async (req, res) => {
  try {
    const convId = req.params.id;
    const conv = await dbGet('SELECT * FROM conversations WHERE conversation_id = ?', [convId]);
    if (!conv) {
      return res.status(404).json({ error: 'Conversation not found.' });
    }

    const messages = await dbAll(
      `SELECT * FROM messages WHERE conversation_id = ? ORDER BY message_id ASC`,
      [convId]
    );

    const formattedMessages = messages.map(m => ({
      messageId: m.message_id,
      conversationId: m.conversation_id,
      role: m.role,
      content: m.content,
      mode: m.mode,
      visualization: m.visualization_data ? JSON.parse(m.visualization_data) : null,
      suggested: [],
      createdAt: m.created_at
    }));

    res.json({
      conversation: conv,
      messages: formattedMessages
    });
  } catch (err) {
    console.error('Fetch conversation messages error:', err);
    res.status(500).json({ error: 'Failed to fetch conversation history.' });
  }
});

// POST /api/chat/conversations (New Chat)
router.post('/conversations', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.user_id;
    const newId = 'conv-' + crypto.randomBytes(6).toString('hex');
    const title = req.body.title || 'New Conversation';

    await dbRun(
      'INSERT INTO conversations (conversation_id, user_id, title) VALUES (?, ?, ?)',
      [newId, userId, title]
    );

    // Initial greeting message (direct and clean without suggestions)
    const defaultGreeting = `Hello! I'm **UniMate AI** 👋

I can answer your questions and assist with university records, attendance, faculty, and academic performance. What would you like to know?`;

    await dbRun(
      `INSERT INTO messages (conversation_id, role, content, mode, suggested_followups) VALUES (?, 'assistant', ?, 'UNIVERSITY', NULL)`,
      [newId, defaultGreeting]
    );

    res.json({ conversationId: newId, title });
  } catch (err) {
    console.error('Create conversation error:', err);
    res.status(500).json({ error: 'Failed to create conversation.' });
  }
});

// DELETE /api/chat/conversations/:id
router.delete('/conversations/:id', authenticateToken, async (req, res) => {
  try {
    const convId = req.params.id;
    await dbRun('DELETE FROM messages WHERE conversation_id = ?', [convId]);
    await dbRun('DELETE FROM conversations WHERE conversation_id = ?', [convId]);
    res.json({ success: true, message: 'Conversation deleted.' });
  } catch (err) {
    console.error('Delete conversation error:', err);
    res.status(500).json({ error: 'Failed to delete conversation.' });
  }
});

// DELETE /api/chat/conversations (Clear all chats)
router.delete('/conversations', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.user_id;
    await dbRun(`DELETE FROM messages WHERE conversation_id IN (SELECT conversation_id FROM conversations WHERE user_id = ?)`, [userId]);
    await dbRun('DELETE FROM conversations WHERE user_id = ?', [userId]);
    res.json({ success: true, message: 'All conversations cleared.' });
  } catch (err) {
    console.error('Clear conversations error:', err);
    res.status(500).json({ error: 'Failed to clear conversations.' });
  }
});

module.exports = router;
