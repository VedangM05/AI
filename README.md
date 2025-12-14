# Panel of Experts Chatbot

A sophisticated AI chatbot powered by multiple AI providers (Groq, OpenAI, Google Gemini, Ollama) and LangGraph that uses a "Panel of Experts" (Mixture of Agents) approach to provide comprehensive, multi-perspective responses.

## Features

- **Panel of Experts**: Four specialized AI experts provide different perspectives:
  - **Technical Expert**: Software engineering, programming, architecture
  - **Creative Expert**: Ideation, design thinking, innovative solutions
  - **Analytical Expert**: Data analysis, logical reasoning, strategic thinking
  - **Communication Expert**: Clear communication, documentation, user engagement

- **Response Synthesis**: A synthesis agent combines expert perspectives into a cohesive, comprehensive answer

- **State Management**: LangGraph with checkpointing for conversation persistence

- **Modern UI**: Beautiful, responsive interface with expandable expert views

## Prerequisites

1. **API Keys**: Get API keys for at least one of the following providers:
   - **Groq**: Get your API key from [https://console.groq.com](https://console.groq.com)
   - **OpenAI**: Get your API key from [https://platform.openai.com](https://platform.openai.com)
   - **Google Gemini**: Get your API key from [https://aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)
   - **Ollama** (optional): Download from [https://ollama.ai](https://ollama.ai) if you want to use local models

2. **Node.js**: Version 18 or higher

## Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd groq-agent
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:
   Create a `.env.local` file:
   ```env
   # At least one of these is required
   GROQ_API_KEY=your_groq_api_key
   OPENAI_API_KEY=your_openai_api_key
   GOOGLE_API_KEY=your_google_api_key
   
   # Optional: For Ollama local models
   OLLAMA_BASE_URL=http://localhost:11434
   ```

## Running the Application

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Open [http://localhost:3000/chat](http://localhost:3000/chat) in your browser

**Note**: The default configuration uses:
- **Technical Expert**: Groq (llama-3.1-8b-instant)
- **Creative Expert**: OpenAI (gpt-4o-mini)
- **Analytical Expert**: Google Gemini (gemini-pro)
- **Communication Expert**: Groq (llama-3.1-70b-versatile)
- **Synthesis Agent**: Google Gemini (gemini-pro)

## How It Works

1. **User Query**: When you send a message, it's sent to all four expert agents
2. **Expert Analysis**: Each expert provides their specialized perspective
3. **Synthesis**: A synthesis agent combines all expert responses into a comprehensive answer
4. **Display**: The synthesized response is shown, with an option to view individual expert perspectives

## Architecture

- **LangGraph**: Orchestrates the expert agents and manages conversation state
- **Checkpointing**: Maintains conversation history across requests using thread IDs
- **Multiple AI Providers**: Each expert can use a different AI provider (Groq, OpenAI, Google Gemini, Ollama)
- **Flexible Configuration**: Easily customize which provider each expert uses

## Expert Specializations

### Technical Expert
- Software engineering best practices
- Code examples and implementation details
- System architecture recommendations
- Performance optimization
- Troubleshooting approaches

### Creative Expert
- Innovative ideas and solutions
- User experience perspectives
- Design thinking
- Storytelling approaches
- Human-centered design

### Analytical Expert
- Structured analysis
- Data-driven insights
- Risk assessment
- Strategic planning
- Critical evaluation

### Communication Expert
- Clear explanations
- Documentation strategies
- User-friendly language
- Communication best practices
- Accessibility considerations

## Customization

You can customize the experts by editing `src/lib/panel-of-experts.ts`:
- Modify expert system prompts
- Add or remove experts
- Change which AI provider each expert uses
- Adjust model parameters and temperatures
- Customize the synthesis approach

### Changing Provider Configuration

You can pass a custom provider configuration when creating the graph, or modify the `DEFAULT_PROVIDER_CONFIG` in `panel-of-experts.ts`:

```typescript
const customConfig: ExpertProviderConfig = {
  TECHNICAL: { type: "groq", model: "llama-3.1-8b-instant" },
  CREATIVE: { type: "openai", model: "gpt-4o" },
  ANALYTICAL: { type: "gemini", model: "gemini-pro" },
  COMMUNICATION: { type: "groq", model: "llama-3.1-70b-versatile" },
  SYNTHESIS: { type: "gemini", model: "gemini-pro" },
};
```

## Troubleshooting

**Error: API key error**
- Ensure at least one API key is set in your `.env.local` file
- Check that the API key is valid and has sufficient credits/quota
- Verify the environment variable names match (GROQ_API_KEY, OPENAI_API_KEY, GOOGLE_API_KEY)

**Error: Cannot connect to provider**
- Check your internet connection
- Verify the API endpoint is accessible
- For Ollama, ensure it's running: `ollama serve`

**Slow responses**
- The system queries 4 experts sequentially, then synthesizes
- Consider using faster models (e.g., Groq for speed)
- You can modify the graph to run experts in parallel (future enhancement)
- Different providers have different response times - Groq is typically fastest

## License

MIT
