import { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';

const API_BASE = 'http://localhost:3000';

export interface GalaxyNode {
    id: string;
    uri: string;
    code: string;
    prefLabel: string;
    description: string | null;
    parentId: string | null;
    type: 'group' | 'occupation';
    count?: number;
    x: number;
    y: number;
    level?: number;
    color?: string;
    icon?: string;
    rootId?: string; // Add rootId to track L1 parent
    descendantCount?: number; // Total nodes (groups + occupations) under this node
}

const MAJOR_GROUP_METADATA: Record<string, { color: string; icon: string }> = {
    '1': { color: '#38bdf8', icon: 'brain' },            // Managers
    '2': { color: '#818cf8', icon: 'graduation-cap' },    // Professionals
    '3': { color: '#2dd4bf', icon: 'code' },             // Technicians
    '4': { color: '#94a3b8', icon: 'clipboard-list' },   // Clerical
    '5': { color: '#fb7185', icon: 'pen-tool' },         // Service/Sales
    '6': { color: '#4ade80', icon: 'cloud' },            // Agriculture
    '7': { color: '#fb923c', icon: 'settings' },         // Craft
    '8': { color: '#f59e0b', icon: 'shield' },           // Operators
    '9': { color: '#a8a29e', icon: 'pen-tool' },         // Elementary
    '0': { color: '#a78bfa', icon: 'shield' },           // Armed Forces
};

// Layout Utils
const WORLD_CENTER = { x: 4000, y: 3000 };

const getRadius = (count: number, nodeSize: number) => {
    const minRadius = nodeSize * 3.5;
    const circum = count * (nodeSize * 2.0);
    return Math.max(minRadius, circum / (2 * Math.PI));
};

export function useEscoGalaxy() {
    const [groups, setGroups] = useState<GalaxyNode[]>([]);
    const [occupations, setOccupations] = useState<GalaxyNode[]>([]);
    const [loading, setLoading] = useState(true);

    // Use refs to build data incrementally without triggering excessive re-renders during initial load
    const nodesRef = useRef<GalaxyNode[]>([]);
    const initialized = useRef(false);

    const fetchLevel1 = async (): Promise<GalaxyNode[]> => {
        const res = await axios.get(`${API_BASE}/esco/groups?level=1`);
        const l1Groups: any[] = res.data;
        const goldenAngle = Math.PI * (3 - Math.sqrt(5));

        return l1Groups.map((g, i) => {
            const meta = MAJOR_GROUP_METADATA[g.code] || { color: '#38bdf8', icon: 'orbit' };
            const r = 1000 * Math.sqrt(i + 1);
            const theta = i * goldenAngle;
            return {
                ...g,
                type: 'group',
                level: 1,
                x: WORLD_CENTER.x + r * Math.cos(theta),
                y: WORLD_CENTER.y + r * Math.sin(theta),
                color: meta.color,
                icon: meta.icon,
                rootId: g.id // Self is root
            };
        });
    };

    const fetchChildren = async (parents: GalaxyNode[], level: number, nodeSize: number, icon: string): Promise<GalaxyNode[]> => {
        if (parents.length === 0) return [];

        // Fetch in parallel
        const promises = parents.map(p => axios.get(`${API_BASE}/esco/groups?parentId=${p.id}`));
        const responses = await Promise.all(promises);
        const allChildren = responses.flatMap(res => res.data);

        const processedNodes: GalaxyNode[] = [];

        allChildren.forEach(child => {
            const parent = parents.find(p => p.id === child.parentId);
            if (!parent) return;

            const siblings = allChildren.filter(s => s.parentId === child.parentId);
            const idx = siblings.findIndex(s => s.id === child.id);

            const radius = getRadius(siblings.length, nodeSize);
            const angleStep = (Math.PI * 2) / siblings.length;
            // Add slight randomness to angle for natural look
            const angle = angleStep * idx + (level > 2 ? Math.random() * 0.5 : 0);

            processedNodes.push({
                ...child,
                type: 'group',
                level,
                x: parent.x + Math.cos(angle) * radius,
                y: parent.y + Math.sin(angle) * radius,
                color: parent.color,
                icon,
                rootId: parent.rootId // Inherit rootId
            });
        });

        return processedNodes;
    };

    const fetchOccupationsForGroup = async (group: GalaxyNode) => {
        try {
            const res = await axios.get(`${API_BASE}/esco/occupations?iscoGroupId=${group.id}&limit=30`);
            const rawOccs: any[] = res.data.data;
            const count = rawOccs.length;
            // Dynamic spacing: more occupations → larger spread area
            const nodeVisualSize = 25; // px per occupation node (increased from 18)
            // Calculate min radius so that outermost ring doesn't overlap
            const baseRadius = Math.max(50, count * nodeVisualSize / (2 * Math.PI)); // Increased from 35
            // Growth factor per node in spiral
            const spiralGrowth = Math.max(20, nodeVisualSize * Math.sqrt(count) / 2.0); // Increased from 14

            const newOccs: GalaxyNode[] = rawOccs.map((o, i) => {
                // Spiral layout using golden angle for even distribution
                const goldenAngle = Math.PI * (3 - Math.sqrt(5));
                const angle = i * goldenAngle;
                // Spiral outward: radius grows based on count
                const r = baseRadius + Math.sqrt(i) * spiralGrowth;
                return {
                    ...o,
                    type: 'occupation',
                    level: 5,
                    x: group.x + Math.cos(angle) * r,
                    y: group.y + Math.sin(angle) * r,
                    parentId: group.id, // Ensure parent link
                    color: group.color, // Inherit color
                    icon: 'user',
                    rootId: group.rootId // Inherit rootId
                };
            });

            setOccupations(prev => [...prev, ...newOccs]);
        } catch (error) {
            console.error(`Error fetching occupations for group ${group.id}`, error);
        }
    };

    const loadGalaxy = useCallback(async () => {
        if (initialized.current) return;
        initialized.current = true;

        try {
            setLoading(true);
            nodesRef.current = [];

            // Level 1
            const l1 = await fetchLevel1();
            nodesRef.current.push(...l1);

            // Level 2
            const l2 = await fetchChildren(l1, 2, 150, 'orbit'); // Increased from 80
            nodesRef.current.push(...l2);

            // Level 3
            const l3 = await fetchChildren(l2, 3, 110, 'dot'); // Increased from 60
            nodesRef.current.push(...l3);

            // Level 4
            const l4 = await fetchChildren(l3, 4, 80, 'dot'); // Increased from 45
            nodesRef.current.push(...l4);

            // Update State Once
            setGroups([...nodesRef.current]);
            setLoading(false);

            // Background load occupations for L4
            const batchSize = 10;
            for (let i = 0; i < l4.length; i += batchSize) {
                const batch = l4.slice(i, i + batchSize);
                await Promise.all(batch.map(g => fetchOccupationsForGroup(g)));
                await new Promise(r => setTimeout(r, 50)); // Throttle
            }

        } catch (error) {
            console.error("Galaxy Load Failed:", error);
            setLoading(false);
            initialized.current = false;
        }
    }, []);

    useEffect(() => {
        loadGalaxy();
    }, [loadGalaxy]);

    return { groups, occupations, loading };
}
