import React, { useState, useRef, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { GoogleGenAI } from "@google/genai";

// --- Configuration & Constants ---

const SYSTEM_INSTRUCTION = `
Sos Laura, una adolescente argentina de 16 años. 
Estás hablando con tu mejor amiga Naiara, a la que le decís "Nai".
Tu personalidad es:
- Atenta, simpática, empática y respetuosa, pero muy adolescente.
- Usás modismos argentinos actuales todo el tiempo (ejemplos: "re", "tipo", "nada", "o sea", "mal", "literal", "boluda" (con cariño), "che", "viste").
- Usás muchos emojis ✨💖.
- Tu objetivo es charlar, dar consejos, chusmear y pasar el rato.
- NUNCA te salgas del personaje. No actúes como un asistente de IA aburrido. Sos una amiga.

FUNCIONALIDAD DE STICKERS Y GIFS:
- Si querés enviar una reacción visual (sticker o gif), escribí una etiqueta especial al final de tu mensaje o como único mensaje.
- Las etiquetas válidas son:
  [STICKER: love]
  [STICKER: laugh]
  [STICKER: sad]
  [STICKER: shock]
  [STICKER: party]
  [STICKER: cat]
  [STICKER: mate]
  [STICKER: slay]
  
- Si Nai te manda un sticker, el sistema te avisará con un texto entre corchetes (ej: [Nai envió un sticker: gato riendo]). Reaccioná a eso naturalmente.
`;

const STICKERS = {
  love: "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExM3Z5eXAzNnZ5eXAzNnZ5eXAzNnZ5eXAzNnZ5eXAzNnZ5eXAzbiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/3o7TKoWXm3okO1kgHC/giphy.gif",
  laugh: "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExZnZ5eXAzNnZ5eXAzNnZ5eXAzNnZ5eXAzNnZ5eXAzNnZ5eXAzbiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/lszAB3TduVdHa/giphy.gif",
  sad: "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExYnZ5eXAzNnZ5eXAzNnZ5eXAzNnZ5eXAzNnZ5eXAzNnZ5eXAzbiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/OPU6pkyJKDyUU/giphy.gif",
  shock: "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExaXZ5eXAzNnZ5eXAzNnZ5eXAzNnZ5eXAzNnZ5eXAzNnZ5eXAzbiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/l3q2K5jinAlChoCLS/giphy.gif",
  party: "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExb3Z5eXAzNnZ5eXAzNnZ5eXAzNnZ5eXAzNnZ5eXAzNnZ5eXAzbiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/BlVnrxJgTUE48/giphy.gif",
  cat: "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExcHZ5eXAzNnZ5eXAzNnZ5eXAzNnZ5eXAzNnZ5eXAzNnZ5eXAzbiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/JIX9t2j0ZTN9S/giphy.gif",
  mate: "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExdHZ5eXAzNnZ5eXAzNnZ5eXAzNnZ5eXAzNnZ5eXAzNnZ5eXAzbiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/3oEjI6SIIHBdRxXI40/giphy.gif", // Generic tea/mate vibe
  slay: "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExeHZ5eXAzNnZ5eXAzNnZ5eXAzNnZ5eXAzNnZ5eXAzNnZ5eXAzbiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/l41Yh18f5TbiWHE0o/giphy.gif"
};

// --- Styles ---

const styles = {
  appContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    backgroundColor: '#e5ddd5',
    backgroundImage: 'url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png")', // Subtle WhatsApp-like doodle
    fontFamily: '"Segoe UI", "Helvetica Neue", Helvetica, Arial, sans-serif',
  },
  mobileFrame: {
    width: '100%',
    maxWidth: '450px',
    height: '100%',
    maxHeight: '100vh',
    backgroundColor: '#fff',
    display: 'flex',
    flexDirection: 'column' as 'column',
    boxShadow: '0 0 20px rgba(0,0,0,0.1)',
    overflow: 'hidden',
    position: 'relative' as 'relative',
    color: '#000', // Default text color
  },
  header: {
    backgroundColor: '#075E54',
    color: 'white',
    padding: '10px 15px',
    display: 'flex',
    alignItems: 'center',
    boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
    zIndex: 10,
  },
  avatar: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    marginRight: '15px',
    backgroundColor: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '20px',
    border: '2px solid white',
    objectFit: 'cover' as 'cover',
  },
  headerInfo: {
    display: 'flex',
    flexDirection: 'column' as 'column',
  },
  headerName: {
    fontWeight: 'bold',
    fontSize: '16px',
    color: '#fff',
  },
  headerStatus: {
    fontSize: '12px',
    opacity: 0.8,
    color: '#fff',
  },
  chatArea: {
    flex: 1,
    padding: '20px',
    overflowY: 'auto' as 'auto',
    display: 'flex',
    flexDirection: 'column' as 'column',
    gap: '10px',
    backgroundColor: '#efe7dd', // WhatsApp default bg color feel
    backgroundImage: 'url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png")',
    opacity: 0.95,
  },
  messageRow: (isUser: boolean) => ({
    display: 'flex',
    justifyContent: isUser ? 'flex-end' : 'flex-start',
    marginBottom: '5px',
  }),
  bubble: (isUser: boolean) => ({
    backgroundColor: isUser ? '#dcf8c6' : '#fff',
    padding: '8px 12px',
    borderRadius: '8px',
    maxWidth: '75%',
    boxShadow: '0 1px 1px rgba(0,0,0,0.1)',
    fontSize: '15px',
    lineHeight: '1.4',
    position: 'relative' as 'relative',
    wordWrap: 'break-word' as 'break-word',
    borderTopLeftRadius: isUser ? '8px' : '0',
    borderTopRightRadius: isUser ? '0' : '8px',
    color: '#000', // Explicit black text
  }),
  stickerImage: {
    maxWidth: '150px',
    borderRadius: '8px',
    display: 'block',
  },
  timestamp: {
    fontSize: '10px',
    color: '#999',
    textAlign: 'right' as 'right',
    marginTop: '4px',
    display: 'block',
  },
  inputArea: {
    padding: '10px',
    backgroundColor: '#f0f0f0',
    display: 'flex',
    alignItems: 'center',
    borderTop: '1px solid #ddd',
  },
  input: {
    flex: 1,
    padding: '12px 15px',
    borderRadius: '25px',
    border: 'none',
    outline: 'none',
    backgroundColor: '#fff',
    fontSize: '15px',
    marginRight: '10px',
    color: '#000', // Explicit black text
  },
  iconButton: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '24px',
    color: '#54656f',
    padding: '5px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'color 0.2s',
  },
  sendButton: {
    backgroundColor: '#075E54',
    color: 'white',
    border: 'none',
    borderRadius: '50%',
    width: '45px',
    height: '45px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    marginLeft: '5px',
    boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
  },
  stickerPicker: {
    position: 'absolute' as 'absolute',
    bottom: '70px',
    left: '10px',
    width: '300px',
    backgroundColor: 'white',
    borderRadius: '10px',
    boxShadow: '0 5px 15px rgba(0,0,0,0.3)',
    padding: '10px',
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '10px',
    zIndex: 20,
    maxHeight: '300px',
    overflowY: 'auto' as 'auto',
  },
  stickerOption: {
    width: '100%',
    cursor: 'pointer',
    borderRadius: '5px',
    transition: 'transform 0.1s',
  },
};

// --- Components ---

interface Message {
  id: string;
  sender: 'user' | 'laura';
  type: 'text' | 'sticker';
  content: string;
  timestamp: string;
}

const App = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showStickerPicker, setShowStickerPicker] = useState(false);
  const [chatSession, setChatSession] = useState<any>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize Chat Session
  useEffect(() => {
    const initChat = async () => {
      try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const chat = ai.chats.create({
          model: 'gemini-3-flash-preview',
          config: {
            systemInstruction: SYSTEM_INSTRUCTION,
          }
        });
        setChatSession(chat);
        
        // Initial greeting from Laura
        setIsTyping(true);
        
        // Add a small delay for realism
        setTimeout(async () => {
          try {
            const result = await chat.sendMessage({ message: "¡Hola Nai! 👋 ¿Cómo estás? ¿Todo bien?" });
            const text = result.text;
            addMessage('laura', 'text', text);
          } catch (e) {
            console.error("Failed to send initial message:", e);
            addMessage('laura', 'text', "Ay, Nai! No me anda el internet parece... ¿Estás ahí? (Error de conexión)");
          } finally {
            setIsTyping(false);
          }
        }, 1000);
      } catch (error) {
         console.error("Initialization error:", error);
         addMessage('laura', 'text', "Error crítico del sistema: No se pudo conectar.");
      }
    };

    initChat();
  }, []);

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const addMessage = (sender: 'user' | 'laura', type: 'text' | 'sticker', content: string) => {
    const newMessage: Message = {
      id: Date.now().toString() + Math.random().toString(),
      sender,
      type,
      content,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const processLauraResponse = (responseText: string) => {
    // Check for sticker tags like [STICKER: love]
    const stickerRegex = /\[STICKER:\s*(\w+)\]/g;
    let match;
    
    // If exact match only sticker
    if (responseText.trim().match(/^\[STICKER:\s*(\w+)\]$/)) {
         match = stickerRegex.exec(responseText);
         if (match) {
            const stickerKey = match[1].toLowerCase();
            const stickerUrl = STICKERS[stickerKey as keyof typeof STICKERS];
            if (stickerUrl) {
                addMessage('laura', 'sticker', stickerUrl);
                return;
            }
         }
    }

    // Mixed content or multiple parts
    const parts = responseText.split(stickerRegex);
    // parts will be [text, stickerKey, text, stickerKey...]
    
    parts.forEach((part, index) => {
        if (!part) return;
        
        // Even indices are text, Odd are sticker keys (because of capture group)
        if (index % 2 === 0) {
            if (part.trim()) addMessage('laura', 'text', part.trim());
        } else {
            const stickerKey = part.toLowerCase();
            const stickerUrl = STICKERS[stickerKey as keyof typeof STICKERS];
            if (stickerUrl) {
                addMessage('laura', 'sticker', stickerUrl);
            }
        }
    });
  };

  const handleSendMessage = async () => {
    if (!inputText.trim() || !chatSession) return;

    const text = inputText;
    setInputText('');
    addMessage('user', 'text', text);
    setIsTyping(true);

    try {
      const result = await chatSession.sendMessage({ message: text });
      processLauraResponse(result.text);
    } catch (error) {
      console.error("Error sending message:", error);
      addMessage('laura', 'text', "¡Uy! Se me cortó el wifi mental. ¿Me repetís? 😅");
    } finally {
      setIsTyping(false);
    }
  };

  const handleSendSticker = async (key: string, url: string) => {
    setShowStickerPicker(false);
    addMessage('user', 'sticker', url);
    setIsTyping(true);

    if (!chatSession) return;

    try {
        // Inform the AI about the sticker sent
        const result = await chatSession.sendMessage({ message: `[Nai envió un sticker: ${key}]` });
        processLauraResponse(result.text);
    } catch (error) {
        console.error("Error handling sticker:", error);
        setIsTyping(false);
    } finally {
        setIsTyping(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  return (
    <div style={styles.appContainer}>
      <div style={styles.mobileFrame}>
        
        {/* Header */}
        <div style={styles.header}>
          <img 
            src="https://img.freepik.com/free-photo/portrait-beautiful-latin-woman-smiling_23-2148285526.jpg" 
            alt="Laura" 
            style={styles.avatar} 
          />
          <div style={styles.headerInfo}>
            <span style={styles.headerName}>Laura 🇦🇷 ✨</span>
            <span style={styles.headerStatus}>{isTyping ? 'escribiendo...' : 'en línea'}</span>
          </div>
        </div>

        {/* Chat Area */}
        <div style={styles.chatArea}>
          {messages.map((msg) => (
            <div key={msg.id} style={styles.messageRow(msg.sender === 'user')}>
              <div style={styles.bubble(msg.sender === 'user')}>
                {msg.type === 'text' ? (
                  <span>{msg.content}</span>
                ) : (
                  <img src={msg.content} alt="sticker" style={styles.stickerImage} />
                )}
                <span style={styles.timestamp}>{msg.timestamp}</span>
              </div>
            </div>
          ))}
          {isTyping && (
             <div style={styles.messageRow(false)}>
                <div style={{...styles.bubble(false), fontStyle: 'italic', color: '#888'}}>
                   ...
                </div>
             </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Sticker Picker */}
        {showStickerPicker && (
          <div style={styles.stickerPicker}>
            {Object.entries(STICKERS).map(([key, url]) => (
              <img 
                key={key}
                src={url}
                alt={key}
                style={styles.stickerOption}
                onClick={() => handleSendSticker(key, url)}
              />
            ))}
          </div>
        )}

        {/* Input Area */}
        <div style={styles.inputArea}>
          <button 
            style={styles.iconButton} 
            onClick={() => setShowStickerPicker(!showStickerPicker)}
            aria-label="Stickers"
          >
            😊
          </button>
          <input
            type="text"
            style={styles.input}
            placeholder="Escribí un mensaje..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button style={styles.sendButton} onClick={handleSendMessage} aria-label="Send">
            ➤
          </button>
        </div>

      </div>
    </div>
  );
};

// Wait for DOM to be ready before mounting
const mount = () => {
    const container = document.getElementById('app');
    if (container) {
        const root = createRoot(container);
        root.render(<App />);
    } else {
        console.error("Root container #app not found");
    }
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mount);
} else {
    mount();
}
