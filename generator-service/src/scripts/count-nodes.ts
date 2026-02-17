import axios from 'axios';

const API_BASE = 'http://localhost:3000';

async function countNodes() {
    try {
        console.log('Fetching Level 1...');
        const resL1 = await axios.get(`${API_BASE}/esco/groups?level=1`);
        const l1 = resL1.data;
        console.log(`L1: ${l1.length}`);

        console.log('Fetching Level 2...');
        // L2 are children of L1
        const l2Promises = l1.map((g: any) => axios.get(`${API_BASE}/esco/groups?parentId=${g.id}`));
        const l2Res = await Promise.all(l2Promises);
        const l2 = l2Res.flatMap(r => r.data);
        console.log(`L2: ${l2.length}`);

        console.log('Fetching Level 3...');
        const l3Promises = l2.map((g: any) => axios.get(`${API_BASE}/esco/groups?parentId=${g.id}`));
        const l3Res = await Promise.all(l3Promises);
        const l3 = l3Res.flatMap(r => r.data);
        console.log(`L3: ${l3.length}`);

        console.log('Fetching Level 4...');
        const l4Promises = l3.map((g: any) => axios.get(`${API_BASE}/esco/groups?parentId=${g.id}`));
        const l4Res = await Promise.all(l4Promises);
        const l4 = l4Res.flatMap(r => r.data);
        console.log(`L4: ${l4.length}`);

        const total = l1.length + l2.length + l3.length + l4.length;
        console.log('---------------------------');
        console.log(`Total Groups (L1-L4): ${total}`);
        console.log('---------------------------');

    } catch (error) {
        console.error('Error counting nodes:', error);
    }
}

countNodes();
