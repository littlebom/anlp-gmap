# Project Vision: AI-Native Learning Platform (POC)

## Overview
We are building a Proof of Concept (POC) for an adaptive learning platform that moves away from traditional linear courses (LMS). Instead, it uses a **Knowledge Graph** where users navigate through "Nodes" of skills.

## Core Value Proposition
- **Non-Linear Learning:** Users can choose their path based on a dependency graph.
- **AI-Driven Content:** Lessons are generated on-the-fly by AI based on the specific node topic.
- **Skill Fusion:** Career paths are dynamic sets of nodes.

## Key Features for POC
1.  **Interactive Knowledge Map:** A 2D graph (using React Flow) showing nodes like "Variables", "Loops", "Functions".
2.  **State Management:** Nodes change visual state (Locked 🔒, Unlocked 🔓, Completed ✅).
3.  **AI Tutor:** Clicking a node opens a chat where AI teaches that specific concept.
4.  **Quiz System:** AI generates a quick quiz to verify mastery before completing a node.

## Success Criteria
- User can see a graph of Python 101 concepts.
- User cannot access "Loops" before completing "Variables" (Prerequisite check).
- User can chat with AI to learn "Variables".