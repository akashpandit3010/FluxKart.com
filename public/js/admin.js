document.getElementById('adminLink').addEventListener('click', function(e) {
    e.preventDefault();
    document.getElementById('adminPanel').classList.remove('hidden');
});

// Close Admin Panel
document.getElementById('closeAdmin').addEventListener('click', function() {
    document.getElementById('adminPanel').classList.add('hidden');
});

// Form Submission
document.getElementById('identityForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    const email = document.getElementById('email').value.trim();
    const phone = document.getElementById('phone').value.trim();
    
    try {
        const response = await fetch('/identify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                email: email || null, 
                phoneNumber: phone || null 
            })
        });
        
        const data = await response.json();
        
        // Display results
        document.getElementById('result').classList.remove('hidden');
        document.getElementById('primaryId').textContent = data.contact.primaryContatctId;
        document.getElementById('emails').textContent = data.contact.emails.join(', ') || 'None';
        document.getElementById('phones').textContent = data.contact.phoneNumbers.join(', ') || 'None';
        document.getElementById('secondaryIds').textContent = data.contact.secondaryContactIds.join(', ') || 'None';
        
    } catch (error) {
        console.error('Error:', error);
        alert('Failed to submit identity request');
    }
});