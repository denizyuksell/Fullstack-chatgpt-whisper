import { useState, useRef, useEffect } from 'react';

const Chat = () => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [apiPort, setApiPort] = useState(3000);
  const inputRef = useRef(null);
  const messagesEndRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const chatBodyRef = useRef(null);

  const hasMessages = messages.length > 0;

  useEffect(() => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  }, [messages]);

  useEffect(() => {
    const checkApiConnection = async () => {
      for (let port = 3000; port <= 3005; port++) {
        try {
          const response = await fetch(`http://localhost:${port}/`);
          if (response.ok) {
            setApiPort(port);
            break;
          }
        } catch (err) {
          console.log(`Port ${port} not available, trying next...`);
        }
      }
    };
    checkApiConnection();
    inputRef.current?.focus();
  }, []);

  const handleInputChange = (e) => setInput(e.target.value);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input || typeof input !== 'string' || input.trim() === '') return;
    const userMessage = input.trim();
    setInput('');
    setIsLoading(true);
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);
    try {
      const response = await fetch(`http://localhost:${apiPort}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage }),
      });
      const data = await response.json();
      setMessages((prev) => [...prev, { role: 'assistant', content: data.message }]);
    } catch {
      setMessages((prev) => [...prev, { role: 'assistant', content: 'Error. Try again.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : MediaRecorder.isTypeSupported('audio/mp4')
        ? 'audio/mp4'
        : 'audio/wav';
      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };
      mediaRecorder.onstop = async () => {
        const ext = mimeType.includes('webm') ? '.webm' : mimeType.includes('mp4') ? '.mp4' : '.wav';
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        const formData = new FormData();
        formData.append('audio', audioBlob, `recording${ext}`);
        setInput('Processing audio...');
        try {
          const res = await fetch(`http://localhost:${apiPort}/api/speech-to-text`, {
            method: 'POST',
            body: formData,
          });
          const data = await res.json();
          setInput(data.text || '(No speech detected)');
          inputRef.current?.focus();
        } catch {
          setInput('(Voice recording failed - check console)');
        } finally {
          stream.getTracks().forEach((track) => track.stop());
        }
      };
      mediaRecorder.start(1000);
      setIsRecording(true);
    } catch {
      alert('Could not access microphone.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleVoiceRecord = () => {
    isRecording ? stopRecording() : startRecording();
  };

  return (
    <div className="chat-container">
      <div className="chat-header">
        <h1>Hi there!</h1>
        <h2>What would you like to know?</h2>
        {!messages.length && <p>Use one of the most common prompts below<br />or ask your own question</p>}
      </div>

      <div className="chat-body" ref={chatBodyRef}>
        <div className="chat-messages">
          {messages.map((m, i) => (
            <div key={i} className={`message ${m.role}`}><span>{m.content}</span></div>
          ))}
          {isLoading && <div className="message assistant"><span>Typing...</span></div>}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className={`chat-form-wrapper${messages.length === 0 ? ' initial' : ''}`}>
        <form onSubmit={handleSubmit} className="chat-form">
          <button 
            type="button" 
            onClick={handleVoiceRecord}
            className={isRecording ? 'recording' : ''}
            aria-label="Record voice"
          >
            🎤
          </button>
          <input
            ref={inputRef}
            type="text"
            value={input || ''}
            onChange={handleInputChange}
            placeholder="Ask whatever you want"
            autoComplete="off"
          />
          <button type="submit" aria-label="Send message">
            ➡
          </button>
        </form>
      </div>
    </div>
  );
};

export default Chat;
