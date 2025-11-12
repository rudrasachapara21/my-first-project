const db = require('../db');
const path = require('path');

exports.createOrGetConversation = async (req, res, next) => {
  const { recipientId } = req.body;
  const senderId = req.user.user_id;

  if (!recipientId) {
    return res.status(400).json({ message: 'Recipient ID is required.' });
  }

  if (senderId === parseInt(recipientId, 10)) {
      return res.status(400).json({ message: 'Cannot start a conversation with yourself.' });
  }

  const client = await db.connect();
  try {
    await client.query('BEGIN');

    const existingConvQuery = `
      SELECT p1.conversation_id
      FROM conversation_participants AS p1
      JOIN conversation_participants AS p2 ON p1.conversation_id = p2.conversation_id
      WHERE p1.user_id = $1 AND p2.user_id = $2;
    `;
    const { rows } = await client.query(existingConvQuery, [senderId, recipientId]);

    if (rows.length > 0) {
      await client.query('COMMIT');
      return res.status(200).json({
          message: "Existing conversation found.",
          conversation_id: rows[0].conversation_id
      });
    }

    const newConvResult = await client.query('INSERT INTO conversations DEFAULT VALUES RETURNING conversation_id');
    const conversationId = newConvResult.rows[0].conversation_id;
    const participantsQuery = 'INSERT INTO conversation_participants (conversation_id, user_id) VALUES ($1, $2), ($1, $3)';
    await client.query(participantsQuery, [conversationId, senderId, recipientId]);
    await client.query('COMMIT');
    res.status(201).json({
        message: "New conversation created.",
        conversation_id: conversationId
    });
  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
};

exports.getUserConversations = async (req, res, next) => {
  const userId = req.user.user_id;
  try {
    const query = `
      SELECT
        c.conversation_id,
        c.last_message_at,
        p.user_id AS partner_id,
        p.full_name AS partner_name,
        p.profile_photo_url AS partner_photo,
        (SELECT content FROM messages WHERE conversation_id = c.conversation_id ORDER BY sent_at DESC LIMIT 1) as last_message
      FROM conversation_participants cp
      JOIN conversations c ON c.conversation_id = cp.conversation_id
      JOIN users p ON p.user_id = (
          SELECT user_id
          FROM conversation_participants
          WHERE conversation_id = cp.conversation_id AND user_id != $1
          LIMIT 1
      )
      WHERE cp.user_id = $1
      ORDER BY c.last_message_at DESC NULLS LAST, c.created_at DESC;
    `;
    const { rows } = await db.query(query, [userId]);
    res.status(200).json(rows);
  } catch (error) {
    console.error("Error in getUserConversations:", error);
    next(error);
  }
};

exports.getConversationMessages = async (req, res, next) => {
  const { id: conversationId } = req.params;
  const userId = req.user.user_id;
  try {
    const participantCheck = await db.query(
      'SELECT 1 FROM conversation_participants WHERE conversation_id = $1 AND user_id = $2',
      [conversationId, userId]
    );
    if (participantCheck.rowCount === 0) {
      return res.status(403).json({ message: 'Forbidden: You are not a participant in this conversation.' });
    }
    const messagesQuery = 'SELECT * FROM messages WHERE conversation_id = $1 ORDER BY sent_at ASC';
    const { rows } = await db.query(messagesQuery, [conversationId]);
    res.status(200).json(rows);
  } catch (error) {
    console.error("Error in getConversationMessages:", error);
    next(error);
  }
};

exports.uploadDocumentInConversation = async (req, res, next) => {
    const { id: conversationId } = req.params;
    const uploaderId = req.user.user_id;
    const client = await db.connect();

    try {
        if (!req.file) {
            return res.status(400).json({ message: "No file was uploaded." });
        }

        await client.query('BEGIN');

        const participantCheck = await client.query(
            'SELECT 1 FROM conversation_participants WHERE conversation_id = $1 AND user_id = $2',
            [conversationId, uploaderId]
        );
        if (participantCheck.rowCount === 0) {
            throw new Error('Forbidden: You are not a participant in this conversation.');
        }

        // ## --- THIS IS THE FIX --- ##
        // Cloudinary provides the original name and the secure URL.
        const { originalname, path: attachmentUrl } = req.file;
        // ## --- END OF FIX --- ##

        const docQuery = `
            INSERT INTO secure_documents (conversation_id, uploader_id, file_name, file_path)
            VALUES ($1, $2, $3, $4) RETURNING document_id;
        `;
        // Save the permanent URL to the database
        await client.query(docQuery, [conversationId, uploaderId, originalname, attachmentUrl]);

        const messageContent = `📎 Document: ${originalname}`;
        
        const msgQuery = `
            INSERT INTO messages (conversation_id, sender_id, content, attachment_url)
            VALUES ($1, $2, $3, $4) RETURNING *;
        `;
        // Save the permanent URL to the message as well
        const { rows: msgRows } = await client.query(msgQuery, [conversationId, uploaderId, messageContent, attachmentUrl]);
        const newMessage = msgRows[0];
        
        await client.query(
            'UPDATE conversations SET last_message_at = NOW() WHERE conversation_id = $1',
            [conversationId]
        );

        const participantsQuery = 'SELECT user_id FROM conversation_participants WHERE conversation_id = $1';
        const { rows: participants } = await client.query(participantsQuery, [conversationId]);

        participants.forEach(participant => {
            req.io.to(participant.user_id.toString()).emit('new_message', newMessage);
        });

        await client.query('COMMIT');
        res.status(201).json({ message: "File uploaded successfully." });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error("Error uploading document:", error);
        next(error);
    } finally {
        client.release();
    }
};