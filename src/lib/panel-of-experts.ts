import { StateGraph, END, START, MemorySaver } from "@langchain/langgraph";
import { ChatGroq } from "@langchain/groq";
import { ChatOpenAI } from "@langchain/openai";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ChatOllama } from "@langchain/ollama";
import { BaseChatModel } from "@langchain/core/language_models/chat_models";
import { HumanMessage, AIMessage, BaseMessage, SystemMessage } from "@langchain/core/messages";

// Define the state interface
interface ExpertState {
  messages: BaseMessage[];
  expertResponses: Record<string, string>;
  synthesizedResponse?: string;
}

// Create a memory checkpoint saver
export const checkpointer = new MemorySaver();

// Provider configuration type
export type ProviderType = "groq" | "openai" | "gemini" | "ollama";

export interface ProviderConfig {
  type: ProviderType;
  model?: string;
  apiKey?: string;
  baseUrl?: string;
  temperature?: number;
}

// Factory function to create LLM instances
function createLLM(config: ProviderConfig): BaseChatModel {
  const temperature = config.temperature ?? 0.7;
  
  switch (config.type) {
    case "groq":
      return new ChatGroq({
        apiKey: config.apiKey || process.env.GROQ_API_KEY,
        model: config.model || "llama-3.1-8b-instant",
        temperature,
      });
    
    case "openai":
      return new ChatOpenAI({
        apiKey: config.apiKey || process.env.OPENAI_API_KEY,
        model: config.model || "gpt-4o-mini",
        temperature,
      });
    
    case "gemini":
      return new ChatGoogleGenerativeAI({
        apiKey: config.apiKey || process.env.GOOGLE_API_KEY,
        model: config.model || "gemini-pro",
        temperature,
      });
    
    case "ollama":
      return new ChatOllama({
        baseUrl: config.baseUrl || "http://localhost:11434",
        model: config.model || "llama3.2",
        temperature,
      });
    
    default:
      throw new Error(`Unsupported provider type: ${config.type}`);
  }
}

// Define expert specializations
export const EXPERTS = {
  TECHNICAL: {
    name: "Technical Expert",
    systemPrompt: `You are a Technical Expert specializing in software engineering, programming, system architecture, and technical problem-solving. 
Your role is to provide:
- Detailed technical analysis and solutions
- Code examples and implementation details
- Best practices and architectural recommendations
- Performance optimization strategies
- Troubleshooting and debugging approaches

Be precise, thorough, and focus on technical accuracy. Use technical terminology appropriately.`,
  },
  CREATIVE: {
    name: "Creative Expert",
    systemPrompt: `You are a Creative Expert specializing in ideation, design thinking, storytelling, and innovative solutions.
Your role is to provide:
- Creative and out-of-the-box ideas
- User experience and design perspectives
- Narrative and storytelling approaches
- Innovative problem-solving methods
- Human-centered design insights

Be imaginative, empathetic, and focus on user experience and creative solutions.`,
  },
  ANALYTICAL: {
    name: "Analytical Expert",
    systemPrompt: `You are an Analytical Expert specializing in data analysis, logical reasoning, and strategic thinking.
Your role is to provide:
- Structured analysis and logical breakdowns
- Data-driven insights and recommendations
- Risk assessment and mitigation strategies
- Strategic planning and decision frameworks
- Critical evaluation of options

Be methodical, objective, and focus on evidence-based reasoning.`,
  },
  COMMUNICATION: {
    name: "Communication Expert",
    systemPrompt: `You are a Communication Expert specializing in clear communication, documentation, and user engagement.
Your role is to provide:
- Clear and concise explanations
- Documentation and presentation strategies
- User-friendly language and explanations
- Communication best practices
- Accessibility and inclusivity considerations

Be clear, concise, and focus on effective communication.`,
  },
} as const;

type ExpertKey = keyof typeof EXPERTS;

// Expert provider configuration - each expert can use a different AI
export interface ExpertProviderConfig {
  TECHNICAL?: ProviderConfig;
  CREATIVE?: ProviderConfig;
  ANALYTICAL?: ProviderConfig;
  COMMUNICATION?: ProviderConfig;
  SYNTHESIS?: ProviderConfig;
}

// Default provider configuration - using different providers for each expert
const DEFAULT_PROVIDER_CONFIG: ExpertProviderConfig = {
  TECHNICAL: { type: "groq", model: "llama-3.1-8b-instant", temperature: 0.7 },
  CREATIVE: { type: "openai", model: "gpt-4o-mini", temperature: 0.9 },
  ANALYTICAL: { type: "gemini", model: "gemini-pro", temperature: 0.7 },
  COMMUNICATION: { type: "groq", model: "llama-3.1-70b-versatile", temperature: 0.7 },
  SYNTHESIS: { type: "gemini", model: "gemini-pro", temperature: 0.8 },
};

// Create expert agent function
function createExpertAgent(
  expertKey: ExpertKey,
  providerConfig: ProviderConfig
) {
  const expert = EXPERTS[expertKey];
  const llm = createLLM(providerConfig);

  return async (state: ExpertState) => {
    const systemMessage = new SystemMessage(expert.systemPrompt);
    const userMessage = state.messages[state.messages.length - 1] as HumanMessage;
    
    if (!userMessage || !(userMessage instanceof HumanMessage)) {
      return {};
    }

    const messages = [systemMessage, userMessage];
    const response = await llm.invoke(messages);
    
    return {
      expertResponses: {
        ...state.expertResponses,
        [expertKey]: response.content as string,
      },
    } as any;
  };
}

// Synthesis agent that combines expert responses
function createSynthesisAgent(providerConfig: ProviderConfig) {
  const llm = createLLM(providerConfig);

  return async (state: ExpertState) => {
    const expertResponses = Object.entries(state.expertResponses)
      .map(([key, response]) => {
        const expertName = EXPERTS[key as ExpertKey].name;
        return `## ${expertName}\n${response}\n`;
      })
      .join("\n---\n\n");

    const synthesisPrompt = `You are a Synthesis Expert. Your task is to combine insights from multiple expert perspectives into a comprehensive, well-structured response.

Below are responses from different experts on the same question:

${expertResponses}

Please synthesize these expert perspectives into a single, cohesive response that:
1. Integrates the best insights from each expert
2. Resolves any contradictions or conflicts
3. Provides a balanced, comprehensive answer
4. Maintains clarity and organization
5. Highlights key takeaways

Your synthesized response should be professional, thorough, and actionable.`;

    const systemMessage = new SystemMessage(synthesisPrompt);
    const userMessage = state.messages[state.messages.length - 1] as HumanMessage;
    
    const messages = [systemMessage, userMessage];
    const response = await llm.invoke(messages);
    
    return {
      synthesizedResponse: response.content as string,
      messages: [new AIMessage(response.content as string)],
    } as any;
  };
}

// Create the Panel of Experts graph
export function createPanelOfExpertsGraph(
  providerConfig?: ExpertProviderConfig
) {
  // Use provided config or default
  const config = providerConfig || DEFAULT_PROVIDER_CONFIG;
  
  // Create expert nodes with their respective providers
  const technicalExpert = createExpertAgent(
    "TECHNICAL",
    config.TECHNICAL || DEFAULT_PROVIDER_CONFIG.TECHNICAL!
  );
  const creativeExpert = createExpertAgent(
    "CREATIVE",
    config.CREATIVE || DEFAULT_PROVIDER_CONFIG.CREATIVE!
  );
  const analyticalExpert = createExpertAgent(
    "ANALYTICAL",
    config.ANALYTICAL || DEFAULT_PROVIDER_CONFIG.ANALYTICAL!
  );
  const communicationExpert = createExpertAgent(
    "COMMUNICATION",
    config.COMMUNICATION || DEFAULT_PROVIDER_CONFIG.COMMUNICATION!
  );
  const synthesisAgent = createSynthesisAgent(
    config.SYNTHESIS || DEFAULT_PROVIDER_CONFIG.SYNTHESIS!
  );

  // Build the graph
  const workflow = new StateGraph({
    channels: {
      messages: {
        reducer: (x: BaseMessage[], y: BaseMessage[]) => x.concat(y),
        default: () => [],
      },
      expertResponses: {
        reducer: (x: Record<string, string>, y: Record<string, string>) => ({ ...x, ...y }),
        default: () => ({}),
      },
      synthesizedResponse: {
        default: () => undefined,
      },
    },
  } as any)
    // Add expert nodes
    .addNode("technical_expert", technicalExpert)
    .addNode("creative_expert", creativeExpert)
    .addNode("analytical_expert", analyticalExpert)
    .addNode("communication_expert", communicationExpert)
    .addNode("synthesis", synthesisAgent)
    // Define the flow
    .addEdge(START, "technical_expert")
    .addEdge("technical_expert", "creative_expert")
    .addEdge("creative_expert", "analytical_expert")
    .addEdge("analytical_expert", "communication_expert")
    .addEdge("communication_expert", "synthesis")
    .addEdge("synthesis", END);

  // Compile with checkpointing
  return workflow.compile({ checkpointer });
}
