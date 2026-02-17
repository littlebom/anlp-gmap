import { architectService } from './modules/architect/architect.service';
import { IGraphNode, IGraphEdge } from './modules/architect/architect.types';
import { logger } from './utils/logger';

// Access private method via any cast for testing
const service = architectService as any;

function runValidatorTest() {
    logger.info("Testing Graph Validator (Cycle Detection)...");

    // defined nodes
    const nodes: IGraphNode[] = [
        { id: 'A', label: 'A' },
        { id: 'B', label: 'B' },
        { id: 'C', label: 'C' },
        { id: 'D', label: 'D' },
    ];

    // Case 1: No Cycle
    const edges1: IGraphEdge[] = [
        { source: 'A', target: 'B' },
        { source: 'B', target: 'C' },
    ];
    const valid1 = service.validateGraph(nodes, edges1);
    logger.info(`Case 1 (No Cycle): Input ${edges1.length}, Output ${valid1.length}`);
    if (valid1.length !== 2) logger.error("Case 1 Failed");

    // Case 2: Simple Cycle (A -> B -> A)
    const edges2: IGraphEdge[] = [
        { source: 'A', target: 'B' },
        { source: 'B', target: 'A' }, // This should be removed
    ];
    const valid2 = service.validateGraph(nodes, edges2);
    logger.info(`Case 2 (Simple Cycle): Input ${edges2.length}, Output ${valid2.length}`);
    if (valid2.length !== 1) logger.error("Case 2 Failed");

    // Case 3: Complex Cycle (A -> B -> C -> A)
    const edges3: IGraphEdge[] = [
        { source: 'A', target: 'B' },
        { source: 'B', target: 'C' },
        { source: 'C', target: 'A' }, // Should be removed
    ];
    const valid3 = service.validateGraph(nodes, edges3);
    logger.info(`Case 3 (Complex Cycle): Input ${edges3.length}, Output ${valid3.length}`);
    // Depending on traversal order, one edge should be removed.
    if (valid3.length !== 2) logger.error(`Case 3 Failed: Got ${valid3.length}`);

    logger.info("Validator Test Completed.");
}

runValidatorTest();
