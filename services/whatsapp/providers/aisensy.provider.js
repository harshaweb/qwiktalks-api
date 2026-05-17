import aisensyService from '../../../aisency/aisensy.service.js';
import { Message, Contact } from '../../../models/index.js';

export default class AisensyProvider {
  async sendMessage(userId, params, connection = null) {
    const {
      recipientNumber,
      messageType = 'text',
      messageText,
      templateName,
      languageCode,
      templateComponents,
      mediaUrl,
      replyMessageId,
      contactId,
      fromCampaignSystem,
      file
    } = params;

    let contact = null;
    if (!fromCampaignSystem) {
      contact = await Contact.findOne({
        phone_number: recipientNumber,
        created_by: userId,
        deleted_at: null
      });

      if (!contact) {
        contact = await Contact.create({
          phone_number: recipientNumber,
          name: recipientNumber,
          source: 'whatsapp',
          user_id: userId,
          created_by: userId,
          status: 'lead'
        });
      }
    } else {
      contact = { _id: contactId || null };
    }

    let payload;
    
    // Handle template messages
    if (messageType === 'template' && templateName) {
      payload = {
        to: recipientNumber,
        type: 'template',
        user_id: userId,
        recipient_type: 'individual',
        template: {
          name: templateName,
          language: {
            policy: 'deterministic',
            code: languageCode || 'en'
          }
        }
      };

      if (templateComponents && templateComponents.length > 0) {
        payload.template.components = templateComponents;
      }
    } 
    // Handle image messages
    else if (messageType === 'image') {
      const imageUrl = file?.path || mediaUrl;
      if (!imageUrl) {
        throw new Error('Image URL or file is required for image messages');
      }
      
      payload = {
        to: recipientNumber,
        type: 'image',
        user_id: userId,
        recipient_type: 'individual',
        image: {
          link: imageUrl,
          caption: messageText || ''
        }
      };
    }
    // Handle document messages
    else if (messageType === 'document') {
      const documentUrl = file?.path || mediaUrl;
      if (!documentUrl) {
        throw new Error('Document URL or file is required for document messages');
      }
      
      const filename = file?.originalname || params.filename || 'document.pdf';
      
      payload = {
        to: recipientNumber,
        type: 'document',
        user_id: userId,
        recipient_type: 'individual',
        document: {
          link: documentUrl,
          filename: filename,
          caption: messageText || ''
        }
      };
    }
    // Handle text messages (default)
    else if (messageType === 'text' || (!messageType && !templateName)) {
      payload = {
        to: recipientNumber,
        type: 'text',
        user_id: userId,
        recipient_type: 'individual',
        text: { body: messageText || '' }
      };
    } 
    else {
      throw new Error(`Unsupported message type for AiSensy: ${messageType}`);
    }

    console.log('[AiSensy Provider] Sending message with payload:', JSON.stringify(payload, null, 2));

    try {
      const result = await aisensyService.sendMessage(payload);

      console.log('[AiSensy Provider] Message sent, result:', JSON.stringify(result, null, 2));

      const messageId = result.message_id || result.data?.message_id || result.messages?.[0]?.id || result.data?.messages?.[0]?.id || null;
      const senderNumber = params.whatsappPhoneNumber?.display_phone_number || connection?.display_phone_number || '';

      if (!fromCampaignSystem) {
        await Message.create({
          sender_number: senderNumber,
          user_id: userId,
          recipient_number: recipientNumber,
          contact_id: contact?._id || contactId,
          content: messageText || `${messageType}: ${templateName || 'media'}`,
          message_type: messageType,
          file_url: (messageType === 'image' || messageType === 'document') ? (file?.path || mediaUrl) : null,
          from_me: true,
          direction: 'outbound',
          wa_message_id: messageId,
          wa_timestamp: new Date(),
          metadata: result,
          provider: 'aisensy'
        });
      }

      return {
        id: messageId,
        messageId: messageId,
        waMessageId: messageId,
        recipientNumber,
        messageType,
        timestamp: new Date(),
        apiResponse: result,
        provider: 'aisensy'
      };
    } catch (error) {
      console.error('[AiSensy Provider] Error sending message:', error);
      console.error('[AiSensy Provider] Error details:', error.message, error.status, error.data);
      throw error;
    }
  }

  async getMessages(userId, contactNumber, connection = null, options = {}) {
    const { Message, Contact } = await import('../../../models/index.js');

    const myPhoneNumber = connection?.display_phone_number || '';

    const contact = await Contact.findOne({
      phone_number: contactNumber,
      created_by: userId,
      deleted_at: null
    });

    const baseCondition = {
      $or: [
        { sender_number: contactNumber, recipient_number: myPhoneNumber, deleted_at: null },
        { sender_number: myPhoneNumber, recipient_number: contactNumber, deleted_at: null }
      ]
    };

    const messages = await Message.find(baseCondition)
      .sort({ wa_timestamp: 1 })
      .populate('template_id')
      .lean();

    return messages.map(message => ({
      ...message,
      can_chat: true,
      contact_id: contact ? contact._id.toString() : null
    }));
  }

  async getConnectionStatus(userId, connection = null) {
    return { connected: !!connection };
  }

  async initializeConnection(userId, connectionData = null) {
    return { success: true, connected: true, provider: 'aisensy' };
  }

  async getRecentChats(userId, connection = null) {
    const { Message } = await import('../../../models/index.js');
    const myPhoneNumber = connection?.display_phone_number || '';

    const sentMessages = await Message.distinct('recipient_number', {
      sender_number: myPhoneNumber,
      recipient_number: { $ne: null },
      deleted_at: null
    });

    const receivedMessages = await Message.distinct('sender_number', {
      recipient_number: myPhoneNumber,
      sender_number: { $ne: null },
      deleted_at: null
    });

    const allContactNumbers = [
      ...new Set([...sentMessages.filter(Boolean), ...receivedMessages.filter(Boolean)])
    ].filter(number => number && number !== myPhoneNumber);

    const recentChats = await Promise.all(
      allContactNumbers.map(async (contactNumber) => {
        const lastMessage = await Message.findOne({
          $or: [
            { sender_number: myPhoneNumber, recipient_number: contactNumber, deleted_at: null },
            { sender_number: contactNumber, recipient_number: myPhoneNumber, deleted_at: null }
          ]
        })
          .sort({ wa_timestamp: -1 })
          .lean();

        return {
          contact: { number: contactNumber, name: contactNumber, avatar: null },
          lastMessage: lastMessage ? {
            id: lastMessage._id.toString(),
            content: lastMessage.content,
            messageType: lastMessage.message_type,
            fileUrl: lastMessage.file_url,
            direction: lastMessage.direction,
            fromMe: lastMessage.from_me,
            createdAt: lastMessage.wa_timestamp,
            is_seen: lastMessage.is_seen || false,
            read_status: lastMessage.read_status || 'unread'
          } : null
        };
      })
    );

    return recentChats.sort((a, b) => {
      if (!a.lastMessage && !b.lastMessage) return 0;
      if (!a.lastMessage) return 1;
      if (!b.lastMessage) return -1;
      return new Date(b.lastMessage.createdAt) - new Date(a.lastMessage.createdAt);
    });
  }

  async disconnect(userId, connection = null) {
    return { success: true };
  }
}
