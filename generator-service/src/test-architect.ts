import { architectService } from './modules/architect/architect.service';
import { logger } from './utils/logger';

async function runTest() {
    const jobTitle = "Frontend Developer";

    // Simulated Raw Data from Adapters
    const rawSkills = [
        "HTML", "HTML5", "Hyper text Markup Language",
        "CSS", "CSS3", "Responsive Design",
        "JavaScript", "JS", "ECMAScript",
        "React", "React.js", "State Management",
        "Git", "Version Control",
        "Communication", "Teamwork"
    ];

    logger.info("Starting Architect Test...");
    try {
        const graph = await architectService.synthesizeGraph(jobTitle, rawSkills);

        logger.info("--- Generated Graph ---");
        logger.info(`Nodes: ${graph.nodes.length}`);
        logger.info(`Edges: ${graph.edges.length}`);

        console.log(JSON.stringify(graph, null, 2));

    } catch (error) {
        logger.error("Test Failed", error);
    }
}

runTest().catch(console.error);
