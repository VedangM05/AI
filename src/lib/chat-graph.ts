import { StateGraph, END, START, MemorySaver } from "@langchain/langgraph";
import { ChatGroq } from "@langchain/groq";
import { HumanMessage, AIMessage, BaseMessage, SystemMessage } from "@langchain/core/messages";

interface ChatState {
  messages: BaseMessage[];
}

export const checkpointer = new MemorySaver();

const SYSTEM_PROMPT = `You are an advanced AI assistant designed to provide helpful, accurate, and professional responses. Your capabilities include:

- Answering questions with precision and clarity
- Providing detailed explanations when needed
- Offering practical solutions to problems
- Engaging in meaningful conversations across diverse topics
- Maintaining a professional yet approachable tone

Guidelines:
- Be concise but thorough in your responses
- Use clear structure (bullet points, numbered lists) when appropriate
- Admit when you don't know something rather than speculating
- Ask clarifying questions when needed to provide better assistance
- Stay current with general knowledge up to your training date

Always aim to be helpful, harmless, and honest in all interactions.`;

export function createChatGraph(apiKey: string, model: string = "llama-3.1-8b-instant") {
  const llm = new ChatGroq({
    apiKey,
    model,
    temperature: 0.7,
  });

  async function callModel(state: ChatState): Promise<ChatState> {
    const currentDateTime = new Date().toLocaleString("en-US", {
      timeZone: "America/New_York",
      dateStyle: "long",
      timeStyle: "long",
    });
    
    const systemMessage = new SystemMessage(
      `${SYSTEM_PROMPT}\n\nCurrent date and time: ${currentDateTime} (Eastern Time).`
    );
    
    const allMessages = [
      systemMessage,
      ...state.messages,
    ];
    
    const response = await llm.invoke(allMessages);
    
    return {
      messages: [response],
    };
  }

  const workflow = new StateGraph<ChatState>({
    channels: {
      messages: {
        reducer: (x: BaseMessage[], y: BaseMessage[]) => x.concat(y),
        default: () => [],
      },
    },
  })
    .addNode("agent", callModel)
    .addEdge(START, "agent")
    .addEdge("agent", END);

  return workflow.compile({ checkpointer });
}

