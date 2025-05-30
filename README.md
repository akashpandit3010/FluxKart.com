# FluxKart.com

## Live Deployment

The app is hosted on Render:  
🔗 **Endpoint**: `https://fluxkart-com.onrender.com/`

The app demomstartion is posted on Google Drive:  
🔗 **Drive Link**: `https://drive.google.com/file/d/12Yh2FUyyFxJR9-K3RCA8MjQcZVeg31gJ/view?usp=sharing`
### API Usage
```json
POST /identify
Content-Type: application/json

{
  "email": "string (optional)",
  "phoneNumber": "string (optional)"
}
```

Example Request:
```bash
curl -X POST https://fluxkart.onrender.com/identify \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","phoneNumber":"1234567890"}'
```

The Admin Panel opens the Identity Reconciliation Form, where you can either enter a mobile number or any valid email (or else it will throw an error) and then one of following happens:

1. If no matches: create new primary contact.

2. If matches exist:

      a. Find the oldest primary contact (will remain primary).

      b. Link all other contacts to this primary.

      c. Create new secondary contact if new information is provided.

Example:
```bash
 Email: xyz@gmail.com
```
This email has already many entries
![image](https://github.com/user-attachments/assets/4c220822-f1f7-4d3e-88f8-638f2b8d8a0b)
