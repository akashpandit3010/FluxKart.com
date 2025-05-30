document.getElementById('contactForm').addEventListener('submit', async (e) => 
{
  e.preventDefault();
  
  const email = document.getElementById('email').value || null;
  const phoneNumber = document.getElementById('phoneNumber').value || null;
  
  try 
  {
    const response = await fetch('/identify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, phoneNumber }),
    });
    
    const data = await response.json();
    displayResult(data);
  } 
  catch (error) 
  {
    console.error('Error:', error);
    document.getElementById('result').textContent = 'An error occurred';
  }
});

function displayResult(data) 
{
  const resultDiv = document.getElementById('result');
  resultDiv.innerHTML = `
    <h3>Result:</h3>
    <p><strong>Primary Contact ID:</strong> ${data.contact.primaryContatctId}</p>
    <p><strong>Emails:</strong> ${data.contact.emails.join(', ')}</p>
    <p><strong>Phone Numbers:</strong> ${data.contact.phoneNumbers.join(', ')}</p>
    <p><strong>Secondary Contact IDs:</strong> ${data.contact.secondaryContactIds.join(', ')}</p>
  `;
}