// Node.js v18+ has global fetch
async function testTransaction() {
    try {
        console.log('Fetching products...');
        const prodRes = await fetch('http://localhost:3001/api/products');
        if (!prodRes.ok) {
            console.error('Failed to fetch products:', prodRes.status, await prodRes.text());
            return;
        }
        const products = await prodRes.json();

        if (products.length === 0) {
            console.log('No products found to test with.');
            return;
        }

        const productId = products[0].id;
        console.log('Testing with Product ID:', productId);

        const payload = {
            date: new Date().toISOString().split('T')[0],
            type: 'IN',
            productId: productId,
            quantity: 5,
            notes: 'Test transaction',
            supplier: 'Test Supplier',
            // channel is undefined
        };

        console.log('Sending payload:', payload);

        const res = await fetch('http://localhost:3001/api/transactions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!res.ok) {
            const err = await res.text();
            console.log('Error status:', res.status);
            console.log('Error body:', err);
        } else {
            const data = await res.json();
            console.log('Success:', data);
        }

    } catch (error) {
        console.error('Test failed:', error);
    }
}

testTransaction();
