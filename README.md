# FluxKart.com

## FluxKart Identity Reconciliation System
This project demonstrates a customer identity management solution for FluxKart, an electronics e-commerce platform. The system helps track customers across multiple purchases even when they use different contact details.

## Key Features:
E-commerce Frontend: Product listings with functional shopping cart
IDentity Reconciliation: Links customer accounts via email/phone
Admin Panel: Special interface for identity management
Data Persistence: SQLite database stores all contact information

![image](https://github.com/user-attachments/assets/1ac57827-125b-47b8-8e54-2ba4d655b23f)

## Technical Stack:
Backend: Node.js + Express
Database: SQLite
Frontend: HTML5, Tailwind CSS, Vanilla JavaScript
Hosting: Render.com (free tier)

## How It Works:
Customers make purchases with different contact details
System automatically links identities via common email/phone
Admin can manually reconcile identities when needed

## Use Case:
Prevents duplicate customer profiles when shoppers like "Doc Brown" use multiple emails/phones for privacy.

## Live Deployment

The app is hosted on Render:  
🔗 **Endpoint**: `https://fluxkart-com.onrender.com/`

Live Demo:  
🔗 **Google Drive Link**: `https://drive.google.com/file/d/12Yh2FUyyFxJR9-K3RCA8MjQcZVeg31gJ/view?usp=sharing`

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
