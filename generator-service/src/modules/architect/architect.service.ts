import { ChatOpenAI } from "@langchain/openai";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { env } from "../../config/env.config";
import { logger } from "../../utils/logger";
import { NormalizationPrompt, GradingPrompt, DependencyPrompt } from "./prompts";
import { IGraphResult, IGraphNode, IGraphEdge } from "./architect.types";
import { v4 as uuidv4 } from 'uuid';

export class ArchitectService {
    private model: any;

    constructor() {
        if (env.API_KEY_OPENAI) {
            this.model = new ChatOpenAI({
                openAIApiKey: env.API_KEY_OPENAI,
                temperature: 0,
                modelName: "gpt-4o", // or gpt-3.5-turbo
            });
            logger.info("ArchitectService initialized with OpenAI");
        } else if (env.API_KEY_GEMINI) {
            this.model = new ChatGoogleGenerativeAI({
                apiKey: env.API_KEY_GEMINI,
                temperature: 0,
                model: "gemini-2.0-flash", // Updated to available model
            } as any); // Type cast to avoid strict check if version mismatch
            logger.info("ArchitectService initialized with Google Gemini");
        } else {
            logger.warn("No AI API Key found. ArchitectService will fail if used.");
        }
    }

    async synthesizeGraph(jobTitle: string, rawSkills: string[]): Promise<IGraphResult> {
        if (!this.model) {
            throw new Error("AI Model not initialized. Check .env for API Keys.");
        }

        try {
            logger.info(`Synthesizing Graph for: ${jobTitle} (${rawSkills.length} raw skills)`);

            // 1. Normalization
            const normalizedNodes = await this.stepNormalization(rawSkills, jobTitle);
            logger.info(`stepNormalization: Produced ${normalizedNodes.length} nodes`);

            // 2. Grading (SFIA)
            const gradedNodes = await this.stepGrading(normalizedNodes, jobTitle);
            logger.info(`stepGrading: Graded ${gradedNodes.length} nodes`);

            // 3. Dependency Mapping
            const edges = await this.stepDependency(gradedNodes);
            logger.info(`stepDependency: Created ${edges.length} edges`);

            // 4. Transform to Final Graph Structure
            const finalNodes: IGraphNode[] = gradedNodes.map((n: any) => ({
                id: uuidv4(), // Assign UUIDs
                label: n.label,
                description: n.description,
                category: n.category,
                sfia_level: n.sfia_level,
                source: 'AI'
            }));

            // Map edges to use UUIDs instead of Labels
            const nodeMap = new Map(finalNodes.map(n => [n.label, n.id]));
            const finalEdges: IGraphEdge[] = edges
                .map((e: any) => ({
                    source: nodeMap.get(e.source),
                    target: nodeMap.get(e.target)
                }))
                .filter((e: any) => e.source && e.target) as IGraphEdge[]; // Filter invalid edges

            // 5. Validation (Cycle Check)
            const validEdges = this.validateGraph(finalNodes, finalEdges);

            return {
                nodes: finalNodes,
                edges: validEdges,
                metadata: {
                    generatedAt: new Date(),
                    jobTitle
                }
            };

        } catch (error) {
            logger.error("Error in synthesizeGraph", error);
            throw error;
        }
    }

    private async stepNormalization(rawSkills: string[], jobTitle: string) {
        const chain = NormalizationPrompt.pipe(this.model);
        const result = await chain.invoke({ rawSkills: JSON.stringify(rawSkills), jobTitle }) as any;
        return this.parseJson(result.content);
    }

    private async stepGrading(nodes: any[], jobTitle: string) {
        const chain = GradingPrompt.pipe(this.model);
        const result = await chain.invoke({ nodes: JSON.stringify(nodes), jobTitle }) as any;
        return this.parseJson(result.content);
    }

    private async stepDependency(nodes: any[]) {
        const chain = DependencyPrompt.pipe(this.model);
        const result = await chain.invoke({ nodes: JSON.stringify(nodes) }) as any;
        return this.parseJson(result.content);
    }

    private validateGraph(nodes: IGraphNode[], edges: IGraphEdge[]): IGraphEdge[] {
        // Simple DFS for Cycle Detection
        // If cycle detected, remove the "back edge"
        const adj = new Map<string, string[]>();
        edges.forEach(e => {
            if (!adj.has(e.source)) adj.set(e.source, []);
            adj.get(e.source)?.push(e.target);
        });

        const visited = new Set<string>();
        const recStack = new Set<string>();
        const safeEdges: IGraphEdge[] = [];

        // We actually need to filter the *input* edges. 
        // A better approach is: Build the graph incrementally. Add edge only if it doesn't create a cycle.

        const safeAdj = new Map<string, string[]>();

        const hasCycle = (src: string, target: string, currentAdj: Map<string, string[]>, visitedCheck: Set<string>): boolean => {
            if (src === target) return true;
            visitedCheck.add(src);
            const neighbors = currentAdj.get(src) || [];
            for (const neighbor of neighbors) {
                if (!visitedCheck.has(neighbor)) {
                    if (hasCycle(neighbor, target, currentAdj, visitedCheck)) return true;
                }
            }
            return false;
        };

        for (const edge of edges) {
            // Check if adding (source -> target) creates a cycle
            // i.e., is there already a path from target -> source?
            if (hasCycle(edge.target, edge.source, safeAdj, new Set())) {
                logger.warn(`Cycle detected! Refusing edge: ${edge.source} -> ${edge.target}`);
                continue;
            }

            // Safe to add
            safeEdges.push(edge);
            if (!safeAdj.has(edge.source)) safeAdj.set(edge.source, []);
            safeAdj.get(edge.source)?.push(edge.target);
        }

        return safeEdges;
    }

    private parseJson(text: any): any[] {
        try {
            // Simple cleanup for markdown code blocks (```json ... ```)
            const cleanText = text.toString().replace(/```json/g, '').replace(/```/g, '').trim();
            return JSON.parse(cleanText);
        } catch (e) {
            logger.error("Failed to parse JSON from LLM", text);
            return [];
        }
    }
}

export const architectService = new ArchitectService();
